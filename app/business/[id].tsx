// app/business/[id].tsx
import { useState, useEffect } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Badge, Alert, PawText, TrustScoreRing, StarRating, Input, Button } from "../../src/components/ui";
import { ReviewForm } from "../../src/components/reviews/review-form";
import { api, BusinessDetail } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

const TABS = ["Overview", "Reviews", "Write Review"] as const;
type Tab = typeof TABS[number];

const BADGE_CONFIG: Record<string, "green"|"cyan"|"yellow"|"red"|"purple"> = {
  PAWPASS_CERTIFIED: "green", SERVICE_DOG_FRIENDLY: "cyan",
  UNDER_REVIEW: "yellow", NON_COMPLIANT: "red", TRAINING_IN_PROGRESS: "purple",
};

export default function BusinessDetailScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const [biz, setBiz] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab === "write" ? "Write Review" : "Overview");
  const [rating, setRating] = useState(0);
  const [accessRating, setAccessRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string|null>(null);

  useEffect(() => {
    if (!id) return;
    api.businesses.get(id)
      .then(setBiz)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (initialTab === "write") setTab("Write Review");
  }, [initialTab]);

  const submitReview = async () => {
    if (!rating || reviewBody.length < 20 || !biz?.location) return;
    setSubmitting(true); setReviewError(null);
    try {
      await api.reviews.create({ businessLocationId: biz.location.id, overallRating: rating, accessRating: accessRating || undefined, body: reviewBody });
      setSubmitted(true);
    } catch (e: any) { setReviewError(e?.message ?? "Submission failed"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.accent} size="large"/>
      </View>
    );
  }

  if (!biz) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: Spacing[6] }}>
        <Alert variant="danger">Business not found.</Alert>
        <Button onPress={() => router.back()} variant="ghost" style={{ marginTop: Spacing[4] }}>← Go Back</Button>
      </View>
    );
  }


  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: Spacing[3] }}>
            {biz.badges.map(b => {
              const v = BADGE_CONFIG[b];
              return v ? <Badge key={b} variant={v}>✓ {b.replace(/_/g," ")}</Badge> : null;
            })}
            {biz.isVerified && <Badge variant="green">Verified</Badge>}
          </View>
          <PawText variant="h1" style={{ marginBottom: 6 }}>{biz.name}</PawText>
          <PawText variant="caption" color={Colors.dim}>
            {biz.businessType.replace(/_/g," ")}
            {biz.location ? ` · ${biz.location.city}, ${biz.location.state}` : ""}
          </PawText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[4], marginTop: Spacing[3] }}>
            {biz.avgRating != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: "#FCD34D", fontSize: 18 }}>★</Text>
                <PawText variant="body" weight="bold">{biz.avgRating}</PawText>
                <PawText variant="caption" color={Colors.dim}>({biz.reviewCount})</PawText>
              </View>
            )}
            {biz.avgAccessRating != null && (
              <PawText variant="caption" color={Colors.info}>Access: {biz.avgAccessRating}</PawText>
            )}
            {biz.trustScore != null && <TrustScoreRing score={biz.trustScore}/>}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabItem, tab === t && styles.tabItemActive]}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: tab === t ? Colors.accent : Colors.muted }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ padding: Spacing[4] }}>
          {/* OVERVIEW */}
          {tab === "Overview" && (
            <View style={{ gap: Spacing[3] }}>
              {biz.description && (
                <Card>
                  <PawText variant="body" weight="bold" style={{ marginBottom: Spacing[2] }}>About</PawText>
                  <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{biz.description}</PawText>
                </Card>
              )}
              {biz.location && (
                <Card>
                  <PawText variant="body" weight="bold" style={{ marginBottom: Spacing[2] }}>Location</PawText>
                  <PawText variant="body" color={Colors.muted}>{biz.location.address}, {biz.location.city}, {biz.location.state}</PawText>
                  {biz.phone && <PawText variant="body" color={Colors.muted} style={{ marginTop: 6 }}>{biz.phone}</PawText>}
                  {biz.website && (
                    <TouchableOpacity onPress={() => Linking.openURL(biz.website!)} style={{ marginTop: 8 }}>
                      <PawText variant="caption" color={Colors.accent}>Visit website →</PawText>
                    </TouchableOpacity>
                  )}
                </Card>
              )}
              <Alert variant="info">
                Reviews reflect individual community experiences. They are not official ADA determinations or legal findings.
              </Alert>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/complaint/new", params: { businessName: biz.name, locationId: biz.location?.id } })}
                style={styles.reportBtn}
              >
                <Text style={{ color: Colors.danger, fontWeight: "700", fontSize: 14 }}>Report an access concern</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* REVIEWS */}
          {tab === "Reviews" && (
            <View style={{ gap: Spacing[3] }}>
              {biz.reviews.length === 0 ? (
                <Card style={{ alignItems: "center", padding: Spacing[8] }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>⭐</Text>
                  <PawText variant="body" color={Colors.muted}>No reviews yet. Be the first.</PawText>
                  <TouchableOpacity onPress={() => setTab("Write Review")} style={{ marginTop: 12 }}>
                    <PawText variant="body" color={Colors.accent} weight="bold">Write a review →</PawText>
                  </TouchableOpacity>
                </Card>
              ) : biz.reviews.map(r => (
                <Card key={r.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[2] }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View><Text style={{ fontSize: 9, color: "rgba(252,211,77,.55)" }}>OVERALL</Text><Text style={{ color: "#FCD34D" }}>{"★".repeat(r.overallRating)}</Text></View>
                      {r.accessRating && <View><Text style={{ fontSize: 9, color: "rgba(34,211,238,.55)" }}>ACCESS</Text><Text style={{ color: Colors.info }}>{"★".repeat(r.accessRating)}</Text></View>}
                    </View>
                    <PawText variant="caption" color={Colors.dim}>{new Date(r.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</PawText>
                  </View>
                  {r.user.isHandler && <Badge variant="cyan" style={{ marginBottom: Spacing[2] }}>Verified Handler</Badge>}
                  <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{r.body}</PawText>
                  {r.businessResponse && (
                    <View style={{ marginTop: Spacing[3], padding: Spacing[3], backgroundColor: Colors.surface2, borderRadius: Radius.sm }}>
                      <PawText variant="label" color={Colors.accent} style={{ marginBottom: 4 }}>BUSINESS RESPONSE</PawText>
                      <PawText variant="caption" color={Colors.muted}>{r.businessResponse.body}</PawText>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )}

          {/* WRITE REVIEW */}
          {tab === "Write Review" && biz.location && (
            <ReviewForm
              target={{ kind: "business", businessLocationId: biz.location.id, placeName: biz.name }}
            />
          )}
          {false && tab === "Write Review" && (
            <Card>
              {submitted ? (
                <View style={{ alignItems: "center", padding: Spacing[6] }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>✓</Text>
                  <PawText variant="h3" color={Colors.accent}>Review submitted.</PawText>
                  <PawText variant="body" color={Colors.muted} style={{ marginTop: 8, textAlign: "center" }}>Thanks for contributing to the community.</PawText>
                </View>
              ) : (
                <View style={{ gap: Spacing[4] }}>
                  <PawText variant="h3">Share your experience.</PawText>
                  {reviewError && <Alert variant="danger">{reviewError}</Alert>}
                  <View>
                    <PawText variant="caption" color={Colors.muted} style={{ marginBottom: 8 }}>Overall rating *</PawText>
                    <StarRating value={rating} onChange={setRating}/>
                  </View>
                  <View>
                    <PawText variant="caption" color={Colors.muted} style={{ marginBottom: 8 }}>Service dog access rating</PawText>
                    <StarRating value={accessRating} onChange={setAccessRating} color={Colors.info}/>
                  </View>
                  <Input
                    label="Your experience"
                    value={reviewBody}
                    onChangeText={setReviewBody}
                    placeholder="I arrived with my service dog…"
                    multiline numberOfLines={5}
                    hint={`${reviewBody.length}/1500 · minimum 20 characters`}
                  />
                  <Alert variant="info" title="Community guidelines">
                    Describe your experience in first-person. Avoid legal conclusions, your medical information, or personal details about staff.
                  </Alert>
                  <Button onPress={submitReview} loading={submitting} disabled={!rating || reviewBody.length < 20} fullWidth>
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
  hero: { padding: Spacing[4], backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBar: { flexDirection: "row", backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, paddingVertical: Spacing[3], alignItems: "center", borderBottomWidth: 2, borderBottomColor: Colors.transparent },
  tabItemActive: { borderBottomColor: Colors.accent },
  reportBtn: {
    padding: Spacing[4], borderRadius: Radius.md,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.06)", alignItems: "center",
  },
});
