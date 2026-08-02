import { Linking, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, PawText } from "../../src/components/ui";
import { PawPassWordmark } from "../../src/components/ui/Logo";
import { Colors, Radius, Spacing } from "../../src/lib/theme";

const WEB_BUSINESS_PORTAL = "https://pawpass411.com/business/dashboard";
const WEB_CLAIM = "https://pawpass411.com/business/claim";

export default function BusinessDashboardBridge() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing[6], paddingBottom: insets.bottom + Spacing[6] }]}>
      <Card style={styles.card}>
        <View style={{ alignItems: "center", marginBottom: Spacing[5] }}>
          <PawPassWordmark height={34} showText />
        </View>
        <PawText variant="label" color={Colors.info} style={{ textAlign: "center" }}>
          BUSINESS PORTAL
        </PawText>
        <PawText variant="h2" style={{ textAlign: "center", marginTop: Spacing[2] }}>
          Business tools are desktop only.
        </PawText>
        <PawText variant="body" color={Colors.muted} style={styles.body}>
          Claims, billing, staff training, verification, corrective action, and business settings are managed from the PawPass web portal.
        </PawText>
        <Button onPress={() => Linking.openURL(WEB_BUSINESS_PORTAL)} fullWidth>
          Open business portal
        </Button>
        <Button onPress={() => Linking.openURL(WEB_CLAIM)} variant="secondary" fullWidth style={{ marginTop: Spacing[3] }}>
          Claim a business
        </Button>
        <Button onPress={() => router.replace("/(tabs)/profile")} variant="ghost" fullWidth style={{ marginTop: Spacing[2] }}>
          Back to profile
        </Button>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    paddingHorizontal: Spacing[4],
  },
  card: {
    borderRadius: Radius.md,
    borderColor: Colors.infoBorder,
  },
  body: {
    textAlign: "center",
    marginVertical: Spacing[5],
    lineHeight: 23,
  },
});
