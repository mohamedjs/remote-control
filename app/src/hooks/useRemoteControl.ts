import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Network from 'expo-network';
import type { ActionMessage, Deck, ServerInfo } from '../types';
import { useDiscovery, type DiscoveredServer } from './useDiscovery';

const PORT = 3000;
const SCAN_TIMEOUT = 2000;
const SCAN_CONCURRENCY = 20;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 2000;

export function useRemoteControl() {
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [manualIP, setManualIP] = useState<string>('');
  const [manualPort, setManualPort] = useState<string>('3000');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastIntent, setLastIntent] = useState<string | null>(null);

  // Auto-discovery via UDP (or HTTP fallback for Expo Go)
  const {
    servers: discoveredServers,
    lastServer,
    discovering,
    discover,
    rememberServer,
  } = useDiscovery();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const intentionalDisconnect = useRef(false);

  // ─── Auto-detect phone's subnet ───────────────────────────────
  const getLocalSubnet = useCallback(async (): Promise<string> => {
    try {
      const ipAddr = await Network.getIpAddressAsync();
      if (ipAddr) {
        const parts = ipAddr.split('.');
        if (parts.length === 4) {
          return `${parts[0]}.${parts[1]}.${parts[2]}`;
        }
      }
    } catch (e) {
      console.warn('Could not detect local IP, defaulting to 192.168.1', e);
    }
    return '192.168.1';
  }, []);

  // ─── Cleanup WebSocket ────────────────────────────────────────
  const cleanupWs = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      // Remove all handlers first to prevent stale callbacks
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      try {
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }
  }, []);

  // ─── WebSocket connect ────────────────────────────────────────
  const connectToServer = useCallback((ip: string, port = PORT) => {
    // Clean up previous connection
    intentionalDisconnect.current = false;
    reconnectAttempts.current = 0;
    cleanupWs();

    setConnectionError(null);
    setServer({ ip, port, status: 'connecting' });

    const attemptConnect = (attempt: number) => {
      if (intentionalDisconnect.current) return;

      console.log(`🔌 Connecting to ws://${ip}:${port} (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS + 1})...`);

      try {
        const ws = new WebSocket(`ws://${ip}:${port}`);

        ws.onopen = () => {
          reconnectAttempts.current = 0;
          setServer({ ip, port, status: 'connected' });
          setConnectionError(null);
          console.log(`✅ Connected to laptop at ${ip}:${port}`);
        };

        ws.onclose = (evt) => {
          if (intentionalDisconnect.current) {
            console.log('WebSocket closed (intentional disconnect)');
            return;
          }

          console.log(`WebSocket closed: code=${evt.code} reason="${evt.reason || 'none'}"`);
          setServer(prev => prev ? { ...prev, status: 'disconnected' } : null);

          // Only auto-reconnect if we haven't exceeded max attempts
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.current++;
            const delay = INITIAL_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts.current - 1);
            console.log(`🔄 Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);

            reconnectTimer.current = setTimeout(() => {
              attemptConnect(reconnectAttempts.current);
            }, delay);
          } else {
            const msg = `Connection to ${ip}:${port} failed after ${MAX_RECONNECT_ATTEMPTS} attempts.\n\nMake sure:\n• The laptop server is running: node index.js\n• Both devices are on the same WiFi\n• No firewall is blocking port ${port}`;
            setConnectionError(msg);
            console.log('❌ Max reconnect attempts reached. Giving up.');
          }
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data as string);
            if (msg.type === 'welcome') {
              // Decks are host-owned data; the phone just renders them.
              if (Array.isArray(msg.decks)) setDecks(msg.decks);
              setVoiceEnabled(Boolean(msg.voiceEnabled));
            } else if (msg.type === 'intent-result') {
              setLastIntent(
                msg.ok ? (msg.actions || []).join(' · ') : `Not understood (${msg.reason})`,
              );
            }
          } catch {
            // Non-JSON frames are not part of this protocol; ignore them.
          }
        };

        ws.onerror = () => {
          // onerror is always followed by onclose in React Native
          // Don't duplicate logic here, just log
          if (!intentionalDisconnect.current) {
            console.log(`WebSocket error connecting to ${ip}:${port}`);
          }
        };

        wsRef.current = ws;
      } catch (e) {
        console.error('Failed to create WebSocket:', e);
        setConnectionError(`Failed to create WebSocket to ${ip}:${port}`);
        setServer({ ip, port, status: 'disconnected' });
      }
    };

    attemptConnect(0);
  }, [cleanupWs]);

  // ─── Disconnect ───────────────────────────────────────────────
  const disconnect = useCallback(() => {
    intentionalDisconnect.current = true;
    cleanupWs();
    setServer(null);
    setConnectionError(null);
    reconnectAttempts.current = 0;
    console.log('🔌 Disconnected by user');
  }, [cleanupWs]);

  // ─── Send action ──────────────────────────────────────────────
  // Note: dropping stale mouse deltas under backpressure is not possible here.
  // React Native declares WebSocket.bufferedAmount but never assigns it, so it
  // reads undefined at runtime and cannot gate anything. Detecting a stalled
  // link would need a transport Expo Go does not offer.
  const sendAction = useCallback((action: ActionMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(action));
  }, []);

  // ─── Hub: press a control by name, never by keystroke ─────────
  const sendHubAction = useCallback((deck: string, control: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'hub', deck, control }));
  }, []);

  // ─── Hub: natural language fallback ───────────────────────────
  const sendIntent = useCallback((text: string, deck: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setLastIntent('Thinking…');
    ws.send(JSON.stringify({ type: 'intent', text, deck }));
  }, []);

  // ─── Quick-test one IP via HTTP ping ──────────────────────────
  const testConnection = useCallback(async (ip: string, port = PORT): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

    try {
      const res = await fetch(`http://${ip}:${port}/ping`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      return data?.status === 'ok';
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  }, []);

  // ─── Scan network in batches ──────────────────────────────────
  const scanNetwork = useCallback(async (subnetPrefix?: string) => {
    setIsScanning(true);
    setConnectionError(null);

    const subnet = subnetPrefix || await getLocalSubnet();
    console.log(`🔍 Scanning ${subnet}.1-254 for server on port ${PORT}...`);

    const found: string[] = [];

    for (let batch = 0; batch < 254; batch += SCAN_CONCURRENCY) {
      const batchPromises = [];

      for (let i = batch + 1; i <= Math.min(batch + SCAN_CONCURRENCY, 254); i++) {
        const targetIp = `${subnet}.${i}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

        const p = fetch(`http://${targetIp}:${PORT}/ping`, {
          signal: controller.signal,
        })
          .then(res => res.json())
          .then(data => {
            clearTimeout(timeoutId);
            if (data?.status === 'ok') {
              found.push(targetIp);
              console.log(`✅ Found server at ${targetIp}`);
            }
          })
          .catch(() => {
            clearTimeout(timeoutId);
          });

        batchPromises.push(p);
      }

      await Promise.allSettled(batchPromises);
    }

    setIsScanning(false);

    if (found.length === 0) {
      setConnectionError(
        `No server found on ${subnet}.x:${PORT}.\n\n` +
        `Make sure:\n` +
        `• The laptop server is running (node index.js)\n` +
        `• Both devices are on the same WiFi\n` +
        `• Try entering the IP manually`
      );
    }

    return found;
  }, [getLocalSubnet]);

  // ─── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      intentionalDisconnect.current = true;
      cleanupWs();
    };
  }, [cleanupWs]);

  return {
    server,
    isScanning,
    discoveredServers,
    connectionError,
    connectToServer,
    disconnect,
    sendAction,
    scanNetwork,
    testConnection,
    getLocalSubnet,
    decks,
    voiceEnabled,
    lastIntent,
    sendHubAction,
    sendIntent,
    lastServer,
    discovering,
    discover,
    rememberServer,
    manualIP,
    setManualIP,
    manualPort,
    setManualPort,
  };
}
