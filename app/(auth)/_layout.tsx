// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Colors } from "../../src/lib/theme";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect authenticated users to main app
  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)/home"/>;
  }

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.bg },
      headerTintColor: Colors.accent,
      headerTitleStyle: { color: Colors.text },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.bg },
    }}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }}/>
      <Stack.Screen name="sign-up" options={{ headerShown: false }}/>
    </Stack>
  );
}
