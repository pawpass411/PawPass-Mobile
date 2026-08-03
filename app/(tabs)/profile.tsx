// app/(tabs)/profile.tsx
// Profile tab — user info, settings, legal links, sign out

import { useState, useEffect } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, Linking, Image,
} from "react-native";
import { router } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Button, PawText, Divider } from "../../src/components/ui";
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
  const { signOut, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setProfile(null);
      return;
    }
    api.users.me()
      .then(d => setProfile(d.user))
      .catch(() => {});
  }, [isLoaded, isSignedIn]);

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

  const displayName =
    clerkUser?.fullName ??
    clerkUser?.firstName ??
    profile?.name ??
    "Your Account";
  const email = profile?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? "";

  if (isLoaded && !isSignedIn) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={{ flex: 1 }}>
            <PawText variant="h2">Sign in to PawPass</PawText>
            <PawText variant="body" color={Colors.muted} style={{ marginTop: Spacing[2], lineHeight: 22 }}>
              Your profile keeps reviews, reports, training notices, and PawPass learning resources in one place.
            </PawText>
          </View>
        </View>
        <View style={{ padding: Spacing[4], gap: Spacing[3] }}>
          <Button onPress={() => router.push("/(auth)/sign-in")} fullWidth>
            Sign in
          </Button>
          <Button onPress={() => router.push("/(auth)/sign-up")} variant="secondary" fullWidth>
            Create account
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatar}>
          {clerkUser?.imageUrl ? (
            <Image
              source={{ uri: clerkUser.imageUrl }}
              style={styles.avatarImage}
              accessibilityLabel={`${displayName}'s profile picture`}
            />
          ) : (
            <PawPassMark size={40}/>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <PawText variant="h3">{displayName}</PawText>
          <PawText variant="caption" color={Colors.dim}>{email}</PawText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing[2], marginTop: Spacing[2] }}>
            {profile?.isHandler && <Badge variant="green">Handler</Badge>}
            {profile?.role === "TRAINER" && <Badge variant="purple">Trainer</Badge>}
            {profile?.role === "PUBLIC" && <Badge variant="cyan">Dog Owner</Badge>}
            {profile?.role === "ADMIN" && <Badge variant="red">Admin</Badge>}
            {profile?.foundingMemberNumber && (
              <Badge variant="yellow">Founding Member #{profile.foundingMemberNumber}</Badge>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      {profile && (
        <View style={styles.statsRow}>
          {[
            { value: profile.stats.reviews, label: "Reviews" },
            { value: profile.stats.complaints, label: "Reports" },
            { value: profile.stats.incidentLogs, label: "Log Entries" },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <PawText variant="h2" color={Colors.accent}>{s.value}</PawText>
              <PawText variant="caption" color={Colors.dim}>{s.label}</PawText>
            </View>
          ))}
        </View>
      )}

      {profile?.businesses.length ? (
        <>
          <SectionHeader label="BUSINESS"/>
          <View style={styles.desktopNotice}>
            <PawText variant="body" weight="bold">Business tools are on desktop</PawText>
            <PawText variant="caption" color={Colors.muted} style={{ marginTop: 6, lineHeight: 18 }}>
              Claims, billing, staff training, verification, and business settings are managed from the PawPass web portal.
            </PawText>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://pawpass411.com/business/dashboard")}
              style={styles.desktopButton}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#0D1F0D", fontWeight: "900" }}>Open business portal</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {/* Account */}
      <SectionHeader label="ACCOUNT"/>
      <View style={styles.menuSection}>
        <MenuRow icon="" label="My Reviews" onPress={() => router.push("/reviews/mine")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="My Reports" onPress={() => router.push("/reports/mine")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Incident Log" onPress={() => router.push("/incident-log")}/>
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
        <MenuRow icon="" label="PawPass Learning" onPress={() => router.push("/(tabs)/learn")}/>
        <Divider style={{ marginLeft: Spacing[4] + 30 }}/>
        <MenuRow icon="" label="Contact Us" onPress={() => router.push("/feedback")}/>
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
        <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center" }}>
          PawPass 1.0.0 by Stodghill Consulting LLC{"\n"}
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
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
  desktopNotice: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface,
  },
  desktopButton: {
    marginTop: Spacing[3],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
  },
});
