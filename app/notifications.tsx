// app/notifications.tsx
import { useState, useEffect, useCallback } from "react";
import { View, FlatList, TouchableOpacity, Text, StyleSheet, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PawText, Card, Button, EmptyState } from "../src/components/ui";
import { api, Notification } from "../src/lib/api";
import { Colors, Spacing, Radius } from "../src/lib/theme";

function NotifCard({ n, onMarkRead }: { n: Notification; onMarkRead: (id: string) => void }) {
  const TYPE_ICONS: Record<string, string> = {
    complaint: "", training: "", badge: "", system: "", info: "",
  };
  return (
    <TouchableOpacity
      onPress={() => { onMarkRead(n.id); if (n.linkUrl) router.push(n.linkUrl as any); }}
      style={[styles.notifCard, !n.isRead && styles.notifCardUnread]}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 24, marginRight: Spacing[3] }}>{TYPE_ICONS[n.type] ?? ""}</Text>
      <View style={{ flex: 1 }}>
        <PawText variant="body" weight={n.isRead ? "normal" : "semibold"}>{n.title}</PawText>
        <PawText variant="caption" color={Colors.muted} style={{ marginTop: 2, lineHeight: 18 }}>{n.body}</PawText>
        <PawText variant="micro" color={Colors.ghost} style={{ marginTop: 4 }}>
          {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </PawText>
      </View>
      {!n.isRead && <View style={styles.unreadDot}/>}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.notifications.list();
      setNotifications(data.notifications);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await api.notifications.markRead(id).catch(() => {});
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const markAllRead = async () => {
    await api.notifications.markAllRead().catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PawText variant="h2">Notifications</PawText>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <PawText variant="caption" color={Colors.accent} weight="bold">Mark all read</PawText>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <PawText variant="body" color={Colors.muted}>Loading…</PawText>
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState icon="" title="No notifications" body="You're all caught up."/>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          renderItem={({ item }) => <NotifCard n={item} onMarkRead={markRead}/>}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.accent}/>}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }}/>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifCard: { flexDirection: "row", alignItems: "flex-start", padding: Spacing[4], backgroundColor: Colors.surface },
  notifCardUnread: { backgroundColor: Colors.surface2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 6 },
});
