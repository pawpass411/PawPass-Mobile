import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Badge, Button, Card, EmptyState, PawText } from "../../src/components/ui";
import { api, ComplaintDetail } from "../../src/lib/api";
import { Colors, Radius, Spacing } from "../../src/lib/theme";

const STATUS_META: Record<string, { label: string; variant: "green" | "yellow" | "red" | "cyan" | "gray" | "purple" }> = {
  SUBMITTED: { label: "Submitted", variant: "yellow" },
  UNDER_REVIEW: { label: "In Review", variant: "cyan" },
  AWAITING_RESPONSE: { label: "Awaiting Response", variant: "yellow" },
  BUSINESS_NOTIFIED: { label: "Business Notified", variant: "cyan" },
  TRAINING_REQUIRED: { label: "Training Required", variant: "red" },
  TRAINING_IN_PROGRESS: { label: "Training Underway", variant: "purple" },
  RESOLVED_CORRECTED: { label: "Resolved", variant: "green" },
  RESOLVED_UNFOUNDED: { label: "Unfounded", variant: "gray" },
  CLOSED: { label: "Closed", variant: "gray" },
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.complaints.get(id)
      .then((data) => setComplaint(data.complaint))
      .catch(() => setError("PawPass could not load this access report."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} />
        <PawText variant="caption" color={Colors.muted} style={{ marginTop: Spacing[3] }}>Loading access report</PawText>
      </View>
    );
  }

  if (error || !complaint) {
    return (
      <View style={styles.center}>
        <EmptyState icon="!" title="Report unavailable" body={error ?? "This report could not be found."} />
        <Button onPress={() => router.back()} variant="secondary">Go back</Button>
      </View>
    );
  }

  const status = STATUS_META[complaint.status] ?? { label: complaint.status.replace(/_/g, " "), variant: "gray" as const };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Access Report" }} />
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <PawText variant="label" color={Colors.info}>ACCESS REPORT</PawText>
            <PawText variant="h2" style={{ marginTop: Spacing[2] }}>{complaint.category.replace(/_/g, " ")}</PawText>
          </View>
          <Badge variant={status.variant}>{status.label}</Badge>
        </View>
        <PawText variant="caption" color={Colors.dim} style={{ marginTop: Spacing[2] }}>
          Incident date: {new Date(complaint.incidentDate).toLocaleDateString()}
        </PawText>
      </Card>

      <Card style={styles.card}>
        <PawText variant="h3">What happened</PawText>
        <PawText variant="body" color={Colors.muted} style={{ marginTop: Spacing[3] }}>
          {complaint.whatUserExperienced}
        </PawText>
      </Card>

      {complaint.businessResponse?.body ? (
        <Card style={StyleSheet.flatten([styles.card, { borderColor: Colors.infoBorder }])}>
          <PawText variant="h3">Business response</PawText>
          <PawText variant="body" color={Colors.muted} style={{ marginTop: Spacing[3] }}>
            {complaint.businessResponse.body}
          </PawText>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <PawText variant="h3">Status history</PawText>
        {complaint.statusHistory?.length ? complaint.statusHistory.map((entry, index) => (
          <View key={`${entry.status}-${entry.changedAt}-${index}`} style={styles.timelineItem}>
            <PawText variant="body" weight="bold">{entry.status.replace(/_/g, " ")}</PawText>
            <PawText variant="caption" color={Colors.dim}>{new Date(entry.changedAt).toLocaleString()}</PawText>
            {entry.note ? <PawText variant="caption" color={Colors.muted} style={{ marginTop: 4 }}>{entry.note}</PawText> : null}
          </View>
        )) : (
          <PawText variant="caption" color={Colors.dim} style={{ marginTop: Spacing[2] }}>No status updates yet.</PawText>
        )}
      </Card>

      <Button onPress={() => router.back()} variant="secondary" fullWidth>
        Back to reports
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
    padding: Spacing[5],
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
  },
  card: {
    marginBottom: Spacing[3],
    borderRadius: Radius.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
  },
  timelineItem: {
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
