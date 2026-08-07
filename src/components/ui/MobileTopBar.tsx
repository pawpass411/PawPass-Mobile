import { Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../lib/theme";
import { PawPassWordmark } from "./Logo";

export function MobileTopBar({ active: _active }: { active?: "home" | "discover" | "parks" | "rights" | "profile" }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: Spacing[2] }}>
        <PawPassWordmark height={40}/>
        <Text
          style={{
            color: Colors.text,
            fontFamily: Typography.family,
            fontSize: 18,
            fontWeight: "900",
            fontStyle: "italic",
            transform: [{ rotate: "-7deg" }],
          }}
        >
          On The Go!
        </Text>
    </View>
  );
}
