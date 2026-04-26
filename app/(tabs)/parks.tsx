// app/(tabs)/parks.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View, FlatList, TextInput, TouchableOpacity, Text,
  StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, PawText, Skeleton, EmptyState } from "../../src/components/ui";
import { api, ParkListing } from "../../src/lib/api";
import { Colors, Spacing, Radius, Typography } from "../../src/lib/theme";

const PARK_TYPES = [
  { key: "",             label: "All" },
  { key: "DOG_PARK",     label: "Dog Parks" },
  { key: "NATIONAL_PARK",label: "National" },
  { key: "STATE_PARK",   label: "State" },
  { key: "CITY_PARK",    label: "City" },
  { key: "TRAIL",        label: "Trail" },
];

const AMENITY_ICONS: Record<string, string> = {
  water: "", paved_paths: "", shade: "", restrooms: "",
  accessible: "", fenced: "", off_leash: "", small_dog_area: "",
  agility: "", lights: "", bag_dispensers: "", parking: "",
};

function ParkCard({ park }: { park: ParkListing }) {
  return (
    <Card
      onPress={() => router.push(`/park/${park.id}`)}
      style={{ marginHorizontal: Spacing[4], marginBottom: Spacing[3] }}
      accent={park.isVerified}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[2] }}>
        <View style={{ flex: 1, marginRight: Spacing[3] }}>
          <PawText variant="h3" numberOfLines={1}>{park.name}</PawText>
          <PawText variant="caption" color={Colors.dim} style={{ marginTop: 2 }}>
            {park.parkType.replace(/_/g, " ")} · {park.city}, {park.state}
          </PawText>
        </View>
        {park.isVerified && (
          <PawText variant="label" color={Colors.accent}>✓ Verified</PawText>
        )}
      </View>

      {/* Amenity icons */}
      {park.amenities.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: Spacing[2], flexWrap: "wrap" }}>
          {park.amenities.slice(0, 6).map(a => (
            <Text key={a} style={{ fontSize: 16 }} title={a.replace(/_/g, " ")}>
              {AMENITY_ICONS[a] ?? "•"}
            </Text>
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {park.avgRating != null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: "#FCD34D" }}>★</Text>
            <PawText variant="caption" weight="bold">{park.avgRating.toFixed(1)}</PawText>
            <PawText variant="caption" color={Colors.dim}>({park.reviewCount})</PawText>
          </View>
        ) : (
          <PawText variant="caption" color={Colors.ghost}>No reviews yet</PawText>
        )}
      </View>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton height={16} style={{ width: "55%", marginBottom: 8 }}/>
      <Skeleton height={12} style={{ width: "40%", marginBottom: 16 }}/>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
        {[0,1,2,3].map(i => <Skeleton key={i} width={28} height={28} style={{ borderRadius: 14 }}/>)}
      </View>
      <Skeleton height={12} style={{ width: "30%" }}/>
    </View>
  );
}

export default function ParksScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [parks, setParks] = useState<ParkListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await api.parks.list({ q: q || undefined, type: typeFilter || undefined });
      setParks(data.results); setTotal(data.total);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [q, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PawText variant="h2">Parks & Dog Parks</PawText>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}></Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Park name or city…"
            placeholderTextColor={Colors.dim}
            style={{ flex: 1, color: Colors.text, fontSize: Typography.base }}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Type filter chips */}
      <View style={styles.chipRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PARK_TYPES}
          keyExtractor={i => i.key}
          contentContainerStyle={{ paddingHorizontal: Spacing[4], gap: Spacing[2] }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setTypeFilter(item.key)}
              style={[styles.chip, typeFilter === item.key && styles.chipActive]}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: typeFilter === item.key ? Colors.accent : Colors.muted }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Count */}
      <PawText variant="caption" color={Colors.dim} style={{ paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] }}>
        {loading ? "Searching…" : `${total.toLocaleString()} parks found`}
      </PawText>

      {/* List */}
      {loading ? (
        <FlatList data={Array.from({length: 6})} keyExtractor={(_, i) => String(i)}
          renderItem={() => <SkeletonCard/>} scrollEnabled={false}/>
      ) : parks.length === 0 ? (
        <EmptyState icon="" title="No parks found" body="Try adjusting your search or filter."/>
      ) : (
        <FlatList
          data={parks}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <ParkCard park={item}/>}
          contentContainerStyle={{ paddingTop: Spacing[2], paddingBottom: insets.bottom + 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent}/>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchContainer: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] + 2,
  },
  chipRow: { backgroundColor: Colors.surface, paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.border },
  chip: {
    paddingHorizontal: Spacing[3], paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border2,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  skeletonCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing[4], marginHorizontal: Spacing[4], marginBottom: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
});
