import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { api } from "./api";
import { telemetryContext } from "./telemetry-context";

const QUEUE_KEY = "pawpass:analytics:v1";
const ANONYMOUS_KEY = "pawpass:analytics:anonymous-id";
const MAX_QUEUE = 200;
let flushing = false;

export type AnalyticsEventName =
  | "app_open" | "sign_in_succeeded" | "sign_in_failed"
  | "search_completed" | "search_failed" | "profile_viewed"
  | "review_started" | "review_abandoned" | "review_queued_offline"
  | "review_submitted" | "review_updated" | "role_selection_completed"
  | "notification_registered" | "notification_received" | "notification_opened"
  | "api_failed" | "app_error";

export type MobileAnalyticsEvent = {
  eventName: AnalyticsEventName;
  path?: string;
  targetType?: string;
  targetId?: string;
  searchTerm?: string;
  category?: string;
  country?: string;
  state?: string;
  resultCount?: number;
  durationMs?: number;
  success?: boolean;
  errorCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
  occurredAt?: string;
};

async function anonymousId() {
  const saved = await AsyncStorage.getItem(ANONYMOUS_KEY);
  if (saved) return saved;
  const created = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(ANONYMOUS_KEY, created);
  return created;
}
async function readQueue(): Promise<MobileAnalyticsEvent[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as MobileAnalyticsEvent[]; } catch { return []; }
}

async function writeQueue(events: MobileAnalyticsEvent[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)));
}

export async function track(event: MobileAnalyticsEvent) {
  const events = await readQueue();
  events.push({ ...event, occurredAt: new Date().toISOString() });
  await writeQueue(events);
  void flushAnalytics();
}

export async function flushAnalytics() {
  if (flushing) return;
  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) return;
  const events = await readQueue();
  if (!events.length) return;
  flushing = true;
  try {
    const anon = await anonymousId();
    const batch = events.slice(0, 40).map(({ occurredAt, ...event }) => ({
      ...event,
      anonymousId: anon,
      sessionId: telemetryContext.sessionId,
      platform: telemetryContext.platform,
      appVersion: telemetryContext.appVersion,
      metadata: { ...(event.metadata ?? {}), ...(occurredAt ? { occurredAt } : {}) },
    }));
    await api.analytics.events(batch);
    await writeQueue(events.slice(batch.length));
  } catch {
    // Analytics must never interrupt the PawPass experience.
  } finally {
    flushing = false;
  }
}
