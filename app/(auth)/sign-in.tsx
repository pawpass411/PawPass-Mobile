// app/(auth)/sign-in.tsx
// Sign-in screen with Clerk + reviewer demo account support

import { useState } from "react";
import {
  View, ScrollView, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input, Alert, PawText } from "../../src/components/ui";
import { PawPassWordmark } from "../../src/components/ui/Logo";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

// Required for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT_URL = "clerk://com.stodghillconsulting.pawpass.callback";

// ─── REVIEWER DEMO ACCOUNTS ───────────────────────────
// These accounts are seeded in the DB and provided to Apple/Google reviewers
// Add to App Store Connect → App Review Information → Demo Account
const DEMO_ACCOUNTS = [
  {
    label: "Handler Demo",
    description: "Service dog handler — full review and report access",
    email: "demo-handler@pawpass411.com",
    password: "PawPassDemo2025!",
    icon: "",
  },
  {
    label: "Business Demo",
    description: "Business owner — dashboard, training, complaint management",
    email: "demo-business@pawpass411.com",
    password: "PawPassDemo2025!",
    icon: "",
  },
  {
    label: "Community Demo",
    description: "Community member — browsing and rating",
    email: "demo-community@pawpass411.com",
    password: "PawPassDemo2025!",
    icon: "",
  },
];

// Toggle this for App Store review builds
const SHOW_DEMO_ACCOUNTS =
  process.env.EXPO_PUBLIC_APP_ENV !== "production" ||
  process.env.EXPO_PUBLIC_SHOW_DEMO === "true";

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google"|"apple"|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemos, setShowDemos] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
        return;
      }

      const resultStatus = result.status as string | null;
      if (resultStatus === "needs_client_trust" || resultStatus === "needs_second_factor") {
        const emailFactor = result.supportedSecondFactors?.find(
          factor => factor.strategy === "email_code",
        );

        if (!emailFactor || !("emailAddressId" in emailFactor)) {
          setError("This account requires a verification method that is not available in the app.");
          return;
        }

        await result.prepareSecondFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
        setAwaitingVerification(true);
        return;
      }

      setError("Sign-in needs another step. Please try again or use Google sign-in.");
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Sign in failed. Check your email and password.");
    } finally { setLoading(false); }
  };

  const handleVerification = async () => {
    if (!isLoaded || !verificationCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode.trim(),
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
        return;
      }
      setError("That verification code was not accepted. Please try again.");
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    setEmail(account.email);
    try {
      const result = await signIn.create({
        identifier: account.email,
        password: account.password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch {
      setError("Demo account unavailable. Contact PawPass support.");
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    setError(null);
    try {
      const startFlow = provider === "google" ? startGoogleOAuth : startAppleOAuth;
      const { createdSessionId, setActive: setOAuthActive } = await startFlow({
        redirectUrl: OAUTH_REDIRECT_URL,
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        `${provider === "google" ? "Google" : "Apple"} sign-in failed.`,
      );
    } finally { setOauthLoading(null); }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <PawPassWordmark height={36} showSubtext/>
        </View>

        {/* OAuth buttons */}
        <View style={styles.oauthRow}>
          <TouchableOpacity
            onPress={() => handleOAuth("apple")}
            disabled={!!oauthLoading}
            style={[styles.oauthButton, { flex: 1 }]}
          >
            <Text style={styles.oauthText}>
              {oauthLoading === "apple" ? "…" : "Sign in with Apple"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.oauthRow}>
          <TouchableOpacity
            onPress={() => handleOAuth("google")}
            disabled={!!oauthLoading}
            style={[styles.oauthButton, { flex: 1 }]}
          >
            <Text style={styles.oauthText}>
              {oauthLoading === "google" ? "…" : "G  Sign in with Google"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine}/>
          <PawText variant="caption" color={Colors.dim} style={{ paddingHorizontal: 12 }}>or email</PawText>
          <View style={styles.dividerLine}/>
        </View>

        {/* Email/password */}
        {error && <Alert variant="danger" style={{ marginBottom: Spacing[3] }}>{error}</Alert>}
        {awaitingVerification ? (
          <>
            <Alert variant="info" style={{ marginBottom: Spacing[3] }}>
              We emailed you a verification code because this is a new device.
            </Alert>
            <Input
              label="Verification code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter the code from your email"
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <Button onPress={handleVerification} loading={loading} fullWidth style={{ marginBottom: Spacing[4] }}>
              Verify and sign in
            </Button>
            <TouchableOpacity
              onPress={() => {
                setAwaitingVerification(false);
                setVerificationCode("");
                setError(null);
              }}
              style={{ alignItems: "center", marginBottom: Spacing[4] }}
            >
              <PawText variant="caption" color={Colors.muted}>Use a different account</PawText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
            />
            <Button onPress={handleSignIn} loading={loading} fullWidth style={{ marginBottom: Spacing[4] }}>
              Sign in
            </Button>
          </>
        )}

        <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")} style={{ alignItems: "center", marginBottom: Spacing[6] }}>
          <PawText variant="caption" color={Colors.muted}>
            Don&apos;t have an account? <Text style={{ color: Colors.accent, fontWeight: "700" }}>Sign up</Text>
          </PawText>
        </TouchableOpacity>

        {/* Demo accounts — for App Store/Play Store reviewers */}
        {SHOW_DEMO_ACCOUNTS && (
          <View style={styles.demoSection}>
            <TouchableOpacity onPress={() => setShowDemos(!showDemos)} style={styles.demoToggle}>
              <PawText variant="label" color={Colors.dim} style={{ letterSpacing: 1 }}>
                REVIEWER DEMO ACCOUNTS {showDemos ? "▲" : "▼"}
              </PawText>
            </TouchableOpacity>
            {showDemos && (
              <View style={{ gap: Spacing[2] }}>
                <Alert variant="info" style={{ marginBottom: Spacing[2] }}>
                  These accounts are pre-configured for App Store and Play Store review. Each demonstrates a different user role.
                </Alert>
                {DEMO_ACCOUNTS.map(account => (
                  <TouchableOpacity
                    key={account.email}
                    onPress={() => handleDemoLogin(account)}
                    style={styles.demoCard}
                    disabled={loading}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 4 }}>{account.icon}</Text>
                    <PawText variant="body" weight="semibold">{account.label}</PawText>
                    <PawText variant="caption" color={Colors.muted}>{account.description}</PawText>
                    <PawText variant="micro" color={Colors.dim} style={{ marginTop: 4 }}>
                      {account.email}
                    </PawText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Legal links */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => router.push("/legal/privacy")}>
            <PawText variant="micro" color={Colors.dim}>Privacy Policy</PawText>
          </TouchableOpacity>
          <PawText variant="micro" color={Colors.ghost}> · </PawText>
          <TouchableOpacity onPress={() => router.push("/legal/terms")}>
            <PawText variant="micro" color={Colors.dim}>Terms of Service</PawText>
          </TouchableOpacity>
        </View>
        <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", marginTop: 8, lineHeight: 15 }}>
          Reviews are community experiences, not legal findings.{"\n"}
          © {new Date().getFullYear()} Stodghill Consulting LLC
        </PawText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing[6] },
  logoArea: { alignItems: "center", marginBottom: Spacing[8] },
  oauthRow: { marginBottom: Spacing[3] },
  oauthButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingVertical: Spacing[3],
    alignItems: "center",
  },
  oauthText: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  divider: {
    flexDirection: "row", alignItems: "center",
    marginVertical: Spacing[5],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  demoSection: {
    marginTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing[4],
  },
  demoToggle: { alignItems: "center", paddingVertical: Spacing[2], marginBottom: Spacing[3] },
  demoCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing[4],
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing[6],
  },
});
