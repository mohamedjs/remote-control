import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { KeyDef } from './keyboard.types';
import { raised, sunken, type Palette } from '../../theme';

interface KeyProps {
  keyDef: KeyDef;
  width: number;
  height: number;
  fontSize: number;
  displayLabel: string;
  isActive?: boolean;
  palette: Palette;
  /** Fires on press-down and auto-repeats while held (Backspace, arrows…). */
  repeatable?: boolean;
  onPress: () => void;
}

const SPRING_CONFIG = { damping: 18, stiffness: 350, mass: 0.4 };
/** Hold this long before auto-repeat kicks in, as on a laptop. */
const REPEAT_DELAY_MS = 400;
/** Then fire this often — ~22 characters a second. */
const REPEAT_INTERVAL_MS = 45;

const KeyComponent: React.FC<KeyProps> = React.memo(({
  keyDef,
  width,
  height,
  fontSize,
  displayLabel,
  isActive,
  palette,
  repeatable,
  onPress,
}) => {
  const pressed = useSharedValue(0);

  const isModifier = keyDef.type === 'modifier';
  const isFunction = keyDef.type === 'function';
  const isSpecial = keyDef.type === 'special';
  const isSpace = keyDef.type === 'space';
  const isArrow = keyDef.type === 'arrow';

  // Modifier/function keys sit visually recessed so the letters read as primary.
  const recessed = isModifier || isFunction;
  const restColor = recessed ? palette.keyModBg : palette.keyBg;
  const pressColor = recessed ? palette.keyModBgPressed : palette.keyBgPressed;

  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const doHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const stopRepeat = useCallback(() => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  // Repeatable keys actuate on touch-down like real hardware, then repeat.
  // (A Tap gesture would be wrong here: holding past maxDuration fails it, so
  // a long press used to emit nothing at all.)
  const startRepeat = useCallback(() => {
    stopRepeat();
    doHaptic();
    onPress();
    delayTimer.current = setTimeout(() => {
      repeatTimer.current = setInterval(onPress, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }, [onPress, stopRepeat]);

  useEffect(() => stopRepeat, [stopRepeat]);

  const tap = Gesture.Tap()
    .maxDuration(repeatable ? 100000 : 500)
    .onBegin(() => {
      pressed.value = withSpring(1, SPRING_CONFIG);
      if (repeatable) runOnJS(startRepeat)();
    })
    .onFinalize((_e, success) => {
      pressed.value = withSpring(0, SPRING_CONFIG);
      if (repeatable) {
        runOnJS(stopRepeat)();
        return;
      }
      if (success) {
        runOnJS(doHaptic)();
        runOnJS(onPress)();
      }
    });

  const animStyle = useAnimatedStyle(() => {
    const p = pressed.value;
    return {
      transform: [{ scale: 1 - p * 0.035 }],
      backgroundColor: isActive
        ? palette.accentSoft
        : interpolateColor(p, [0, 1], [restColor, pressColor]),
    };
  });

  // Active modifiers read as pressed-in; every other key sits proud of the
  // surface. Depth is carried entirely by the paired light/dark shadows.
  const containerStyle: ViewStyle = {
    width,
    height,
    borderRadius: height > 36 ? 12 : 9,
    marginHorizontal: 2.5,
    marginVertical: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isActive ? palette.accent : palette.keyBorder,
    boxShadow: isActive ? sunken(palette, 2, 4) : raised(palette, 3, 6),
  };

  const labelColor = isActive
    ? palette.accent
    : recessed || isArrow
      ? palette.textOnModKey
      : palette.textOnKey;

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[containerStyle, animStyle]}>
        {isSpace ? (
          // A bar reads as a spacebar far better than an empty box.
          <Animated.View
            style={[styles.spaceBar, { backgroundColor: palette.textOnModKey }]}
          />
        ) : (
          <Text
            style={[
              styles.keyLabel,
              {
                fontSize: isFunction || isArrow ? fontSize * 0.85 : fontSize,
                color: labelColor,
                fontWeight: isModifier || isSpecial ? '600' : '500',
                letterSpacing: isArrow ? 0 : 0.3,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {displayLabel}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

KeyComponent.displayName = 'Key';

export { KeyComponent as Key };

const styles = StyleSheet.create({
  keyLabel: {
    textAlign: 'center',
  },
  spaceBar: {
    width: '55%',
    height: 2,
    borderRadius: 1,
    opacity: 0.45,
  },
});
