// app/complaint/new.tsx
// 4-step complaint wizard — modal screen

import { useState } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
  KeyboardAvoidingView, Platform, Alert as RNAlert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input, Alert, Badge, Card, PawText } from "../../src/components/ui";
import { api, ApiError } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";
import { useProtectedRoute } from "../../src/hooks/useProtectedRoute";

const CATEGORIES = [
  { value: "entry_denied",            label: "Entry was refused or blocked" },
  { value: "documentation_requested", label: "Asked for documentation, ID, or papers" },
  { value: "disability_questioned",   label: "Asked about my disability or condition" },
  { value: "extra_fee_charged",       label: "Charged a fee because of my service animal" },
  { value: "isolated_or_segregated",  label: "Directed to a separate or isolated area" },
  { value: "demonstration_required",  label: "Asked to demonstrate my dog's task" },
  { value: "staff_rude",              label: "Staff was hostile or dismissive" },
  { value: "other_concern",           label: "Other access concern" },
];

const TOTAL_STEPS = 4;

interface FormState {
  businessLocationId: string;
  businessName: string;
  incidentDate: string;
  category: string;
  wasEntryDenied: boolean;
  wasDocumentationAsked: boolean;
  wasPoliceInvolved: boolean;
  whatUserExperienced: string;
  whatStaffSaid: string;
  wantsMediation: boolean;
  isPrivate: boolean;
}

export default function ComplaintNewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ businessId?: string; businessName?: string; locationId?: string }>();
  const { isLoaded, isSignedIn } = useProtectedRoute();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    businessLocationId: params.locationId ?? "",
    businessName:       params.businessName ?? "Unknown Business",
    incidentDate:       new Date().toISOString().slice(0, 10),
    category:           "",
    wasEntryDenied:     false,
    wasDocumentationAsked: false,
    wasPoliceInvolved:  false,
    whatUserExperienced: "",
    whatStaffSaid:      "",
    wantsMediation:     false,
    isPrivate:          false,
  });

  if (!isLoaded || !isSignedIn) {
    return (
      <View style={styles.authGate}>
        <PawText variant="body" color={Colors.muted}>Opening secure sign in…</PawText>
      </View>
    );
  }

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const validate = (): boolean => {
    if (step === 1 && !form.category) {
      RNAlert.alert("Required", "Please select a category before continuing.");
      return false;
    }
    if (step === 3 && form.whatUserExperienced.trim().length < 20) {
      RNAlert.alert("Too short", "Please describe your experience (minimum 20 characters).");
      return false;
    }
    return true;
  };

  const next = () => { if (validate()) setStep(s => Math.min(TOTAL_STEPS, s + 1)); };
  const back = () => setStep(s => Math.max(1, s - 1));

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.complaints.create({
        businessLocationId: form.businessLocationId || "UNKNOWN",
        incidentDate: new Date(form.incidentDate),
        category: form.category,
        whatUserExperienced: form.whatUserExperienced,
        whatStaffSaid: form.whatStaffSaid || undefined,
        wasEntryDenied: form.wasEntryDenied,
        wasDocumentationAsked: form.wasDocumentationAsked,
        wasPoliceInvolved: form.wasPoliceInvolved,
        wantsMediation: form.wantsMediation,
        isPrivate: form.isPrivate,
        contactPreference: "email",
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          setModError("Your description contains language we can't submit. Please describe what you personally experienced in first-person language, without legal conclusions or medical disclosures.");
          setStep(3);
        } else if (err.status === 409) {
          RNAlert.alert("Duplicate Report", "You have an open report at this location from the past 7 days.");
        } else {
          RNAlert.alert("Error", err.message);
        }
      }
    } finally { setSubmitting(false); }
  };

  // ── DONE STATE ─────────────────────────────────────
  if (done) {
    return (
      <View style={[styles.doneContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}></Text>
        <PawText variant="h2" style={{ textAlign: "center", marginBottom: 12 }}>Report received.</PawText>
        <PawText variant="body" color={Colors.muted} style={{ textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
          Your report has been submitted. A PawPass admin will review it before any badge action is taken. You&apos;ll be notified when the status changes.
        </PawText>
        <View style={{ gap: Spacing[3], width: "100%" }}>
          {[
            "Reviewed by PawPass team (usually within 2 business days)",
            "Business is notified and given a chance to respond",
            "Corrective training assigned if warranted",
            "You’re updated when status changes",
          ].map((s, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12 }}>
              <Text style={{ color: Colors.accent, fontWeight: "700" }}>{i + 1}.</Text>
              <PawText variant="caption" color={Colors.muted} style={{ flex: 1 }}>{s}</PawText>
            </View>
          ))}
        </View>
        <View style={{ marginTop: Spacing[8], gap: Spacing[3], width: "100%" }}>
          <Button onPress={() => router.replace("/(tabs)")} fullWidth>Back to Home</Button>
          <Button onPress={() => router.push("/(tabs)/learn")} variant="ghost" fullWidth>Learn about your rights</Button>
        </View>
        <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", marginTop: Spacing[6], lineHeight: 15 }}>
          Access concern reports are community records, not official ADA complaints or legal filings.
          PawPass makes no legal determinations about individual incidents.
        </PawText>
      </View>
    );
  }

  const progressPct = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]}/>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {["What happened?", "Details", "Your experience", "Review & Submit"].map((label, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <View style={[styles.stepDot, step > i + 1 && styles.stepDotDone, step === i + 1 && styles.stepDotActive]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: step > i + 1 ? "#0D1F0D" : step === i + 1 ? "#0D1F0D" : Colors.dim }}>
                  {step > i + 1 ? "✓" : String(i + 1)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <PawText variant="h2" style={{ marginBottom: 6 }}>
          {["What happened?", "A few more details.", "Tell us what happened.", "Review your report."][step - 1]}
        </PawText>
        <PawText variant="caption" color={Colors.muted} style={{ marginBottom: Spacing[4] }}>
          Reporting at: {form.businessName}
        </PawText>

        {/* ─── STEP 1 ─────────────────────────────── */}
        {step === 1 && (
          <View>
            <Alert variant="info" style={{ marginBottom: Spacing[4] }}>
              Tell us the basics. Use first-person language — describe what you saw, heard, and experienced.
            </Alert>
            <Input
              label="Date of incident"
              value={form.incidentDate}
              onChangeText={v => set("incidentDate", v)}
              placeholder="YYYY-MM-DD"
              keyboardType="default"
            />
            <PawText variant="caption" color={Colors.muted} style={{ marginBottom: 8 }}>Type of concern *</PawText>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => set("category", cat.value)}
                style={[
                  styles.categoryOption,
                  form.category === cat.value && styles.categoryOptionSelected,
                ]}
              >
                <View style={[styles.radioCircle, form.category === cat.value && styles.radioCircleSelected]}/>
                <Text style={{ flex: 1, color: form.category === cat.value ? Colors.accent : Colors.muted, fontSize: 14, fontWeight: form.category === cat.value ? "600" : "400" }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── STEP 2 ─────────────────────────────── */}
        {step === 2 && (
          <View>
            <PawText variant="caption" color={Colors.muted} style={{ marginBottom: Spacing[4] }}>
              Check everything that applies. These help us understand the full situation.
            </PawText>
            {[
              { key: "wasEntryDenied",          label: "I was refused entry or asked to leave" },
              { key: "wasDocumentationAsked",    label: "Asked to see documentation, papers, or ID for my dog" },
              { key: "wasPoliceInvolved",        label: "Police, security, or another authority got involved" },
              { key: "isPrivate",                label: "Keep this report private (visible to admins only)" },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => set(key as keyof FormState, !form[key as keyof FormState] as any)}
                style={styles.checkRow}
              >
                <View style={[styles.checkbox, (form[key as keyof FormState] as boolean) && styles.checkboxChecked]}>
                  {(form[key as keyof FormState] as boolean) && (
                    <Text style={{ color: "#0D1F0D", fontSize: 11, fontWeight: "900" }}>✓</Text>
                  )}
                </View>
                <Text style={{ flex: 1, color: Colors.muted, fontSize: 14, lineHeight: 20 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── STEP 3 ─────────────────────────────── */}
        {step === 3 && (
          <View>
            {modError && (
              <Alert variant="danger" title="Content flagged" style={{ marginBottom: Spacing[4] }}>
                {modError}
              </Alert>
            )}
            <Alert variant="info" style={{ marginBottom: Spacing[4] }}>
              Describe your experience in your own words. Write what you saw and heard — not conclusions about what the law requires.
            </Alert>
            <Input
              label="What did you experience? (required)"
              value={form.whatUserExperienced}
              onChangeText={v => { set("whatUserExperienced", v); setModError(null); }}
              placeholder="I arrived with my service dog. The staff member said…"
              multiline
              numberOfLines={6}
              hint={`${form.whatUserExperienced.length} characters · minimum 20`}
            />
            <Input
              label="What did staff say? (optional)"
              value={form.whatStaffSaid}
              onChangeText={v => set("whatStaffSaid", v)}
              placeholder="If a staff member spoke to you directly, quote what they said here."
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* ─── STEP 4 ─────────────────────────────── */}
        {step === 4 && (
          <View>
            <Card style={{ marginBottom: Spacing[4] }}>
              {[
                { label: "Business",    value: form.businessName },
                { label: "Date",        value: form.incidentDate },
                { label: "Concern",     value: CATEGORIES.find(c => c.value === form.category)?.label ?? form.category },
              ].map(row => (
                <View key={row.label} style={styles.summaryRow}>
                  <PawText variant="caption" color={Colors.dim}>{row.label}</PawText>
                  <PawText variant="caption" style={{ flex: 1, textAlign: "right" }}>{row.value}</PawText>
                </View>
              ))}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: Spacing[2] }}>
                {form.wasEntryDenied        && <Badge variant="red">Entry refused</Badge>}
                {form.wasDocumentationAsked && <Badge variant="yellow">Docs requested</Badge>}
                {form.wasPoliceInvolved     && <Badge variant="red">Police involved</Badge>}
                {form.isPrivate             && <Badge variant="gray">Private</Badge>}
              </View>
              {form.whatUserExperienced.length > 0 && (
                <View style={{ marginTop: Spacing[3], paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <PawText variant="caption" color={Colors.dim} style={{ marginBottom: 4 }}>Your experience:</PawText>
                  <PawText variant="caption" color={Colors.muted} numberOfLines={4}>{form.whatUserExperienced}</PawText>
                </View>
              )}
            </Card>
            <Alert variant="warn" title="Before you submit">
              By submitting, you&apos;re confirming this is a truthful account of your experience. This report is not a legal complaint — it&apos;s a community record reviewed by the PawPass team.
            </Alert>
          </View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navBar, { paddingBottom: insets.bottom + 8 }]}>
        <Button variant="ghost" onPress={step === 1 ? () => router.back() : back} style={{ flex: 1 }}>
          {step === 1 ? "Cancel" : "← Back"}
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onPress={next} style={{ flex: 2 }}>Continue →</Button>
        ) : (
          <Button onPress={submit} loading={submitting} style={{ flex: 2 }}>Submit report →</Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing[4] },
  progressTrack: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.accent },
  stepIndicator: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[5] },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: "center", justifyContent: "center",
  },
  stepDotActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepDotDone:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[3],
    borderRadius: Radius.md, marginBottom: Spacing[2],
    borderWidth: 1, borderColor: Colors.border2,
    backgroundColor: Colors.surface2,
  },
  categoryOptionSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.border2,
  },
  radioCircleSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  checkRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.border2,
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBar: {
    flexDirection: "row", gap: Spacing[3],
    paddingHorizontal: Spacing[4], paddingTop: Spacing[3],
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  doneContainer: {
    flex: 1, backgroundColor: Colors.bg,
    padding: Spacing[6], alignItems: "center", justifyContent: "center",
  },
  authGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
    padding: Spacing[6],
  },
});
