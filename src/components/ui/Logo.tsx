// src/components/ui/Logo.tsx
// PawPass brand mark for mobile — matches the actual app icon (655.png)
// Oval + stylized A in yellow-green with glow, "PawPass" in blue inside the oval.
// Transparent background — renders cleanly on any dark surface.

import React from "react";
import { View, Text } from "react-native";
import Svg, {
  Ellipse, Path, Text as SvgText, Defs,
  Filter, FeGaussianBlur, FeMerge, FeMergeNode,
} from "react-native-svg";
import { Colors, Typography } from "../../lib/theme";

interface MarkProps {
  size?: number;
  glow?: boolean;
}

export function PawPassMark({ size = 32, glow = true }: MarkProps) {
  const stroke  = "#BBFF00";
  const glowId  = `ppglow`;
  const textSize = Math.max(size * 0.18, 8);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {glow && (
          <Filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="2.5" result="b1"/>
            <FeGaussianBlur stdDeviation="5"   result="b2"/>
            <FeMerge>
              <FeMergeNode in="b2"/>
              <FeMergeNode in="b1"/>
              <FeMergeNode in="SourceGraphic"/>
            </FeMerge>
          </Filter>
        )}
      </Defs>

      {/* Outer oval ring */}
      <Ellipse
        cx="50" cy="52" rx="44" ry="37"
        fill="none"
        stroke={stroke}
        strokeWidth="6.5"
        filter={glow ? `url(#${glowId})` : undefined}
      />

      {/* Stylized A — left leg */}
      <Path
        d="M50 17 L20 80"
        stroke={stroke}
        strokeWidth="6.5"
        strokeLinecap="round"
        filter={glow ? `url(#${glowId})` : undefined}
      />

      {/* Stylized A — right leg */}
      <Path
        d="M50 17 L80 80"
        stroke={stroke}
        strokeWidth="6.5"
        strokeLinecap="round"
        filter={glow ? `url(#${glowId})` : undefined}
      />

      {/* "PawPass" in blue inside the oval */}
      <SvgText
        x="50"
        y="57"
        textAnchor="middle"
        fontFamily={Typography.family ?? "System"}
        fontSize={textSize}
        fontWeight="700"
        fill="#5B80CC"
        letterSpacing={0.5}
      >
        PawPass
      </SvgText>
    </Svg>
  );
}

// ─── WORDMARK ─────────────────────────────────────────
// showText=false (default) — mark already contains "PawPass", use mark alone.
// showText=true — mark + separate text beside it for large lockup contexts.
interface WordmarkProps {
  height?: number;
  showSubtext?: boolean;
  showText?: boolean;
}

export function PawPassWordmark({ height = 28, showSubtext = false, showText = false }: WordmarkProps) {
  const markSize = Math.round(height * 1.4);

  if (!showText) {
    return <PawPassMark size={markSize}/>;
  }

  const fontSize    = Math.round(height * 0.72);
  const subtextSize = Math.round(height * 0.3);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Math.round(height * 0.35) }}>
      <PawPassMark size={markSize}/>
      <View>
        <Text style={{
          fontWeight: "900",
          fontSize,
          color: "#5B80CC",
          letterSpacing: height * 0.06,
          lineHeight: fontSize * 1.1,
          fontFamily: Typography.family,
        }}>
          PawPass
        </Text>
        {showSubtext && (
          <Text style={{
            fontSize: subtextSize,
            color: "rgba(91,128,204,0.55)",
            letterSpacing: height * 0.04,
            marginTop: 2,
            fontFamily: Typography.family,
          }}>
            by Apawcalypse LLC
          </Text>
        )}
      </View>
    </View>
  );
}
