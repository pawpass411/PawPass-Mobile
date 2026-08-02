import { Image } from "expo-image";

const FULL_LOGO = require("../../../assets/pawpass-logo-2026-transparent.png");
const CIRCLE_MARK = require("../../../assets/pawpass-circle-icon-transparent.png");
const FULL_LOGO_ASPECT_RATIO = 1864 / 843;

interface MarkProps {
  size?: number;
  glow?: boolean;
}

export function PawPassMark({ size = 32 }: MarkProps) {
  return (
    <Image
      source={CIRCLE_MARK}
      accessibilityLabel="PawPass"
      contentFit="contain"
      style={{ width:size, height:size }}
    />
  );
}

interface WordmarkProps {
  height?: number;
  showSubtext?: boolean;
  showText?: boolean;
}

export function PawPassWordmark({ height = 28 }: WordmarkProps) {
  return (
    <Image
      source={FULL_LOGO}
      accessibilityLabel="PawPass"
      contentFit="contain"
      style={{ width:Math.round(height * FULL_LOGO_ASPECT_RATIO), height }}
    />
  );
}
