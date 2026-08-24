import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Sun, Moon, Wifi, WifiOff, Menu } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useRemoteControl } from './src/hooks/useRemoteControl';
import { Trackpad } from './src/components/Trackpad';
import { Keyboard, type KeyEvent, type KeyboardOrientation } from './src/components/keyboard/index';
import { DeckHub } from './src/components/DeckHub';
import { ScannerModal } from './src/components/ScannerModal';
import { ServerPicker } from './src/components/ServerPicker';
import type { ThemeMode } from './src/types';
import { getPalette, raised } from './src/theme';
import { toActionMessage } from './src/keymap';

const TRACKPAD_SPLIT_PORTRAIT = 0.4;
const TRACKPAD_SPLIT_LANDSCAPE = 0.28;

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(true);
  const { width: screenW, height: screenH } = useWindowDimensions();

  const {
    server,
    isScanning,
    discoveredServers,
    lastServer,
    discovering,
    rememberServer,
    connectionError,
    connectToServer,
    disconnect,
    sendAction,
    scanNetwork,
    decks,
    voiceEnabled,
    lastIntent,
    sendHubAction,
    sendIntent,
  } = useRemoteControl();

  const isConnected = !!server;
  const isLandscape = screenW > screenH;
  const p = getPalette(theme);

  // Auto-show server picker once on mount
  useEffect(() => {
    if (discoveredServers.length > 0 && !isConnected) {
      setPickerVisible(true);
    }
  }, [discoveredServers.length, isConnected]);

  const handleServerSelect = (server: any) => {
    rememberServer(server);
    connectToServer(server.ip);
    setPickerVisible(false);
  };

  const handleKeyboardEvent = (evt: KeyEvent) => {
    if (!isConnected) return;
    const msg = toActionMessage(evt);
    if (msg) sendAction(msg);
  };

  const handleTrackpadMove = (dx: number, dy: number) => {
    if (!isConnected) return;
    sendAction({ type: 'move', dx, dy });
  };

  const handleTrackpadClick = (button: 'left' | 'right') => {
    if (!isConnected) return;
    Haptics.impactAsync(button === 'right' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    sendAction({ type: 'click', button });
  };

  const trackpadHeight = isLandscape
    ? screenH * TRACKPAD_SPLIT_LANDSCAPE
    : screenH * TRACKPAD_SPLIT_PORTRAIT;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={[styles.container, { backgroundColor: p.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: p.bg, borderBottomColor: p.border }]}>
          <View style={styles.headerLeft}>
            {isConnected ? (
              <View style={styles.statusPill}>
                <Wifi size={13} color={p.text} />
                <Text style={[styles.statusText, { color: p.text }]}>
                  Connected
                </Text>
              </View>
            ) : (
              <View style={styles.statusPill}>
                <WifiOff size={13} color={p.textMuted} />
                <Text style={[styles.statusText, { color: p.textMuted }]}>
                  {discovering ? 'Discovering...' : 'Disconnected'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            {isConnected && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  disconnect();
                }}
                style={[styles.headerBtn, { borderColor: p.border }]}
              >
                <WifiOff size={16} color={p.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setScannerVisible(true)}
              style={[styles.headerBtn, { borderColor: p.border }]}
            >
              <Menu size={16} color={p.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={[styles.headerBtn, { borderColor: p.border }]}
            >
              {theme === 'dark' ? (
                <Sun size={16} color={p.accent} />
              ) : (
                <Moon size={16} color={p.accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Error */}
        {connectionError && (
          <View style={[styles.errorBar, { backgroundColor: p.accentSoft }]}>
            <Text style={[styles.errorText, { color: p.accent }]}>{connectionError}</Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Trackpad */}
          <View style={[styles.trackpadContainer, { height: trackpadHeight }]}>
            {isConnected ? (
              <Trackpad
                theme={theme}
                onAction={(action) => {
                  if (action.type === 'move') {
                    handleTrackpadMove(action.dx, action.dy);
                  } else if (action.type === 'click') {
                    handleTrackpadClick(action.button as 'left' | 'right');
                  }
                }}
              />
            ) : (
              <View style={[styles.placeholder, { backgroundColor: p.surface, borderColor: p.border }]}>
                <Text style={[styles.placeholderText, { color: p.textMuted }]}>
                  {discovering ? 'Discovering servers...' : 'Select a server to begin'}
                </Text>
              </View>
            )}
          </View>

          {/* Hub + Keyboard Stack */}
          <View style={styles.bottomStack}>
            {isConnected && (
              <DeckHub
                theme={theme}
                decks={decks}
                connected={isConnected}
                voiceEnabled={voiceEnabled}
                lastIntent={lastIntent}
                compact={isLandscape}
                onAction={sendHubAction}
                onIntent={sendIntent}
              />
            )}

            <View style={[styles.keyboardContainer, { backgroundColor: p.surface, boxShadow: raised(p, 4, 8) }]}>
              <Keyboard
                theme={theme}
                onKeyPress={handleKeyboardEvent}
                orientation={isLandscape ? 'landscape' : 'portrait'}
                disabled={!isConnected}
              />
            </View>
          </View>
        </View>

        {/* Modals */}
        <ServerPicker
          visible={pickerVisible && !isConnected && discoveredServers.length > 0}
          servers={discoveredServers}
          discovering={discovering}
          lastServer={lastServer || null}
          onSelect={handleServerSelect}
          onDismiss={() => setPickerVisible(false)}
          theme={theme}
        />

        <ScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onConnect={(ip) => {
            connectToServer(ip);
            setScannerVisible(false);
          }}
          isScanning={isScanning}
          discoveredServers={discoveredServers}
          onStartScan={scanNetwork}
          connectionError={connectionError}
          theme={theme}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBar: { paddingHorizontal: 12, paddingVertical: 8 },
  errorText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  mainContent: { flex: 1, flexDirection: 'column' },
  trackpadContainer: { flex: 0, paddingHorizontal: 6, paddingVertical: 6 },
  placeholder: { flex: 1, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 14, textAlign: 'center' },
  bottomStack: { flex: 1, gap: 4, paddingHorizontal: 6, paddingBottom: 6 },
  keyboardContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
});
