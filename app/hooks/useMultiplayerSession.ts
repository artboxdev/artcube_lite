'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface MultiplayerMessage {
  id?: string;
  type: 'GUEST_JOIN' | 'HOST_ACK' | 'START_SESSION' | 'ARTWORK_INTERACTION' | 'STATUS';
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

  const dispatchIncomingMessage = useCallback((msg: MultiplayerMessage) => {
    if (!msg || !msg.type) return;

    // Deduplication check across WebRTC and BroadcastChannel
    const dedupeKey = msg.id || `${msg.type}_${msg.timestamp || 0}_${JSON.stringify(msg.payload || '')}`;
    if (handledMessagesRef.current.has(dedupeKey)) return;
    handledMessagesRef.current.add(dedupeKey);
    setTimeout(() => {
      handledMessagesRef.current.delete(dedupeKey);
    }, 5000);

    if (msg.type === 'GUEST_JOIN') {
      setIsConnected(true);
      callbacksRef.current.onGuestJoined?.(msg.name || 'Gast');
      // If Host received guest join, send acknowledgment back
      if (isHost && connRef.current && connRef.current.open) {
        try {
          connRef.current.send({
            id: 'ack_' + Math.random().toString(36).substring(2, 9),
            type: 'HOST_ACK',
            name: myName || 'Host',
            sessionId: safeSessionId,
            timestamp: Date.now(),
          });
        } catch {}
      }
    } else if (msg.type === 'HOST_ACK') {
      setIsConnected(true);
      callbacksRef.current.onHostAck?.(msg.name || 'Host');
    } else if (msg.type === 'START_SESSION') {
      callbacksRef.current.onStartSession?.(msg.artwork || 'bluten', msg.mode || 'test');
    } else if (msg.type === 'ARTWORK_INTERACTION') {
      callbacksRef.current.onPeerMessage?.(msg.payload ?? msg);
    }
  }, [isHost, myName, safeSessionId]);

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
          dispatchIncomingMessage(event.data);
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

        // If Guest has a name, immediately announce join
        if (!isHost && myName) {
          try {
            conn.send({
              id: 'join_' + Math.random().toString(36).substring(2, 9),
              type: 'GUEST_JOIN',
              name: myName,
              sessionId: safeSessionId,
              timestamp: Date.now(),
            });
          } catch {}
        }
      });

      conn.on('data', (data: unknown) => {
        if (!isMounted) return;
        dispatchIncomingMessage(data as MultiplayerMessage);
      });

      conn.on('close', () => {
        if (!isMounted) return;
        setIsConnected(false);
      });

      conn.on('error', () => {
        if (!isMounted) return;
        setIsConnected(false);
      });
    };

    initPeer();

    return () => {
      isMounted = false;
      try {
        connRef.current?.close();
        peerRef.current?.destroy();
        channelRef.current?.close();
      } catch {}
    };
  }, [safeSessionId, isHost, dispatchIncomingMessage, myName]);

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
      senderIndex: isHost ? 1 : 2,
    });
  }, [isHost, broadcastMessage]);

  return {
    isConnected,
    peerError,
    sendGuestJoin,
    sendStartSession,
    sendArtworkInteraction,
  };
}

