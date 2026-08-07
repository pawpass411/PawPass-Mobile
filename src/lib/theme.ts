// src/lib/theme.ts
// PawPass design tokens — mirrors the web T object
// Brand: #AAFF00 yellow-green on #080F08 dark background

import { Platform } from "react-native";

export const Colors = {
  // Backgrounds
  bg:        "#080F08",
  surface:   "#0D1F0D",
  surface2:  "#122012",
  surface3:  "#102538",

  // Borders
  border:    "#19354A",
  border2:   "#2B4A62",

  // Brand accent
  accent:    "#AAFF00",
  accentDim: "rgba(170,255,0,0.12)",
  accentBorder: "rgba(170,255,0,0.35)",

  // Text
  text:      "#e0ffe0",
  muted:     "rgba(224,255,224,0.55)",
  dim:       "rgba(224,255,224,0.35)",
  ghost:     "rgba(224,255,224,0.15)",

  // Semantic
  danger:    "#EF4444",
  warn:      "#FCD34D",
  info:      "#7FA6FF",
  infoDim:   "rgba(127,166,255,0.16)",
  infoBorder:"rgba(127,166,255,0.42)",
  purple:    "#A78BFA",
  orange:    "#FB923C",
  success:   "#AAFF00",

  // iOS/Android specifics
  white:     "#ffffff",
  black:     "#000000",
  transparent: "transparent",
} as const;

export const Typography = {
  // Font families
  family: Platform.select({
    ios:     "System",
    android: "Roboto",
    default: "System",
  }),
  familyBold: Platform.select({
    ios:     "System",
    android: "Roboto",
    default: "System",
  }),

  // Sizes
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  "2xl": 28,
  "3xl": 34,
  "4xl": 42,
} as const;

export const Spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  "2xl": 24,
  full: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  accent: {
    shadowColor: "#AAFF00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  info: {
    shadowColor: "#7FA6FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

// Hit slop for touch targets (minimum 44pt per Apple HIG)
export const HitSlop = {
  top: 8, right: 8, bottom: 8, left: 8,
} as const;

export const Theme = { Colors, Typography, Spacing, Radius, Shadow, HitSlop };
export default Theme;
