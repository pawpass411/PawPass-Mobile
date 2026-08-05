import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, PawText } from "../../src/components/ui";
import { MobileTopBar } from "../../src/components/ui/MobileTopBar";
import { Colors, Radius, Spacing, Typography } from "../../src/lib/theme";

const WEB_HOME = "https://pawpass411.com";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  function runSearch() {
    const query = search.trim();
    router.push(query ? ({ pathname: "/(tabs)", params: { query } } as any) : "/(tabs)");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 92 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing[3] }]}>
        <MobileTopBar active="home" />
      </View>

      <View style={styles.hero}>
        <PawText variant="label" color={Colors.info}>PAWPASS MOBILE</PawText>
        <PawText variant="h1" style={{ marginTop: Spacing[2] }}>
          Find welcoming places. Share real experiences.
        </PawText>
        <PawText variant="body" color={Colors.muted} style={{ marginTop: Spacing[3], lineHeight: 23 }}>
          Search nearby businesses, parks, and community-reviewed places for service dog access and dog-friendly visits.
        </PawText>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.info} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={runSearch}
            placeholder="Where would you like to go with your dog?"
            placeholderTextColor={Colors.muted}
            returnKeyType="search"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button onPress={runSearch} style={{ flex: 1 }}>Explore</Button>
          <Button variant="secondary" onPress={() => router.push("/(tabs)/parks")} style={{ flex: 1 }}>Parks</Button>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickCard
          icon="search"
          title="Discover"
          body="Find nearby businesses and places using the same PawPass search as the web app."
          onPress={() => router.push("/(tabs)")}
        />
        <QuickCard
          icon="paw"
          title="Parks"
          body="Browse nearby parks, dog parks, trails, and public park notes."
          onPress={() => router.push("/(tabs)/parks")}
        />
        <QuickCard
          icon="alert-circle"
          title="Access Report"
          body="Submit a separate access concern report when something needs review."
          onPress={() => router.push("/complaint/new")}
        />
        <QuickCard
          icon="person-circle"
          title="Profile"
          body="Your reviews, reports, training notices, settings, and educational resources."
          onPress={() => router.push("/(tabs)/profile")}
        />
      </View>

      <Card style={styles.desktopCard}>
        <PawText variant="label" color={Colors.info}>BUSINESS TOOLS</PawText>
        <PawText variant="h3" style={{ marginTop: Spacing[2] }}>Business management stays on desktop.</PawText>
        <PawText variant="body" color={Colors.muted} style={{ marginTop: Spacing[2], lineHeight: 22 }}>
          Claims, billing, staff training, verification, and business settings are handled from the PawPass web portal.
        </PawText>
        <TouchableOpacity onPress={() => Linking.openURL(`${WEB_HOME}/business/dashboard`)} style={styles.webLink}>
          <Text style={styles.webLinkText}>Open web portal</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

function QuickCard({
  icon,
  title,
  body,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.quickCard}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={20} color={Colors.info} />
      </View>
      <PawText variant="body" weight="bold" style={{ marginTop: Spacing[3] }}>{title}</PawText>
      <PawText variant="caption" color={Colors.muted} style={{ marginTop: Spacing[1], lineHeight: 18 }}>{body}</PawText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  hero: {
    padding: Spacing[5],
    gap: Spacing[1],
  },
  searchBox: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    marginTop: Spacing[5],
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: Typography.family,
    fontSize: Typography.base,
    opacity: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  quickGrid: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  quickCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing[4],
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.infoDim,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
  },
  desktopCard: {
    margin: Spacing[4],
    borderColor: Colors.infoBorder,
  },
  webLink: {
    marginTop: Spacing[4],
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.info,
  },
  webLinkText: {
    color: Colors.white,
    fontWeight: "900",
    fontFamily: Typography.family,
  },
});
