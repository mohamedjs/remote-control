import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionMessage, ThemeMode } from '../types';
import { GlassCard } from './GlassCard';
import { X, CornerDownLeft, Delete, Space } from 'lucide-react-native';

interface KeyboardModalProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: ActionMessage) => void;
  theme: ThemeMode;
}

export const KeyboardModal: React.FC<KeyboardModalProps> = ({
  visible,
  onClose,
  onAction,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const isDark = theme === 'dark';

  const handleTextChange = (newText: string) => {
    if (newText.length > text.length) {
      // Key added
      const char = newText[newText.length - 1];
      onAction({ type: 'key', key: char });
    } else if (newText.length < text.length) {
      // Key deleted
      onAction({ type: 'key', key: 'Backspace' });
    }
    setText(newText);
  };

  const handleKeyPress = (key: string) => {
    onAction({ type: 'key', key });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <GlassCard theme={theme} style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark ? styles.darkText : styles.lightText]}>
              Remote Keyboard
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          {/* Typing Area */}
          <TextInput
            style={[
              styles.input,
              isDark ? styles.darkInput : styles.lightInput,
              isDark ? styles.darkText : styles.lightText,
            ]}
            placeholder="Type here to send keystrokes..."
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            value={text}
            onChangeText={handleTextChange}
            autoFocus
            multiline={false}
          />

          {/* Quick Keys */}
          <View style={styles.quickKeysGrid}>
            <TouchableOpacity
              onPress={() => handleKeyPress('Backspace')}
              style={[styles.keyBtn, isDark ? styles.darkKey : styles.lightKey]}
            >
              <Delete size={18} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.keyText, isDark ? styles.darkText : styles.lightText]}>Backspace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleKeyPress('Enter')}
              style={[styles.keyBtn, isDark ? styles.darkKey : styles.lightKey]}
            >
              <CornerDownLeft size={18} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.keyText, isDark ? styles.darkText : styles.lightText]}>Enter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleKeyPress(' ')}
              style={[styles.keyBtn, isDark ? styles.darkKey : styles.lightKey]}
            >
              <Space size={18} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.keyText, isDark ? styles.darkText : styles.lightText]}>Space</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleKeyPress('Tab')}
              style={[styles.keyBtn, isDark ? styles.darkKey : styles.lightKey]}
            >
              <Text style={[styles.keyText, isDark ? styles.darkText : styles.lightText]}>Tab</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  lightInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#000000',
  },
  quickKeysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyBtn: {
    flex: 1,
    minWidth: '45%',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  darkKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lightKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  keyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
