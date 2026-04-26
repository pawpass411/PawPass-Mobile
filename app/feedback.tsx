// app/feedback.tsx
import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert as RNAlert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Button, Input, Card, PawText, Alert } from "../src/components/ui";
import { Colors, Spacing } from "../src/lib/theme";

const BASE = Constants.expoConfig?.extra?.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://pawpass.app";
const TOPICS = ["Bug report", "Feature request", "Content issue", "Accessibility", "Account issue", "Other"];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!topic || message.length < 10) { RNAlert.alert("Required", "Please select a topic and write a message."); return; }
    setSubmitting(true);
    await fetch(`${BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, message }),
    }).catch(() => {});
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: Spacing[6] }}>
        <PawText variant="h2" style={{ textAlign: "center", marginBottom: Spacing[3] }}>Thanks for your feedback!</PawText>
        <PawText variant="body" color={Colors.muted} style={{ textAlign: "center", marginBottom: Spacing[6] }}>
          We read everything. If you reported a bug or issue, we'll look into it.
        </PawText>
        <Button onPress={() => router.back()} fullWidth>Go Back</Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <PawText variant="h2" style={{ marginBottom: Spacing[6] }}>Send Feedback</PawText>
        <PawText variant="caption" color={Colors.muted} style={{ marginBottom: Spacing[2] }}>Topic *</PawText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing[2], marginBottom: Spacing[4] }}>
          {TOPICS.map(t => (
            <Button key={t} onPress={() => setTopic(t)} variant={topic === t ? "primary" : "outline"} size="sm">{t}</Button>
          ))}
        </View>
        <Input
          label="Message *"
          value={message}
          onChangeText={setMessage}
          placeholder="Describe what you experienced or what you'd like to see…"
          multiline numberOfLines={6}
          hint={`${message.length} characters`}
        />
        <Button onPress={submit} loading={submitting} fullWidth>Send Feedback</Button>
        <PawText variant="micro" color={Colors.ghost} style={{ textAlign: "center", marginTop: Spacing[4] }}>
          For urgent issues: support@pawpass.app
        </PawText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
