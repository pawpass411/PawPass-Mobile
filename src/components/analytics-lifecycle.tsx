import { useEffect } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { configureApiTelemetry } from "../lib/api";
import { flushAnalytics, track } from "../lib/analytics";

export function AnalyticsLifecycle() {
  useEffect(() => {
    configureApiTelemetry(event => void track(event));
    void track({ eventName: "app_open", path: "/" });
    const network = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) void flushAnalytics();
    });
    const appState = AppState.addEventListener("change", state => {
      if (state === "active") void flushAnalytics();
    });
    return () => {
      configureApiTelemetry(null);
      network();
      appState.remove();
    };
  }, []);
  return null;
}
