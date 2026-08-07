// app/legal/terms.tsx
// Terms of Service — required for App Store + Play Store submission

import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PawText } from "../../src/components/ui";
import { Colors, Spacing } from "../../src/lib/theme";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By downloading, installing, or using PawPass, you agree to these Terms of Service. If you do not agree, do not use PawPass. These terms constitute a binding agreement between you and Stodghill Consulting LLC.`,
  },
  {
    title: "2. Service Description",
    body: `PawPass is a community platform that helps service dog handlers find welcoming businesses and parks, rate their access experiences, and report access concerns. PawPass also provides ADA compliance training content for businesses.

PawPass is not a legal service. Content on PawPass is educational and community-generated. Nothing on PawPass constitutes legal advice or creates an attorney-client relationship.`,
  },
  {
    title: "3. User Accounts",
    body: `You must create an account to access most features. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must be at least 14 years old to create an account.

You agree to provide accurate information and to update it as needed. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "4. Community Content Guidelines",
    body: `When submitting reviews, reports, or other content, you agree that:

• Your content is truthful and based on your genuine experience
• You will not include legal conclusions (e.g., "violated the ADA"), medical disclosures, or personal information about individuals beyond what is relevant to the access concern
• You will not submit false or misleading reports
• You will not use PawPass to harass, defame, or target individuals or businesses maliciously
• You will not submit content that violates applicable laws

Submitting knowingly false reports may result in account termination and may expose you to liability.`,
  },
  {
    title: "5. Disclaimer of Warranties",
    body: `PAWPASS IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. STODGHILL CONSULTING LLC DOES NOT WARRANT THAT:

• Reviews or reports accurately reflect legal compliance or non-compliance
• Business or park information is current or accurate
• Training content guarantees regulatory compliance
• The platform will be uninterrupted or error-free

USER-GENERATED CONTENT ON PAWPASS REFLECTS INDIVIDUAL COMMUNITY EXPERIENCES, NOT LEGAL DETERMINATIONS.`,
  },
  {
    title: "6. Limitation of Liability",
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, STODGHILL CONSULTING LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF PAWPASS, INCLUDING BUT NOT LIMITED TO:

• Reliance on reviews or ratings
• Business compliance with or violation of applicable law
• Outcomes of access concern reports
• Loss of data

OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, OR $100, WHICHEVER IS GREATER.`,
  },
  {
    title: "7. Business Training Content",
    body: `Training content provided through PawPass Business plans is educational in nature. Completion of training does not guarantee regulatory compliance, legal protection, or immunity from government enforcement actions. Businesses remain fully responsible for compliance with all applicable federal, state, and local law.

PawPass Certified badges and certificates reflect completion of educational content, not government-issued certifications.`,
  },
  {
    title: "8. Termination",
    body: `We may suspend or terminate your access to PawPass at any time for violations of these terms, without prior notice. You may delete your account at any time through the app settings or by contacting PawPass support.`,
  },
  {
    title: "9. Governing Law",
    body: `These terms are governed by the laws of the State of Colorado, United States, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in Denver, Colorado.`,
  },
  {
    title: "10. Changes to Terms",
    body: `We may update these terms from time to time. We will notify you of material changes through the app or by email. Continued use of PawPass after changes take effect constitutes acceptance of the updated terms.`,
  },
  {
    title: "11. Contact",
    body: `Questions about these terms can be sent through Contact Us in the PawPass app.\n\nPawPass is operated by Stodghill Consulting LLC.\n\nEffective: June 15, 2026`,
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
    >
      <PawText variant="h1" style={{ marginBottom: 4 }}>Terms of Service</PawText>
      <PawText variant="caption" color={Colors.dim} style={{ marginBottom: Spacing[6] }}>
        Stodghill Consulting LLC · Effective January 1, 2025
      </PawText>

      {SECTIONS.map((section, i) => (
        <View key={i} style={styles.section}>
          <PawText variant="h3" style={{ marginBottom: Spacing[3] }}>{section.title}</PawText>
          <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{section.body}</PawText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing[5] },
  section: {
    marginBottom: Spacing[6],
    paddingBottom: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
