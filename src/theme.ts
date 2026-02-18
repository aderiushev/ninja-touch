import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// ninja-msg dark neubrutalism design system
//
// Core principles applied:
//   - Thick borders (3px) with high-contrast colors against dark backgrounds
//   - Hard shadows: solid color, 4px offset, zero blur
//   - Bold flat accent colors, no gradients
//   - Angular/blocky shapes, no rounded corners (borderRadius: 0)
//   - Oversized bold typography for headings, heavy weight throughout
//   - Raw, deliberate, "unpolished" aesthetic with dark-mode inversion
// ---------------------------------------------------------------------------

export const colors = {
  // Backgrounds
  bg: "#1E1E2E",
  surface: "#2A2A3C",
  surfaceRaised: "#333348",

  // Borders — warm off-white pops against dark bg
  border: "#FFFBF0",

  // Accents
  yellow: "#FBD438",
  pink: "#FF6B9D",
  mint: "#7BF1A8",
  cyan: "#56D1E0",

  // Text
  text: "#FFFBF0",
  textDark: "#1E1E2E",
  textMuted: "#7B7B90",

  // Semantic
  error: "#FF4757",
  success: "#7BF1A8",
} as const;

export const borders = {
  thin: 2,
  medium: 3,
  thick: 4,
} as const;

export const shadows = {
  // React Native shadow simulation via offset views — these are the offsets
  small: { x: 3, y: 3 },
  medium: { x: 5, y: 5 },
  large: { x: 7, y: 7 },
} as const;

export const fonts = {
  // System fonts render well in heavy weights for neubrutalism.
  // iOS: SF Pro, Android: Roboto — both strong in black/bold.
  heading: Platform.select({ ios: "System", default: "sans-serif" }),
  body: Platform.select({ ios: "System", default: "sans-serif" }),
  mono: Platform.select({ ios: "Courier-Bold", default: "monospace" }),
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
} as const;
