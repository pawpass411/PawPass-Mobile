// app/legal/disclaimer.tsx
import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PawText, Alert } from "../../src/components/ui";
import { Colors, Spacing } from "../../src/lib/theme";

export default function DisclaimerScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <PawText variant="h1" style={{ marginBottom: 4 }}>Platform Disclaimer</PawText>
      <PawText variant="caption" color={Colors.dim} style={{ marginBottom: Spacing[5] }}>Stodghill Consulting LLC</PawText>

      <Alert variant="warn" style={{ marginBottom: Spacing[5] }}>
        Please read this disclaimer before using PawPass. By using the app, you acknowledge and agree to the following.
      </Alert>

      {[
        {
          title: "Reviews and Reports Are Community Experiences",
          body: "All reviews, ratings, and access concern reports on PawPass are user-generated content submitted by community members. They reflect individual experiences and opinions. They are not official ADA determinations, legal findings, government enforcement actions, or legal advice of any kind.",
        },
        {
          title: "Trust Scores Are Informational Only",
          body: "PawPass trust scores are calculated based on community reviews, complaint history, and training completion. They do not reflect legal compliance or non-compliance with any law. A high trust score does not guarantee a positive experience, and a low trust score does not mean a business has violated any law.",
        },
        {
          title: "Training Content Is Educational",
          body: "Business training content provided through PawPass is educational in nature. It is designed to help staff understand federal service animal requirements under the ADA. Completing PawPass training does not guarantee regulatory compliance, provide legal protection from enforcement actions, or constitute legal advice. Businesses remain fully responsible for compliance with all applicable federal, state, and local law.",
        },
        {
          title: "PawPass Certified Badges",
          body: "PawPass Certified badges and certificates reflect completion of educational training content. They are not government certifications, legal endorsements, or guarantees of compliance. Badges may be revoked if a business accumulates unresolved complaints.",
        },
        {
          title: "No Attorney-Client Relationship",
          body: "Nothing on PawPass — including the Learn section, ADA rights information, or staff scripts — constitutes legal advice or creates an attorney-client relationship. If you have specific legal questions about your rights or obligations, consult a qualified attorney.",
        },
        {
          title: "Accuracy of Information",
          body: "PawPass does not verify the accuracy of user-submitted content. Business hours, contact information, and locations may be out of date. Laws vary by state and locality and change over time. PawPass makes no warranties that information on the platform is current, complete, or accurate.",
        },
        {
          title: "Limitation of Liability",
          body: "Stodghill Consulting LLC is not liable for any harm, damages, or losses arising from your use of PawPass, reliance on information or reviews on the platform, or outcomes of access concern reports. See our Terms of Service for the full limitation of liability.",
        },
        {
          title: "Contact",
          body: "Questions about this disclaimer can be sent through Contact Us in the PawPass app.\n\nPawPass is operated by Stodghill Consulting LLC.\n© " + new Date().getFullYear() + " All rights reserved.",
        },
      ].map((s, i) => (
        <View key={i} style={styles.section}>
          <PawText variant="h3" style={{ marginBottom: Spacing[3] }}>{s.title}</PawText>
          <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{s.body}</PawText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing[5] },
  section: { marginBottom: Spacing[6], paddingBottom: Spacing[6], borderBottomWidth: 1, borderBottomColor: Colors.border },
});
