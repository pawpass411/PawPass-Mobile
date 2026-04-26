// app/reports/mine.tsx
import { useState, useEffect } from "react";
import {
  View, FlatList, TouchableOpacity, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, PawText, EmptyState, Button } from "../../src/components/ui";
import { api, ComplaintSummary } from "../../src/lib/api";
import { Colors, Spacing } from "../../src/lib/theme";

const STATUS_META: Record<string, { label: string; variant: "green" | "yellow" | "red" | "cyan" | "gray" | "purple" }> = {
  SUBMITTED:            { label: "Submitted",       variant: "yellow" },
  UNDER_REVIEW:         { label: "In Review",        variant: "cyan" },
  AWAITING_RESPONSE:    { label: "Awaiting Response",variant: "yellow" },
  BUSINESS_NOTIFIED:    { label: "Business Notified",variant: "cyan" },
  TRAINING_REQUIRED:    { label: "Training Required",variant: "red" },
  TRAINING_IN_PROGRESS: { label: "Training Underway",variant: "purple" },
  RESOLVED_CORRECTED:   { label: "Resolved",         variant: "green" },
  RESOLVED_UNFOUNDED:   { label: "Unfounded",        variant: "gray" },
  CLOSED:               { label: "Closed",           variant: "gray" },
};

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<ComplaintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.complaints.list();
      setReports(data.complaints ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <PawText variant="body" color={Colors.muted}>Loading reports…</PawText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {reports.length === 0 ? (
        <EmptyState
          icon=""
          title="No reports filed"
          body="When you file an access concern report it will appear here."
          action={
            <Button onPress={() => router.push("/complaint/new")} size="sm">
              File a Report
            </Button>
          }
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />
          }
          renderItem={({ item: r }) => {
            const sm = STATUS_META[r.status] ?? { label: r.status, variant: "gray" as const };
            return (
              <TouchableOpacity
                onPress={() => router.push(`/complaint/${r.id}` as any)}
                activeOpacity={0.7}
              >
                <Card style={{ marginBottom: Spacing[3] }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing[2] }}>
                    <PawText variant="body" weight="semibold" style={{ flex: 1, marginRight: Spacing[3] }}>
                      {r.category.replace(/_/g, " ")}
                    </PawText>
                    <Badge variant={sm.variant}>{sm.label}</Badge>
                  </View>
                  <PawText variant="caption" color={Colors.dim}>
                    Incident: {new Date(r.incidentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </PawText>
                  <PawText variant="caption" color={Colors.ghost} style={{ marginTop: 2 }}>
                    Filed: {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </PawText>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
