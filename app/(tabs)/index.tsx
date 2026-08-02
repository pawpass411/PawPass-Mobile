import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, Badge, Button, Card, EmptyState, PawText, Skeleton } from "../../src/components/ui";
import { PawPassMark, PawPassWordmark } from "../../src/components/ui/Logo";
import { MobileTopBar } from "../../src/components/ui/MobileTopBar";
import { api, UnifiedListing } from "../../src/lib/api";
import { Colors, Radius, Spacing, Typography } from "../../src/lib/theme";

const MILE_OPTIONS = [10, 25, 50, 100, 250];
const DEFAULT_MILES = 50;
const TYPES = [
  { key: "", label: "All" },
  { key: "GROCERY", label: "Grocery" },
  { key: "RESTAURANT", label: "Food" },
  { key: "BREWERY", label: "Brewery" },
  { key: "PHARMACY", label: "Pharmacy" },
  { key: "VETERINARIAN", label: "Vet" },
  { key: "DOG_TRAINER", label: "Trainer" },
  { key: "GAS_STATION", label: "Gas" },
  { key: "HOTEL", label: "Hotel" },
];

function metersFromMiles(miles: number) {
  return Math.round(miles * 1609.344);
}

function listingPriority(item: UnifiedListing) {
  if (item.subscriptionTier === "PROFESSIONAL") return 0;
  if (item.badges.includes("PAWPASS_CERTIFIED") || item.badges.includes("ACCESS_EXCELLENCE_AWARD")) return 0;
  if (item.subscriptionTier === "BASIC") return 1;
  if (item.source === "pawpass" && (item.reviewCount > 0 || item.isClaimed || item.isVerified)) return 2;
  return 3;
}

function bestDistance(item: UnifiedListing) {
  return item.drivingDistanceMiles ?? item.distanceMiles ?? Number.POSITIVE_INFINITY;
}

function distanceLabel(item: UnifiedListing) {
  if (item.drivingDistanceMiles != null) {
    const miles = item.drivingDistanceMiles < 10 ? item.drivingDistanceMiles.toFixed(1) : String(Math.round(item.drivingDistanceMiles));
    return `${item.drivingDurationText ? `${item.drivingDurationText} drive · ` : ""}${miles} mi drive`;
  }
  if (item.distanceMiles != null) {
    const miles = item.distanceMiles < 10 ? item.distanceMiles.toFixed(1) : String(Math.round(item.distanceMiles));
    return `${miles} mi away`;
  }
  return "Distance unavailable";
}

function statusFor(item: UnifiedListing) {
  if (item.subscriptionTier === "PROFESSIONAL" || item.badges.includes("PAWPASS_CERTIFIED")) {
    return { label: "PawPass Certified", variant: "green" as const };
  }
  if (item.subscriptionTier === "BASIC") return { label: "Access Ready", variant: "cyan" as const };
  if (item.source === "pawpass" && item.claimStatus === "PENDING_VERIFICATION") {
    return { label: "Verification pending", variant: "yellow" as const };
  }
  if (item.source === "pawpass") return { label: item.reviewCount > 0 ? "PawPass reviewed" : "PawPass listing", variant: "gray" as const };
  return { label: "Google listing", variant: "gray" as const };
}

function directionsUrl(item: UnifiedListing) {
  const destination = item.lat != null && item.lng != null
    ? `${item.lat},${item.lng}`
    : item.formattedAddress || item.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function ListingCard({ item }: { item: UnifiedListing }) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const status = statusFor(item);
  const isPaid = item.subscriptionTier === "BASIC" || item.subscriptionTier === "PROFESSIONAL";
  const accessLabel = item.avgAccessRating != null
    ? `${item.avgAccessRating}/5 access`
    : item.googleRating != null
    ? `${item.googleRating} Google`
    : "No access review yet";
  const petLabel = item.petFriendly == null ? "Pet dog: not noted" : `Pet dog: ${item.petFriendly ? "Yes" : "No"}`;
  const openPawPass = async (writeReview = false) => {
    setOpening(true);
    setOpenError("");
    try {
      let businessId = item.pawpassBusinessId;
      if (!businessId) {
        if (!item.googlePlaceId) throw new Error("This listing is missing its Google place identifier.");
        const record = await api.places.ensureRecord({
          googlePlaceId: item.googlePlaceId,
          name: item.name,
          formattedAddress: item.formattedAddress,
          city: item.city,
          state: item.state,
          lat: item.lat,
          lng: item.lng,
          placeTypes: item.placeTypes,
        });
        businessId = record.businessId;
      }
      router.push({
        pathname: "/business/[id]",
        params: { id: businessId, ...(writeReview ? { tab: "write" } : {}) },
      });
    } catch (caught) {
      setOpenError(caught instanceof Error ? caught.message : "Could not open this PawPass listing.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <Card style={{ marginBottom: Spacing[3] }} accent={isPaid}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: Spacing[3] }}>
        <View style={{ flex: 1, gap: Spacing[2] }}>
          <View style={{ flexDirection: "row", gap: Spacing[2], flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant={status.variant}>{status.label}</Badge>
            {isPaid && <PawPassMark size={24} glow={false} />}
          </View>
          <PawText variant="h3">{item.name}</PawText>
          <PawText variant="caption" color={Colors.muted}>
            {(item.displayType ?? item.placeTypes?.[0] ?? "Place").replace(/_/g, " ")} · {item.city || item.state || item.formattedAddress}
          </PawText>
        </View>
        <PawText variant="caption" color={Colors.accent} weight="bold" style={{ textAlign: "right", maxWidth: 108 }}>
          {distanceLabel(item)}
        </PawText>
      </View>

      <View style={{ flexDirection: "row", gap: Spacing[2], marginTop: Spacing[3], flexWrap: "wrap" }}>
        <Badge variant="cyan">{accessLabel}</Badge>
        <Badge variant={item.petFriendly === false ? "yellow" : "green"}>{petLabel}</Badge>
      </View>

      {openError ? <Alert variant="danger" style={{ marginTop: Spacing[3] }}>{openError}</Alert> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing[2], marginTop: Spacing[4] }}>
        <Button variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => Linking.openURL(directionsUrl(item))}>
          Directions
        </Button>
        <Button variant="outline" size="sm" style={{ flex: 1 }} onPress={() => openPawPass(false)} disabled={opening}>
          Profile
        </Button>
        <Button size="sm" style={{ width: "100%" }} onPress={() => openPawPass(true)} loading={opening}>
          Write a Review
        </Button>
      </View>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card style={{ marginBottom: Spacing[3] }}>
      <Skeleton height={16} style={{ width: "65%", marginBottom: 8 }} />
      <Skeleton height={12} style={{ width: "90%", marginBottom: 14 }} />
      <View style={{ flexDirection: "row", gap: Spacing[2] }}>
        <Skeleton width={92} height={28} style={{ borderRadius: 14 }} />
        <Skeleton width={118} height={28} style={{ borderRadius: 14 }} />
      </View>
    </Card>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_MILES);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<UnifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const priority = listingPriority(a) - listingPriority(b);
      if (priority !== 0) return priority;
      return bestDistance(a) - bestDistance(b);
    });
  }, [results]);

  const requestLocation = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setMessage("Location is off. Search by city, ZIP, or place name to browse PawPass listings.");
      return null;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const next = { lat: position.coords.latitude, lng: position.coords.longitude };
    setCoords(next);
    return next;
  }, []);

  const loadNearby = useCallback(async (nextCoords = coords, isRefresh = false) => {
    if (!nextCoords) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await api.places.nearby({
        ...nextCoords,
        radius: metersFromMiles(radiusMiles),
        type: type || undefined,
      });
      setResults(data.results ?? []);
      setMessage(`${data.results?.length ?? 0} nearby listings loaded`);
    } catch (err: any) {
      setError(err?.message ?? "Nearby search failed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, radiusMiles, type]);

  const searchFor = useCallback(async (rawQuery: string, isRefresh = false) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      const nextCoords = coords ?? await requestLocation();
      if (nextCoords) await loadNearby(nextCoords, isRefresh);
      else setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await api.places.search({
        query: trimmed,
        type: type || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      const combined = [...(data.featured ?? []), ...(data.results ?? [])];
      const deduped = combined.filter((item, index, all) => {
        const key = item.pawpassLocationId ?? item.googlePlaceId ?? `${item.name}-${item.formattedAddress}`;
        return all.findIndex(other => (other.pawpassLocationId ?? other.googlePlaceId ?? `${other.name}-${other.formattedAddress}`) === key) === index;
      });
      setResults(deduped);
      setMessage(`${deduped.length} listings found`);
    } catch (err: any) {
      setError(err?.message ?? "Search failed. Try adding a city or ZIP code.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, loadNearby, requestLocation, type]);

  const runSearch = useCallback(async (isRefresh = false) => {
    await searchFor(query, isRefresh);
  }, [query, searchFor]);

  useEffect(() => {
    if (typeof params.query === "string" && params.query.trim()) {
      setQuery(params.query);
      searchFor(params.query);
    }
  }, [params.query, searchFor]);

  useEffect(() => {
    requestLocation().then((nextCoords) => {
      if (nextCoords) loadNearby(nextCoords);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (coords) loadNearby(coords);
  }, [radiusMiles, type]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: Spacing[4], paddingBottom: Spacing[3], backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <MobileTopBar active="discover" />
        <View style={{ marginTop: Spacing[3], flexDirection: "row", gap: Spacing[2] }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Where would you like to go?"
            placeholderTextColor={Colors.dim}
            returnKeyType="search"
            onSubmitEditing={() => runSearch()}
            style={{ flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.md, color: Colors.text, paddingHorizontal: Spacing[3], fontSize: Typography.base }}
          />
          <Button onPress={() => runSearch()} style={{ minWidth: 96 }}>Search</Button>
        </View>

        <FlatList
          horizontal
          data={TYPES}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing[2], paddingTop: Spacing[3] }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setType(item.key)} style={{ paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: type === item.key ? Colors.accent : Colors.border2, backgroundColor: type === item.key ? Colors.accentDim : Colors.transparent }}>
              <Text style={{ color: type === item.key ? Colors.accent : Colors.muted, fontWeight: "700", fontSize: 12 }}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2], marginTop: Spacing[3] }}>
          <PawText variant="caption" color={Colors.dim}>Miles:</PawText>
          {MILE_OPTIONS.map((miles) => (
            <TouchableOpacity key={miles} onPress={() => setRadiusMiles(miles)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: radiusMiles === miles ? Colors.info : Colors.border2, backgroundColor: radiusMiles === miles ? Colors.infoDim : Colors.transparent }}>
              <Text style={{ color: radiusMiles === miles ? Colors.info : Colors.muted, fontSize: 12, fontWeight: "800" }}>{miles}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <FlatList data={Array.from({ length: 7 })} keyExtractor={(_, i) => String(i)} renderItem={() => <SkeletonCard />} contentContainerStyle={{ padding: Spacing[4] }} />
      ) : (
        <FlatList
          data={sortedResults}
          keyExtractor={(item, index) => item.key ?? item.pawpassLocationId ?? item.googlePlaceId ?? `${item.name}-${index}`}
          renderItem={({ item }) => <ListingCard item={item} />}
          contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 92 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => runSearch(true)} tintColor={Colors.accent} />}
          ListHeaderComponent={
            <View style={{ gap: Spacing[2], marginBottom: Spacing[3] }}>
              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              {sortedResults.some(item => item.subscriptionTier === "BASIC" || item.subscriptionTier === "PROFESSIONAL") && (
                <Alert variant="info">PawPass participating businesses are highlighted first so you can quickly spot places with active community trust signals.</Alert>
              )}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No listings found"
              body="Try a city, ZIP code, or a wider mile range."
              action={<Button variant="outline" onPress={() => requestLocation().then((nextCoords) => nextCoords && loadNearby(nextCoords))}>Use my location</Button>}
            />
          }
        />
      )}
    </View>
  );
}
