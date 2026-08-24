import React, { useCallback } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { ActionMessage, ThemeMode } from '../types';
import { getPalette, sunken } from '../theme';
import * as Haptics from 'expo-haptics';

/** Pointer travel per finger-pixel. */
const SENSITIVITY = 2.0;
/** Finger travel (px) that equals one scroll-wheel step. */
const SCROLL_STEP_PX = 14;
/** Diameter of the touch indicator; must match styles.touchDot. */
const DOT_SIZE = 44;
/**
 * Fraction of the pad height that acts as the physical-button strip, the way a
 * laptop trackpad's lower area does. Above it, a tap is always a left click.
 */
const CLICK_ZONE = 0.26;

interface TrackpadProps {
  onAction: (action: ActionMessage) => void;
  theme: ThemeMode;
  disabled?: boolean;
}

export const Trackpad: React.FC<TrackpadProps> = ({ onAction, theme, disabled }) => {
  const p = getPalette(theme);
  const dotX = useSharedValue(0);
  const dotY = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const scrollAcc = useSharedValue(0);
  // Pad size lives in shared values so the tap worklet can decide which region
  // was hit without hopping to the JS thread first.
  const padW = useSharedValue(0);
  const padH = useSharedValue(0);

  const onPadLayout = useCallback((e: LayoutChangeEvent) => {
    padW.value = e.nativeEvent.layout.width;
    padH.value = e.nativeEvent.layout.height;
  }, [padW, padH]);

  const sendMove = useCallback((dx: number, dy: number) => {
    onAction({ type: 'move', dx, dy });
  }, [onAction]);

  const sendScroll = useCallback((dy: number) => {
    onAction({ type: 'scroll', dy });
  }, [onAction]);

  const sendClick = useCallback((button: 'left' | 'right') => {
    Haptics.impactAsync(
      button === 'right'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    );
    onAction({ type: 'click', button });
  }, [onAction]);

  // ─── Single-finger pan for mouse movement ──────────────────
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .maxPointers(1)
    .minDistance(1)
    .onStart((e) => {
      dotX.value = e.x;
      dotY.value = e.y;
      dotOpacity.value = withSpring(0.6, { damping: 20 });
    })
    .onChange((e) => {
      dotX.value = e.x;
      dotY.value = e.y;
      runOnJS(sendMove)(e.changeX * SENSITIVITY, e.changeY * SENSITIVITY);
    })
    .onFinalize(() => {
      dotOpacity.value = withSpring(0, { damping: 20 });
    });

  // ─── Tap to click, with laptop-style button regions ────────
  // Bottom-left of the pad is a left button, bottom-right a right button.
  // Anywhere above that strip behaves as plain tap-to-click.
  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(300)
    .onStart((e) => {
      const inButtonStrip = padH.value > 0 && e.y > padH.value * (1 - CLICK_ZONE);
      const isRight = inButtonStrip && padW.value > 0 && e.x > padW.value / 2;
      runOnJS(sendClick)(isRight ? 'right' : 'left');
    });

  // ─── Two-finger pan for scrolling ──────────────────────────
  const scrollGesture = Gesture.Pan()
    .enabled(!disabled)
    .minPointers(2)
    .maxPointers(2)
    .minDistance(8)
    .onStart(() => {
      scrollAcc.value = 0;
    })
    .onChange((e) => {
      scrollAcc.value += e.changeY;
      const steps = Math.trunc(scrollAcc.value / SCROLL_STEP_PX);
      if (steps !== 0) {
        scrollAcc.value -= steps * SCROLL_STEP_PX;
        runOnJS(sendScroll)(-steps);
      }
    });

  // ─── Two-finger tap for right click ───────────────────────
  const twoFingerTap = Gesture.Tap()
    .enabled(!disabled)
    .minPointers(2)
    .maxDuration(300)
    .onStart(() => {
      runOnJS(sendClick)('right');
    });

  const composed = Gesture.Race(
    scrollGesture,
    Gesture.Exclusive(twoFingerTap, tapGesture),
    panGesture,
  );

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dotX.value - DOT_SIZE / 2 },
      { translateY: dotY.value - DOT_SIZE / 2 },
    ],
    opacity: dotOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View
          onLayout={onPadLayout}
          style={[
            styles.trackpadArea,
            {
              backgroundColor: p.surfaceSunken,
              borderColor: p.border,
              boxShadow: sunken(p, 6, 12),
            },
            disabled && styles.disabled,
          ]}
        >
          <Animated.View
            style={[
              styles.touchDot,
              { backgroundColor: p.accentSoft, borderColor: p.accent },
              dotStyle,
            ]}
          />

          <View style={styles.hintContainer} pointerEvents="none">
            <Text style={[styles.hintText, { color: p.textMuted }]}>
              {disabled ? 'NOT CONNECTED' : 'TRACKPAD'}
            </Text>
            {!disabled && (
              <Text style={[styles.hintSub, { color: p.textMuted }]}>
                drag to move · two fingers to scroll
              </Text>
            )}
          </View>

          {/* Button strip: hairlines only, like the seam on a real trackpad. */}
          <View
            style={[
              styles.buttonZone,
              { height: `${CLICK_ZONE * 100}%`, borderTopColor: p.textMuted },
            ]}
            pointerEvents="none"
          >
            <View style={styles.zoneHalf}>
              <Text style={[styles.zoneLabel, { color: p.textMuted }]}>LEFT</Text>
            </View>
            <View style={[styles.zoneDivider, { backgroundColor: p.textMuted }]} />
            <View style={styles.zoneHalf}>
              <Text style={[styles.zoneLabel, { color: p.textMuted }]}>RIGHT</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  },
  trackpadArea: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.45,
  },
  touchDot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1,
  },
  hintContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    opacity: 0.45,
  },
  hintSub: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.3,
  },
  buttonZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.25,
  },
  zoneHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: '18%',
  },
  zoneLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
