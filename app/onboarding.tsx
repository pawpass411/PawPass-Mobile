// app/onboarding.tsx
// Post sign-up onboarding - handler or dog owner setup
import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Alert, PawText } from "../src/components/ui";
import { PawPassWordmark } from "../src/components/ui/Logo";
import { api } from "../src/lib/api";
import { Colors, Spacing, Radius } from "../src/lib/theme";

const STEPS = 3;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [isHandler, setIsHandler] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    await api.users.update({ isHandler: isHandler ?? false }).catch(() => {});
    setSaving(false);
    router.replace("/(tabs)");
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
            <Button onPress={() => setStep(2)} fullWidth>Let's go</Button>
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
                  val: true,
                  label: "I'm a service dog handler",
                  desc: "I use a trained service animal and want to review service dog access experiences.",
                },
                {
                  val: false,
                  label: "I'm a dog owner",
                  desc: "I want to find dog-friendly places and share pet dog experience feedback.",
                },
              ].map(o => (
                <TouchableOpacity key={String(o.val)} onPress={() => setIsHandler(o.val)} style={[styles.roleCard, isHandler === o.val && styles.roleCardActive]}>
                  <PawText variant="body" weight="bold" color={isHandler === o.val ? Colors.accent : Colors.text}>{o.label}</PawText>
                  <PawText variant="caption" color={Colors.muted} style={{ marginTop: 4, lineHeight: 18 }}>{o.desc}</PawText>
                </TouchableOpacity>
              ))}
            </View>
            <Button onPress={() => setStep(3)} disabled={isHandler === null} fullWidth>Continue</Button>
          </View>
        )}

        {step === 3 && (
          <View>
            <PawText variant="h2" style={{ marginBottom: Spacing[5] }}>A few things to know.</PawText>
            <Alert variant="info" title="Reviews are community experiences" style={{ marginBottom: Spacing[3] }}>
              Ratings and reports on PawPass reflect individual users' experiences. They are not official ADA determinations, legal findings, or enforcement actions.
            </Alert>
            <Alert variant="warn" title="Not legal advice" style={{ marginBottom: Spacing[5] }}>
              PawPass content is educational. It is not legal advice or a legal determination.
            </Alert>
            <TouchableOpacity onPress={() => setAgreed(!agreed)} style={[styles.agreeRow, agreed && styles.agreeRowActive]}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={{ color: "#0D1F0D", fontSize: 12, fontWeight: "900" }}>✓</Text>}
              </View>
              <PawText variant="body" color={Colors.muted} style={{ flex: 1, lineHeight: 22 }}>
                I understand that reviews are community experiences, not legal findings, and that PawPass content is educational in nature.
              </PawText>
            </TouchableOpacity>
            <Button onPress={finish} loading={saving} disabled={!agreed} fullWidth style={{ marginTop: Spacing[5] }}>
              I understand - let's go
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
