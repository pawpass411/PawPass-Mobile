// app/settings/handler.tsx
import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, PawText, Button } from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { Colors, Spacing, Radius } from "../../src/lib/theme";

export default function HandlerStatusScreen() {
  const insets = useSafeAreaInsets();
  type AccountUse = "handler" | "trainer" | "handler_trainer" | "community";
  const [accountUse, setAccountUse] = useState<AccountUse | null>(null);
  const [handlerAttested, setHandlerAttested] = useState(false);
  const [trainerAttested, setTrainerAttested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.users.me()
      .then(({ user }) => {
        if (user.role === "TRAINER" && user.isHandler) setAccountUse("handler_trainer");
        else if (user.role === "TRAINER") setAccountUse("trainer");
        else if (user.role === "HANDLER" || user.isHandler) setAccountUse("handler");
        else setAccountUse("community");
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    if (accountUse === null) return;
    setSaving(true);
    setError("");
    try {
      await api.users.update({
        accountUse,
        isHandler: accountUse === "handler" || accountUse === "handler_trainer" ? true : accountUse === "community" ? false : undefined,
        handlerAttestationAccepted: accountUse === "handler" || accountUse === "handler_trainer" ? handlerAttested : undefined,
        trainerAttestationAccepted: accountUse === "trainer" || accountUse === "handler_trainer" ? trainerAttested : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PawPass could not update your account type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: Spacing[4], paddingBottom: insets.bottom + 40 }}
    >
      <PawText variant="body" color={Colors.muted} style={{ marginBottom: Spacing[5], lineHeight: 22 }}>
        Your account type controls your service-dog rights access, review tools, and the role badges shown with your contributions. You can change it without creating a new account.
      </PawText>

      <View style={{ gap: Spacing[3], marginBottom: Spacing[6] }}>
        {[
          {
            val: "handler" as const,
            icon: "",
            label: "I'm a service dog handler",
            desc: "I use a trained service animal. My reviews display a verified handler badge, which helps other handlers identify first-hand accounts.",
          },
          {
            val: "trainer" as const,
            icon: "",
            label: "I'm a service dog trainer",
            desc: "I train service dogs and use handler-level review questions and jurisdiction guidance.",
          },
          {
            val: "handler_trainer" as const,
            icon: "",
            label: "I'm both a handler and trainer",
            desc: "I handle a service dog and also train service dogs, including owner-training my own service dog.",
          },
          {
            val: "community" as const,
            icon: "",
            label: "I'm a community member",
            desc: "I contribute reviews and ratings to help the community, but don't personally use a service animal.",
          },
        ].map(option => (
          <TouchableOpacity
            key={String(option.val)}
            onPress={() => { setAccountUse(option.val); setHandlerAttested(false); setTrainerAttested(false); }}
            style={[styles.card, accountUse === option.val && styles.cardActive]}
          >
            <PawText variant="h3" style={{ marginBottom: 4 }}>{option.icon}  {option.label}</PawText>
            <PawText variant="body" color={Colors.muted} style={{ lineHeight: 21 }}>{option.desc}</PawText>
          </TouchableOpacity>
        ))}
      </View>

      {(accountUse === "handler" || accountUse === "handler_trainer") && (
        <TouchableOpacity onPress={() => setHandlerAttested(!handlerAttested)} style={[styles.agreeRow, handlerAttested && styles.cardActive]}>
          <View style={[styles.checkbox, handlerAttested && styles.checkboxChecked]} />
          <PawText variant="body" color={Colors.muted} style={{flex:1,lineHeight:21}}>
            I confirm that I am a service dog handler and that my service-dog access reviews will describe real handling experiences.
          </PawText>
        </TouchableOpacity>
      )}
      {(accountUse === "trainer" || accountUse === "handler_trainer") && (
        <TouchableOpacity onPress={() => setTrainerAttested(!trainerAttested)} style={[styles.agreeRow, trainerAttested && styles.cardActive]}>
          <View style={[styles.checkbox, trainerAttested && styles.checkboxChecked]} />
          <PawText variant="body" color={Colors.muted} style={{flex:1,lineHeight:21}}>
            I confirm that I train service dogs and that my handler-level access reviews will describe real training experiences.
          </PawText>
        </TouchableOpacity>
      )}

      {saved && (
        <Alert variant="success" style={{ marginBottom: Spacing[3] }}>Account type updated.</Alert>
      )}
      {error ? <Alert variant="danger" style={{marginBottom:Spacing[3]}}>{error}</Alert> : null}

      <Button onPress={save} loading={saving} disabled={accountUse === null || ((accountUse === "handler" || accountUse === "handler_trainer") && !handlerAttested) || ((accountUse === "trainer" || accountUse === "handler_trainer") && !trainerAttested)} fullWidth>
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
  agreeRow:{flexDirection:"row",gap:Spacing[3],alignItems:"flex-start",padding:Spacing[4],marginBottom:Spacing[4],borderRadius:Radius.lg,borderWidth:1,borderColor:Colors.border2,backgroundColor:Colors.surface2},
  checkbox:{width:22,height:22,borderRadius:4,borderWidth:2,borderColor:Colors.border2},
  checkboxChecked:{backgroundColor:Colors.accent,borderColor:Colors.accent},
});
