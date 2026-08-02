// app/reviews/mine.tsx
import { useState, useEffect } from "react";
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, Button, Card, PawText, EmptyState, Input, StarRating } from "../../src/components/ui";
import { api, Review } from "../../src/lib/api";
import { Colors, Spacing } from "../../src/lib/theme";

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<(Review & { locationName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editAccessRating, setEditAccessRating] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const beginEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.overallRating);
    setEditAccessRating(review.accessRating);
    setEditBody(review.body);
    setEditError("");
  };

  const saveEdit = async (review: Review) => {
    if (editBody.trim().length < 10) {
      setEditError("Please write at least 10 characters about your experience.");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      const data = await api.reviews.update(review.id, {
        overallRating: editRating,
        accessRating: review.accessRating == null ? null : editAccessRating,
        body: editBody.trim(),
      });
      setReviews(current => current.map(item => item.id === review.id ? { ...item, ...data.review } : item));
      setEditingId(null);
    } catch (caught) {
      setEditError(caught instanceof Error ? caught.message : "Could not update this review.");
    } finally {
      setSaving(false);
    }
  };

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.reviews.list({ mine: true });
      setReviews((data.reviews as any[]) ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <PawText variant="body" color={Colors.muted}>Loading reviews…</PawText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {reviews.length === 0 ? (
        <EmptyState
          icon=""
          title="No reviews yet"
          body="Rate businesses and parks you've visited with your service dog."
          action={
            <TouchableOpacity onPress={() => router.push("/(tabs)")}>
              <PawText variant="body" color={Colors.accent} weight="bold">Browse businesses →</PawText>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent} />
          }
          renderItem={({ item: r }) => (
            <Card style={{ marginBottom: Spacing[3] }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing[2] }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View>
                    <PawText variant="micro" color="rgba(252,211,77,.55)" style={{ letterSpacing: 1 }}>OVERALL</PawText>
                    <PawText variant="body" color="#FCD34D">{"★".repeat(r.overallRating)}</PawText>
                  </View>
                  {r.accessRating != null && (
                    <View>
                      <PawText variant="micro" color="rgba(34,211,238,.55)" style={{ letterSpacing: 1 }}>ACCESS</PawText>
                      <PawText variant="body" color={Colors.info}>{"★".repeat(r.accessRating)}</PawText>
                    </View>
                  )}
                </View>
                <PawText variant="caption" color={Colors.dim}>
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </PawText>
              </View>
              {(r as any).location?.business?.name && (
                <PawText variant="body" weight="semibold" style={{ marginBottom: Spacing[2] }}>
                  {(r as any).location.business.name}
                </PawText>
              )}
              <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>
                {r.body}
              </PawText>
              {editingId === r.id ? (
                <View style={{ marginTop:Spacing[3], gap:Spacing[3] }}>
                  <Alert variant="info">Edits return the review to PawPass admin approval before it appears publicly again.</Alert>
                  {editError ? <Alert variant="danger">{editError}</Alert> : null}
                  <View>
                    <PawText variant="caption" color={Colors.muted}>Overall rating</PawText>
                    <StarRating value={editRating} onChange={setEditRating}/>
                  </View>
                  {r.accessRating != null ? (
                    <View>
                      <PawText variant="caption" color={Colors.muted}>Service-animal access rating</PawText>
                      <StarRating value={editAccessRating ?? r.accessRating} onChange={setEditAccessRating} color={Colors.info}/>
                    </View>
                  ) : null}
                  <Input label="Your experience" value={editBody} onChangeText={setEditBody} multiline numberOfLines={6} hint={`${editBody.length}/1500`}/>
                  <View style={{ flexDirection:"row", gap:Spacing[2] }}>
                    <Button style={{ flex:1 }} variant="outline" onPress={() => setEditingId(null)}>Cancel</Button>
                    <Button style={{ flex:1 }} loading={saving} onPress={() => saveEdit(r)}>Save update</Button>
                  </View>
                </View>
              ) : (
                <View style={{ marginTop:Spacing[3] }}>
                  <Button variant="outline" size="sm" onPress={() => beginEdit(r)}>Update review</Button>
                </View>
              )}
              {r.businessResponse && (
                <View style={styles.responseBox}>
                  <PawText variant="label" color={Colors.accent} style={{ marginBottom: 4 }}>
                    BUSINESS RESPONSE
                  </PawText>
                  <PawText variant="caption" color={Colors.muted}>{r.businessResponse.body}</PawText>
                </View>
              )}
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  responseBox: {
    marginTop: Spacing[3],
    padding: Spacing[3],
    backgroundColor: Colors.surface2,
    borderRadius: 8,
  },
});
