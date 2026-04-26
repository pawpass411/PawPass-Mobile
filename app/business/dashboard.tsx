// app/business/dashboard.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, PawText, Alert, TrustScoreRing, EmptyState } from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";
import Constants from "expo-constants";

const BASE = Constants.expoConfig?.extra?.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://pawpass.app";

const BADGE_META: Record<string, { label: string; variant: "green"|"cyan"|"yellow"|"red"|"purple" }> = {
  PAWPASS_CERTIFIED:    { label: "PawPass Certified",    variant: "green" },
  SERVICE_DOG_FRIENDLY: { label: "Service Dog Friendly", variant: "cyan" },
  UNDER_REVIEW:         { label: "Under Review",         variant: "yellow" },
  NON_COMPLIANT:        { label: "Issues Noted",         variant: "red" },
  TRAINING_IN_PROGRESS: { label: "Training Underway",    variant: "purple" },
};

type Tab = "overview" | "complaints" | "training";

interface DashData {
  name: string; trustScore: number; plan: string; badges: string[];
  stats: { openComplaints: number; resolvedComplaints: number; avgRating: number; reviewCount: number; staffTrained: number; staffTotal: number };
  complaints: Array<{ id: string; category: string; status: string; date: string }>;
  recentReviews: Array<{ id: string; rating: number; body: string; date: string }>;
}

function StatBox({ icon, value, label, color = Colors.text }: { icon: string; value: string|number; label: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: "900", color, lineHeight: 26 }}>{String(value)}</Text>
      <PawText variant="micro" color={Colors.dim}>{label}</PawText>
    </View>
  );
}

export default function BusinessDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab]       = useState<Tab>("overview");
  const [data, setData]     = useState<DashData | null>(null);
  const [bizId, setBizId]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { user } = await api.users.me();
      const biz = user.businesses?.[0];
      if (!biz) throw new Error("No business found. Claim your listing first.");
      setBizId(biz.businessId);
      const res = await fetch(`${BASE}/api/business/${biz.businessId}/overview`);
      if (!res.ok) throw new Error("Dashboard unavailable");
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent}/></View>;
  if (error || !data) return (
    <View style={styles.center}>
      <EmptyState icon="" title="No business found" body={error ?? ""}
        action={<TouchableOpacity onPress={() => router.push("/business/claim")} style={styles.accentBtn}><Text style={{ color: "#0D1F0D", fontWeight: "800" }}>Claim a listing →</Text></TouchableOpacity>}/>
    </View>
  );

  const d = data;
  const pct = d.stats.staffTotal > 0 ? Math.round((d.stats.staffTrained / d.stats.staffTotal) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.tabBar}>
        {(["overview","complaints","training"] as Tab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[styles.tabItem, tab === t && styles.tabActive]}>
            <Text style={{ fontSize: 13, fontWeight: tab === t ? "700" : "500", color: tab === t ? Colors.accent : Colors.muted, textTransform: "capitalize" }}>{t}</Text>
            {t === "complaints" && d.stats.openComplaints > 0 && (
              <View style={{ backgroundColor: Colors.danger, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 }}>
                <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{d.stats.openComplaints}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent}/>}>

        {tab === "overview" && <>
          <Card style={{ marginBottom: Spacing[3] }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[4] }}>
              <TrustScoreRing score={Math.round(d.trustScore)}/>
              <View style={{ flex: 1 }}>
                <PawText variant="h3" numberOfLines={1}>{d.name}</PawText>
                <PawText variant="caption" color={Colors.dim}>{d.plan} Plan</PawText>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                  {d.badges.map(b => { const m = BADGE_META[b]; return m ? <Badge key={b} variant={m.variant}>{m.label}</Badge> : null; })}
                </View>
              </View>
            </View>
          </Card>
          <View style={styles.statsRow}>
            <StatBox icon="" value={d.stats.openComplaints} label="Open Reports" color={d.stats.openComplaints > 0 ? Colors.danger : Colors.accent}/>
            <StatBox icon="" value={d.stats.avgRating.toFixed(1)} label="Rating" color="#FCD34D"/>
            <StatBox icon="" value={`${d.stats.staffTrained}/${d.stats.staffTotal}`} label="Trained" color={pct === 100 ? Colors.accent : Colors.warn}/>
          </View>
          {d.stats.openComplaints > 0 && <Alert variant="danger" title="Open reports need attention." style={{ marginBottom: Spacing[3] }}>Tap Complaints tab to respond.</Alert>}
          {pct < 100 && <Alert variant="warn" title="Staff training incomplete." style={{ marginBottom: Spacing[3] }}>{d.stats.staffTotal - d.stats.staffTrained} staff need to complete training.</Alert>}
          {d.recentReviews?.slice(0,3).map(r => (
            <Card key={r.id} style={{ marginBottom: Spacing[2] }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: "#FCD34D" }}>{"★".repeat(r.rating)}</Text>
                <PawText variant="micro" color={Colors.dim}>{r.date}</PawText>
              </View>
              <PawText variant="caption" color={Colors.muted} numberOfLines={2}>{r.body}</PawText>
            </Card>
          ))}
        </>}

        {tab === "complaints" && <>
          <PawText variant="h3" style={{ marginBottom: Spacing[4] }}>Access Concern Reports</PawText>
          {d.complaints.length === 0
            ? <EmptyState icon="" title="No open reports" body="Your business has a clear complaint record."/>
            : d.complaints.map(c => (
              <Card key={c.id} onPress={() => router.push(`/business/complaint/${c.id}` as any)} style={{ marginBottom: Spacing[3] }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <PawText variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1, marginRight: Spacing[2] }}>{c.category.replace(/_/g," ")}</PawText>
                  <PawText variant="caption" color={Colors.warn} style={{ fontWeight: "700" }}>{c.status.replace(/_/g," ")}</PawText>
                </View>
                <PawText variant="micro" color={Colors.dim} style={{ marginTop: 4 }}>{c.date}</PawText>
              </Card>
            ))
          }
        </>}

        {tab === "training" && <>
          <PawText variant="h3" style={{ marginBottom: Spacing[3] }}>Staff Training</PawText>
          <Card style={{ marginBottom: Spacing[3] }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[2] }}>
              <PawText variant="body">{d.stats.staffTrained} of {d.stats.staffTotal} trained</PawText>
              <PawText variant="body" color={pct === 100 ? Colors.accent : Colors.warn}>{pct}%</PawText>
            </View>
            <View style={{ height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${pct}%`, backgroundColor: pct === 100 ? Colors.accent : Colors.warn, borderRadius: 4 }}/>
            </View>
          </Card>
          <TouchableOpacity onPress={() => router.push("/business/training" as any)} style={[styles.accentBtn, { marginBottom: Spacing[3] }]}>
            <Text style={{ color: "#0D1F0D", fontWeight: "800", fontSize: 15 }}>Assign Training →</Text>
          </TouchableOpacity>
          <Alert variant="info">Staff must complete Service Animal Access Fundamentals to qualify for PawPass Certified status.</Alert>
        </>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: Spacing[6] },
  tabBar: { flexDirection: "row", backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing[3] },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  scroll: { padding: Spacing[4] },
  statsRow: { flexDirection: "row", gap: Spacing[2], marginBottom: Spacing[3] },
  statBox: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing[3], alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  accentBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, padding: Spacing[3], alignItems: "center" },
});
