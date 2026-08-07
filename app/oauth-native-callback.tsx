import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { PawText } from "../src/components/ui";
import { Colors } from "../src/lib/theme";

export default function OAuthNativeCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/(tabs)");
  }, [isLoaded, isSignedIn]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg }}>
      <PawText variant="body" color={Colors.muted}>Completing sign in...</PawText>
    </View>
  );
}
