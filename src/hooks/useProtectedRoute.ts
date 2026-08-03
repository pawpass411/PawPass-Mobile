// src/hooks/useProtectedRoute.ts
// Redirects unauthenticated users to sign-in
// Call at the top of any screen that requires auth

import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";

export function useProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  return { isLoaded, isSignedIn };
}
