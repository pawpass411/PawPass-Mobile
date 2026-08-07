// app/(tabs)/learn.tsx
import { useEffect, useState } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Alert, PawText, Divider } from "../../src/components/ui";
import { MobileTopBar } from "../../src/components/ui/MobileTopBar";
import { JurisdictionRules } from "../../src/components/rights/jurisdiction-rules";
import { Colors, Spacing, Radius } from "../../src/lib/theme";
import { api, UserProfile } from "../../src/lib/api";
import { useAuth } from "@clerk/clerk-expo";

// Rights guidance must be selected by jurisdiction. The former general FAQ and
// scripts were U.S.-specific and could mislead Canadian and UK users.
const TABS = ["Your Rights"] as const;
type Tab = "FAQ" | "Scripts" | "Your Rights";

const FAQ = [
  { q: "What qualifies as a service animal?", a: "A dog individually trained to perform work or tasks related to a person's disability. The key word is trained — the dog must do a specific job. Emotional support animals and comfort dogs do not qualify under ADA Title III." },
  { q: "What are the only two questions a business can ask?", a: "1. \"Is this a service animal required because of a disability?\"\n2. \"What work or task has the dog been trained to perform?\"\n\nThat's it. No asking for papers, no asking about your diagnosis, no requiring the dog to demonstrate anything." },
  { q: "Can a business ask to see documentation?", a: "No. There is no official federal registry for service animals. Businesses cannot require ID cards, certification papers, vests, or any other documentation as a condition of entry." },
  { q: "Can a business charge a pet fee?", a: "No. No pet fee, no deposit, no cleaning surcharge. This applies to hotels, restaurants, retail — all public accommodations covered by the ADA." },
  { q: "What are valid grounds for asking my dog to leave?", a: "Only two situations: (1) the dog is out of control and you're not addressing it, or (2) the dog is not housebroken. Even then, the business must still offer to serve you without the animal." },
  { q: "Does my dog need a vest or ID tag?", a: "No. Vests, patches, ID cards, and registration tags are not legally required. A business cannot require them as a condition of entry." },
  { q: "Are emotional support animals covered?", a: "Not under ADA Title III (public accommodations). ESAs provide comfort through companionship but aren't task-trained. Some states have broader protections — check your state's laws." },
];

const SCRIPTS = [
  {
    scenario: "At a restaurant entrance",
    say: "\"My dog is a service animal. Table for two, please.\"",
    note: "That's all you're required to say. If they ask follow-up questions, you may answer the two permitted questions — or not.",
  },
  {
    scenario: "When asked for documentation",
    say: "\"The ADA doesn't require service animal documentation. I'm not required to provide papers.\"",
    note: "If they persist: \"I'm happy to answer the two questions the ADA allows. Beyond that, I'm not obligated to provide anything.\"",
  },
  {
    scenario: "When asked about your disability",
    say: "\"That's personal medical information I'm not required to share. My dog is trained to perform a task related to my disability.\"",
    note: "You don't owe them a diagnosis.",
  },
  {
    scenario: "When another customer complains",
    say: "Stay put. That's not your problem to manage.",
    note: "The business is responsible for handling other customers' reactions. If staff comes to you, calmly confirm your right to be there.",
  },
  {
    scenario: "When asked to leave",
    say: "\"I'd like to understand the specific reason. If there's a behavior issue with my dog, I'll address it. If this is about my service animal, I'd like to speak with a manager.\"",
    note: "Write down everything: date, time, what was said, who said it. It matters later.",
  },
];

const RIGHTS = [
  { icon: "✓", title: "Access to public accommodations", body: "Restaurants, hotels, retail stores, pharmacies, gyms, entertainment venues — any place open to the public must admit your service animal." },
  { icon: "✓", title: "No documentation required", body: "No ID card, certification, vet letter, registry, or vest is legally required. Requiring documentation is a violation." },
  { icon: "✓", title: "No extra fees", body: "A business cannot charge you more because you have a service animal. No pet fees, no deposits, no cleaning surcharges." },
  { icon: "✓", title: "No task demonstrations", body: "Your dog cannot be required to demonstrate its task as proof that it is a service animal." },
  { icon: "✓", title: "Equal service", body: "You must receive the same quality of service as any other customer. A business cannot isolate you, seat you in a less desirable area, or treat you differently." },
  { icon: "✓", title: "Removal only in narrow circumstances", body: "A dog can only be asked to leave if it is out of control and you're not addressing it, or if it is not housebroken. Not for other customers' allergies, fear, or discomfort." },
];

function FAQItem({ item }: { item: typeof FAQ[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqRow}>
        <PawText variant="body" weight="semibold" style={{ flex: 1, marginRight: Spacing[3] }}>{item.q}</PawText>
        <Text style={{ color: Colors.accent, fontSize: 18 }}>{open ? "−" : "+"}</Text>
      </View>
      {open && (
        <View style={styles.faqAnswer}>
          <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{item.a}</PawText>
        </View>
      )}
      <Divider/>
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Your Rights");
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setProfile(null); setProfileReady(true); return; }
    api.users.me().then(({user}) => setProfile(user)).catch(() => setProfile(null)).finally(() => setProfileReady(true));
  }, [isLoaded,isSignedIn]);

  useEffect(() => {
    if (params.tab === "rights") setActiveTab("Your Rights");
  }, [params.tab]);

  const hasFullRights = Boolean(profile && (
    profile.isHandler || ["HANDLER","TRAINER"].includes(profile.role)
  ));

  if (!profileReady) return <View style={{flex:1,backgroundColor:Colors.bg,alignItems:"center",justifyContent:"center"}}><PawText variant="body" color={Colors.muted}>Loading guidance…</PawText></View>;

  if (profileReady && !hasFullRights) return (
    <View style={{flex:1,backgroundColor:Colors.bg}}>
      <View style={[styles.header,{paddingTop:insets.top+8}]}><MobileTopBar active="rights"/><PawText variant="h2">Park & Dog Guidance</PawText><PawText variant="caption" color={Colors.dim}>Public information for everyday outings</PawText></View>
      <ScrollView contentContainerStyle={[styles.scroll,{paddingBottom:insets.bottom+80,gap:Spacing[3]}]}>
        <Alert variant="info" title="Rules depend on the location">Pet-dog access, leash requirements, and park rules can vary by property, city, county, and state. PawPass only presents a local rule when its source has been verified.</Alert>
        <Card><PawText variant="h3">Check the specific place</PawText><PawText variant="body" color={Colors.muted} style={{lineHeight:22,marginTop:Spacing[2]}}>Use a PawPass park or business profile for posted leash rules, dog-friendly access, amenities, hours, and community experiences. Always follow posted signs.</PawText></Card>
        {!isSignedIn ? (
          <Card style={styles.rightsAccessCard}>
            <PawText variant="h3">Unlock service-dog rights</PawText>
            <PawText variant="body" color={Colors.muted} style={{lineHeight:22,marginTop:Spacing[2]}}>
              Create a free account and choose Service Dog Handler, Service Dog Trainer, or both to access available federal, state, provincial, and local service-dog guidance.
            </PawText>
            <Alert variant="info" title="Why PawPass asks" style={{marginTop:Spacing[3]}}>
              Your account type keeps service-dog rights and handler-level review tools separate from general dog-owner features.
            </Alert>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")} style={[styles.communityButton,{marginTop:Spacing[3]}]}>
              <PawText variant="body" weight="bold" color={Colors.bg}>Create a free account</PawText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")} style={[styles.communityButton,styles.signInButton]}>
              <PawText variant="body" weight="bold" color={Colors.info}>Sign in</PawText>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card><PawText variant="h3">Service dogs are different</PawText><PawText variant="body" color={Colors.muted} style={{lineHeight:22,marginTop:Spacing[2]}}>Pet-dog permission does not determine service-dog access. The complete jurisdiction rights view is reserved for Service Dog Handler and Service Dog Trainer accounts.</PawText></Card>
        )}
        <TouchableOpacity onPress={() => router.push("/(tabs)/parks")} style={styles.communityButton}><PawText variant="body" weight="bold" color={Colors.bg}>Browse parks</PawText></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/discover")} style={[styles.communityButton,{backgroundColor:Colors.info}]}><PawText variant="body" weight="bold" color={Colors.bg}>Find dog-friendly places</PawText></TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <MobileTopBar active="rights" />
        <PawText variant="h2">Know Your Rights</PawText>
        <PawText variant="caption" color={Colors.dim} style={{ marginTop: 2 }}>
          Location-specific service animal education
        </PawText>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: activeTab === tab ? Colors.accent : Colors.muted }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}>

        <Alert variant="warn" title="Educational content only" style={{ marginBottom: Spacing[4] }}>
          This information is educational and general in nature. It is not legal advice. For a specific situation, consult the official source shown, the applicable human-rights authority, or a qualified lawyer in that jurisdiction.
        </Alert>

        {/* FAQ */}
        {activeTab === "FAQ" && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {FAQ.map((item, i) => <FAQItem key={i} item={item}/>)}
          </Card>
        )}

        {/* Scripts */}
        {activeTab === "Scripts" && (
          <View style={{ gap: Spacing[3] }}>
            {SCRIPTS.map((s, i) => (
              <Card key={i}>
                <PawText variant="label" color={Colors.dim} style={{ marginBottom: Spacing[2] }}>
                  {s.scenario.toUpperCase()}
                </PawText>
                <View style={styles.scriptQuote}>
                  <PawText variant="body" weight="semibold" color={Colors.accent} style={{ lineHeight: 22 }}>
                    {s.say}
                  </PawText>
                </View>
                <PawText variant="caption" color={Colors.muted} style={{ marginTop: Spacing[3], lineHeight: 19 }}>
                  {s.note}
                </PawText>
              </Card>
            ))}
          </View>
        )}

        {/* Your Rights */}
        {activeTab === "Your Rights" && (
          <View style={{ gap: Spacing[3] }}>
            <JurisdictionRules />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  communityButton:{minHeight:50,borderRadius:Radius.md,backgroundColor:Colors.accent,alignItems:"center",justifyContent:"center",paddingHorizontal:Spacing[4]},
  rightsAccessCard:{borderColor:Colors.info,borderWidth:1},
  signInButton:{marginTop:Spacing[2],backgroundColor:Colors.transparent,borderWidth:1,borderColor:Colors.info},
  header: {
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: Spacing[3], alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: Colors.transparent,
  },
  tabActive: { borderBottomColor: Colors.accent },
  scroll: { padding: Spacing[4] },
  faqRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[4],
  },
  faqAnswer: {
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[4],
    backgroundColor: Colors.surface2,
  },
  scriptQuote: {
    backgroundColor: Colors.accentDim, borderRadius: Radius.sm,
    padding: Spacing[3], borderLeftWidth: 3, borderLeftColor: Colors.accent,
  },
});
