// app/settings/handler.tsx
import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Alert, PawText, Button } from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

export default function HandlerStatusScreen() {
  const insets = useSafeAreaInsets();
  const [isHandler, setIsHandler] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.users.me()
      .then(d => setIsHandler(d.user.isHandler))
      .catch(() => {});
  }, []);

  const save = async () => {
    if (isHandler === null) return;
    setSaving(true);
    await api.users.update({ isHandler }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 40 }}
    >
      <PawText variant="body" color={Colors.muted} style={{ marginBottom: Spacing[5], lineHeight: 22 }}>
        Your handler status affects how your reviews appear to others and what features you see. You can change this at any time.
      </PawText>

      <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
        {[
          {
            val: true,
            icon: "",
            label: "I'm a service dog handler",
            desc: "I use a trained service animal. My reviews display a verified handler badge, which helps other handlers identify first-hand accounts.",
          },
          {
            val: false,
            icon: "",
            label: "I'm a community member",
            desc: "I contribute reviews and ratings to help the community, but don't personally use a service animal.",
          },
        ].map(option => (
          <TouchableOpacity
            key={String(option.val)}
            onPress={() => setIsHandler(option.val)}
            style={[styles.card, isHandler === option.val && styles.cardActive]}
          >
            <PawText variant="h3" style={{ marginBottom: 4 }}>{option.icon}  {option.label}</PawText>
            <PawText variant="body" color={Colors.muted} style={{ lineHeight: 21 }}>{option.desc}</PawText>
          </TouchableOpacity>
        ))}
      </View>

      {saved && (
        <Alert variant="success" style={{ marginBottom: Spacing[3] }}>Handler status updated.</Alert>
      )}

      <Button onPress={save} loading={saving} disabled={isHandler === null} fullWidth>
        Save Changes
      </Button>

      <Alert variant="info" style={{ marginTop: Spacing[4] }}>
        Handler status is self-reported. PawPass does not verify service animal status or disability status.
      </Alert>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface2,
  },
  cardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
});
