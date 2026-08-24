import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { KeyDef } from './keyboard.types';
import type { Palette } from '../../theme';
import { Key } from './Key';

/** Keys that auto-repeat when held, matching laptop behaviour. */
const REPEATABLE = new Set([
  'Backspace', 'Delete', 'Space',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

interface KeyboardRowProps {
  keys: KeyDef[];
  baseKeyWidth: number;
  keyHeight: number;
  fontSize: number;
  shiftActive: boolean;
  modifiers: Record<string, boolean>;
  palette: Palette;
  onKeyPress: (keyDef: KeyDef) => void;
}

export const KeyboardRow: React.FC<KeyboardRowProps> = React.memo(({
  keys,
  baseKeyWidth,
  keyHeight,
  fontSize,
  shiftActive,
  modifiers,
  palette,
  onKeyPress,
}) => {
  return (
    <View style={styles.row}>
      {keys.map((keyDef, index) => {
        const w = (keyDef.width || 1) * baseKeyWidth;

        let displayLabel = keyDef.label;
        if (keyDef.type === 'character' && shiftActive && keyDef.shiftLabel) {
          displayLabel = keyDef.shiftLabel;
        } else if (keyDef.type === 'character' && shiftActive) {
          displayLabel = keyDef.label.toUpperCase();
        }

        const isActive =
          keyDef.type === 'modifier' &&
          (modifiers[keyDef.code] || false);

        return (
          <Key
            key={`${keyDef.code}-${index}`}
            keyDef={keyDef}
            width={w}
            height={keyHeight}
            fontSize={fontSize}
            displayLabel={displayLabel}
            isActive={isActive}
            palette={palette}
            repeatable={REPEATABLE.has(keyDef.code)}
            onPress={() => onKeyPress(keyDef)}
          />
        );
      })}
    </View>
  );
});

KeyboardRow.displayName = 'KeyboardRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
