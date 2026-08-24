import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemeMode } from '../types';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  theme: ThemeMode;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  theme,
  intensity = 50,
}) => {
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, isDark ? styles.darkBorder : styles.lightBorder]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  darkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  lightContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  content: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  darkBorder: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  lightBorder: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
});
