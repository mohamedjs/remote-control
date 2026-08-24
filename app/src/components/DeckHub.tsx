import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, Pressable, Modal, ScrollView, TextInput,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { X, Mic, ChevronUp } from 'lucide-react-native';
import type { Deck, ThemeMode } from '../types';
import { getPalette, raised, sunken, glassShadow } from '../theme';

interface DeckHubProps {
  theme: ThemeMode;
  decks: Deck[];
  connected: boolean;
  voiceEnabled: boolean;
  lastIntent: string | null;
  compact?: boolean;
  onAction: (deck: string, control: string) => void;
  onIntent: (text: string, deck: string) => void;
}

export const DeckHub: React.FC<DeckHubProps> = ({
  theme, decks, connected, voiceEnabled, lastIntent, compact, onAction, onIntent,
}) => {
  const p = getPalette(theme);
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [utterance, setUtterance] = useState('');

  const active = useMemo(
    () => decks.find(d => d.id === activeId) ?? decks[0] ?? null,
    [decks, activeId],
  );

  const label = !connected
    ? 'CONTROL HUB'
    : active
      ? active.name.toUpperCase()
      : 'NO DECKS';

  const press = (controlId: string) => {
    if (!active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction(active.id, controlId);
  };

  const submitIntent = () => {
    const text = utterance.trim();
    if (!text || !active) return;
    onIntent(text, active.id);
    setUtterance('');
  };

  return (
    <>
      <Pressable
        onPress={() => connected && setOpen(true)}
        style={({ pressed }) => [
          styles.bar,
          compact && styles.barCompact,
          {
            backgroundColor: p.glass,
            borderColor: p.glassEdge,
            boxShadow: glassShadow(p),
            opacity: connected ? (pressed ? 0.88 : 1) : 0.5,
          },
        ]}
      >
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="hubSheen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={isDark ? 0.2 : 0.98} />
              <Stop offset="0.42" stopColor="#FFFFFF" stopOpacity={isDark ? 0.07 : 0.55} />
              <Stop offset="0.52" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={isDark ? 0.04 : 0.28} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx="16" fill="url(#hubSheen)" />
        </Svg>

        <View style={styles.barInner}>
          <Text
            style={[styles.label, compact && styles.labelCompact, { color: p.textMuted }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {connected && active ? (
            <ChevronUp size={compact ? 13 : 15} color={p.textMuted} />
          ) : null}
        </View>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: p.bg, borderColor: p.border }]}>
            <View style={styles.sheetHead}>
              <View>
                <Text style={[styles.sheetTitle, { color: p.text }]}>
                  {active?.name ?? 'Hub'}
                </Text>
                <Text style={[styles.sheetSub, { color: p.textMuted }]}>
                  {active ? `${active.context} · ${active.controls.length} controls` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                style={[styles.closeBtn, { backgroundColor: p.surface, borderColor: p.border, boxShadow: raised(p, 3, 7) }]}
              >
                <X size={17} color={p.textMuted} />
              </Pressable>
            </View>

            {/* Deck switcher */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {decks.map(d => {
                const on = d.id === active?.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => setActiveId(d.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: on ? p.accentSoft : p.surface,
                        borderColor: on ? p.accent : p.border,
                        boxShadow: on ? sunken(p, 2, 4) : raised(p, 3, 6),
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: on ? p.accent : p.textMuted }]}>
                      {d.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Controls */}
            <ScrollView contentContainerStyle={styles.grid}>
              {active?.controls.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => press(c.id)}
                  style={({ pressed }) => [
                    styles.control,
                    c.wide && styles.controlWide,
                    {
                      backgroundColor: c.wide ? p.accentSoft : p.surface,
                      borderColor: c.wide ? p.accent : p.border,
                      boxShadow: pressed ? sunken(p, 3, 6) : raised(p, 4, 9),
                    },
                  ]}
                >
                  <Text style={[styles.glyph, { color: c.wide ? p.accent : p.text }]}>
                    {c.glyph ?? '•'}
                  </Text>
                  <Text
                    style={[styles.controlLabel, { color: c.wide ? p.accent : p.textMuted }]}
                    numberOfLines={1}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Natural language */}
            <View style={[styles.voiceRow, { borderTopColor: p.border }]}>
              <View
                style={[
                  styles.input,
                  { backgroundColor: p.surfaceSunken, borderColor: p.border, boxShadow: sunken(p, 2, 5) },
                ]}
              >
                <Mic size={15} color={voiceEnabled ? p.accent : p.textMuted} />
                <TextInput
                  value={utterance}
                  onChangeText={setUtterance}
                  onSubmitEditing={submitIntent}
                  returnKeyType="send"
                  placeholder={voiceEnabled ? 'Say what you want…' : 'Set GROQ_API_KEY to enable'}
                  placeholderTextColor={p.textMuted}
                  editable={voiceEnabled}
                  style={[styles.inputText, { color: p.text }]}
                />
              </View>
              <Pressable
                onPress={submitIntent}
                disabled={!voiceEnabled}
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: p.surface,
                    borderColor: p.accent,
                    opacity: voiceEnabled ? 1 : 0.4,
                    boxShadow: pressed ? sunken(p, 2, 4) : raised(p, 3, 7),
                  },
                ]}
              >
                <Text style={[styles.sendText, { color: p.accent }]}>RUN</Text>
              </Pressable>
            </View>

            {lastIntent ? (
              <Text style={[styles.intentResult, { color: p.textMuted }]} numberOfLines={2}>
                {lastIntent}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 40, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  barCompact: { height: 28, borderRadius: 12 },
  barInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  labelCompact: { fontSize: 10, letterSpacing: 2.2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth, padding: 16, maxHeight: '88%',
  },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  sheetTitle: { fontSize: 19, fontWeight: '700', letterSpacing: 0.2 },
  sheetSub: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth,
  },

  chipRow: { gap: 7, paddingBottom: 14, paddingRight: 4 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  control: {
    width: '31.5%', aspectRatio: 1.25, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', gap: 5, borderWidth: StyleSheet.hairlineWidth,
  },
  controlWide: { width: '100%', aspectRatio: undefined, height: 56, flexDirection: 'row', gap: 10 },
  glyph: { fontSize: 20 },
  controlLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  voiceRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  input: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 42, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth,
  },
  inputText: { flex: 1, fontSize: 14, padding: 0 },
  sendBtn: {
    paddingHorizontal: 16, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth,
  },
  sendText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  intentResult: { fontSize: 11.5, marginTop: 9, textAlign: 'center' },
});
