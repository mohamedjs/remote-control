import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeMode } from '../types';
import type { DiscoveredServer } from '../hooks/useDiscovery';
import { GlassCard } from './GlassCard';
import { X, Search, Laptop, Wifi, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react-native';

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (ip: string) => void;
  isScanning: boolean;
  discoveredServers: DiscoveredServer[];
  onStartScan: (subnet: string) => void;
  onTestConnection?: (ip: string) => Promise<boolean>;
  onGetSubnet?: () => Promise<string>;
  connectionError?: string | null;
  theme: ThemeMode;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  visible,
  onClose,
  onConnect,
  isScanning,
  discoveredServers,
  onStartScan,
  onTestConnection,
  onGetSubnet,
  connectionError,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const [manualIp, setManualIp] = useState('');
  const [subnet, setSubnet] = useState('192.168.1');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const isDark = theme === 'dark';

  // Auto-detect subnet when modal opens
  useEffect(() => {
    if (visible && onGetSubnet) {
      onGetSubnet().then(s => setSubnet(s));
    }
  }, [visible, onGetSubnet]);

  const handleTestManualIp = async () => {
    if (!manualIp.trim() || !onTestConnection) return;
    setTestStatus('testing');
    const ok = await onTestConnection(manualIp.trim());
    setTestStatus(ok ? 'ok' : 'fail');
  };

  const handleConnect = () => {
    if (manualIp.trim()) {
      onConnect(manualIp.trim());
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
        <GlassCard theme={theme} style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Wifi size={22} color={isDark ? '#38bdf8' : '#0284c7'} />
              <Text style={[styles.title, isDark ? styles.darkText : styles.lightText]}>
                Connect to Laptop
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {connectionError ? (
            <View style={[styles.errorBanner, isDark ? styles.darkErrorBanner : styles.lightErrorBanner]}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={[styles.errorText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>
                {connectionError}
              </Text>
            </View>
          ) : null}

          {/* Subnet Scan Section */}
          <View style={styles.scanSection}>
            <Text style={[styles.label, isDark ? styles.darkSubText : styles.lightSubText]}>
              Auto Scan Subnet (auto-detected)
            </Text>
            <View style={styles.scanRow}>
              <TextInput
                style={[
                  styles.subnetInput,
                  isDark ? styles.darkInput : styles.lightInput,
                  isDark ? styles.darkText : styles.lightText,
                ]}
                value={subnet}
                onChangeText={setSubnet}
                placeholder="192.168.1"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                keyboardType="numeric"
              />
              <TouchableOpacity
                disabled={isScanning}
                onPress={() => onStartScan(subnet)}
                style={[styles.scanBtn, isScanning ? styles.scanBtnDisabled : (isDark ? styles.darkScanBtn : styles.lightScanBtn)]}
              >
                {isScanning ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.scanBtnText}>Scanning...</Text>
                  </>
                ) : (
                  <>
                    <Search size={16} color="#fff" />
                    <Text style={styles.scanBtnText}>Scan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Discovered Machines List */}
          <Text style={[styles.label, isDark ? styles.darkSubText : styles.lightSubText]}>
            Discovered Devices ({discoveredServers.length})
          </Text>
          <ScrollView style={styles.listContainer}>
            {discoveredServers.length === 0 ? (
              <Text style={[styles.emptyText, isDark ? styles.darkSubText : styles.lightSubText]}>
                {isScanning ? 'Scanning network range...' : 'No devices found. Tap Scan or enter IP manually below.'}
              </Text>
            ) : (
              discoveredServers.map((server) => (
                <TouchableOpacity
                  key={`${server.ip}:${server.port}`}
                  onPress={() => {
                    onConnect(server.ip);
                    onClose();
                  }}
                  style={[styles.serverItem, isDark ? styles.darkServerItem : styles.lightServerItem]}
                >
                  <Laptop size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
                  <View style={styles.serverInfo}>
                    <Text style={[styles.serverName, isDark ? styles.darkText : styles.lightText]}>
                      {server.hostname} ({server.ip})
                    </Text>
                    <Text style={[styles.serverStatus, { color: '#22c55e' }]}>Ready — tap to connect</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Manual IP Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.line, isDark ? styles.darkLine : styles.lightLine]} />
            <Text style={[styles.orText, isDark ? styles.darkSubText : styles.lightSubText]}>OR ENTER MANUALLY</Text>
            <View style={[styles.line, isDark ? styles.darkLine : styles.lightLine]} />
          </View>

          {/* Manual Connection */}
          <View style={styles.manualRow}>
            <TextInput
              style={[
                styles.manualInput,
                isDark ? styles.darkInput : styles.lightInput,
                isDark ? styles.darkText : styles.lightText,
              ]}
              placeholder="e.g. 192.168.1.15"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              value={manualIp}
              onChangeText={(t) => { setManualIp(t); setTestStatus('idle'); }}
              keyboardType="numeric"
            />

            {/* Test Button */}
            {onTestConnection && (
              <TouchableOpacity
                disabled={!manualIp.trim() || testStatus === 'testing'}
                onPress={handleTestManualIp}
                style={[
                  styles.testBtn,
                  testStatus === 'ok' ? styles.testBtnOk :
                  testStatus === 'fail' ? styles.testBtnFail :
                  (isDark ? styles.darkTestBtn : styles.lightTestBtn),
                ]}
              >
                {testStatus === 'testing' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : testStatus === 'ok' ? (
                  <CheckCircle size={18} color="#fff" />
                ) : testStatus === 'fail' ? (
                  <AlertCircle size={18} color="#fff" />
                ) : (
                  <RefreshCw size={18} color="#fff" />
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              disabled={!manualIp.trim()}
              onPress={handleConnect}
              style={[styles.connectBtn, !manualIp.trim() && styles.connectBtnDisabled]}
            >
              <Text style={styles.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>

          {/* Test status text */}
          {testStatus === 'ok' && (
            <Text style={[styles.testResultText, { color: '#22c55e' }]}>✅ Server found! Tap Connect.</Text>
          )}
          {testStatus === 'fail' && (
            <Text style={[styles.testResultText, { color: '#ef4444' }]}>❌ No server at this IP. Check if it's running.</Text>
          )}
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  darkErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  lightErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  scanSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  scanRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subnetInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  scanBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
  },
  scanBtnDisabled: {
    backgroundColor: '#64748b',
  },
  darkScanBtn: {
    backgroundColor: '#0284c7',
  },
  lightScanBtn: {
    backgroundColor: '#0369a1',
  },
  scanBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    maxHeight: 160,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 13,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  darkServerItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lightServerItem: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 14,
    fontWeight: '600',
  },
  serverStatus: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
  },
  darkLine: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  lightLine: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  testBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkTestBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  lightTestBtn: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  testBtnOk: {
    backgroundColor: '#16a34a',
  },
  testBtnFail: {
    backgroundColor: '#dc2626',
  },
  darkInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  lightInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  connectBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnDisabled: {
    opacity: 0.5,
  },
  connectBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#000000',
  },
  darkSubText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lightSubText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
});
