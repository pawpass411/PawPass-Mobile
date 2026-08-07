import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";
import { ApiError, api } from "./api";
import { track } from "./analytics";
import { uploadReviewImages, ReviewUploadKind } from "./review-uploads";

export type OutboxImage = { uri: string; name: string; mimeType: string; uploadedUrl?: string };
export type OutboxTarget =
  | { kind: "business"; businessLocationId: string; placeName: string }
  | { kind: "park"; parkId: string; placeName: string };

export type ReviewOutboxDraft = {
  ownerUserId: string;
  target: OutboxTarget;
  overallRating: number;
  accessRating?: number;
  tags: string[];
  accessIssueType?: string;
  body: string;
  gps?: { lat: number; lng: number; accuracy: number };
  publicPhotos: OutboxImage[];
  verificationPhotos: OutboxImage[];
  receiptPhotos: OutboxImage[];
};

export type ReviewOutboxItem = ReviewOutboxDraft & {
  id: string;
  createdAt: string;
  status: "pending" | "uploading" | "failed";
  attempts: number;
  lastError?: string;
};

const STORAGE_KEY = "pawpass:review-outbox:v1";
const ROOT = `${FileSystem.documentDirectory ?? ""}review-outbox/`;
const listeners = new Set<() => void>();
let syncing: Promise<void> | null = null;

function emit() { listeners.forEach(listener => listener()); }
export function subscribeReviewOutbox(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function listReviewOutbox(): Promise<ReviewOutboxItem[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored) as ReviewOutboxItem[]; }
  catch { return []; }
}

async function save(items: ReviewOutboxItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emit();
}

function safeName(name: string, index: number) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${index}-${cleaned || "photo.jpg"}`;
}

async function preserveImages(id: string, group: string, images: OutboxImage[]) {
  if (!images.length) return [];
  const directory = `${ROOT}${id}/${group}/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const saved: OutboxImage[] = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const destination = `${directory}${safeName(image.name, index)}`;
    await FileSystem.copyAsync({ from: image.uri, to: destination });
    saved.push({ ...image, uri: destination });
  }
  return saved;
}

export async function queueReview(draft: ReviewOutboxDraft) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
    const item: ReviewOutboxItem = {
      ...draft,
      id,
      createdAt: new Date().toISOString(),
      status: "pending",
      attempts: 0,
      publicPhotos: await preserveImages(id, "public", draft.publicPhotos),
      verificationPhotos: await preserveImages(id, "verification", draft.verificationPhotos),
      receiptPhotos: await preserveImages(id, "receipts", draft.receiptPhotos),
    };
    const items = await listReviewOutbox();
    await save([...items, item]);
    return item;
  } catch (error) {
    await FileSystem.deleteAsync(`${ROOT}${id}/`, { idempotent: true }).catch(() => {});
    throw error;
  }
}

export function reviewOutboxForm(item: ReviewOutboxItem) {
  const form = new FormData();
  if (item.target.kind === "business") form.append("businessLocationId", item.target.businessLocationId);
  else form.append("parkId", item.target.parkId);
  form.append("overallRating", String(item.overallRating));
  if (item.accessRating) form.append("accessRating", String(item.accessRating));
  form.append("tags", JSON.stringify(item.tags));
  if (item.accessIssueType) form.append("accessIssueType", item.accessIssueType);
  form.append("body", item.body);
  const append = (field: string, images: OutboxImage[]) => images.forEach(image => form.append(field, {
    uri: image.uri, name: image.name, type: image.mimeType,
  } as any));
  append("images", item.publicPhotos);
  append("verificationPhotos", item.verificationPhotos);
  append("receiptProofs", item.receiptPhotos);
  if (item.gps) {
    form.append("gpsLat", String(item.gps.lat));
    form.append("gpsLng", String(item.gps.lng));
    form.append("gpsAccuracy", String(item.gps.accuracy));
  }
  return form;
}

export async function removeReviewOutboxItem(id: string) {
  await save((await listReviewOutbox()).filter(item => item.id !== id));
  await FileSystem.deleteAsync(`${ROOT}${id}/`, { idempotent: true }).catch(() => {});
}

async function updateItem(id: string, update: Partial<ReviewOutboxItem>) {
  await save((await listReviewOutbox()).map(item => item.id === id ? { ...item, ...update } : item));
}

async function uploadQueuedGroup(item: ReviewOutboxItem, field: "publicPhotos" | "verificationPhotos" | "receiptPhotos", kind: ReviewUploadKind) {
  return uploadReviewImages(item[field], kind, async (index, uploadedUrl) => {
    item[field] = item[field].map((image, imageIndex) => imageIndex === index ? { ...image, uploadedUrl } : image);
    await updateItem(item.id, { [field]: item[field] });
  });
}

async function runSync(onlyId?: string, ownerUserId?: string) {
  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) return;
  const items = await listReviewOutbox();
  for (const item of items) {
    if (onlyId && item.id !== onlyId) continue;
    if (ownerUserId && item.ownerUserId !== ownerUserId) continue;
    await updateItem(item.id, { status: "uploading", attempts: item.attempts + 1, lastError: undefined });
    try {
      const imageUrls = await uploadQueuedGroup(item, "publicPhotos", "public");
      const verificationPhotoUrls = await uploadQueuedGroup(item, "verificationPhotos", "verification");
      const receiptProofUrls = await uploadQueuedGroup(item, "receiptPhotos", "receipt");
      await api.reviews.create({
        ...(item.target.kind === "business" ? { businessLocationId: item.target.businessLocationId } : { parkId: item.target.parkId }),
        overallRating: item.overallRating, accessRating: item.accessRating, tags: item.tags,
        accessIssueType: item.accessIssueType, body: item.body,
        imageUrls, verificationPhotoUrls, receiptProofUrls,
        proofTypes: [...(verificationPhotoUrls.length ? ["photo"] : []), ...(receiptProofUrls.length ? ["receipt"] : []), ...(item.gps ? ["gps"] : [])],
        gpsLat: item.gps?.lat, gpsLng: item.gps?.lng, gpsAccuracy: item.gps?.accuracy,
      });
      void track({ eventName:"review_submitted", targetType:item.target.kind, targetId:item.target.kind === "business" ? item.target.businessLocationId : item.target.parkId, success:true, metadata:{ source:"offline_queue" } });
      await removeReviewOutboxItem(item.id);
    } catch (error) {
      // A timed-out first request may have reached PawPass. The server's one-review-per-place
      // rule makes its duplicate response confirmation that this queued copy is complete.
      if (error instanceof ApiError && error.status === 409) {
        await removeReviewOutboxItem(item.id);
        continue;
      }
      const message = error instanceof Error ? error.message : "Could not upload this review.";
      await updateItem(item.id, { status: "failed", lastError: message });
      if (!(error instanceof ApiError) || error.status === 0) break;
    }
  }
}

export function syncReviewOutbox(onlyId?: string, ownerUserId?: string) {
  if (syncing) return syncing;
  syncing = runSync(onlyId, ownerUserId).finally(() => { syncing = null; });
  return syncing;
}
