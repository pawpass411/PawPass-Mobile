// src/components/ui/index.tsx
// PawPass mobile UI primitives
// All components match the web design system but use React Native APIs

import React from "react";
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, Platform, Pressable,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, HitSlop } from "../../lib/theme";

// ─── TEXT ─────────────────────────────────────────────
interface PawTextProps {
  children: React.ReactNode;
  variant?: "h1"|"h2"|"h3"|"body"|"caption"|"label"|"micro";
  color?: string;
  weight?: "normal"|"medium"|"semibold"|"bold"|"black";
  style?: TextStyle;
  numberOfLines?: number;
}

const weightMap = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
};

const variantStyles: Record<string, TextStyle> = {
  h1:      { fontSize: Typography["3xl"],  fontWeight: "900", lineHeight: 40 },
  h2:      { fontSize: Typography["2xl"],  fontWeight: "800", lineHeight: 34 },
  h3:      { fontSize: Typography.xl,      fontWeight: "700", lineHeight: 28 },
  body:    { fontSize: Typography.base,    fontWeight: "400", lineHeight: 22 },
  caption: { fontSize: Typography.sm,      fontWeight: "400", lineHeight: 18 },
  label:   { fontSize: Typography.xs,      fontWeight: "700", lineHeight: 16, letterSpacing: 0.8 },
  micro:   { fontSize: 10,                 fontWeight: "600", lineHeight: 14, letterSpacing: 0.5 },
};

export function PawText({ children, variant = "body", color, weight, style, numberOfLines }: PawTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { color: color ?? Colors.text, fontFamily: Typography.family },
        variantStyles[variant],
        weight ? { fontWeight: weightMap[weight] } : {},
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─── CARD ─────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
  onPress?: () => void;
}

export function Card({ children, style, accent, onPress }: CardProps) {
  const inner = (
    <View style={[
      styles.card,
      accent && { borderLeftColor: Colors.accent, borderLeftWidth: 3 },
      style,
    ]}>
      {children}
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress} android_ripple={{ color: Colors.accentDim }}>{inner}</Pressable>;
  }
  return inner;
}

// ─── BUTTON ───────────────────────────────────────────
interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary"|"secondary"|"ghost"|"danger"|"outline";
  size?: "sm"|"md"|"lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: string;
}

export function Button({
  children, onPress, variant = "primary", size = "md",
  loading, disabled, fullWidth, style, icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bgColor = {
    primary:   Colors.accent,
    secondary: Colors.surface2,
    ghost:     Colors.transparent,
    danger:    "#EF4444",
    outline:   Colors.transparent,
  }[variant];

  const textColor = {
    primary:   "#0D1F0D",
    secondary: Colors.text,
    ghost:     Colors.accent,
    danger:    "#fff",
    outline:   Colors.accent,
  }[variant];

  const paddingV = { sm: 8, md: 12, lg: 16 }[size];
  const fontSize = { sm: Typography.sm, md: Typography.base, lg: Typography.md }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={HitSlop}
      activeOpacity={0.75}
      style={[
        styles.button,
        { backgroundColor: bgColor, paddingVertical: paddingV },
        variant === "outline" && { borderWidth: 1, borderColor: Colors.accent },
        variant === "secondary" && { borderWidth: 1, borderColor: Colors.border2 },
        fullWidth && { width: "100%" },
        isDisabled && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor}/>
      ) : (
        <Text style={{ color: textColor, fontSize, fontWeight: "700", fontFamily: Typography.family, textAlign: "center" }}>
          {icon ? `${icon}  ` : ""}{children as string}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── BADGE ────────────────────────────────────────────
type BadgeVariant = "green"|"cyan"|"yellow"|"red"|"purple"|"gray"|"orange";

const badgeColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  green:  { bg: "rgba(170,255,0,0.12)",    text: "#AAFF00", border: "rgba(170,255,0,0.3)" },
  cyan:   { bg: "rgba(34,211,238,0.1)",    text: "#22D3EE", border: "rgba(34,211,238,0.3)" },
  yellow: { bg: "rgba(252,211,77,0.1)",    text: "#FCD34D", border: "rgba(252,211,77,0.3)" },
  red:    { bg: "rgba(239,68,68,0.1)",     text: "#EF4444", border: "rgba(239,68,68,0.3)" },
  purple: { bg: "rgba(167,139,250,0.1)",   text: "#A78BFA", border: "rgba(167,139,250,0.3)" },
  gray:   { bg: "rgba(156,163,175,0.1)",   text: "#9CA3AF", border: "rgba(156,163,175,0.3)" },
  orange: { bg: "rgba(251,146,60,0.1)",    text: "#FB923C", border: "rgba(251,146,60,0.3)" },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = "gray", style }: BadgeProps) {
  const c = badgeColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: "700" }}>{children as string}</Text>
    </View>
  );
}

// ─── INPUT ────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default"|"email-address"|"numeric"|"phone-pad"|"url";
  autoCapitalize?: "none"|"sentences"|"words"|"characters";
  error?: string;
  hint?: string;
  editable?: boolean;
  style?: ViewStyle;
}

export function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  multiline, numberOfLines, keyboardType, autoCapitalize,
  error, hint, editable = true, style,
}: InputProps) {
  return (
    <View style={[{ marginBottom: Spacing[3] }, style]}>
      {label && (
        <Text style={styles.inputLabel}>{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.dim}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? (numberOfLines ?? 4) : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        editable={editable}
        style={[
          styles.input,
          multiline && { height: (numberOfLines ?? 4) * 22 + 24, textAlignVertical: "top" },
          error && { borderColor: Colors.danger },
          !editable && { opacity: 0.5 },
        ]}
      />
      {error && <Text style={styles.inputError}>{error}</Text>}
      {hint && !error && <Text style={styles.inputHint}>{hint}</Text>}
    </View>
  );
}

// ─── DIVIDER ──────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: Colors.border }, style]}/>;
}

// ─── TRUST SCORE RING ─────────────────────────────────
export function TrustScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? Colors.accent : score >= 50 ? Colors.warn : Colors.danger;
  const label = score >= 80 ? "Strong" : score >= 50 ? "Fair" : "Low";
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[styles.trustRing, { borderColor: color }]}>
        <Text style={{ fontSize: Typography["2xl"], fontWeight: "900", color }}>{Math.round(score)}</Text>
      </View>
      <Text style={{ fontSize: Typography.xs, color: Colors.dim, marginTop: 4 }}>Trust · {label}</Text>
    </View>
  );
}

// ─── STAR RATING ──────────────────────────────────────
interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  color?: string;
}

export function StarRating({ value, onChange, size = 28, color = "#FCD34D" }: StarRatingProps) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange?.(i)}
          disabled={!onChange}
          hitSlop={HitSlop}
        >
          <Text style={{ fontSize: size, color: i <= value ? color : Colors.border2 }}>
            {i <= value ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "", title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{icon}</Text>
      <PawText variant="h3" style={{ textAlign: "center", marginBottom: 8 }}>{title}</PawText>
      {body && <PawText variant="body" color={Colors.muted} style={{ textAlign: "center" }}>{body}</PawText>}
      {action && <View style={{ marginTop: 16 }}>{action}</View>}
    </View>
  );
}

// ─── ALERT ────────────────────────────────────────────
type AlertVariant = "info"|"warn"|"danger"|"success";
const alertConfig: Record<AlertVariant, { bg: string; border: string; color: string }> = {
  info:    { bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)",  color: "#22D3EE" },
  warn:    { bg: "rgba(252,211,77,0.08)",  border: "rgba(252,211,77,0.2)",  color: "#FCD34D" },
  danger:  { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   color: "#EF4444" },
  success: { bg: "rgba(170,255,0,0.08)",   border: "rgba(170,255,0,0.2)",   color: "#AAFF00" },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Alert({ variant = "info", title, children, style }: AlertProps) {
  const c = alertConfig[variant];
  return (
    <View style={[styles.alert, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      {title && <Text style={{ color: c.color, fontWeight: "700", fontSize: 13, marginBottom: 4 }}>{title}</Text>}
      <Text style={{ color: c.color, fontSize: 13, lineHeight: 19, opacity: 0.85 }}>{children as string}</Text>
    </View>
  );
}

// ─── SKELETON ─────────────────────────────────────────
export function Skeleton({ width, height, style }: { width?: number|string; height?: number; style?: ViewStyle }) {
  return (
    <View style={[
      { backgroundColor: Colors.surface2, borderRadius: Radius.sm, opacity: 0.6 },
      width !== undefined ? { width: width as number } : { flex: 1 },
      { height: height ?? 16 },
      style,
    ]}/>
  );
}

// ─── STYLESHEETS ──────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  button: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[5],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: "600",
    color: Colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2] + 2,
    color: Colors.text,
    fontSize: Typography.base,
    fontFamily: Typography.family,
  },
  inputError: {
    color: Colors.danger,
    fontSize: Typography.xs,
    marginTop: 4,
  },
  inputHint: {
    color: Colors.dim,
    fontSize: Typography.xs,
    marginTop: 4,
  },
  trustRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing[8],
  },
  alert: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
});
