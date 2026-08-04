// src/lib/api.ts
// Typed API client for PawPass mobile — hits the Next.js backend
// All endpoints mirror src/app/api/ in the web project

import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { telemetryContext } from "./telemetry-context";

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  "https://pawpass411.com"
);

type AuthTokenGetter = () => Promise<string | null>;
let authTokenGetter: AuthTokenGetter | null = null;

export function configureApiAuth(getToken: AuthTokenGetter) {
  authTokenGetter = getToken;
}

type TelemetryCallback = (event: { eventName: "api_failed"; path: string; success: false; errorCode: string; durationMs: number }) => void;
let telemetryCallback: TelemetryCallback | null = null;
export function configureApiTelemetry(callback: TelemetryCallback | null) { telemetryCallback = callback; }

// ─── REQUEST HELPER ──────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  requestOptions: { auth?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const shouldAuthenticate = requestOptions.auth !== false;
  const clerkToken = shouldAuthenticate && authTokenGetter
    ? await authTokenGetter().catch(() => null)
    : null;
  const legacyToken = !shouldAuthenticate || clerkToken
    ? null
    : await SecureStore.getItemAsync("session_token").catch(() => null);
  const token = clerkToken ?? legacyToken;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestOptions.timeoutMs ?? 20_000);
  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-PawPass-Platform": telemetryContext.platform,
        "X-PawPass-App-Version": telemetryContext.appVersion,
        "X-PawPass-Session-Id": telemetryContext.sessionId,
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    if (path !== "/analytics/events") telemetryCallback?.({ eventName: "api_failed", path, success: false, errorCode: controller.signal.aborted ? "timeout" : "network_error", durationMs: Date.now() - startedAt });
    if (controller.signal.aborted) {
      throw new ApiError(0, "PawPass took too long to respond. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (path !== "/analytics/events") telemetryCallback?.({ eventName: "api_failed", path, success: false, errorCode: `http_${res.status}`, durationMs: Date.now() - startedAt });
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── TYPED ENDPOINTS ─────────────────────────────────

// Businesses
export const api = {
  analytics: {
    events: (events: Record<string, unknown>[]) => request<{ accepted: number }>("/analytics/events", {
      method: "POST",
      body: JSON.stringify({ events }),
    }, { auth: true, timeoutMs: 10_000 }),
  },
  pushDevices: {
    register: (data: { expoPushToken: string; platform: "android" | "ios"; appVersion?: string; deviceName?: string }) =>
      request<{ ok: boolean; deviceId: string }>("/push-devices", { method: "POST", body: JSON.stringify(data) }),
  },
  places: {
    ensureRecord: (data: {
      googlePlaceId: string;
      name: string;
      formattedAddress: string;
      city?: string;
      state?: string;
      lat?: number | null;
      lng?: number | null;
      placeTypes?: string[];
    }) => request<{
      success: boolean;
      businessId: string;
      locationId: string;
      businessSlug?: string;
    }>("/places/ensure-record", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    nearby: (params: { lat: number; lng: number; radius?: number; type?: string }) => {
      const p = new URLSearchParams();
      p.set("lat", String(params.lat));
      p.set("lng", String(params.lng));
      if (params.radius) p.set("radius", String(params.radius));
      if (params.type) p.set("type", params.type);
      return request<{ results: UnifiedListing[]; total?: number; databaseAvailable?: boolean }>(`/places/nearby?${p}`, {}, { auth: false });
    },

    search: (params: { query: string; type?: string; lat?: number; lng?: number }) => {
      const p = new URLSearchParams();
      p.set("query", params.query);
      if (params.type) p.set("type", params.type);
      if (params.lat != null) p.set("lat", String(params.lat));
      if (params.lng != null) p.set("lng", String(params.lng));
      return request<{ results: UnifiedListing[]; featured?: UnifiedListing[]; total?: number; databaseAvailable?: boolean }>(`/places/search?${p}`, {}, { auth: false });
    },
  },

  businesses: {
    list: (params?: {
      q?: string;
      state?: string;
      category?: string;
      badge?: string;
      page?: number;
      limit?: number;
    }) => {
      const p = new URLSearchParams();
      if (params?.q)        p.set("q", params.q);
      if (params?.state)    p.set("state", params.state);
      if (params?.category) p.set("category", params.category);
      if (params?.badge)    p.set("badge", params.badge);
      if (params?.page)     p.set("page", String(params.page));
      if (params?.limit)    p.set("limit", String(params.limit ?? 20));
      return request<{
        results: BusinessListing[];
        total: number;
        pages: number;
      }>(`/businesses?${p}`);
    },

    get: (id: string) =>
      request<BusinessDetail>(`/businesses/${id}`),
  },

  parks: {
    promote: (data: {
      name: string;
      formattedAddress: string;
      city?: string;
      state?: string;
      lat?: number | null;
      lng?: number | null;
      parkType?: string;
    }) => request<{ success: boolean; parkId: string; parkSlug?: string }>("/parks/promote", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    list: (params?: { q?: string; state?: string; type?: string; lat?: number; lng?: number; originLat?: number; originLng?: number; radius?: number; page?: number }) => {
      const p = new URLSearchParams();
      if (params?.q)     p.set("q", params.q);
      if (params?.state) p.set("state", params.state);
      if (params?.type)  p.set("type", params.type);
      if (params?.lat != null) p.set("lat", String(params.lat));
      if (params?.lng != null) p.set("lng", String(params.lng));
      if (params?.originLat != null) p.set("originLat", String(params.originLat));
      if (params?.originLng != null) p.set("originLng", String(params.originLng));
      if (params?.radius) p.set("radius", String(params.radius));
      if (params?.page)  p.set("page", String(params.page));
      return request<{ results: ParkListing[]; total: number; pages: number }>(`/parks?${p}`, {}, { auth: false });
    },

    get: (id: string) =>
      request<{ park: ParkDetail }>(`/parks/${id}`, {}, { auth: false }),
  },

  reviews: {
    create: (data: {
      businessLocationId?: string;
      parkId?: string;
      overallRating: number;
      accessRating?: number;
      body: string;
    }) => request<{ review: Review }>("/reviews", { method: "POST", body: JSON.stringify(data) }),

    createForm: (form: FormData) =>
      request<{ review: Review }>("/reviews", { method: "POST", body: form }),

    update: (id: string, data: { overallRating: number; accessRating?: number | null; body: string }) =>
      request<{ review: Review }>(`/reviews/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

    updateForm: (id: string, form: FormData) =>
      request<{ review: Review }>(`/reviews/${id}`, { method: "PATCH", body: form }),

    list: (params?: { locationId?: string; parkId?: string; mine?: boolean; page?: number }) => {
      const p = new URLSearchParams();
      if (params?.locationId) p.set("locationId", params.locationId);
      if (params?.parkId)     p.set("parkId", params.parkId);
      if (params?.mine)       p.set("mine", "true");
      if (params?.page)       p.set("page", String(params.page));
      return request<{ reviews: Review[]; total: number }>(`/reviews?${p}`);
    },
  },

  complaints: {
    create: (data: ComplaintInput) =>
      request<{ complaint: { id: string } }>("/complaints", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          incidentDate: data.incidentDate.toISOString(),
        }),
      }),

    list: () =>
      request<{ complaints: ComplaintSummary[] }>("/complaints"),

    get: (id: string) =>
      request<{ complaint: ComplaintDetail }>(`/complaints/${id}`),
  },

  incidentLogs: {
    list: () => request<{ logs: IncidentLog[] }>("/incident-logs"),

    create: (data: {
      placeName: string;
      issueType: string;
      incidentDate: string;
      notes?: string;
      isPrivate?: boolean;
    }) => request<{ log: IncidentLog }>("/incident-logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

    delete: (id: string) =>
      request<{ ok: boolean }>(`/incident-logs?id=${id}`, { method: "DELETE" }),
  },

  users: {
    me: () => request<{ user: UserProfile }>("/users/me"),

    update: (data: { name?: string; bio?: string; phone?: string; avatarUrl?: string | null; isHandler?: boolean; accountUse?: "handler" | "trainer" | "handler_trainer" | "community"; handlerAttestationAccepted?: boolean; trainerAttestationAccepted?: boolean }) =>
      request<{ user: UserProfile }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    uploadAvatar: (form: FormData) =>
      request<{ imageUrl: string }>("/uploads/profile-image", { method: "POST", body: form }),
  },

  contact: {
    submit: (data: {
      name: string;
      email: string;
      category: string;
      subject: string;
      message: string;
    }) => request<{ ok: boolean; id: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },

  notifications: {
    list: () => request<{ notifications: Notification[] }>("/notifications"),

    markRead: (id: string) =>
      request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),

    markAllRead: () =>
      request<{ ok: boolean }>("/notifications/read-all", { method: "PATCH" }),
  },

  training: {
    assignments: () =>
      request<{ assignments: TrainingAssignment[] }>("/training/assignments"),

    startCourse: (courseId: string) =>
      request<{ assignment: TrainingAssignment }>("/training/assignments", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      }),

    completeModule: (moduleId: string, assignmentId: string) =>
      request<{ ok: boolean }>(`/training/modules/${moduleId}/complete`, {
        method: "POST",
        body: JSON.stringify({ assignmentId }),
      }),

    submitQuiz: (data: { assignmentId: string; answers: Record<string, string> }) =>
      request<{ passed: boolean; score: number; certId?: string }>("/training/quiz", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  certificates: {
    verify: (token: string) =>
      request<{
        valid: boolean;
        recipientName?: string;
        businessName?: string;
        courseName?: string;
        issuedAt?: string;
        isRevoked?: boolean;
        isExpired?: boolean;
      }>(`/certificates/verify/${token}`),
  },

  rules: {
    effective: (params?: { country?: "US" | "CA" | "GB"; state?: string; businessType?: string }) => {
      const p = new URLSearchParams();
      if (params?.country)      p.set("country", params.country);
      if (params?.state)        p.set("state", params.state);
      if (params?.businessType) p.set("businessType", params.businessType);
      return request<{ rules: EffectiveRules }>(`/rules/effective?${p}`);
    },
  },
};

// ─── SHARED TYPES ─────────────────────────────────────

export interface BusinessListing {
  id: string;
  businessId?: string;
  name: string;
  businessType: string;
  city: string;
  state: string;
  trustScore: number | null;
  badges: string[];
  reviewCount: number;
  avgRating: number | null;
  avgAccessRating: number | null;
}

export interface UnifiedListing {
  key?: string;
  googlePlaceId: string | null;
  pawpassBusinessId: string | null;
  pawpassLocationId: string | null;
  name: string;
  entityType?: string;
  displayType?: string;
  formattedAddress: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  placeTypes: string[];
  trustScore: number | null;
  badges: string[];
  reviewCount: number;
  avgRating: number | null;
  avgAccessRating: number | null;
  accessReviewCount?: number;
  petFriendlyYesCount?: number;
  petFriendlyNoCount?: number;
  petFriendlyReviewCount?: number;
  petFriendly?: boolean | null;
  isClaimed: boolean;
  isVerified: boolean;
  claimStatus?: "VERIFIED" | "PENDING_VERIFICATION" | "UNCLAIMED";
  googleRating: number | null;
  googleRatingCount: number | null;
  source: "pawpass" | "google_only";
  distanceMiles: number | null;
  drivingDistanceMiles: number | null;
  drivingDurationText: string | null;
  subscriptionTier: string | null;
}

export interface BusinessDetail extends BusinessListing {
  description: string | null;
  website: string | null;
  phone: string | null;
  isVerified: boolean;
  location: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string | null;
    lat: number | null;
    lng: number | null;
    hours: Record<string, string> | null;
  } | null;
  reviews: Review[];
  avgAccessRating: number | null;
}

export interface ParkListing {
  id: string;
  googlePlaceId?: string | null;
  name: string;
  parkType: string;
  formattedAddress?: string;
  city: string;
  state: string;
  lat?: number | null;
  lng?: number | null;
  amenities: string[];
  isVerified: boolean;
  badges: string[];
  reviewCount: number;
  avgRating: number | null;
  googleRating?: number | null;
  googleRatingCount?: number | null;
  googleMapsUri?: string | null;
  source?: "pawpass" | "google_only";
  distanceMiles?: number | null;
  drivingDistanceMiles?: number | null;
  drivingDurationText?: string | null;
  leashRule?: string | null;
  rules?: { icon?: string; rule: string }[];
}

export interface ParkDetail extends ParkListing {
  description: string | null;
  address: string | null;
  phone: string | null;
  hours: Record<string, string> | null;
  reviews: Review[];
  avgAccessRating: number | null;
}

export interface Review {
  id: string;
  overallRating: number;
  accessRating: number | null;
  body: string;
  tags?: string[];
  accessIssueType?: string | null;
  imageUrls?: string[];
  verificationPhotoUrls?: string[];
  receiptProofUrls?: string[];
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAccuracy?: number | null;
  businessLocationId?: string | null;
  parkId?: string | null;
  isHandlerReview?: boolean;
  createdAt: string;
  user: { name: string | null; isHandler: boolean };
  businessResponse?: { body: string; createdAt: string } | null;
}

export interface ComplaintInput {
  businessLocationId: string;
  incidentDate: Date;
  category: string;
  whatUserExperienced: string;
  whatStaffSaid?: string;
  wasEntryDenied?: boolean;
  wasDocumentationAsked?: boolean;
  wasPoliceInvolved?: boolean;
  contactPreference?: "email" | "phone" | "none";
  wantsMediation?: boolean;
  isPrivate?: boolean;
}

export interface ComplaintSummary {
  id: string;
  status: string;
  category: string;
  incidentDate: string;
  createdAt: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  whatUserExperienced: string;
  statusHistory: { status: string; note: string | null; changedAt: string }[];
  businessResponse?: { body: string } | null;
}

export interface IncidentLog {
  id: string;
  placeName: string;
  issueType: string;
  incidentDate: string;
  notes: string | null;
  isPrivate: boolean;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  role: string;
  isHandler: boolean;
  handlerVerified: boolean;
  foundingMemberNumber: number | null;
  onboardingCompletedAt: string | null;
  stats: { reviews: number; complaints: number; incidentLogs: number };
  businesses: { businessId: string; name: string; role: string; country: string }[];
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TrainingAssignment {
  id: string;
  status: string;
  courseId: string;
  course: { id: string; title: string; modules: { id: string; title: string; orderIndex: number }[] };
  moduleAttempts: { moduleId: string; completedAt: string | null }[];
}

export interface EffectiveRules {
  jurisdiction: {
    country: string;
    state: string | null;
    county: string | null;
    city: string | null;
  };
  allowedQuestions: { id: string; question: string }[];
  prohibitedActions: { id: string; action: string; citation: string }[];
  citations: { ref: string; label?: string; url?: string | null }[];
  notes: string[];
  layers: string[];
  jurisdictionReviewStatus: "verified" | "partial" | "baseline_only";
  rightsSections: {
    id: "public_access" | "in_training" | "housing" | "employment" | "air_travel" | "education";
    title: string;
    summary: string;
    bullets: string[];
    citations: { ref: string; label?: string; url?: string | null }[];
    status: "verified" | "baseline" | "pending";
  }[];
}
