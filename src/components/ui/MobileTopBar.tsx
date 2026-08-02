import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Colors, Radius, Spacing, Typography } from "../../lib/theme";
import { PawPassWordmark } from "./Logo";

export function MobileTopBar({ active: _active }: { active?: "home" | "discover" | "parks" | "rights" | "profile" }) {
  return (
    <View style={{ gap: Spacing[2] }}>
      <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: Spacing[2] }}>
        <PawPassWordmark height={56}/>
        <Text
          style={{
            color: Colors.text,
            fontFamily: Typography.family,
            fontSize: 22,
            fontWeight: "900",
            fontStyle: "italic",
            transform: [{ rotate: "-7deg" }],
          }}
        >
          On The Go!
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/(tabs)/learn", params: { tab: "rights" } })}
        activeOpacity={0.78}
        style={{
          alignSelf: "center",
          minHeight: 36,
          justifyContent: "center",
          paddingHorizontal: 22,
          borderRadius: Radius.full,
          borderWidth: 1,
          borderColor: Colors.accentBorder,
          backgroundColor: Colors.accentDim,
        }}
      >
        <Text style={{ color: Colors.accent, fontFamily: Typography.family, fontSize: 13, fontWeight: "900" }}>
          Your Rights
        </Text>
      </TouchableOpacity>
    </View>
  );
}
