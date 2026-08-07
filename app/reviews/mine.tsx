// app/reviews/mine.tsx
import { useState, useEffect } from "react";
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert as NativeAlert,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, Button, Card, PawText, EmptyState, Input, StarRating } from "../../src/components/ui";
import { api, Review } from "../../src/lib/api";
import { Colors, Spacing } from "../../src/lib/theme";
import { ACCESS_ISSUES, DOG_OWNER_TAGS, HANDLER_TAGS, PARK_TAGS, chooseImages, SelectedImage } from "../../src/components/reviews/review-form";
import { listReviewOutbox, removeReviewOutboxItem, ReviewOutboxItem, subscribeReviewOutbox, syncReviewOutbox } from "../../src/lib/review-outbox";
import { track } from "../../src/lib/analytics";
import { uploadReviewImages } from "../../src/lib/review-uploads";

export default function MyReviewsScreen() {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<(Review & { locationName?: string })[]>([]);
  const [outbox, setOutbox] = useState<ReviewOutboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editAccessRating, setEditAccessRating] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [retainedImages, setRetainedImages] = useState<string[]>([]);
  const [retainedVerification, setRetainedVerification] = useState<string[]>([]);
  const [retainedReceipts, setRetainedReceipts] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<SelectedImage[]>([]);
  const [newVerification, setNewVerification] = useState<SelectedImage[]>([]);
  const [newReceipts, setNewReceipts] = useState<SelectedImage[]>([]);
  const [editGps, setEditGps] = useState<{lat:number;lng:number;accuracy:number}|null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAccessIssue, setEditAccessIssue] = useState("");

  const beginEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.overallRating);
    setEditAccessRating(review.accessRating);
    setEditBody(review.body);
    setEditError("");
    setRetainedImages(review.imageUrls ?? []);
    setRetainedVerification(review.verificationPhotoUrls ?? []);
    setRetainedReceipts(review.receiptProofUrls ?? []);
    setNewImages([]); setNewVerification([]); setNewReceipts([]); setEditGps(null);
    setEditTags(review.tags ?? []);
    setEditAccessIssue(review.accessIssueType ?? "");
  };

  const saveEdit = async (review: Review) => {
    if (editBody.trim().length < 10) {
      setEditError("Please write at least 10 characters about your experience.");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      const [newImageUrls, newVerificationPhotoUrls, newReceiptProofUrls] = await Promise.all([
        uploadReviewImages(newImages, "public"), uploadReviewImages(newVerification, "verification"), uploadReviewImages(newReceipts, "receipt"),
      ]);
      const data = await api.reviews.update(review.id, {
        overallRating: editRating,
        accessRating: review.accessRating != null ? editAccessRating : undefined,
        body: editBody.trim(), tags: editTags, accessIssueType: editAccessIssue || null,
        retainedImageUrls: retainedImages, retainedVerificationPhotoUrls: retainedVerification,
        retainedReceiptProofUrls: retainedReceipts, newImageUrls, newVerificationPhotoUrls, newReceiptProofUrls,
        gpsLat: editGps?.lat, gpsLng: editGps?.lng, gpsAccuracy: editGps?.accuracy,
      });
      void track({ eventName:"review_updated", path:"/reviews/mine", targetType:review.parkId ? "park" : "business", targetId:review.id, success:true, metadata:{ photos:newImages.length + newVerification.length + newReceipts.length, hasGps:Boolean(editGps) } });
      setReviews(current => current.map(item => item.id === review.id ? { ...item, ...data.review } : item));
      setEditingId(null);
    } catch (caught) {
      setEditError(caught instanceof Error ? caught.message : "Could not update this review.");
    } finally {
      setSaving(false);
    }
  };

  const captureGps = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) { setEditError("Location permission is needed to update the private GPS log."); return; }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setEditGps({ lat:location.coords.latitude, lng:location.coords.longitude, accuracy:location.coords.accuracy ?? 0 });
  };

  const safelyChoose = async (limit:number, setter:(images:SelectedImage[])=>void) => {
    if (limit < 1) { setEditError("Remove a saved picture before adding another one."); return; }
    try { setter(await chooseImages(limit)); }
    catch (caught) { setEditError(caught instanceof Error ? caught.message : "Could not select pictures."); }
  };

  const ExistingFiles = ({ label, files, onChange }: { label:string; files:string[]; onChange:(files:string[])=>void }) => files.length ? (
    <View style={{ gap:Spacing[2] }}><PawText variant="caption" color={Colors.muted}>{label}</PawText>{files.map((file,index) => (
      <View key={file} style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <PawText variant="caption" color={Colors.info}>Saved picture {index + 1}</PawText>
        <Button size="sm" variant="ghost" onPress={() => onChange(files.filter(item => item !== file))}>Remove</Button>
      </View>
    ))}</View>
  ) : null;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    listReviewOutbox().then(items => setOutbox(items.filter(item => !userId || item.ownerUserId === userId))).catch(() => {});
    try {
      const data = await api.reviews.list({ mine: true });
      setReviews((data.reviews as any[]) ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  // The first load is intentionally mount-only; pull-to-refresh handles later reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  useEffect(() => subscribeReviewOutbox(() => {
    listReviewOutbox().then(items => setOutbox(items.filter(item => !userId || item.ownerUserId === userId))).catch(() => {});
  }), [userId]);

  const retryQueued = async (id: string) => {
    await syncReviewOutbox(id, userId ?? undefined).catch(() => {});
    await load();
  };

  const deleteQueued = (item: ReviewOutboxItem) => NativeAlert.alert(
    "Delete saved review?",
    `This permanently removes the offline review and its saved pictures for ${item.target.placeName}.`,
    [
      { text: "Keep it", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeReviewOutboxItem(item.id).catch(() => {}) },
    ],
  );

  const OutboxCards = () => outbox.length ? (
    <View style={{ gap: Spacing[3], marginBottom: Spacing[4] }}>
      <Alert variant="info" title={`${outbox.length} review${outbox.length === 1 ? "" : "s"} waiting to upload`}>
        PawPass will retry automatically when reception returns. Keep PawPass installed so saved pictures are not removed.
      </Alert>
      {outbox.map(item => (
        <Card key={item.id} style={{ gap: Spacing[2] }}>
          <PawText variant="h3">{item.target.placeName}</PawText>
          <PawText variant="caption" color={item.status === "failed" ? Colors.danger : Colors.muted}>
            {item.status === "uploading" ? "Uploading now…" : item.status === "failed" ? item.lastError || "Upload failed." : "Saved on this phone"}
          </PawText>
          <PawText variant="body" color={Colors.muted} numberOfLines={3}>{item.body}</PawText>
          <View style={{ flexDirection: "row", gap: Spacing[2] }}>
            <Button style={{ flex: 1 }} size="sm" onPress={() => retryQueued(item.id)} disabled={item.status === "uploading"}>Retry now</Button>
            <Button style={{ flex: 1 }} size="sm" variant="outline" onPress={() => deleteQueued(item)}>Delete draft</Button>
          </View>
        </Card>
      ))}
    </View>
  ) : null;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <PawText variant="body" color={Colors.muted}>Loading reviews…</PawText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {reviews.length === 0 && outbox.length === 0 ? (
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
          ListHeaderComponent={<OutboxCards/>}
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
                  <View style={{ gap:Spacing[2] }}>
                    <PawText variant="caption" color={Colors.muted}>Experience details</PawText>
                    <View style={{ flexDirection:"row", flexWrap:"wrap", gap:Spacing[2] }}>
                      {(r.parkId ? PARK_TAGS : r.isHandlerReview ? HANDLER_TAGS : DOG_OWNER_TAGS).map(([value,label]) => (
                        <TouchableOpacity key={value} onPress={() => setEditTags(current => current.includes(value) ? current.filter(tag => tag !== value) : [...current,value].slice(0,12))} style={[styles.choice, editTags.includes(value) && styles.choiceActive]}>
                          <PawText variant="caption" color={editTags.includes(value) ? Colors.info : Colors.muted}>{label}</PawText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {(r.isHandlerReview || r.parkId) ? <View style={{ gap:Spacing[2] }}>
                    <PawText variant="caption" color={Colors.muted}>Review category</PawText>
                    <View style={{ flexDirection:"row", flexWrap:"wrap", gap:Spacing[2] }}>
                      {ACCESS_ISSUES.map(([value,label]) => <TouchableOpacity key={value || "none"} onPress={() => setEditAccessIssue(value)} style={[styles.choice, editAccessIssue === value && styles.choiceActive]}><PawText variant="caption" color={editAccessIssue === value ? Colors.info : Colors.muted}>{label}</PawText></TouchableOpacity>)}
                    </View>
                  </View> : null}
                  <ExistingFiles label="Current public pictures" files={retainedImages} onChange={setRetainedImages}/>
                  <Button variant="outline" size="sm" onPress={() => safelyChoose(4-retainedImages.length, setNewImages)}>{newImages.length ? `${newImages.length} new public picture(s) selected` : "Add public pictures"}</Button>
                  <ExistingFiles label="Current private verification pictures" files={retainedVerification} onChange={setRetainedVerification}/>
                  <Button variant="outline" size="sm" onPress={() => safelyChoose(4-retainedVerification.length, setNewVerification)}>{newVerification.length ? `${newVerification.length} verification picture(s) selected` : "Add private verification pictures"}</Button>
                  <ExistingFiles label="Current private receipt proof" files={retainedReceipts} onChange={setRetainedReceipts}/>
                  <Button variant="outline" size="sm" onPress={() => safelyChoose(4-retainedReceipts.length, setNewReceipts)}>{newReceipts.length ? `${newReceipts.length} receipt picture(s) selected` : "Add private receipt proof"}</Button>
                  <Button variant="outline" size="sm" onPress={captureGps}>{editGps ? "GPS visit log updated" : "Update private GPS visit log"}</Button>
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
  choice: { borderWidth:1, borderColor:Colors.border2, backgroundColor:Colors.surface2, borderRadius:18, paddingHorizontal:12, paddingVertical:8 },
  choiceActive: { borderColor:Colors.info, backgroundColor:Colors.infoDim },
  responseBox: {
    marginTop: Spacing[3],
    padding: Spacing[3],
    backgroundColor: Colors.surface2,
    borderRadius: 8,
  },
});
