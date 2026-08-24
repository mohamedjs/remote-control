import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ActionMessage, ThemeMode } from '../types';
import { GlassCard } from './GlassCard';
import {
  X,
  CornerDownLeft,
  Delete,
  ChevronUp,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';

type KeyboardLayout = 'vertical' | 'horizontal';
type KeyboardLayer = 'lower' | 'upper' | 'symbols' | 'symbols2';

interface CustomKeyboardProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: ActionMessage) => void;
  theme: ThemeMode;
}

// ─── Key Definitions ────────────────────────────────────────────
const ROWS_LOWER = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

const ROWS_UPPER = [
  ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'],
];

// Function keys row
const F_KEYS = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

export const CustomKeyboard: React.FC<CustomKeyboardProps> = ({
  visible,
  onClose,
  onAction,
  theme,
}) => {
  const [layout, setLayout] = useState<KeyboardLayout>('vertical');
  const [layer, setLayer] = useState<KeyboardLayer>('lower');
  const [capsLock, setCapsLock] = useState(false);
  const [showFnRow, setShowFnRow] = useState(false);
  const isDark = theme === 'dark';

  if (!visible) return null;

  const currentRows = (layer === 'upper' || capsLock) ? ROWS_UPPER : ROWS_LOWER;
  const isHorizontal = layout === 'horizontal';
  const keySize = isHorizontal ? 36 : 40;
  const keyFontSize = isHorizontal ? 13 : 15;
  const keyGap = isHorizontal ? 3 : 4;
  const rowGap = isHorizontal ? 3 : 5;

  const handleKeyPress = (key: string) => {
    // Handle special display keys
    if (key === 'Esc') {
      onAction({ type: 'key', key: 'Escape' });
      return;
    }
    if (key.startsWith('F') && key.length <= 3 && /^F\d+$/.test(key)) {
      onAction({ type: 'key', key });
      return;
    }
    onAction({ type: 'key', key });

    // Auto-release shift after a keypress (unless caps lock is on)
    if (layer === 'upper' && !capsLock) {
      setLayer('lower');
    }
  };

  const handleSpecialKey = (key: string) => {
    switch (key) {
      case 'Backspace':
      case 'Enter':
      case 'Tab':
        onAction({ type: 'key', key });
        break;
      case 'Space':
        onAction({ type: 'key', key: ' ' });
        break;
      case 'Shift':
        setLayer(prev => prev === 'upper' ? 'lower' : 'upper');
        break;
      case 'CapsLock':
        setCapsLock(prev => !prev);
        if (!capsLock) setLayer('upper');
        else setLayer('lower');
        break;
    }
  };

  // ─── Render a single key ──────────────────────────────────────
  const renderKey = (
    label: string,
    onPress: () => void,
    widthMultiplier = 1,
    isActive = false,
    icon?: React.ReactNode,
  ) => {
    const w = keySize * widthMultiplier + keyGap * (widthMultiplier - 1);
    return (
      <TouchableOpacity
        key={label}
        activeOpacity={0.6}
        onPress={onPress}
        style={[
          styles.key,
          {
            width: w,
            height: keySize,
            borderRadius: isHorizontal ? 5 : 7,
          },
          isDark ? styles.darkKey : styles.lightKey,
          isActive && styles.activeKey,
        ]}
      >
        {icon || (
          <Text
            style={[
              styles.keyLabel,
              { fontSize: keyFontSize },
              isDark ? styles.darkKeyLabel : styles.lightKeyLabel,
              isActive && styles.activeKeyLabel,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Render keyboard rows ────────────────────────────────────
  const renderRows = () => {
    return (
      <View style={{ gap: rowGap }}>
        {/* Function keys row (toggleable) */}
        {showFnRow && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.keyRow, { gap: keyGap }]}>
              {F_KEYS.map(k =>
                renderKey(k, () => handleKeyPress(k))
              )}
            </View>
          </ScrollView>
        )}

        {/* Main character rows */}
        {currentRows.map((row, rowIndex) => (
          <ScrollView key={rowIndex} horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.keyRow, { gap: keyGap }]}>
              {/* Row 3 (index 2): add Tab at start */}
              {rowIndex === 2 &&
                renderKey(
                  'Tab',
                  () => handleSpecialKey('Tab'),
                  1.3,
                  false,
                )
              }

              {/* Row 4 (index 3): add Shift at start */}
              {rowIndex === 3 &&
                renderKey(
                  '⇧',
                  () => handleSpecialKey('Shift'),
                  1.5,
                  layer === 'upper',
                )
              }

              {row.map(k => renderKey(k, () => handleKeyPress(k)))}

              {/* Row 4 (index 3): add Backspace at end */}
              {rowIndex === 3 &&
                renderKey(
                  '⌫',
                  () => handleSpecialKey('Backspace'),
                  1.5,
                  false,
                  <Delete size={isHorizontal ? 14 : 16} color={isDark ? '#fff' : '#000'} />,
                )
              }
            </View>
          </ScrollView>
        ))}

        {/* Bottom row: modifier keys + space + enter */}
        <View style={[styles.keyRow, { gap: keyGap, justifyContent: 'center' }]}>
          {renderKey(
            capsLock ? '⇪ ON' : '⇪',
            () => handleSpecialKey('CapsLock'),
            1.3,
            capsLock,
          )}
          {renderKey('Fn', () => setShowFnRow(prev => !prev), 1, showFnRow)}
          {renderKey('Ctrl', () => onAction({ type: 'key', key: 'Control' }), 1.2)}
          {renderKey('Alt', () => onAction({ type: 'key', key: 'Alt' }), 1.2)}
          {renderKey(
            'Space',
            () => handleSpecialKey('Space'),
            isHorizontal ? 4 : 3.5,
          )}
          {renderKey('Alt', () => onAction({ type: 'key', key: 'Alt' }), 1.2)}
          {renderKey(
            '⏎',
            () => handleSpecialKey('Enter'),
            1.5,
            false,
            <CornerDownLeft size={isHorizontal ? 14 : 16} color={isDark ? '#fff' : '#000'} />,
          )}
        </View>

        {/* Arrow keys row */}
        <View style={[styles.keyRow, { gap: keyGap, justifyContent: 'center' }]}>
          {renderKey('←', () => onAction({ type: 'key', key: 'ArrowLeft' }))}
          {renderKey('↓', () => onAction({ type: 'key', key: 'ArrowDown' }))}
          {renderKey('↑', () => onAction({ type: 'key', key: 'ArrowUp' }))}
          {renderKey('→', () => onAction({ type: 'key', key: 'ArrowRight' }))}
          <View style={{ width: keyGap * 4 }} />
          {renderKey('Home', () => onAction({ type: 'key', key: 'Home' }), 1.2)}
          {renderKey('End', () => onAction({ type: 'key', key: 'End' }), 1.2)}
          {renderKey('PgUp', () => onAction({ type: 'key', key: 'PageUp' }), 1.2)}
          {renderKey('PgDn', () => onAction({ type: 'key', key: 'PageDown' }), 1.2)}
          {renderKey('Del', () => onAction({ type: 'key', key: 'Delete' }), 1.2)}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontalContainer : styles.verticalContainer,
      ]}
    >
      <GlassCard
        theme={theme}
        intensity={70}
        style={isHorizontal ? styles.horizontalCard : styles.verticalCard}
      >
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <Text style={[styles.toolbarTitle, isDark ? styles.darkText : styles.lightText]}>
            ⌨️ Keyboard
          </Text>

          <View style={styles.toolbarActions}>
            {/* Layout toggle */}
            <TouchableOpacity
              onPress={() => setLayout(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
              style={[styles.toolbarBtn, isDark ? styles.darkToolbarBtn : styles.lightToolbarBtn]}
            >
              {isHorizontal ? (
                <Minimize2 size={16} color={isDark ? '#38bdf8' : '#0284c7'} />
              ) : (
                <Maximize2 size={16} color={isDark ? '#38bdf8' : '#0284c7'} />
              )}
              <Text style={[styles.toolbarBtnText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                {isHorizontal ? 'Vertical' : 'Horizontal'}
              </Text>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Keyboard Area */}
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.keyboardContent}
        >
          {renderRows()}
        </ScrollView>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  verticalContainer: {
    bottom: 0,
  },
  horizontalContainer: {
    bottom: 0,
    top: '40%',
  },
  verticalCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  horizontalCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolbarTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  darkToolbarBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  lightToolbarBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  toolbarBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  keyboardContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  key: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  lightKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  activeKey: {
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
  },
  keyLabel: {
    fontWeight: '500',
  },
  darkKeyLabel: {
    color: '#ffffff',
  },
  lightKeyLabel: {
    color: '#1c1c1e',
  },
  activeKeyLabel: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#000000',
  },
});
