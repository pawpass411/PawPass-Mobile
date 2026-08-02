import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, Badge, Button, Card, EmptyState, PawText, Skeleton } from "../../src/components/ui";
import { MobileTopBar } from "../../src/components/ui/MobileTopBar";
import { api, ParkListing } from "../../src/lib/api";
import { Colors, Radius, Spacing, Typography } from "../../src/lib/theme";

const PARK_TYPES = [
  { key: "", label: "All" },
  { key: "DOG_PARK", label: "Dog Parks" },
  { key: "NATIONAL_PARK", label: "National" },
  { key: "STATE_PARK", label: "State" },
  { key: "CITY_PARK", label: "City" },
  { key: "TRAIL", label: "Trail" },
];

const RADIUS_OPTIONS = [
  { label: "25 mi", meters: 40234 },
  { label: "50 mi", meters: 80467 },
  { label: "100 mi", meters: 160934 },
  { label: "250 mi", meters: 402336 },
];

function formatDistance(park: ParkListing) {
  if (park.drivingDurationText && park.drivingDistanceMiles != null) {
    return `${park.drivingDurationText} drive - ${park.drivingDistanceMiles.toFixed(1)} mi`;
  }
  if (park.distanceMiles != null) return `${park.distanceMiles.toFixed(1)} mi away`;
  return null;
}

function directionsUrl(park: ParkListing) {
  if (park.googleMapsUri) return park.googleMapsUri;
  const query = encodeURIComponent(park.formattedAddress || `${park.name} ${park.city} ${park.state}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function parkStatus(park: ParkListing) {
  if (park.reviewCount > 0) return { label: "PawPass Reviewed", variant: "green" as const };
  if (park.isVerified) return { label: "PawPass park", variant: "green" as const };
  if (park.source === "google_only") return { label: "Google listing", variant: "gray" as const };
  return { label: "Community listing", variant: "yellow" as const };
}

function ParkCard({ park }: { park: ParkListing }) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const status = parkStatus(park);
  const distance = formatDistance(park);
  const address = park.formattedAddress || `${park.city}, ${park.state}`;

  const openPark = async (writeReview = false) => {
    setOpening(true);
    setOpenError("");
    try {
      let parkId = park.source === "google_only" ? null : park.id;
      if (!parkId) {
        const record = await api.parks.promote({
          name: park.name,
          formattedAddress: park.formattedAddress || `${park.name}, ${park.city}, ${park.state}`,
          city: park.city,
          state: park.state,
          lat: park.lat,
          lng: park.lng,
          parkType: park.parkType,
        });
        parkId = record.parkId;
      }
      router.push({
        pathname: "/park/[id]",
        params: { id: parkId, ...(writeReview ? { tab: "write" } : {}) },
      });
    } catch (caught) {
      setOpenError(caught instanceof Error ? caught.message : "Could not open this park in PawPass.");
    } finally {
      setOpening(false);
    }
  };

  if (park.reviewCount <= 0) {
    return (
      <Card style={styles.compactCard} onPress={() => openPark(false)}>
        <View style={styles.cardTop}>
          <Badge variant={status.variant}>{status.label}</Badge>
          {distance && <PawText variant="caption" color={Colors.text} weight="bold">{distance}</PawText>}
        </View>
        <PawText variant="body" weight="bold">{park.name}</PawText>
        <PawText variant="caption" color={Colors.muted} style={{ marginTop: 3 }}>
          {address}
        </PawText>
        {park.googleRating != null && (
          <PawText variant="caption" color={Colors.dim} style={{ marginTop: Spacing[2] }}>
            {park.googleRating.toFixed(1)} Google rating{park.googleRatingCount ? ` (${park.googleRatingCount})` : ""}
          </PawText>
        )}
        {openError ? <Alert variant="danger" style={{ marginTop: Spacing[2] }}>{openError}</Alert> : null}
        <View style={styles.compactButtonRow}>
          <Button size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(directionsUrl(park))}>
            Directions
          </Button>
          <Button size="sm" style={{ flex: 1 }} onPress={() => openPark(false)} loading={opening}>
            Profile
          </Button>
        </View>
      </Card>
    );
  }

  return (
    <Card
      style={styles.card}
      accent={park.isVerified || park.reviewCount > 0}
      onPress={() => openPark(false)}
    >
      <View style={styles.cardTop}>
        <Badge variant={status.variant}>{status.label}</Badge>
        {distance && <PawText variant="caption" color={Colors.dim}>{distance}</PawText>}
      </View>

      <PawText variant="h3">{park.name}</PawText>
      <PawText variant="caption" color={Colors.muted} style={{ marginTop: 4 }}>
        {(park.parkType || "Park").replace(/_/g, " ")} - {address}
      </PawText>

      {park.leashRule && (
        <Alert variant="info" title="Park rules" style={{ marginTop: Spacing[3] }}>
          {park.leashRule}
        </Alert>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <PawText variant="micro" color={Colors.dim}>RATING</PawText>
          <PawText variant="body" weight="bold">
            {park.avgRating != null ? park.avgRating.toFixed(1) : park.googleRating != null ? park.googleRating.toFixed(1) : "-"}
          </PawText>
          <PawText variant="caption" color={Colors.dim}>
            {park.reviewCount ? `${park.reviewCount} PawPass reviews` : park.googleRatingCount ? `${park.googleRatingCount} Google ratings` : "Not yet rated"}
          </PawText>
        </View>
        <View style={styles.statBox}>
          <PawText variant="micro" color={Colors.dim}>RULES</PawText>
          <PawText variant="body" weight="bold">{park.rules?.length || (park.leashRule ? 1 : 0)}</PawText>
          <PawText variant="caption" color={Colors.dim}>Known park notes</PawText>
        </View>
      </View>

      {openError ? <Alert variant="danger" style={{ marginTop: Spacing[3] }}>{openError}</Alert> : null}
      <View style={[styles.buttonRow, { flexWrap: "wrap" }]}>
        <Button size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(directionsUrl(park))}>
          Directions
        </Button>
        <Button size="sm" variant="outline" style={{ flex: 1 }} onPress={() => openPark(false)} disabled={opening}>
          Profile
        </Button>
        <Button size="sm" style={{ width: "100%" }} onPress={() => openPark(true)} loading={opening}>
          Write a Review
        </Button>
      </View>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton height={16} style={{ width: "60%", marginBottom: 8 }} />
      <Skeleton height={12} style={{ width: "72%", marginBottom: 16 }} />
      <Skeleton height={46} style={{ marginBottom: 12 }} />
      <Skeleton height={12} style={{ width: "35%" }} />
    </View>
  );
}

export default function ParksScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [radius, setRadius] = useState(160934);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [parks, setParks] = useState<ParkListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const hasLoadedInitially = useRef(false);

  const sortedParks = useMemo(() => {
    return [...parks].sort((a, b) => {
      const aPaid = a.isVerified ? 0 : a.reviewCount > 0 ? 1 : a.source === "google_only" ? 3 : 2;
      const bPaid = b.isVerified ? 0 : b.reviewCount > 0 ? 1 : b.source === "google_only" ? 3 : 2;
      if (aPaid !== bPaid) return aPaid - bPaid;
      const aDistance = a.drivingDistanceMiles ?? a.distanceMiles ?? 999999;
      const bDistance = b.drivingDistanceMiles ?? b.distanceMiles ?? 999999;
      return aDistance - bDistance;
    });
  }, [parks]);

  const load = useCallback(async (
    mode: "nearby" | "search" = "nearby",
    isRefresh = false,
    overrides?: { type?: string; radius?: number },
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setNotice(null);

    try {
      let nextCoords = coords;
      if (!nextCoords) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === "granted") {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          nextCoords = { lat: current.coords.latitude, lng: current.coords.longitude };
          setCoords(nextCoords);
        }
      }

      const destinationQuery = mode === "search" ? query.trim() : "";
      const effectiveType = overrides?.type ?? typeFilter;
      const effectiveRadius = overrides?.radius ?? radius;
      let regionalQuery = destinationQuery;
      let stateQuery: string | undefined;

      if (!regionalQuery && nextCoords && (effectiveType === "STATE_PARK" || effectiveType === "NATIONAL_PARK")) {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: nextCoords.lat,
          longitude: nextCoords.lng,
        });
        if (effectiveType === "STATE_PARK") {
          stateQuery = address?.region || undefined;
          regionalQuery = stateQuery ?? "";
        } else {
          regionalQuery = address?.country || address?.isoCountryCode || "";
        }
      }

      const useCurrentLocation = !regionalQuery;

      const data = await api.parks.list({
        q: regionalQuery || undefined,
        state: stateQuery,
        type: effectiveType || undefined,
        lat: useCurrentLocation ? nextCoords?.lat : undefined,
        lng: useCurrentLocation ? nextCoords?.lng : undefined,
        radius: useCurrentLocation && nextCoords ? effectiveRadius : undefined,
      });

      setParks(data.results ?? []);
      setTotal(data.total ?? data.results?.length ?? 0);

      if (destinationQuery) {
        setNotice(`Showing parks matching "${destinationQuery}" instead of places near your current location.`);
      } else if (effectiveType === "STATE_PARK" && regionalQuery) {
        setNotice(`Showing state parks across ${regionalQuery}.`);
      } else if (effectiveType === "NATIONAL_PARK" && regionalQuery) {
        setNotice(`Showing national parks across ${regionalQuery}.`);
      } else if (!nextCoords && mode === "nearby") {
        setNotice("Location is off. Search by park name, city, or ZIP, or allow location to find parks near you.");
      }
    } catch (error) {
      setParks([]);
      setTotal(0);
      setNotice("PawPass could not load parks right now. Try again, or search by city or ZIP.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, query, radius, typeFilter]);

  useEffect(() => {
    if (hasLoadedInitially.current) return;
    hasLoadedInitially.current = true;
    void load("nearby");
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <MobileTopBar active="parks" />
        <PawText variant="h2" style={{ marginTop: Spacing[3] }}>Parks</PawText>
        <PawText variant="caption" color={Colors.muted}>
          Find parks, dog parks, trails, and rules near you.
        </PawText>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={Colors.info} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => load("search")}
            placeholder="Park, dog park, trail, or city..."
            placeholderTextColor={Colors.dim}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close" size={20} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <Button onPress={() => load(query.trim() ? "search" : "nearby")} style={{ marginTop: Spacing[3] }}>
          Search parks
        </Button>
      </View>

      <View style={styles.chipBlock}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PARK_TYPES}
          keyExtractor={(item) => item.key || "all"}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setTypeFilter(item.key);
                void load(query.trim() ? "search" : "nearby", false, { type: item.key });
              }}
              style={[styles.chip, typeFilter === item.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === item.key && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RADIUS_OPTIONS}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setRadius(item.meters);
                if (!query.trim()) void load("nearby", false, { radius: item.meters });
              }}
              style={[styles.chip, radius === item.meters && styles.chipActiveBlue]}
            >
              <Text style={[styles.chipText, radius === item.meters && styles.chipTextBlue]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {notice && (
        <Alert variant="warn" style={{ marginHorizontal: Spacing[4], marginTop: Spacing[3] }}>
          {notice}
        </Alert>
      )}

      <PawText variant="caption" color={Colors.dim} style={styles.count}>
        {loading ? "Searching parks..." : `${total.toLocaleString()} parks found`}
      </PawText>

      {loading ? (
        <FlatList
          data={Array.from({ length: 5 })}
          keyExtractor={(_, index) => String(index)}
          renderItem={() => <SkeletonCard />}
          scrollEnabled={false}
        />
      ) : sortedParks.length === 0 ? (
        <EmptyState
          icon="?"
          title="No parks found"
          body="Try a wider distance, a nearby town, or a different park type."
        />
      ) : (
        <FlatList
          data={sortedParks}
          keyExtractor={(park, index) => park.id || park.googlePlaceId || `${park.name}-${index}`}
          renderItem={({ item }) => <ParkCard park={item} />}
          contentContainerStyle={{ paddingTop: Spacing[2], paddingBottom: insets.bottom + 92 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(query.trim() ? "search" : "nearby", true)} tintColor={Colors.accent} />}
        />
      )}

      {loading && (
        <View style={styles.loadingPill}>
          <ActivityIndicator color={Colors.accent} />
          <PawText variant="caption" color={Colors.muted}>Checking nearby parks</PawText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchSection: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
  },
  searchRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: Spacing[3],
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: Typography.family,
    fontSize: Typography.base,
  },
  chipBlock: {
    backgroundColor: Colors.surface,
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipList: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
    gap: Spacing[2],
  },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.bg,
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  chipActiveBlue: {
    borderColor: Colors.info,
    backgroundColor: Colors.infoDim,
  },
  chipText: {
    color: Colors.muted,
    fontFamily: Typography.family,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: Colors.accent,
  },
  chipTextBlue: {
    color: Colors.info,
  },
  count: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
  },
  card: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  compactCard: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    padding: Spacing[3],
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing[2],
    gap: Spacing[2],
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: 3,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  compactButtonRow: {
    flexDirection: "row",
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing[4],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingPill: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
