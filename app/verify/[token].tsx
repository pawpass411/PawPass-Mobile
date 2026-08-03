// app/verify/[token].tsx
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Alert, PawText } from "../../src/components/ui";
import { PawPassMark } from "../../src/components/ui/Logo";
import { api } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

export default function VerifyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<Awaited<ReturnType<typeof api.certificates.verify>> | null>(null);

  useEffect(() => {
    if (!token) return;
    api.certificates.verify(token)
      .then(setCert)
      .catch(() => setCert({ valid: false }))
      .finally(() => setLoading(false));
  }, [token]);

  const isValid = cert?.valid && !cert.isRevoked && !cert.isExpired;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
    >
      {loading ? (
        <View style={{ alignItems: "center", padding: Spacing[10] }}>
          <ActivityIndicator color={Colors.accent} size="large"/>
          <PawText variant="body" color={Colors.muted} style={{ marginTop: Spacing[4] }}>Verifying certificate…</PawText>
        </View>
      ) : (
        <>
          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: isValid ? Colors.accentDim : "rgba(239,68,68,0.1)", borderColor: isValid ? "rgba(170,255,0,0.3)" : "rgba(239,68,68,0.3)" }]}>
            <PawText variant="body" weight="bold" color={isValid ? Colors.accent : Colors.danger} style={{ textAlign: "center" }}>
              {isValid ? "Certificate Verified" : cert?.isRevoked ? "Revoked" : cert?.isExpired ? "Invalid Certificate Expired" : "Invalid Certificate Not Found"}
            </PawText>
          </View>

          {cert?.recipientName && (
            <Card style={{ alignItems: "center", padding: Spacing[6], marginBottom: Spacing[4], backgroundColor: Colors.surface2, borderColor: "rgba(170,255,0,0.2)" }}>
              <PawPassMark size={52}/>
              <PawText variant="label" color="rgba(170,255,0,0.45)" style={{ marginTop: Spacing[3], letterSpacing: 2 }}>CERTIFICATE OF COMPLETION</PawText>
              <PawText variant="h3" color={Colors.accent} style={{ marginTop: 4, letterSpacing: 4 }}>PAWPASS</PawText>
              <PawText variant="micro" color="rgba(170,255,0,0.35)" style={{ letterSpacing: 2 }}>by PawPass</PawText>

              <View style={styles.certDivider}/>

              <PawText variant="caption" color={Colors.dim} style={{ marginBottom: 8 }}>This certifies that</PawText>
              <PawText variant="h2" color={Colors.accent} style={{ textAlign: "center" }}>{cert.recipientName}</PawText>
              {cert.businessName && (
                <PawText variant="body" color={Colors.muted} style={{ marginTop: 4, textAlign: "center" }}>{cert.businessName}</PawText>
              )}
              <PawText variant="caption" color={Colors.dim} style={{ marginTop: Spacing[4] }}>has successfully completed</PawText>
              <PawText variant="body" weight="bold" style={{ marginTop: 4, textAlign: "center" }}>{cert.courseName}</PawText>

              {cert.issuedAt && (
                <PawText variant="caption" color={Colors.dim} style={{ marginTop: Spacing[4] }}>
                  Issued {new Date(cert.issuedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </PawText>
              )}
            </Card>
          )}

          <Alert variant={isValid ? "success" : "danger"}>
            {isValid
              ? "This certificate is valid. It was issued by PawPass following completion of service animal access training."
              : cert?.isRevoked ? "This certificate has been revoked."
              : cert?.isExpired ? "This certificate has expired. Updated training may be required."
              : "Certificate not found. The link may be invalid or expired."}
          </Alert>

          <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", marginTop: Spacing[4], lineHeight: 16 }}>
            PawPass certificates confirm educational training completion. They are not government certifications.
            {"\n"}© {new Date().getFullYear()} Stodghill Consulting LLC
          </PawText>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing[5] },
  statusBanner: {
    borderRadius: Radius.xl, borderWidth: 1,
    padding: Spacing[4], marginBottom: Spacing[4], alignItems: "center",
  },
  certDivider: {
    width: 200, height: 1,
    backgroundColor: "rgba(170,255,0,0.2)",
    marginVertical: Spacing[5],
  },
});
