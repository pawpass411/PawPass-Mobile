// app/(tabs)/index.tsx
// Discover screen — searchable business listings

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, FlatList, TextInput, TouchableOpacity, Text,
  StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, PawText, Skeleton, EmptyState } from "../../src/components/ui";
import { PawPassWordmark } from "../../src/components/ui/Logo";
import { api, BusinessListing } from "../../src/lib/api";
import { Colors, Spacing, Radius, Typography } from "../../src/lib/theme";

const BADGE_CONFIG: Record<string, { label: string; variant: "green"|"cyan"|"yellow"|"red"|"purple" }> = {
  PAWPASS_CERTIFIED:    { label: "Certified",    variant: "green" },
  SERVICE_DOG_FRIENDLY: { label: "Friendly",     variant: "cyan" },
  UNDER_REVIEW:         { label: "Under Review", variant: "yellow" },
  NON_COMPLIANT:        { label: "Issues",       variant: "red" },
  TRAINING_IN_PROGRESS: { label: "Training",     variant: "purple" },
};

const BADGE_FILTERS = [
  { key: "", label: "All" },
  { key: "PAWPASS_CERTIFIED",    label: "Certified" },
  { key: "SERVICE_DOG_FRIENDLY", label: "Friendly" },
];

function ListingCard({ item }: { item: BusinessListing }) {
  const scoreColor = item.trustScore == null ? Colors.dim
    : item.trustScore >= 80 ? Colors.accent
    : item.trustScore >= 50 ? Colors.warn
    : Colors.danger;

  return (
    <Card
      onPress={() => router.push(`/business/${item.id}`)}
      style={{ marginHorizontal: Spacing[4], marginBottom: Spacing[3] }}
      accent={item.trustScore != null && item.trustScore >= 80}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[2] }}>
        <View style={{ flex: 1, marginRight: Spacing[3] }}>
          <PawText variant="h3" numberOfLines={1}>{item.name}</PawText>
          <PawText variant="caption" color={Colors.dim} style={{ marginTop: 2 }}>
            {item.businessType.replace(/_/g, " ")} · {item.city}, {item.state}
          </PawText>
        </View>
        {item.trustScore != null && (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: scoreColor, lineHeight: 28 }}>
              {Math.round(item.trustScore)}
            </Text>
            <Text style={{ fontSize: 9, color: Colors.ghost }}>TRUST</Text>
          </View>
        )}
      </View>

      {item.badges.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: Spacing[2] }}>
          {item.badges.slice(0, 3).map(b => {
            const cfg = BADGE_CONFIG[b];
            return cfg ? <Badge key={b} variant={cfg.variant}>{cfg.label}</Badge> : null;
          })}
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {item.avgRating != null ? (
            <>
              <Text style={{ color: "#FCD34D", fontSize: 14 }}>★</Text>
              <Text style={{ color: Colors.text, fontWeight: "700", fontSize: 13 }}>{item.avgRating.toFixed(1)}</Text>
              <Text style={{ color: Colors.dim, fontSize: 12 }}>({item.reviewCount})</Text>
            </>
          ) : (
            <Text style={{ color: Colors.ghost, fontSize: 12 }}>No reviews yet</Text>
          )}
        </View>
        {item.avgAccessRating != null && (
          <Text style={{ color: Colors.info, fontSize: 12 }}>{item.avgAccessRating.toFixed(1)}</Text>
        )}
      </View>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <View style={[styles.skeletonCard]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton height={16} style={{ width: "60%" }}/>
          <Skeleton height={12} style={{ width: "40%" }}/>
        </View>
        <Skeleton width={44} height={44} style={{ borderRadius: 8 }}/>
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
        <Skeleton width={70} height={20} style={{ borderRadius: 10 }}/>
        <Skeleton width={60} height={20} style={{ borderRadius: 10 }}/>
      </View>
      <Skeleton height={12} style={{ width: "50%" }}/>
    </View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [dQ, setDQ] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("");
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDQ(q); setPage(1); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const load = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else if (pageNum === 1) { setLoading(true); } else { setLoadingMore(true); }
    try {
      const data = await api.businesses.list({ q: dQ, badge: badgeFilter, page: pageNum, limit: 20 });
      if (pageNum === 1) {
        setListings(data.results);
      } else {
        setListings(prev => [...prev, ...data.results]);
      }
      setTotal(data.total);
      setHasMore(pageNum < data.pages);
    } catch { /* keep existing data */ }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [dQ, badgeFilter]);

  useEffect(() => { load(1); }, [load]);

  const onEndReached = () => {
    if (hasMore && !loadingMore) {
      const next = page + 1;
      setPage(next);
      load(next);
    }
  };

  const onRefresh = () => load(1, true);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PawPassWordmark height={24}/>
        <TouchableOpacity onPress={() => router.push("/notifications")} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={{ fontSize: 22 }}></Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}></Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Business name or city…"
            placeholderTextColor={Colors.dim}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Badge filters */}
      <View style={styles.filterRow}>
        {BADGE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => { setBadgeFilter(f.key); setPage(1); }}
            style={[styles.filterChip, badgeFilter === f.key && styles.filterChipActive]}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: badgeFilter === f.key ? Colors.accent : Colors.muted }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={{ marginLeft: "auto", fontSize: 12, color: Colors.dim, alignSelf: "center" }}>
          {loading ? "…" : `${total.toLocaleString()} found`}
        </Text>
      </View>

      {/* Listings */}
      {loading ? (
        <FlatList
          data={Array.from({ length: 8 })}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => <SkeletonCard/>}
          contentContainerStyle={{ paddingTop: Spacing[3] }}
          scrollEnabled={false}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon=""
          title="No listings found"
          body="Try adjusting your search or filters."
          action={
            <TouchableOpacity onPress={() => { setQ(""); setBadgeFilter(""); }}>
              <Text style={{ color: Colors.accent, fontWeight: "700" }}>Clear filters</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ListingCard item={item}/>}
          contentContainerStyle={{ paddingTop: Spacing[3], paddingBottom: insets.bottom + 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent}/>}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? (
            <View style={{ padding: Spacing[4], alignItems: "center" }}>
              <ActivityIndicator color={Colors.accent}/>
            </View>
          ) : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2] + 2,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.base,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  filterChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
