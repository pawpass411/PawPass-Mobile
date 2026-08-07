import Constants from "expo-constants";
import { Platform } from "react-native";

export const telemetryContext = {
  sessionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
  platform: (Platform.OS === "ios" ? "ios" : "android") as "ios" | "android",
  appVersion: Constants.expoConfig?.version ?? "unknown",
};
