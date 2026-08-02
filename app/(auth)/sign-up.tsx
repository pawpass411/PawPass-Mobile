// app/(auth)/sign-up.tsx
import { useState } from "react";
import {
  View, ScrollView, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input, Alert, PawText } from "../../src/components/ui";
import { PawPassWordmark } from "../../src/components/ui/Logo";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!isLoaded) return;
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true); setError(null);
    try {
      await signUp.create({ emailAddress: email, password, firstName: name.split(" ")[0] || undefined, lastName: name.split(" ").slice(1).join(" ") || undefined });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true); setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/onboarding");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Invalid code. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">

        <View style={{ alignItems: "center", marginBottom: Spacing[8] }}>
          <PawPassWordmark height={36} showSubtext/>
        </View>

        {step === "details" ? (
          <>
            <PawText variant="h2" style={{ marginBottom: Spacing[2] }}>Create account</PawText>
            <PawText variant="body" color={Colors.muted} style={{ marginBottom: Spacing[6] }}>
              Join the community. Help handlers find welcoming places.
            </PawText>
            {error && <Alert variant="danger" style={{ marginBottom: Spacing[3] }}>{error}</Alert>}
            <Input label="Name (optional)" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words"/>
            <Input label="Email *" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"/>
            <Input label="Password *" value={password} onChangeText={setPassword} placeholder="8+ characters" secureTextEntry hint="Minimum 8 characters"/>
            <Button onPress={handleRegister} loading={loading} fullWidth style={{ marginBottom: Spacing[4] }}>
              Create account
            </Button>
          </>
        ) : (
          <>
            <PawText variant="h2" style={{ marginBottom: Spacing[2] }}>Verify your email</PawText>
            <PawText variant="body" color={Colors.muted} style={{ marginBottom: Spacing[6] }}>
              We sent a 6-digit code to {email}. Enter it below.
            </PawText>
            {error && <Alert variant="danger" style={{ marginBottom: Spacing[3] }}>{error}</Alert>}
            <Input
              label="Verification code"
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <Button onPress={handleVerify} loading={loading} fullWidth style={{ marginBottom: Spacing[3] }}>
              Verify & continue
            </Button>
            <Button onPress={() => setStep("details")} variant="ghost" fullWidth>
              ← Go back
            </Button>
          </>
        )}

        <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")} style={{ alignItems: "center", marginTop: Spacing[4] }}>
          <PawText variant="caption" color={Colors.muted}>
            Already have an account? <Text style={{ color: Colors.accent, fontWeight: "700" }}>Sign in</Text>
          </PawText>
        </TouchableOpacity>

        <View style={styles.legal}>
          <TouchableOpacity onPress={() => router.push("/legal/terms")}>
            <PawText variant="micro" color={Colors.dim}>Terms</PawText>
          </TouchableOpacity>
          <PawText variant="micro" color={Colors.ghost}> · </PawText>
          <TouchableOpacity onPress={() => router.push("/legal/privacy")}>
            <PawText variant="micro" color={Colors.dim}>Privacy Policy</PawText>
          </TouchableOpacity>
        </View>
        <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", marginTop: 6, lineHeight: 15 }}>
          Reviews are community experiences, not legal findings.{"\n"}© {new Date().getFullYear()} Stodghill Consulting LLC
        </PawText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing[6] },
  legal: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: Spacing[6] },
});
