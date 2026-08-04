import { useEffect } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncReviewOutbox } from "../../lib/review-outbox";
import { api, configureApiAuth } from "../../lib/api";

export function ReviewOutboxSync() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    configureApiAuth(() => getToken());
    api.users.me().then(({ user }) => AsyncStorage.setItem(`pawpass:review-profile:${userId}`, JSON.stringify(user))).catch(() => {});
    syncReviewOutbox(undefined, userId).catch(() => {});
    const unsubscribeNetwork = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) syncReviewOutbox(undefined, userId).catch(() => {});
    });
    const appState = AppState.addEventListener("change", state => {
      if (state === "active") syncReviewOutbox(undefined, userId).catch(() => {});
    });
    return () => { unsubscribeNetwork(); appState.remove(); };
  }, [getToken, isLoaded, isSignedIn, userId]);

  return null;
}
