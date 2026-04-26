// src/lib/api.ts
// Typed API client for PawPass mobile — hits the Next.js backend
// All endpoints mirror src/app/api/ in the web project

import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL = (
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://pawpass.app"
);

// ─── REQUEST HELPER ──────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync("session_token").catch(() => null);

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
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
    list: (params?: { q?: string; state?: string; type?: string; page?: number }) => {
      const p = new URLSearchParams();
      if (params?.q)     p.set("q", params.q);
      if (params?.state) p.set("state", params.state);
      if (params?.type)  p.set("type", params.type);
      if (params?.page)  p.set("page", String(params.page));
      return request<{ results: ParkListing[]; total: number; pages: number }>(`/parks?${p}`);
    },

    get: (id: string) =>
      request<{ park: ParkDetail }>(`/parks/${id}`),
  },

  reviews: {
    create: (data: {
      businessLocationId?: string;
      parkId?: string;
      overallRating: number;
      accessRating?: number;
      body: string;
    }) => request<{ review: Review }>("/reviews", { method: "POST", body: JSON.stringify(data) }),

    list: (params?: { locationId?: string; parkId?: string; page?: number }) => {
      const p = new URLSearchParams();
      if (params?.locationId) p.set("locationId", params.locationId);
      if (params?.parkId)     p.set("parkId", params.parkId);
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

    update: (data: { name?: string; isHandler?: boolean }) =>
      request<{ user: UserProfile }>("/users/me", {
        method: "PATCH",
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
    effective: (params?: { state?: string; businessType?: string }) => {
      const p = new URLSearchParams();
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
  name: string;
  parkType: string;
  city: string;
  state: string;
  amenities: string[];
  isVerified: boolean;
  badges: string[];
  reviewCount: number;
  avgRating: number | null;
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
  statusHistory: Array<{ status: string; note: string | null; changedAt: string }>;
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
  role: string;
  isHandler: boolean;
  stats: { reviews: number; complaints: number };
  businesses: Array<{ businessId: string; name: string; role: string }>;
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
  course: { id: string; title: string; modules: Array<{ id: string; title: string; orderIndex: number }> };
  moduleAttempts: Array<{ moduleId: string; completedAt: string | null }>;
}

export interface EffectiveRules {
  allowedQuestions: Array<{ id: string; question: string }>;
  prohibitedActions: Array<{ id: string; action: string; citation: string }>;
  layers: string[];
}
