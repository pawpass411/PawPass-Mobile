// app/settings/notifications.tsx
import { useState } from "react";
import { View, ScrollView, Switch, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, PawText, Divider } from "../../src/components/ui";
import { Colors, Spacing } from "../../src/lib/theme";

function SettingRow({
  label, description, value, onChange,
}: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, marginRight: Spacing[3] }}>
        <PawText variant="body">{label}</PawText>
        {description && (
          <PawText variant="caption" color={Colors.muted} style={{ marginTop: 2, lineHeight: 18 }}>
            {description}
          </PawText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border2, true: Colors.accentDim }}
        thumbColor={value ? Colors.accent : Colors.dim}
        ios_backgroundColor={Colors.border2}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [reviewApprovals, setReviewApprovals] = useState(true);
  const [badgeChanges, setBadgeChanges] = useState(true);
  const [communityDigest, setCommunityDigest] = useState(false);
  const [newReviews, setNewReviews] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 40 }}
    >
      <PawText variant="caption" color={Colors.dim} style={{ marginBottom: Spacing[2] }}>REVIEWS</PawText>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: Spacing[4] }}>
        <SettingRow
          label="Review approved"
          description="When your review is approved and becomes public"
          value={reviewApprovals}
          onChange={setReviewApprovals}
        />
        <Divider style={{ marginLeft: Spacing[4] }} />
        <SettingRow
          label="Badge changes"
          description="When a business you've reviewed earns or loses a badge"
          value={badgeChanges}
          onChange={setBadgeChanges}
        />
      </Card>

      <PawText variant="caption" color={Colors.dim} style={{ marginBottom: Spacing[2] }}>COMMUNITY</PawText>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: Spacing[4] }}>
        <SettingRow
          label="Weekly community digest"
          description="Summary of new verified businesses and parks in your area"
          value={communityDigest}
          onChange={setCommunityDigest}
        />
        <Divider style={{ marginLeft: Spacing[4] }} />
        <SettingRow
          label="Responses to my reviews"
          description="When a business responds to one of your reviews"
          value={newReviews}
          onChange={setNewReviews}
        />
      </Card>

      <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", lineHeight: 16 }}>
        Push notification preferences are saved locally. You can also manage notification permissions in your device Settings app.
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
