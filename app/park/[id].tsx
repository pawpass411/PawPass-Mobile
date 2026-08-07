// app/park/[id].tsx
import { useState, useEffect } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, Alert, PawText, StarRating, Input, Button } from "../../src/components/ui";
import { ReviewForm } from "../../src/components/reviews/review-form";
import { api, ParkDetail } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";
import { track } from "../../src/lib/analytics";

const AMENITY_META: Record<string, { label: string; icon: string }> = {
  water:          { label: "Water",          icon: "" },
  paved_paths:    { label: "Paved Paths",    icon: "" },
  shade:          { label: "Shade",          icon: "" },
  restrooms:      { label: "Restrooms",      icon: "" },
  accessible:     { label: "ADA Accessible", icon: "" },
  fenced:         { label: "Fenced",         icon: "" },
  off_leash:      { label: "Off-Leash Area", icon: "" },
  small_dog_area: { label: "Small Dog Area", icon: "" },
  agility:        { label: "Agility",        icon: "" },
  lights:         { label: "Night Lights",   icon: "" },
  bag_dispensers: { label: "Bag Stations",   icon: "" },
  parking:        { label: "Parking",        icon: "" },
};

const TABS = ["Overview", "Reviews", "Write Review"] as const;
type Tab = typeof TABS[number];

export default function ParkDetailScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const [park, setPark] = useState<ParkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab === "write" ? "Write Review" : "Overview");
  const [rating, setRating] = useState(0);
  const [accessRating, setAccessRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.parks.get(id)
      .then(d => { setPark(d.park); void track({ eventName:"profile_viewed", path:`/park/${id}`, targetType:"park", targetId:id }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (initialTab === "write") setTab("Write Review");
  }, [initialTab]);

  const submitReview = async () => {
    if (!rating || reviewBody.length < 20) return;
    setSubmitting(true); setReviewError(null);
    try {
      await api.reviews.create({
        parkId: id,
        overallRating: rating,
        accessRating: accessRating || undefined,
        body: reviewBody,
      });
      setSubmitted(true);
    } catch (e: any) {
      setReviewError(e?.message ?? "Submission failed");
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!park) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: Spacing[6] }}>
        <Alert variant="danger">Park not found.</Alert>
        <Button onPress={() => router.back()} variant="ghost" style={{ marginTop: Spacing[4] }}>← Go Back</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: Spacing[3] }}>
            {park.isVerified && <Badge variant="green">✓ Park Verified</Badge>}
            <Badge variant="gray">{park.parkType.replace(/_/g, " ")}</Badge>
          </View>
          <PawText variant="h1" style={{ marginBottom: 6 }}>{park.name}</PawText>
          <PawText variant="caption" color={Colors.dim}>{park.city}, {park.state}</PawText>
          {park.avgRating != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[4], marginTop: Spacing[3] }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: "#FCD34D", fontSize: 18 }}>★</Text>
                <PawText variant="body" weight="bold">{park.avgRating}</PawText>
                <PawText variant="caption" color={Colors.dim}>({park.reviewCount})</PawText>
              </View>
              {park.avgAccessRating != null && (
                <PawText variant="caption" color={Colors.info}>Access: {park.avgAccessRating}</PawText>
              )}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabItem, tab === t && styles.tabItemActive]}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: tab === t ? Colors.accent : Colors.muted }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ padding: Spacing[4] }}>

          {/* OVERVIEW */}
          {tab === "Overview" && (
            <View style={{ gap: Spacing[3] }}>
              {park.description && (
                <Card>
                  <PawText variant="body" weight="bold" style={{ marginBottom: Spacing[2] }}>About</PawText>
                  <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{park.description}</PawText>
                </Card>
              )}

              {park.amenities.length > 0 && (
                <Card>
                  <PawText variant="body" weight="bold" style={{ marginBottom: Spacing[3] }}>Amenities</PawText>
                  <View style={styles.amenityGrid}>
                    {park.amenities.map(a => {
                      const m = AMENITY_META[a];
                      return m ? (
                        <View key={a} style={styles.amenityChip}>
                          <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                          <PawText variant="micro" color={Colors.muted} style={{ marginTop: 2, textAlign: "center" }}>
                            {m.label}
                          </PawText>
                        </View>
                      ) : null;
                    })}
                  </View>
                </Card>
              )}

              {park.address && (
                <Card>
                  <PawText variant="body" weight="bold" style={{ marginBottom: Spacing[2] }}>Location</PawText>
                  <PawText variant="body" color={Colors.muted}>{park.address}, {park.city}, {park.state}</PawText>
                  {park.phone && (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${park.phone}`)}>
                      <PawText variant="body" color={Colors.muted} style={{ marginTop: 6 }}>{park.phone}</PawText>
                    </TouchableOpacity>
                  )}
                </Card>
              )}

              <Alert variant="info">
                Service animals are not pets. ADA-covered service animals may access all areas of public parks regardless of posted pet restrictions.
              </Alert>
            </View>
          )}

          {/* REVIEWS */}
          {tab === "Reviews" && (
            <View style={{ gap: Spacing[3] }}>
              {park.reviews.length === 0 ? (
                <Card style={{ alignItems: "center", padding: Spacing[8] }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>⭐</Text>
                  <PawText variant="body" color={Colors.muted}>No reviews yet. Be the first.</PawText>
                  <TouchableOpacity onPress={() => setTab("Write Review")} style={{ marginTop: 12 }}>
                    <PawText variant="body" color={Colors.accent} weight="bold">Write a review →</PawText>
                  </TouchableOpacity>
                </Card>
              ) : park.reviews.map(r => (
                <Card key={r.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[2] }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View>
                        <Text style={{ fontSize: 9, color: "rgba(252,211,77,.55)" }}>OVERALL</Text>
                        <Text style={{ color: "#FCD34D" }}>{"★".repeat(r.overallRating)}</Text>
                      </View>
                      {r.accessRating != null && (
                        <View>
                          <Text style={{ fontSize: 9, color: "rgba(34,211,238,.55)" }}>ACCESS</Text>
                          <Text style={{ color: Colors.info }}>{"★".repeat(r.accessRating)}</Text>
                        </View>
                      )}
                    </View>
                    <PawText variant="caption" color={Colors.dim}>
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </PawText>
                  </View>
                  {r.user.isHandler && (
                    <Badge variant="cyan" style={{ marginBottom: Spacing[2] }}>Verified Handler</Badge>
                  )}
                  <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{r.body}</PawText>
                </Card>
              ))}
            </View>
          )}

          {/* WRITE REVIEW */}
          {tab === "Write Review" && (
            <ReviewForm target={{ kind: "park", parkId: id, placeName: park.name }} />
          )}
          {false && tab === "Write Review" && (
            <Card>
              {submitted ? (
                <View style={{ alignItems: "center", padding: Spacing[6] }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>✓</Text>
                  <PawText variant="h3" color={Colors.accent}>Review submitted.</PawText>
                </View>
              ) : (
                <View style={{ gap: Spacing[4] }}>
                  <PawText variant="h3">Share your experience.</PawText>
                  {reviewError && <Alert variant="danger">{reviewError}</Alert>}
                  <View>
                    <PawText variant="caption" color={Colors.muted} style={{ marginBottom: 8 }}>Overall rating *</PawText>
                    <StarRating value={rating} onChange={setRating} />
                  </View>
                  <View>
                    <PawText variant="caption" color={Colors.muted} style={{ marginBottom: 8 }}>Service dog access rating</PawText>
                    <StarRating value={accessRating} onChange={setAccessRating} color={Colors.info} />
                  </View>
                  <Input
                    label="Your experience"
                    value={reviewBody}
                    onChangeText={setReviewBody}
                    placeholder="What was the park like for you and your service dog?"
                    multiline
                    numberOfLines={5}
                    hint={`${reviewBody.length}/1500 · minimum 20 characters`}
                  />
                  <Button
                    onPress={submitReview}
                    loading={submitting}
                    disabled={!rating || reviewBody.length < 20}
                    fullWidth
                  >
                    Submit review
                  </Button>
                </View>
              )}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1, paddingVertical: Spacing[3], alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: Colors.transparent,
  },
  tabItemActive: { borderBottomColor: Colors.accent },
  amenityGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: Spacing[2],
  },
  amenityChip: {
    width: 72, alignItems: "center",
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing[2],
  },
});
