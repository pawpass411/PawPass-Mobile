import { Linking, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, PawText } from "../../src/components/ui";
import { PawPassWordmark } from "../../src/components/ui/Logo";
import { Colors, Radius, Spacing } from "../../src/lib/theme";
import { api } from "../../src/lib/api";

const WEB_BUSINESS_PORTAL = "https://pawpass411.com/business/dashboard";
const WEB_CLAIM = "https://pawpass411.com/business/claim";

export default function BusinessDashboardBridge() {
  const insets = useSafeAreaInsets();
  const [role,setRole] = useState("BUSINESS");
  useEffect(() => { api.users.me().then(({user}) => setRole(user.role)).catch(() => {}); },[]);
  const portal = role === "ADMIN" || role === "SUPERADMIN" ? "https://pawpass411.com/admin" : role === "STAFF" ? "https://pawpass411.com/employee/dashboard" : WEB_BUSINESS_PORTAL;
  const label = role === "ADMIN" || role === "SUPERADMIN" ? "Admin" : role === "STAFF" ? "Employee" : "Business";

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing[6], paddingBottom: insets.bottom + Spacing[6] }]}>
      <Card style={styles.card}>
        <View style={{ alignItems: "center", marginBottom: Spacing[5] }}>
          <PawPassWordmark height={34} showText />
        </View>
        <PawText variant="label" color={Colors.info} style={{ textAlign: "center" }}>
          WEB PORTAL
        </PawText>
        <PawText variant="h2" style={{ textAlign: "center", marginTop: Spacing[2] }}>
          {label} account detected
        </PawText>
        <PawText variant="body" color={Colors.muted} style={styles.body}>
          This account type is managed on the PawPass website. The mobile app is for dog owners, service-dog handlers, and service-dog trainers.
        </PawText>
        <Button onPress={() => Linking.openURL(portal)} fullWidth>
          Open {label.toLowerCase()} portal
        </Button>
        {role === "BUSINESS" ? <Button onPress={() => Linking.openURL(WEB_CLAIM)} variant="secondary" fullWidth style={{ marginTop: Spacing[3] }}>Claim a business</Button> : null}
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
