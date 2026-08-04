const mockStorage = new Map<string, string>();
const mockCopyAsync = jest.fn(async (_options?: unknown) => {});
const mockDeleteAsync = jest.fn(async (_path?: unknown, _options?: unknown) => {});
const mockCreateForm = jest.fn(async (_form?: unknown) => ({ review: { id: "review-1" } }));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
}));

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  makeDirectoryAsync: jest.fn(async () => {}),
  copyAsync: (options: unknown) => mockCopyAsync(options),
  deleteAsync: (path: unknown, options: unknown) => mockDeleteAsync(path, options),
}));

jest.mock("../api", () => ({
  ApiError: Error,
  api: { reviews: { createForm: (form: unknown) => mockCreateForm(form) } },
}));

// Mocks must be declared before this module is loaded.
// eslint-disable-next-line import/first
import { listReviewOutbox, queueReview, removeReviewOutboxItem, syncReviewOutbox } from "../review-outbox";

const draft = {
  ownerUserId: "clerk-user-1",
  target: { kind: "park" as const, parkId: "park-1", placeName: "Tarryall Reservoir" },
  overallRating: 5,
  tags: ["accessible_paths"],
  body: "A detailed offline park review for testing.",
  gps: { lat: 39.1, lng: -105.5, accuracy: 8 },
  publicPhotos: [{ uri: "file:///picker/photo.jpg", name: "photo.jpg", mimeType: "image/jpeg" }],
  verificationPhotos: [],
  receiptPhotos: [],
};

beforeEach(() => {
  mockStorage.clear();
  mockCopyAsync.mockClear();
  mockDeleteAsync.mockClear();
  mockCreateForm.mockClear();
});

test("keeps an offline review and its photo in durable storage", async () => {
  const queued = await queueReview(draft);
  const items = await listReviewOutbox();

  expect(items).toHaveLength(1);
  expect(items[0].id).toBe(queued.id);
  expect(items[0].publicPhotos[0].uri).toContain("file:///documents/review-outbox/");
  expect(mockCopyAsync).toHaveBeenCalledTimes(1);
});

test("uploads a queued review once and removes its saved files", async () => {
  await queueReview(draft);
  await syncReviewOutbox();

  expect(mockCreateForm).toHaveBeenCalledTimes(1);
  expect(await listReviewOutbox()).toEqual([]);
  expect(mockDeleteAsync).toHaveBeenCalled();
});

test("allows a person to delete a queued draft", async () => {
  const item = await queueReview(draft);
  await removeReviewOutboxItem(item.id);

  expect(await listReviewOutbox()).toEqual([]);
});
