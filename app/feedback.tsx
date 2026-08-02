import { useEffect, useState } from "react";
import { KeyboardAvoidingView, ScrollView, TouchableOpacity, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, Button, Input, PawText } from "../src/components/ui";
import { ApiError, api } from "../src/lib/api";
import { Colors, Spacing } from "../src/lib/theme";

const TOPICS = [
  "General question",
  "Account help",
  "Bug report",
  "Feature feedback",
  "Accessibility",
  "Privacy - Request",
  "Other",
];

export default function ContactScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(current => current || user.fullName || user.firstName || "");
    setEmail(current => current || user.primaryEmailAddress?.emailAddress || "");
  }, [user]);

  const submit = async () => {
    setError("");
    if (name.trim().length < 2 || !email.includes("@") || subject.trim().length < 3 || message.trim().length < 10) {
      setError("Please complete your name, email, subject, and a message of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await api.contact.submit({
        name: name.trim(),
        email: email.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Your message could not be sent. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", padding: Spacing[6] }}>
        <PawText variant="h2" style={{ textAlign: "center", marginBottom: Spacing[3] }}>Message received</PawText>
        <PawText variant="body" color={Colors.muted} style={{ textAlign: "center", marginBottom: Spacing[6], lineHeight: 22 }}>
          Your message was securely submitted through PawPass.
        </PawText>
        <Button onPress={() => router.back()} fullWidth>Go Back</Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 40, gap: Spacing[3] }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <PawText variant="h2">Contact PawPass</PawText>
        <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>
          Questions, feedback, account help, accessibility concerns, and privacy requests can all be sent here.
        </PawText>

        {error ? <Alert variant="danger" title="Message not sent">{error}</Alert> : null}

        <Input label="Name *" value={name} onChangeText={setName} placeholder="Your name" />
        <Input label="Email *" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />

        <PawText variant="caption" color={Colors.muted}>What can we help with?</PawText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing[2] }}>
          {TOPICS.map(topic => (
            <TouchableOpacity key={topic} onPress={() => setCategory(topic)}>
              <PawText
                variant="caption"
                color={category === topic ? Colors.bg : Colors.text}
                style={{
                  paddingHorizontal: Spacing[3],
                  paddingVertical: Spacing[2],
                  borderRadius: 999,
                  overflow: "hidden",
                  backgroundColor: category === topic ? Colors.accent : Colors.surface2,
                  borderWidth: 1,
                  borderColor: category === topic ? Colors.accent : Colors.border2,
                }}
              >
                {topic}
              </PawText>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Subject *" value={subject} onChangeText={setSubject} placeholder="How can we help?" />
        <Input
          label="Message *"
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what you need..."
          multiline
          numberOfLines={6}
          hint={`${message.length} characters`}
        />
        <Button onPress={submit} loading={submitting} fullWidth>Send Message</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
