// app/(tabs)/profile.tsx
// Profile tab — user info, settings, legal links, sign out

import { useState, useEffect } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, Button, PawText, Divider } from "../../src/components/ui";
import { PawPassMark } from "../../src/components/ui/Logo";
import { api, UserProfile } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

function MenuRow({
  icon, label, onPress, value, destructive,
}: { icon: string; label: string; onPress: () => void; value?: string; destructive?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow} activeOpacity={0.6}>
      <Text style={{ fontSize: 18, marginRight: Spacing[3] }}>{icon}</Text>
      <PawText variant="body" color={destructive ? Colors.danger : Colors.text} style={{ flex: 1 }}>
        {label}
      </PawText>
      {value && <PawText variant="caption" color={Colors.muted}>{value}</PawText>}
      {!destructive && <Text style={{ color: Colors.dim, fontSize: 16 }}>›</Text>}
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <PawText
      variant="label"
      color={Colors.dim}
      style={{ paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[2] }}
    >
      {label}
    </PawText>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.users.me()
      .then(d => setProfile(d.user))
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of PawPass?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]
    );
  };

  const displayName = profile?.name ?? clerkUser?.firstName ?? "Your Account";
  const email = profile?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatar}>
          <PawPassMark size={40}/>
        </View>
        <View style={{ flex: 1 }}>
          <PawText variant="h3">{displayName}</PawText>
          <PawText variant="caption" color={Colors.dim}>{email}</PawText>
          <View style={{ flexDirection: "row", gap: Spacing[2], marginTop: Spacing[2] }}>
            {profile?.isHandler && <Badge variant="green">Handler</Badge>}
            {profile?.role === "ADMIN" && <Badge variant="red">Admin</Badge>}
            {profile?.role === "BUSINESS" && <Badge variant="purple">Business</Badge>}
          </View>
        </View>
      </View>

      {/* Stats */}
      {profile && (
        <View style={styles.statsRow}>
          {[
            { value: profile.stats.reviews, label: "Reviews" },
            { value: profile.stats.complaints, label: "Reports" },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <PawText variant="h2" color={Colors.accent}>{s.value}</PawText>
              <PawText variant="caption" color={Colors.dim}>{s.label}</PawText>
            </View>
          ))}
          {profile.businesses.length > 0 && (
            <View style={styles.statBox}>
              <PawText variant="h2" color={Colors.info}>{profile.businesses.length}</PawText>
              <PawText variant="caption" color={Colors.dim}>Business{profile.businesses.length !== 1 ? "es" : ""}</PawText>
            </View>
          )}
        </View>
      )}

      {/* Account */}
      <SectionHeader label="ACCOUNT"/>
      <View style={styles.menuSection}>
        <MenuRow icon="" label="My Reviews" onPress={() => router.push("/reviews/mine")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="My Reports" onPress={() => router.push("/reports/mine")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Incident Log" onPress={() => router.push("/incident-log")}/>
        {profile?.businesses.length ? (
          <>
            <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
            <MenuRow icon="" label="Business Dashboard" onPress={() => router.push("/business/dashboard")}/>
          </>
        ) : null}
      </View>

      {/* Settings */}
      <SectionHeader label="SETTINGS"/>
      <View style={styles.menuSection}>
        <MenuRow icon="" label="Notifications" onPress={() => router.push("/settings/notifications")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Location" onPress={() => router.push("/settings/location")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow
          icon=""
          label="Handler Status"
          onPress={() => router.push("/settings/handler")}
          value={profile?.isHandler ? "Handler" : "Community"}
        />
      </View>

      {/* Legal */}
      <SectionHeader label="LEGAL"/>
      <View style={styles.menuSection}>
        <MenuRow icon="" label="Privacy Policy" onPress={() => router.push("/legal/privacy")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Terms of Service" onPress={() => router.push("/legal/terms")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Platform Disclaimer" onPress={() => router.push("/legal/disclaimer")}/>
      </View>

      {/* Support */}
      <SectionHeader label="SUPPORT"/>
      <View style={styles.menuSection}>
        <MenuRow icon="" label="Send Feedback" onPress={() => router.push("/feedback")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Help & FAQ" onPress={() => router.push("/(tabs)/learn")}/>
      </View>

      {/* Sign out */}
      <SectionHeader label="ACCOUNT"/>
      <View style={styles.menuSection}>
        <MenuRow icon="" label="Sign Out" onPress={handleSignOut} destructive/>
      </View>

      {/* App info */}
      <View style={{ alignItems: "center", padding: Spacing[6] }}>
        <PawPassMark size={24}/>
        <PawText variant="micro" color={Colors.ghost} style={{ marginTop: 8, textAlign: "center" }}>
          PawPass 1.0.0 by Apawcalypse LLC{"\n"}
          Reviews are community experiences, not legal findings.
        </PawText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accentDim,
    borderWidth: 2, borderColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statBox: {
    flex: 1, alignItems: "center",
    paddingVertical: Spacing[4],
    borderRightWidth: 1, borderRightColor: Colors.border,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    marginBottom: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
    minHeight: 52,
  },
});
