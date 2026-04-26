// app/_layout.tsx
// Root layout — Clerk provider, navigation, safe area, fonts

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Colors } from "../src/lib/theme";
import { usePushNotifications } from "../src/hooks/usePushNotifications";

// Keep splash visible while fonts/auth load
SplashScreen.preventAutoHideAsync();

// Clerk secure token cache
const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

const CLERK_KEY =
  Constants.expoConfig?.extra?.clerkPublishableKey ??
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  "";

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://pawpass.app";

function RootLayoutInner() {
  const { isLoaded } = useAuth();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  // Register push token with backend when available
  useEffect(() => {
    if (!expoPushToken) return;
    fetch(`${BASE_URL}/api/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expoPushToken }),
    }).catch(() => {}); // non-critical — fail silently
  }, [expoPushToken]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.accent,
        headerTitleStyle: { color: Colors.text, fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: "slide_from_right",
      }}
    >
      {/* Auth screens — no header */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }}/>

      {/* Main tab navigation */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>

      {/* Modal screens */}
      <Stack.Screen
        name="complaint/new"
        options={{
          title: "Report an Access Concern",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.accent,
          headerTitleStyle: { color: Colors.text },
        }}
      />
      <Stack.Screen
        name="verify/[token]"
        options={{ title: "Verify Certificate" }}
      />
      <Stack.Screen
        name="legal/privacy"
        options={{ title: "Privacy Policy", presentation: "modal" }}
      />
      <Stack.Screen
        name="legal/terms"
        options={{ title: "Terms of Service", presentation: "modal" }}
      />
      <Stack.Screen
        name="legal/disclaimer"
        options={{ title: "Platform Disclaimer", presentation: "modal" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="incident-log"
        options={{ title: "Incident Log" }}
      />
      <Stack.Screen
        name="feedback"
        options={{ title: "Send Feedback", presentation: "modal" }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="business/[id]"
        options={{ title: "" }}
      />
      <Stack.Screen
        name="business/dashboard"
        options={{ title: "Business Dashboard" }}
      />
      <Stack.Screen
        name="park/[id]"
        options={{ title: "" }}
      />
      <Stack.Screen
        name="reviews/mine"
        options={{ title: "My Reviews" }}
      />
      <Stack.Screen
        name="reports/mine"
        options={{ title: "My Reports" }}
      />
      <Stack.Screen
        name="settings/notifications"
        options={{ title: "Notification Settings" }}
      />
      <Stack.Screen
        name="settings/location"
        options={{ title: "Location Settings" }}
      />
      <Stack.Screen
        name="settings/handler"
        options={{ title: "Handler Status" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={Colors.bg}/>
          <RootLayoutInner/>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

// Note: /business/claim is handled by opening the web flow in a browser
// Add this to the root layout if needed:
// <Stack.Screen name="business/claim" options={{ title: "Claim Your Business" }}/>
