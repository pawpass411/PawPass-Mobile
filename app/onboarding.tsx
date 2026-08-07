// app/onboarding.tsx
// Post sign-up onboarding - handler, trainer, or dog owner setup
import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Alert, PawText } from "../src/components/ui";
import { PawPassWordmark } from "../src/components/ui/Logo";
import { api } from "../src/lib/api";
import { Colors, Spacing, Radius } from "../src/lib/theme";

const STEPS = 3;
type AccountUse = "handler" | "trainer" | "handler_trainer" | "community";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [accountUse, setAccountUse] = useState<AccountUse | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [handlerAttested, setHandlerAttested] = useState(false);
  const [trainerAttested, setTrainerAttested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    if (!accountUse) return;
    setSaving(true);
    setError("");
    try {
      await api.users.update({
        accountUse,
        isHandler: accountUse === "handler" || accountUse === "handler_trainer" ? true : accountUse === "community" ? false : undefined,
        handlerAttestationAccepted: accountUse === "handler" || accountUse === "handler_trainer" ? handlerAttested : undefined,
        trainerAttestationAccepted: accountUse === "trainer" || accountUse === "handler_trainer" ? trainerAttested : undefined,
      });
      router.replace("/(tabs)");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PawPass could not save your account type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.progressTrack, { marginTop: insets.top + 8 }]}>
        <View style={[styles.progressFill, { width: `${((step - 1) / STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: Spacing[8] }}>
          <PawPassWordmark height={32} showSubtext />
        </View>

        {step === 1 && (
          <View style={{ alignItems: "center" }}>
            <PawText variant="h2" style={{ textAlign: "center", marginBottom: Spacing[3] }}>Welcome to PawPass.</PawText>
            <PawText variant="body" color={Colors.muted} style={{ textAlign: "center", lineHeight: 22, marginBottom: Spacing[8] }}>
              Find welcoming places, share real experiences, and explore with confidence through PawPass community reviews.
            </PawText>
            <Button onPress={() => setStep(2)} fullWidth>Let&apos;s go</Button>
          </View>
        )}

        {step === 2 && (
          <View>
            <PawText variant="h2" style={{ marginBottom: Spacing[2] }}>How will you use PawPass?</PawText>
            <PawText variant="body" color={Colors.muted} style={{ marginBottom: Spacing[5], lineHeight: 22 }}>
              This helps us show you the most relevant information. You can update this anytime in Settings.
            </PawText>
            <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
              {[
                {
                  val: "handler" as const,
                  label: "I’m a service dog handler",
                  desc: "I use a trained service animal and want to review service dog access experiences.",
                },
                {
                  val: "trainer" as const,
                  label: "I'm a service dog trainer",
                  desc: "I train service dogs and need handler-level review questions and jurisdiction guidance.",
                },
                {
                  val: "handler_trainer" as const,
                  label: "I'm both a handler and trainer",
                  desc: "I handle a service dog and also train service dogs, including owner-training my own service dog.",
                },
                {
                  val: "community" as const,
                  label: "I’m a dog owner",
                  desc: "I want to find dog-friendly places and share pet dog experience feedback.",
                },
              ].map(o => (
                <TouchableOpacity key={o.val} onPress={() => { setAccountUse(o.val); setHandlerAttested(false); setTrainerAttested(false); }} style={[styles.roleCard, accountUse === o.val && styles.roleCardActive]}>
                  <PawText variant="body" weight="bold" color={accountUse === o.val ? Colors.accent : Colors.text}>{o.label}</PawText>
                  <PawText variant="caption" color={Colors.muted} style={{ marginTop: 4, lineHeight: 18 }}>{o.desc}</PawText>
                </TouchableOpacity>
              ))}
            </View>
            <Button onPress={() => setStep(3)} disabled={accountUse === null} fullWidth>Continue</Button>
          </View>
        )}

        {step === 3 && (
          <View>
            <PawText variant="h2" style={{ marginBottom: Spacing[5] }}>A few things to know.</PawText>
            <Alert variant="info" title="Reviews are community experiences" style={{ marginBottom: Spacing[3] }}>
              Ratings and reports on PawPass reflect individual users&apos; experiences. They are not official ADA determinations, legal findings, or enforcement actions.
            </Alert>
            <Alert variant="warn" title="Not legal advice" style={{ marginBottom: Spacing[5] }}>
              PawPass content is educational. It is not legal advice or a legal determination.
            </Alert>
            {(accountUse === "handler" || accountUse === "handler_trainer") ? (
              <TouchableOpacity onPress={() => setHandlerAttested(!handlerAttested)} style={[styles.agreeRow, handlerAttested && styles.agreeRowActive, {marginBottom:Spacing[3]}]}>
                <View style={[styles.checkbox, handlerAttested && styles.checkboxChecked]} />
                <PawText variant="body" color={Colors.muted} style={{flex:1,lineHeight:22}}>I confirm that I am a service dog handler and that my service-dog access reviews will describe real handling experiences.</PawText>
              </TouchableOpacity>
            ) : null}
            {(accountUse === "trainer" || accountUse === "handler_trainer") ? (
              <TouchableOpacity onPress={() => setTrainerAttested(!trainerAttested)} style={[styles.agreeRow, trainerAttested && styles.agreeRowActive, {marginBottom:Spacing[3]}]}>
                <View style={[styles.checkbox, trainerAttested && styles.checkboxChecked]} />
                <PawText variant="body" color={Colors.muted} style={{flex:1,lineHeight:22}}>I confirm that I train service dogs and that my handler-level access reviews will describe real training experiences.</PawText>
              </TouchableOpacity>
            ) : null}
            {error ? <Alert variant="danger" style={{ marginBottom:Spacing[3] }}>{error}</Alert> : null}
            <TouchableOpacity onPress={() => setAgreed(!agreed)} style={[styles.agreeRow, agreed && styles.agreeRowActive]}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={{ color: "#0D1F0D", fontSize: 12, fontWeight: "900" }}>✓</Text>}
              </View>
              <PawText variant="body" color={Colors.muted} style={{ flex: 1, lineHeight: 22 }}>
                I understand that reviews are community experiences, not legal findings, and that PawPass content is educational in nature.
              </PawText>
            </TouchableOpacity>
            <Button onPress={finish} loading={saving} disabled={!agreed || ((accountUse === "handler" || accountUse === "handler_trainer") && !handlerAttested) || ((accountUse === "trainer" || accountUse === "handler_trainer") && !trainerAttested)} fullWidth style={{ marginTop: Spacing[5] }}>
              I understand - let&apos;s go
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.accent },
  scroll: { padding: Spacing[6] },
  roleCard: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface2,
  },
  roleCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  agreeRow: {
    flexDirection: "row",
    gap: Spacing[3],
    alignItems: "flex-start",
    padding: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface2,
  },
  agreeRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
});
