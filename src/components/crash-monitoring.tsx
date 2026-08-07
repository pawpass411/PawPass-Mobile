import { useEffect } from "react";
import { getCrashlytics, log, recordError, setAttributes, setCrashlyticsCollectionEnabled } from "@react-native-firebase/crashlytics";
import { track } from "../lib/analytics";
import { telemetryContext } from "../lib/telemetry-context";

type ErrorHandler = (error: Error, isFatal?: boolean) => void;
declare const ErrorUtils: {
  getGlobalHandler(): ErrorHandler;
  setGlobalHandler(handler: ErrorHandler): void;
};

export function CrashMonitoring() {
  useEffect(() => {
    // The Android Firebase app is configured now. iOS will be enabled after
    // GoogleService-Info.plist is added from the same Firebase project.
    if (telemetryContext.platform !== "android") return;
    const client = getCrashlytics();
    void setCrashlyticsCollectionEnabled(client, !__DEV__);
    void setAttributes(client, { platform:telemetryContext.platform, appVersion:telemetryContext.appVersion });
    log(client, "PawPass React application mounted");

    const previous = ErrorUtils.getGlobalHandler();
    const handler: ErrorHandler = (error, isFatal) => {
      recordError(client, error);
      void track({ eventName:"app_error", path:"/", success:false, errorCode:isFatal ? "fatal_js_error" : "js_error" });
      previous(error, isFatal);
    };
    ErrorUtils.setGlobalHandler(handler);
    return () => ErrorUtils.setGlobalHandler(previous);
  }, []);
  return null;
}
