import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import {
  KeyDef,
  KeyEvent,
  ModifierState,
  KeyboardOrientation,
} from './keyboard.types';
import type { ModifierName, ThemeMode } from '../../types';
import { getPalette } from '../../theme';
import {
  landscapeLayout,
  portraitLayout,
  portraitMoreLayout,
} from './keyboardLayouts';
import { KeyboardRow } from './KeyboardRow';

interface KeyboardProps {
  onKeyPress: (event: KeyEvent) => void;
  orientation: KeyboardOrientation;
  theme: ThemeMode;
  disabled?: boolean;
}

/** Absolute floor — below this keys stop being tappable. */
const MIN_KEY_SIZE = 22;
/** Ceiling so keys don't become comically large on a tablet. */
const MAX_KEY_SIZE = 82;
/** Horizontal + vertical margin each key adds (marginHorizontal/Vertical * 2). */
const KEY_GAP = 5;
/**
 * Key height is no longer derived from width — it fills whatever vertical room
 * the container has, bounded by these aspect limits so keys stay key-shaped.
 * Portrait has height to spare, so keys grow taller than they are wide.
 */
const ASPECT_MIN = 0.62;
const ASPECT_MAX = 1.30;

export const Keyboard: React.FC<KeyboardProps> = React.memo(({
  onKeyPress,
  orientation,
  theme,
  disabled,
}) => {
  const [modifiers, setModifiers] = useState<ModifierState>({
    shift: false, ctrl: false, alt: false, cmd: false, fn: false, capsLock: false,
  });
  const [showMore, setShowMore] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const isLandscape = orientation === 'landscape';
  const palette = getPalette(theme);

  // Landscape can trade the F-row for taller keys.
  const currentLayout = useMemo(() => {
    if (!isLandscape) return portraitLayout;
    // Default shows everything (Esc and Del live in that row); pressing Fn
    // trades the F-row away for taller keys.
    return modifiers.fn ? landscapeLayout.slice(1) : landscapeLayout;
  }, [isLandscape, modifiers.fn]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  // Keys are sized by BOTH axes. Sizing on width alone (the previous
  // behaviour) let six landscape rows overflow the container and get clipped
  // top and bottom — the F-row and the spacebar row vanished off-screen.
  const sizing = useMemo(() => {
    if (containerWidth === 0 || containerHeight === 0) {
      return { keyW: 0, keyH: 0, fontSize: 0, maxRowWidth: 0 };
    }

    const layout = currentLayout;

    let maxRowWidth = 0;
    for (const row of layout) {
      const rowW = row.reduce((sum, k) => sum + (k.width || 1), 0);
      if (rowW > maxRowWidth) maxRowWidth = rowW;
    }

    // Width: fill the container edge to edge.
    const safeW = containerWidth - 8;
    const widthKeyW = (safeW - maxRowWidth * KEY_GAP) / maxRowWidth;

    // Height: fill the container top to bottom.
    const safeH = containerHeight - 8;
    const rows = layout.length;
    const availRowH = (safeH - rows * KEY_GAP) / rows;

    let keyW = Math.min(widthKeyW, MAX_KEY_SIZE);
    let keyH = availRowH;

    // Keep the cap key-shaped. Portrait usually hits the tall cap; landscape
    // is short, so instead of leaving very wide flat keys we narrow them.
    if (keyH > keyW * ASPECT_MAX) keyH = keyW * ASPECT_MAX;
    if (keyH < keyW * ASPECT_MIN) keyW = keyH / ASPECT_MIN;

    keyW = Math.max(MIN_KEY_SIZE, keyW);
    keyH = Math.max(MIN_KEY_SIZE * ASPECT_MIN, keyH);

    const fontSize = Math.max(10, Math.min(24, Math.min(keyW, keyH) * 0.42));

    return { keyW, keyH, fontSize, maxRowWidth };
  }, [containerWidth, containerHeight, currentLayout]);

  const shiftActive = modifiers.shift || modifiers.capsLock;

  const handleKeyPress = useCallback((keyDef: KeyDef) => {
    if (disabled) return;

    if (keyDef.code === 'More') {
      setShowMore(prev => !prev);
      return;
    }

    if (keyDef.type === 'modifier') {
      const modMap: Record<string, keyof ModifierState> = {
        'ShiftLeft': 'shift', 'ShiftRight': 'shift',
        'ControlLeft': 'ctrl', 'ControlRight': 'ctrl',
        'AltLeft': 'alt', 'AltRight': 'alt',
        'MetaLeft': 'cmd', 'MetaRight': 'cmd',
        'Fn': 'fn',
        'CapsLock': 'capsLock',
      };

      const mod = modMap[keyDef.code];
      if (mod) {
        setModifiers(prev => ({ ...prev, [mod]: !prev[mod] }));
      }

      // Modifiers are sticky UI state; they are transmitted with the next real
      // key, not on their own.
      return;
    }

    let keyChar = keyDef.label;
    if (keyDef.type === 'character' && shiftActive) {
      keyChar = keyDef.shiftLabel || keyDef.label.toUpperCase();
    }

    // Shift is already baked into `keyChar` for character keys, so only send it
    // alongside keys where it changes meaning rather than the character itself.
    const held: ModifierName[] = [];
    if (modifiers.ctrl) held.push('Control');
    if (modifiers.alt) held.push('Alt');
    if (modifiers.cmd) held.push('Meta');
    if (modifiers.shift && keyDef.type !== 'character') held.push('Shift');

    onKeyPress({
      key: keyChar,
      code: keyDef.code,
      type: keyDef.type,
      modifiers: held,
    });

    // One-shot modifiers: consume them after the key they applied to.
    if (modifiers.shift || modifiers.ctrl || modifiers.alt || modifiers.cmd) {
      setModifiers(prev => ({
        ...prev,
        shift: prev.capsLock ? prev.shift : false,
        ctrl: false,
        alt: false,
        cmd: false,
      }));
    }
  }, [shiftActive, modifiers, onKeyPress, disabled]);

  const modStateMap = useMemo<Record<string, boolean>>(() => ({
    'ShiftLeft': modifiers.shift,
    'ShiftRight': modifiers.shift,
    'ControlLeft': modifiers.ctrl,
    'ControlRight': modifiers.ctrl,
    'AltLeft': modifiers.alt,
    'AltRight': modifiers.alt,
    'MetaLeft': modifiers.cmd,
    'MetaRight': modifiers.cmd,
    'Fn': modifiers.fn,
    'CapsLock': modifiers.capsLock,
  }), [modifiers]);


  return (
    <View style={[styles.container, disabled && styles.disabled]} onLayout={onLayout}>
      {containerWidth > 0 && containerHeight > 0 && (
        <View style={styles.keyboardBody}>
          {currentLayout.map((row, rowIndex) => (
            <KeyboardRow
              key={`row-${rowIndex}`}
              keys={row}
              baseKeyWidth={sizing.keyW}
              keyHeight={sizing.keyH}
              fontSize={sizing.fontSize}
              shiftActive={shiftActive}
              modifiers={modStateMap}
              palette={palette}
              onKeyPress={handleKeyPress}
            />
          ))}

          {!isLandscape && showMore && (
            <ScrollView
              style={[styles.morePanel, { borderTopColor: palette.border }]}
              contentContainerStyle={styles.morePanelContent}
              showsVerticalScrollIndicator={false}
            >
              {portraitMoreLayout.map((row, rowIndex) => (
                <KeyboardRow
                  key={`more-${rowIndex}`}
                  keys={row}
                  baseKeyWidth={sizing.keyW}
                  keyHeight={sizing.keyH * 0.9}
                  fontSize={sizing.fontSize * 0.9}
                  shiftActive={shiftActive}
                  modifiers={modStateMap}
                  palette={palette}
                  onKeyPress={handleKeyPress}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
});

Keyboard.displayName = 'Keyboard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  keyboardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  morePanel: {
    maxHeight: 160,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    width: '100%',
  },
  morePanelContent: {
    alignItems: 'center',
    paddingBottom: 4,
  },
});
