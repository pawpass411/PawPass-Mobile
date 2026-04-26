// app/incident-log.tsx
import { useState, useEffect } from "react";
import {
  View, FlatList, TouchableOpacity, Text, StyleSheet,
  Alert as RNAlert, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Button, Input, PawText, Alert, EmptyState } from "../src/components/ui";
import { api, IncidentLog } from "../src/lib/api";
import { Colors, Spacing, Radius } from "../src/lib/theme";

const ISSUE_TYPES = [
  "Documentation requested", "Entry denied", "Fee charged", "Disability questioned",
  "Isolated or segregated", "Task demonstration required", "Staff hostility", "Other",
];

export default function IncidentLogScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<IncidentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ placeName: "", issueType: "", incidentDate: new Date().toISOString().slice(0, 10), notes: "" });

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.incidentLogs.list();
      setLogs(data.logs);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const addLog = async () => {
    if (!form.placeName || !form.issueType) { RNAlert.alert("Required", "Business name and issue type are required."); return; }
    setSaving(true);
    try {
      await api.incidentLogs.create({ placeName: form.placeName, issueType: form.issueType, incidentDate: new Date(form.incidentDate).toISOString(), notes: form.notes || undefined, isPrivate: true });
      setShowAdd(false);
      setForm({ placeName: "", issueType: "", incidentDate: new Date().toISOString().slice(0, 10), notes: "" });
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const deleteLog = (id: string) => {
    RNAlert.alert("Delete Entry", "Remove this log entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await api.incidentLogs.delete(id).catch(() => {});
        setLogs(l => l.filter(x => x.id !== id));
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <PawText variant="h2">Incident Log</PawText>
          <PawText variant="caption" color={Colors.dim}>Private — visible only to you</PawText>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={{ color: "#0D1F0D", fontWeight: "700", fontSize: 14 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <PawText variant="body" color={Colors.muted}>Loading…</PawText>
        </View>
      ) : logs.length === 0 ? (
        <EmptyState
          icon=""
          title="No log entries yet"
          body="Keep a private record of access concerns for your own reference."
          action={<Button onPress={() => setShowAdd(true)} size="sm">Add First Entry</Button>}
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={l => l.id}
          contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent}/>}
          renderItem={({ item: log }) => (
            <Card style={{ marginBottom: Spacing[3] }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <PawText variant="body" weight="semibold">{log.placeName}</PawText>
                  <PawText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
                    {log.issueType} · {new Date(log.incidentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </PawText>
                  {log.notes && <PawText variant="caption" color={Colors.dim} style={{ marginTop: 6, lineHeight: 18 }}>{log.notes}</PawText>}
                </View>
                <TouchableOpacity onPress={() => deleteLog(log.id)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Text style={{ color: Colors.danger, fontSize: 18 }}></Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {/* Add modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <PawText variant="body" color={Colors.muted}>Cancel</PawText>
            </TouchableOpacity>
            <PawText variant="body" weight="bold">New Entry</PawText>
            <TouchableOpacity onPress={addLog} disabled={saving}>
              <PawText variant="body" color={Colors.accent} weight="bold">{saving ? "Saving…" : "Save"}</PawText>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing[4] }} keyboardShouldPersistTaps="handled">
            <Alert variant="info" style={{ marginBottom: Spacing[4] }}>
              This entry is private — visible only to you. Use it to document experiences for your own records.
            </Alert>
            <Input label="Business or Park Name *" value={form.placeName} onChangeText={v => setForm(f => ({ ...f, placeName: v }))} placeholder="e.g. The Corner Café"/>
            <Input label="Date of Incident" value={form.incidentDate} onChangeText={v => setForm(f => ({ ...f, incidentDate: v }))} placeholder="YYYY-MM-DD"/>
            <PawText variant="caption" color={Colors.muted} style={{ marginBottom: 8 }}>Type of Issue *</PawText>
            <View style={{ gap: Spacing[2], marginBottom: Spacing[4] }}>
              {ISSUE_TYPES.map(type => (
                <TouchableOpacity key={type} onPress={() => setForm(f => ({ ...f, issueType: type }))} style={[styles.issueChip, form.issueType === type && styles.issueChipActive]}>
                  <Text style={{ fontSize: 13, color: form.issueType === type ? Colors.accent : Colors.muted, fontWeight: form.issueType === type ? "700" : "400" }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Notes (optional)" value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Additional details…" multiline numberOfLines={4}/>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  addBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  issueChip: {
    padding: Spacing[3], borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border2, backgroundColor: Colors.surface2,
  },
  issueChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
});
