import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DiscoveredServer {
  hostname: string;
  ip: string;
  port: number;
  platform: string;
}

const DISCOVERY_TIMEOUT_MS = 3000;
const LAST_SERVER_KEY = 'last_connected_server';

/**
 * Discover remote control servers on the local network.
 * Tries UDP first (native device), falls back to HTTP ping scan (Expo Go).
 */
export function useDiscovery() {
  const [servers, setServers] = useState<DiscoveredServer[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [lastServer, setLastServer] = useState<DiscoveredServer | null>(null);

  // Load the last connected server from storage
  useEffect(() => {
    AsyncStorage.getItem(LAST_SERVER_KEY)
      .then((json: string | null) => {
        if (json) {
          try {
            setLastServer(JSON.parse(json));
          } catch {
            // Ignore parse errors
          }
        }
      })
      .catch(() => {
        // Ignore storage errors
      });
  }, []);

  // Try UDP discovery (works on native device)
  const discoverViaUDP = useCallback((): Promise<DiscoveredServer[]> => {
    return new Promise((resolve) => {
      try {
        const dgram = require('react-native-udp');
        const socket = dgram.createSocket('udp4');
        const found: DiscoveredServer[] = [];

        const timeout = setTimeout(() => {
          try {
            socket.close();
          } catch {
            // Socket may already be closed
          }
          resolve(found);
        }, DISCOVERY_TIMEOUT_MS);

        socket.on('message', (msg: any) => {
          try {
            const data = JSON.parse(msg.toString());
            if (data.type === 'REMOTE_CONTROL' && data.ips && data.ips[0]) {
              const server: DiscoveredServer = {
                hostname: data.hostname || 'Unknown',
                ip: data.ips[0],
                port: data.port || 3000,
                platform: data.platform || 'unknown',
              };
              if (!found.some((s) => s.ip === server.ip && s.port === server.port)) {
                found.push(server);
              }
            }
          } catch {
            // Ignore malformed packets
          }
        });

        socket.on('error', () => {
          // Silently fail, try HTTP fallback
          clearTimeout(timeout);
          resolve(found);
        });

        socket.bind(3334, () => {
          try {
            socket.setBroadcast(true);
            const req = 'DISCOVER_REMOTE_CONTROL';
            socket.send(req, 0, req.length, 3333, '255.255.255.255', () => {});
          } catch {
            clearTimeout(timeout);
            resolve(found);
          }
        });
      } catch {
        resolve([]);
      }
    });
  }, []);

  // Fallback: HTTP ping scan for Expo Go compatibility
  // Scans common subnet IPs and tries to connect
  const discoverViaHTTP = useCallback((): Promise<DiscoveredServer[]> => {
    return new Promise((resolve) => {
      const found: DiscoveredServer[] = [];
      let completed = 0;
      let attempts = 0;

      // Scan 192.168.x.0/24 — adjust for your network if needed
      // Ponytail: brute-force IP scan. If this becomes slow, switch to mDNS on native.
      const subnets = ['192.168.1', '192.168.0', '10.0.0', '172.16.0'];
      const ips: string[] = [];

      for (const subnet of subnets) {
        for (let i = 1; i <= 10; i++) {
          ips.push(`${subnet}.${i}`);
        }
      }

      const checkIP = (ip: string) => {
        const timeout = setTimeout(() => {
          completed++;
          if (completed === attempts) resolve(found);
        }, 300);

        fetch(`http://${ip}:3000/`, { method: 'HEAD' })
          .then(() => {
            // If we can reach the server, try to get its info via WebSocket
            // For now, just add it with basic info
            const server: DiscoveredServer = {
              hostname: ip,
              ip,
              port: 3000,
              platform: 'unknown',
            };
            if (!found.some((s) => s.ip === server.ip)) {
              found.push(server);
            }
            clearTimeout(timeout);
            completed++;
            if (completed === attempts) resolve(found);
          })
          .catch(() => {
            clearTimeout(timeout);
            completed++;
            if (completed === attempts) resolve(found);
          });
      };

      attempts = ips.length;
      ips.forEach((ip) => checkIP(ip));

      // Timeout the whole scan
      setTimeout(() => resolve(found), DISCOVERY_TIMEOUT_MS);
    });
  }, []);

  const discover = useCallback(async () => {
    setDiscovering(true);

    // Try UDP first
    let found = await discoverViaUDP();

    // If UDP found nothing, try HTTP fallback
    if (found.length === 0) {
      found = await discoverViaHTTP();
    }

    setServers(found);
    setDiscovering(false);
    return found;
  }, [discoverViaUDP, discoverViaHTTP]);

  // Auto-discover on mount
  useEffect(() => {
    discover();
  }, [discover]);

  // Remember the last chosen server
  const rememberServer = useCallback((server: DiscoveredServer) => {
    AsyncStorage.setItem(LAST_SERVER_KEY, JSON.stringify(server)).catch(() => {
      // Ignore storage errors
    });
    setLastServer(server);
  }, []);

  return {
    servers,
    lastServer,
    discovering,
    discover,
    rememberServer,
  };
}
