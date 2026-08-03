// app/settings/location.tsx
import { useState } from "react";
import { View, ScrollView, Switch, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Alert, PawText, Button, Divider } from "../../src/components/ui";
import { Colors, Spacing } from "../../src/lib/theme";

export default function LocationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [nearbySearch, setNearbySearch] = useState(true);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 40 }}
    >
      <Alert variant="info" style={{ marginBottom: Spacing[4] }}>
        PawPass uses your approximate location to show businesses and parks near you. We never store or share your precise location.
      </Alert>

      <PawText variant="caption" color={Colors.dim} style={{ marginBottom: Spacing[2] }}>LOCATION ACCESS</PawText>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: Spacing[4] }}>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: Spacing[3] }}>
            <PawText variant="body">Location access</PawText>
            <PawText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
              Allow PawPass to use your location for nearby search
            </PawText>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: Colors.border2, true: Colors.accentDim }}
            thumbColor={locationEnabled ? Colors.accent : Colors.dim}
            ios_backgroundColor={Colors.border2}
          />
        </View>
        <Divider style={{ marginLeft: Spacing[4] }} />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: Spacing[3] }}>
            <PawText variant="body">Nearby search by default</PawText>
            <PawText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
              Auto-populate searches with your current city
            </PawText>
          </View>
          <Switch
            value={nearbySearch}
            onValueChange={setNearbySearch}
            trackColor={{ false: Colors.border2, true: Colors.accentDim }}
            thumbColor={nearbySearch ? Colors.accent : Colors.dim}
            ios_backgroundColor={Colors.border2}
            disabled={!locationEnabled}
          />
        </View>
      </Card>

      <Button
        onPress={() => Linking.openSettings()}
        variant="outline"
        fullWidth
        style={{ marginBottom: Spacing[3] }}
      >
        Open Device Location Settings
      </Button>

      <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", lineHeight: 16 }}>
        Location permissions are managed by your device. Tap above to change them in System Settings.
      </PawText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
    minHeight: 56,
  },
});
