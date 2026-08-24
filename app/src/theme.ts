import type { ThemeMode } from './types';

/**
 * Neumorphic palette. Every surface is the *same* colour as the page and is
 * separated from it only by a light shadow on one corner and a dark shadow on
 * the opposite one — so `bg`, `surface` and `keyBg` are deliberately close.
 * Depth comes from the shadow helpers below, not from fill contrast.
 */
export interface Palette {
  bg: string;
  bgAccent: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  keyBg: string;
  keyBgPressed: string;
  keyModBg: string;
  keyModBgPressed: string;
  glass: string;
  glassSheen: string;
  glassEdge: string;
  text: string;
  textMuted: string;
  textOnKey: string;
  textOnModKey: string;
  accent: string;
  accentSoft: string;
  border: string;
  keyBorder: string;
  /** Highlight — the "lit" corner of an extruded surface. */
  shadowLight: string;
  /** Occlusion — the shaded corner. */
  shadowDark: string;
  shadow: string;
  success: string;
  warning: string;
  danger: string;
}

const dark: Palette = {
  bg: '#23272F',
  bgAccent: '#272C35',
  surface: '#23272F',
  surfaceRaised: '#272C35',
  surfaceSunken: '#1E222A',
  keyBg: '#262B33',
  keyBgPressed: '#1F242B',
  keyModBg: '#212630',
  keyModBgPressed: '#1B1F27',
  glass: 'rgba(255, 255, 255, 0.07)',
  glassSheen: 'rgba(255, 255, 255, 0.22)',
  glassEdge: 'rgba(255, 255, 255, 0.16)',
  text: '#EEF1F7',
  textMuted: '#8A93A6',
  textOnKey: '#E7EBF3',
  textOnModKey: '#9AA4B8',
  accent: '#5AA9FF',
  accentSoft: 'rgba(90, 169, 255, 0.18)',
  border: 'rgba(255, 255, 255, 0.05)',
  keyBorder: 'rgba(255, 255, 255, 0.04)',
  shadowLight: 'rgba(255, 255, 255, 0.055)',
  shadowDark: 'rgba(0, 0, 0, 0.55)',
  shadow: '#000000',
  success: '#3BD68A',
  warning: '#F5B838',
  danger: '#FF6B6B',
};

const light: Palette = {
  bg: '#E8EBF2',
  bgAccent: '#EDF0F6',
  surface: '#E8EBF2',
  surfaceRaised: '#EDEFF5',
  surfaceSunken: '#E1E4EC',
  keyBg: '#EBEDF4',
  keyBgPressed: '#E0E3EB',
  keyModBg: '#E3E6EE',
  keyModBgPressed: '#D8DCE6',
  glass: 'rgba(255, 255, 255, 0.55)',
  glassSheen: 'rgba(255, 255, 255, 0.95)',
  glassEdge: 'rgba(255, 255, 255, 0.85)',
  text: '#2B3242',
  textMuted: '#8A92A6',
  textOnKey: '#2B3242',
  textOnModKey: '#6C7488',
  accent: '#3B82F6',
  accentSoft: 'rgba(59, 130, 246, 0.16)',
  border: 'rgba(255, 255, 255, 0.75)',
  keyBorder: 'rgba(255, 255, 255, 0.7)',
  shadowLight: '#FFFFFF',
  shadowDark: 'rgba(163, 172, 191, 0.75)',
  shadow: '#A3ACBF',
  success: '#12B76A',
  warning: '#F79009',
  danger: '#F04438',
};

export const palettes: Record<ThemeMode, Palette> = { dark, light };

export const getPalette = (theme: ThemeMode): Palette => palettes[theme];

/** Extruded: lit from the top-left, occluded bottom-right. */
export const raised = (p: Palette, d = 6, blur = d * 2) => [
  { offsetX: -d, offsetY: -d, blurRadius: blur, color: p.shadowLight },
  { offsetX: d, offsetY: d, blurRadius: blur, color: p.shadowDark },
];

/** Carved into the surface — the inverse of `raised`. */
export const sunken = (p: Palette, d = 5, blur = d * 2) => [
  { offsetX: -d, offsetY: -d, blurRadius: blur, color: p.shadowLight, inset: true },
  { offsetX: d, offsetY: d, blurRadius: blur, color: p.shadowDark, inset: true },
];

/** Glass: a bright inner top edge plus a soft drop, for the control hub. */
export const glassShadow = (p: Palette) => [
  { offsetX: 0, offsetY: 1, blurRadius: 1, color: p.glassSheen, inset: true },
  { offsetX: 0, offsetY: -2, blurRadius: 6, color: p.shadowDark, inset: true },
  { offsetX: -3, offsetY: -3, blurRadius: 8, color: p.shadowLight },
  { offsetX: 5, offsetY: 6, blurRadius: 14, color: p.shadowDark },
];
