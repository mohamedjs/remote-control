import React from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { Wifi, Loader } from 'lucide-react-native';
import type { DiscoveredServer } from '../hooks/useDiscovery';
import type { ThemeMode } from '../types';
import { getPalette } from '../theme';

interface ServerPickerProps {
  visible: boolean;
  servers: DiscoveredServer[];
  discovering: boolean;
  lastServer: DiscoveredServer | null;
  onSelect: (server: DiscoveredServer) => void;
  onDismiss: () => void;
  theme: ThemeMode;
}

export const ServerPicker: React.FC<ServerPickerProps> = ({
  visible, servers, discovering, lastServer, onSelect, onDismiss, theme,
}) => {
  const p = getPalette(theme);

  const renderServer = (server: DiscoveredServer, isLast: boolean) => (
    <TouchableOpacity
      key={`${server.ip}:${server.port}`}
      onPress={() => {
        onSelect(server);
        onDismiss();
      }}
      style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}
    >
      <View style={styles.cardContent}>
        <Wifi size={18} color={p.accent} />
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: p.text }]} numberOfLines={1}>
            {server.hostname}
          </Text>
          <Text style={[styles.cardSub, { color: p.textMuted }]}>
            {server.ip}:{server.port} · {server.platform}
          </Text>
        </View>
        {isLast && (
          <Text style={[styles.badge, { backgroundColor: p.accentSoft, color: p.accent }]}>
            Last used
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <View style={[styles.modal, { backgroundColor: p.bg, borderColor: p.border }]}>
          <Text style={[styles.title, { color: p.text }]}>Found Servers</Text>

          {discovering ? (
            <View style={styles.loadingBox}>
              <Loader size={32} color={p.accent} />
              <Text style={[styles.loadingText, { color: p.textMuted }]}>Discovering...</Text>
            </View>
          ) : servers.length === 0 ? (
            <Text style={[styles.empty, { color: p.textMuted }]}>
              No servers found on this network.{'\n'}
              Make sure your PC is running the remote control server.
            </Text>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {servers.map((s) => renderServer(s, lastServer?.ip === s.ip && lastServer?.port === s.port))}
            </ScrollView>
          )}

          {servers.length > 0 && (
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.dismissBtn, { backgroundColor: p.surface, borderColor: p.border }]}
            >
              <Text style={[styles.dismissText, { color: p.textMuted }]}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  modal: {
    borderRadius: 18, borderWidth: 1, padding: 20, maxHeight: '72%', width: '100%',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16, letterSpacing: 0.2 },
  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  list: { gap: 8, paddingBottom: 12 },
  card: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cardSub: { fontSize: 12, letterSpacing: 0.3 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', paddingVertical: 28, fontSize: 14, lineHeight: 20 },
  dismissBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  dismissText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});
