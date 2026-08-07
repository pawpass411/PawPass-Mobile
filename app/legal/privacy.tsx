// app/legal/privacy.tsx
// Privacy Policy — required for App Store + Play Store submission

import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PawText } from "../../src/components/ui";
import { Colors, Spacing } from "../../src/lib/theme";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `When you use PawPass, we collect:

Account information: Your name, email address, and profile information provided through our authentication provider (Clerk).

Location data: With your permission, approximate location to show nearby businesses and parks. We do not store precise location history.

User-generated content: Reviews, access concern reports, incident log entries, and ratings you create.

Usage data: App opens, sign-in success or failure, searches and result counts, listing views, review-flow progress, notification interactions, and features used. PawPass does not put review text, report text, medical details, uploaded files, or precise location history into analytics events.

Device and diagnostics information: Device type, operating system version, app version, response times, privacy-limited error codes, crash traces, and technical breadcrumbs for compatibility, reliability, and support. Android crash diagnostics may be processed by Firebase Crashlytics.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use collected information to:

• Operate and improve the PawPass platform
• Show you relevant businesses, parks, and reviews near you
• Process and display your reviews and reports
• Send notifications about reports you've filed or businesses you follow
• Ensure platform safety and enforce our community guidelines
• Comply with legal obligations

We do not sell your personal information to third parties. We do not use your data for targeted advertising.`,
  },
  {
    title: "3. Reviews and Reports",
    body: `Reviews and access concern reports you submit are community-contributed content. Public reviews may be visible to other users. Private incident log entries are visible only to you.

Access concern reports are reviewed by PawPass staff before any action is taken. The business subject of a report is notified; your personal identity is not disclosed to them without your consent.

Content you submit may be moderated for compliance with our community guidelines. Content containing legal conclusions, medical disclosures, or personal information about third parties will be flagged.`,
  },
  {
    title: "4. Data Sharing",
    body: `We share data with:

Service providers: Clerk (authentication), Stripe (payments), AWS (storage), Resend (email). These providers process data on our behalf under data processing agreements.

Diagnostics providers: Firebase Crashlytics may process mobile crash and reliability information so PawPass can identify startup failures, crashes, and affected app versions.

Business users: When you submit an access concern report about a business, that business receives a notification and a summary of the concern. Your contact information is not shared unless you choose the "email" contact preference.

Legal requirements: We may disclose information when required by law or to protect the rights and safety of our users.`,
  },
  {
    title: "5. Data Retention",
    body: `Account data is retained while your account is active. You may request deletion of your account and associated data at any time by contacting PawPass support.

Reviews and reports that are part of an active investigation or dispute resolution process may be retained for up to 24 months after resolution.

Raw product analytics and diagnostics are retained only as long as reasonably needed for trend analysis, troubleshooting, security, and improvement. Aggregated, de-identified statistics may be retained longer.`,
  },
  {
    title: "6. Your Rights",
    body: `You have the right to:

• Access the personal information we hold about you
• Correct inaccurate information
• Request deletion of your account and associated data
• Export your data in a portable format
• Opt out of non-essential communications

To exercise these rights, contact PawPass support.`,
  },
  {
    title: "7. Children's Privacy",
    body: `PawPass accounts are for people age 14 or older. PawPass does not knowingly create accounts for children under 14. If PawPass learns that a younger child submitted personal information, a parent or guardian may use the contact form to request review and deletion.`,
  },
  {
    title: "8. Security",
    body: `We implement industry-standard security measures including encryption in transit (TLS), encrypted storage of sensitive data, and access controls. No system is completely secure. If you discover a security vulnerability, please contact PawPass support.`,
  },
  {
    title: "9. Contact",
    body: `For privacy questions or requests, use Contact Us in the PawPass app. Choose “Privacy - Request” so your message is routed correctly.\n\nPawPass is operated by Stodghill Consulting LLC.\n\nThis policy is effective as of August 4, 2026.`,
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
    >
      <PawText variant="h1" style={{ marginBottom: 4 }}>Privacy Policy</PawText>
      <PawText variant="caption" color={Colors.dim} style={{ marginBottom: Spacing[6] }}>
        Stodghill Consulting LLC - Effective August 4, 2026
      </PawText>

      <PawText variant="body" color={Colors.muted} style={{ marginBottom: Spacing[6], lineHeight: 22 }}>
        PawPass helps people find welcoming places, share real experiences, and explore with confidence. This Privacy Policy explains how Stodghill Consulting LLC collects, uses, and protects your information when you use the PawPass app and website.
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
