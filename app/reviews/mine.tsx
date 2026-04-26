// app/reviews/mine.tsx
import { useState, useEffect } from "react";
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, PawText, EmptyState, Badge } from "../../src/components/ui";
import { api, Review } from "../../src/lib/api";
import { Colors, Spacing } from "../../src/lib/theme";

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<(Review & { locationName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.reviews.list();
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
