'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface MultiplayerMessage {
  id?: string;
  type: 'GUEST_JOIN' | 'HOST_ACK' | 'START_SESSION' | 'ARTWORK_INTERACTION' | 'STATUS' | 'PEER_LEAVE';
  name?: string;
  sessionId?: string;
  artwork?: 'bluten' | 'plexus';
  mode?: 'test' | 'souvenir';
  trackIndex?: number;
  kind?: string;
  payload?: unknown;
  senderIndex?: 1 | 2;
  timestamp?: number;
}

interface UseMultiplayerSessionOptions {
  sessionId: string;
  isHost: boolean;
  myName: string;
  onGuestJoined?: (guestName: string) => void;
  onHostAck?: (hostName: string) => void;
  onStartSession?: (artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir', trackIndex?: number) => void;
  onPeerMessage?: (data: unknown) => void;
}

export function useMultiplayerSession({
  sessionId,
  isHost,
  myName,
  onGuestJoined,
  onHostAck,
  onStartSession,
  onPeerMessage,
}: UseMultiplayerSessionOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [peerError, setPeerError] = useState<string | null>(null);

  const myNameRef = useRef(myName);
  myNameRef.current = myName;

  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connRef = useRef<any>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const handledMessagesRef = useRef<Set<string>>(new Set());

  // Message Queue & Join Resend Mechanism for reliable mobile/iOS WebRTC delivery
  const guestJoinPendingNameRef = useRef<string | null>(null);
  const hostAckReceivedRef = useRef<boolean>(false);
  const pendingMessagesRef = useRef<MultiplayerMessage[]>([]);
  const joinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const callbacksRef = useRef({
    onGuestJoined,
    onHostAck,
    onStartSession,
    onPeerMessage,
  });
  callbacksRef.current = {
    onGuestJoined,
    onHostAck,
    onStartSession,
    onPeerMessage,
  };

  const safeSessionId = (sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

  // Transmit message to peer via both WebRTC and BroadcastChannel with queueing
  const broadcastMessage = useCallback((msg: MultiplayerMessage) => {
    const fullMsg: MultiplayerMessage = {
      ...msg,
      id: msg.id || 'msg_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      sessionId: safeSessionId,
    };

    // 1. WebRTC DataConnection
    if (connRef.current && connRef.current.open) {
      try {
        connRef.current.send(fullMsg);
      } catch (err) {
        console.warn('Failed to send on open connection, queuing:', err);
        pendingMessagesRef.current.push(fullMsg);
      }
    } else {
      // If discrete control message (like GUEST_JOIN, START_SESSION, STATUS), queue until connection is ready
      const payloadKind = (msg.payload && typeof msg.payload === 'object' && 'kind' in msg.payload)
        ? (msg.payload as { kind?: string }).kind
        : undefined;
      const isStreamMsg = msg.type === 'ARTWORK_INTERACTION' && (
        payloadKind === 'CURSOR_MOVE' ||
        payloadKind === 'PLEXUS_ORB_MOVE' ||
        payloadKind === 'PLEXUS_CLUSTER_MOVE' ||
        msg.kind === 'CURSOR_MOVE' ||
        msg.kind === 'PLEXUS_ORB_MOVE' ||
        msg.kind === 'PLEXUS_CLUSTER_MOVE'
      );
      if (!isStreamMsg) {
        pendingMessagesRef.current.push(fullMsg);
      }
    }

    // 2. BroadcastChannel
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(fullMsg);
      } catch {}
    }
  }, [safeSessionId]);

  const broadcastMessageRef = useRef(broadcastMessage);
  broadcastMessageRef.current = broadcastMessage;

  const dispatchIncomingMessage = useCallback((msg: MultiplayerMessage) => {
    if (!msg || !msg.type) return;

    // Ignore echoes of our own messages
    const mySenderIndex = isHostRef.current ? 1 : 2;
    if (msg.senderIndex !== undefined && msg.senderIndex === mySenderIndex) {
      return;
    }

    // Deduplication check across WebRTC and BroadcastChannel for discrete control messages
    const payloadKind = (msg.payload && typeof msg.payload === 'object' && 'kind' in msg.payload)
      ? (msg.payload as { kind?: string }).kind
      : undefined;
    const isStreamMsg = msg.type === 'ARTWORK_INTERACTION' && (
      payloadKind === 'CURSOR_MOVE' ||
      payloadKind === 'PLEXUS_ORB_MOVE' ||
      payloadKind === 'PLEXUS_CLUSTER_MOVE' ||
      msg.kind === 'CURSOR_MOVE' ||
      msg.kind === 'PLEXUS_ORB_MOVE' ||
      msg.kind === 'PLEXUS_CLUSTER_MOVE'
    );

    if (!isStreamMsg) {
      const dedupeKey = msg.id || `${msg.type}_${msg.timestamp || 0}_${JSON.stringify(msg.payload || '')}`;
      if (handledMessagesRef.current.has(dedupeKey)) return;
      handledMessagesRef.current.add(dedupeKey);
      if (handledMessagesRef.current.size > 200) {
        handledMessagesRef.current.clear();
      } else {
        setTimeout(() => {
          handledMessagesRef.current.delete(dedupeKey);
        }, 4000);
      }
    }

    if (msg.type === 'GUEST_JOIN') {
      setIsConnected(true);
      callbacksRef.current.onGuestJoined?.(msg.name || 'Gast');
      // If Host received guest join, send acknowledgment back via both WebRTC & BroadcastChannel
      if (isHostRef.current) {
        broadcastMessageRef.current({
          id: 'ack_' + Math.random().toString(36).substring(2, 9),
          type: 'HOST_ACK',
          name: myNameRef.current || 'Host',
          sessionId: safeSessionId,
          timestamp: Date.now(),
          senderIndex: 1,
        });
      }
    } else if (msg.type === 'HOST_ACK') {
      hostAckReceivedRef.current = true;
      if (joinIntervalRef.current) {
        clearInterval(joinIntervalRef.current);
        joinIntervalRef.current = null;
      }
      setIsConnected(true);
      callbacksRef.current.onHostAck?.(msg.name || 'Host');
    } else if (msg.type === 'START_SESSION') {
      callbacksRef.current.onStartSession?.(msg.artwork || 'bluten', msg.mode || 'test', msg.trackIndex);
    } else if (msg.type === 'ARTWORK_INTERACTION') {
      callbacksRef.current.onPeerMessage?.(msg.payload ?? msg);
    } else if (msg.type === 'PEER_LEAVE') {
      setIsConnected(false);
      callbacksRef.current.onPeerMessage?.({ kind: 'PEER_LEAVE', senderIndex: msg.senderIndex });
    }
  }, [safeSessionId]);

  const dispatchIncomingMessageRef = useRef(dispatchIncomingMessage);
  dispatchIncomingMessageRef.current = dispatchIncomingMessage;

  // Setup PeerJS & BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    // 1. Local BroadcastChannel fallback (works synchronously across same-browser tabs)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(`artcube_multi_${safeSessionId}`);
        channelRef.current = bc;
        bc.onmessage = (event) => {
          if (!isMounted) return;
          dispatchIncomingMessageRef.current(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not available:', e);
    }

    // 2. PeerJS WebRTC Connection (cross-network, mobile & desktop)
    const initPeer = async () => {
      try {
        const PeerClass = (await import('peerjs')).default;
        if (!isMounted) return;

        const peerConfig = {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
              { urls: 'stun:stun.services.mozilla.com' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
            sdpSemantics: 'unified-plan',
          },
        };

        const hostPeerId = `artcube-${safeSessionId}`;
        const peer = isHost
          ? new PeerClass(hostPeerId, peerConfig)
          : new PeerClass(peerConfig);
        peerRef.current = peer;

        peer.on('open', () => {
          if (!isMounted) return;
          if (!isHost) {
            // Guest initiates connection to Host
            connectToHost(peer, hostPeerId);
          }
        });

        peer.on('connection', (conn) => {
          if (!isMounted) return;
          connRef.current = conn;
          setupDataConnection(conn);
        });

        peer.on('error', (err: any) => {
          if (!isMounted) return;
          // Handle unavailable host ID gracefully (e.g. Host reloaded tab)
          if (err?.type === 'unavailable-id') {
            console.warn('Peer ID in use, attempting to re-use session...');
          } else {
            console.error('PeerJS error:', err);
          }
          setPeerError(err?.message || 'Peer connection issue');
        });
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('PeerJS init failed, continuing with Broadcast fallback:', err);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectToHost = (peer: any, targetId: string) => {
      try {
        if (connRef.current && connRef.current.open) return;
        const conn = peer.connect(targetId, { serialization: 'json' });
        connRef.current = conn;
        setupDataConnection(conn);

        // Auto retry connecting if not opened within 3.5s
        let retryCount = 0;
        const retryTimer = setInterval(() => {
          if (!isMounted || (connRef.current && connRef.current.open) || retryCount > 5) {
            clearInterval(retryTimer);
            return;
          }
          retryCount++;
          try {
            const retryConn = peer.connect(targetId, { serialization: 'json' });
            connRef.current = retryConn;
            setupDataConnection(retryConn);
          } catch {}
        }, 3500);

        conn.on('open', () => clearInterval(retryTimer));
      } catch (err) {
        console.warn('Failed to connect to host peer:', err);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setupDataConnection = (conn: any) => {
      conn.on('open', () => {
        if (!isMounted) return;
        setIsConnected(true);
        setPeerError(null);

        // 1. Flush any messages that were queued before connection was open!
        if (pendingMessagesRef.current.length > 0) {
          const queue = [...pendingMessagesRef.current];
          pendingMessagesRef.current = [];
          queue.forEach(m => {
            try {
              conn.send(m);
            } catch (e) {
              console.warn('Error flushing pending message:', e);
            }
          });
        }

        // 2. If guest has already clicked join, ensure GUEST_JOIN is transmitted immediately!
        if (!isHostRef.current && guestJoinPendingNameRef.current) {
          try {
            conn.send({
              id: 'join_' + Math.random().toString(36).substring(2, 9),
              type: 'GUEST_JOIN',
              name: guestJoinPendingNameRef.current,
              senderIndex: 2,
              sessionId: safeSessionId,
              timestamp: Date.now(),
            });
          } catch {}
        }
      });

      conn.on('data', (data: unknown) => {
        if (!isMounted) return;
        dispatchIncomingMessageRef.current(data as MultiplayerMessage);
      });

      conn.on('close', () => {
        if (!isMounted) return;
        setIsConnected(false);
        callbacksRef.current.onPeerMessage?.({ kind: 'PEER_LEAVE' });
      });

      conn.on('error', () => {
        if (!isMounted) return;
        setIsConnected(false);
        callbacksRef.current.onPeerMessage?.({ kind: 'PEER_LEAVE' });
      });
    };

    const handleBeforeUnload = () => {
      try {
        const mySenderIndex = isHostRef.current ? 1 : 2;
        const leaveMsg: MultiplayerMessage = {
          id: 'leave_' + Math.random().toString(36).substring(2, 9),
          type: 'PEER_LEAVE',
          senderIndex: mySenderIndex,
          sessionId: safeSessionId,
          timestamp: Date.now()
        };
        if (connRef.current && connRef.current.open) {
          connRef.current.send(leaveMsg);
        }
        if (channelRef.current) {
          channelRef.current.postMessage(leaveMsg);
        }
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // iOS Safari wake-up & reconnection handler
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (peerRef.current && peerRef.current.disconnected && !peerRef.current.destroyed) {
          try { peerRef.current.reconnect(); } catch {}
        }
        if (!isHost && peerRef.current && (!connRef.current || !connRef.current.open)) {
          const hostPeerId = `artcube-${safeSessionId}`;
          connectToHost(peerRef.current, hostPeerId);
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    initPeer();

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (joinIntervalRef.current) {
        clearInterval(joinIntervalRef.current);
        joinIntervalRef.current = null;
      }
      try {
        connRef.current?.close();
        peerRef.current?.destroy();
        channelRef.current?.close();
      } catch {}
    };
  }, [safeSessionId, isHost]);

  // Explicit Guest Join action with auto-retry until Host ACK
  const sendGuestJoin = useCallback((guestName: string) => {
    guestJoinPendingNameRef.current = guestName;
    hostAckReceivedRef.current = false;

    const joinMsg: MultiplayerMessage = {
      type: 'GUEST_JOIN',
      name: guestName,
      senderIndex: 2,
    };

    broadcastMessage(joinMsg);

    // Resend periodically every 1.2s until host acknowledges receipt via HOST_ACK
    if (joinIntervalRef.current) clearInterval(joinIntervalRef.current);
    let attempts = 0;
    joinIntervalRef.current = setInterval(() => {
      if (hostAckReceivedRef.current || isHostRef.current || attempts > 20) {
        if (joinIntervalRef.current) {
          clearInterval(joinIntervalRef.current);
          joinIntervalRef.current = null;
        }
        return;
      }
      attempts++;
      broadcastMessage(joinMsg);
    }, 1200);
  }, [broadcastMessage]);

  // Launch artwork session for both players synchronously
  const sendStartSession = useCallback((artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir', trackIndex?: number) => {
    broadcastMessage({
      type: 'START_SESSION',
      artwork,
      mode,
      trackIndex,
    });
  }, [broadcastMessage]);

  // Sync artwork interactions (cursor move, gestures, blossom color, vortex)
  const sendArtworkInteraction = useCallback((kind: string, payload: unknown) => {
    broadcastMessage({
      type: 'ARTWORK_INTERACTION',
      kind,
      payload: { kind, ...(typeof payload === 'object' && payload !== null ? payload : { value: payload }) },
      senderIndex: isHostRef.current ? 1 : 2,
    });
  }, [broadcastMessage]);

  return {
    isConnected,
    peerError,
    sendGuestJoin,
    sendStartSession,
    sendArtworkInteraction,
  };
}

