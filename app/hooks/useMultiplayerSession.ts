'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface MultiplayerMessage {
  id?: string;
  type: 'GUEST_JOIN' | 'HOST_ACK' | 'START_SESSION' | 'ARTWORK_INTERACTION' | 'STATUS' | 'PEER_LEAVE';
  name?: string;
  sessionId?: string;
  artwork?: 'bluten' | 'plexus';
  mode?: 'test' | 'souvenir';
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
  onStartSession?: (artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir') => void;
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

  const safeSessionId = (sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');

  // Transmit message to peer via both WebRTC and BroadcastChannel
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
      } catch {}
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
      setIsConnected(true);
      callbacksRef.current.onHostAck?.(msg.name || 'Host');
    } else if (msg.type === 'START_SESSION') {
      callbacksRef.current.onStartSession?.(msg.artwork || 'bluten', msg.mode || 'test');
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

        const hostPeerId = `artcube-${safeSessionId}`;
        const peer = isHost
          ? new PeerClass(hostPeerId, { debug: 0 })
          : new PeerClass({ debug: 0 });
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
        const conn = peer.connect(targetId, { reliable: true });
        connRef.current = conn;
        setupDataConnection(conn);

        // Auto retry connecting if not opened within 4s
        const retryTimer = setTimeout(() => {
          if (isMounted && connRef.current && !connRef.current.open) {
            try {
              const retryConn = peer.connect(targetId, { reliable: true });
              connRef.current = retryConn;
              setupDataConnection(retryConn);
            } catch {}
          }
        }, 4000);

        conn.on('open', () => clearTimeout(retryTimer));
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

    initPeer();

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        connRef.current?.close();
        peerRef.current?.destroy();
        channelRef.current?.close();
      } catch {}
    };
  }, [safeSessionId, isHost]);

  // Explicit Guest Join action
  const sendGuestJoin = useCallback((guestName: string) => {
    broadcastMessage({
      type: 'GUEST_JOIN',
      name: guestName,
      senderIndex: 2,
    });
  }, [broadcastMessage]);

  // Launch artwork session for both players synchronously
  const sendStartSession = useCallback((artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir') => {
    broadcastMessage({
      type: 'START_SESSION',
      artwork,
      mode,
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

