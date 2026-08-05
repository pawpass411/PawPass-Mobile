import { useEffect, useState } from "react";
import { Linking, Modal, ScrollView, TouchableOpacity, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import { api, EffectiveRules } from "../../lib/api";
import { COUNTRIES, CountryCode, REGIONS } from "../../lib/jurisdictions";
import { Colors, Radius, Spacing } from "../../lib/theme";
import { Alert, Button, Card, PawText } from "../ui";
import { BUNDLED_RIGHTS_UPDATED_AT, bundledRules, readStoredRules, storeRules } from "../../lib/offline-rights";

function SelectSheet({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(option => option.value === value)?.label ?? "Choose";

  return (
    <>
      <PawText variant="caption" color={Colors.muted}>{label}</PawText>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          minHeight: 48,
          justifyContent: "center",
          paddingHorizontal: Spacing[3],
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: Colors.border2,
          backgroundColor: Colors.surface2,
        }}
      >
        <PawText variant="body">{selectedLabel}  ▾</PawText>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.bg }}
          contentContainerStyle={{ padding: Spacing[4], gap: Spacing[2] }}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: Spacing[2] }}>
            <PawText variant="h3">{label}</PawText>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <PawText variant="body" color={Colors.accent} weight="bold">Close</PawText>
            </TouchableOpacity>
          </View>
          {options.map(option => (
            <TouchableOpacity
              key={option.value || "baseline"}
              onPress={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              style={{
                minHeight: 48,
                justifyContent: "center",
                paddingHorizontal: Spacing[3],
                borderRadius: Radius.md,
                backgroundColor: option.value === value ? Colors.accentDim : Colors.surface,
                borderWidth: 1,
                borderColor: option.value === value ? Colors.accentBorder : Colors.border,
              }}
            >
              <PawText variant="body" color={option.value === value ? Colors.accent : Colors.text}>
                {option.label}
              </PawText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
    </>
  );
}

export function JurisdictionRules() {
  const [country, setCountry] = useState<CountryCode>("US");
  const [region, setRegion] = useState("");
  const [rules, setRules] = useState<EffectiveRules | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [source, setSource] = useState<"online"|"saved"|"bundled">("bundled");
  const [updatedAt, setUpdatedAt] = useState(BUNDLED_RIGHTS_UPDATED_AT);
  const countryMeta = COUNTRIES.find(item => item.code === country)!;

  useEffect(() => NetInfo.addEventListener(state => setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false))), []);

  const loadRules = async () => {
    setLoading(true);
    setError("");
    const fallback = async () => {
      const saved = await readStoredRules(country, region || undefined);
      if (saved) { setRules(saved.rules); setUpdatedAt(saved.updatedAt); setSource("saved"); return; }
      setRules(bundledRules(country, region || undefined));
      setUpdatedAt(BUNDLED_RIGHTS_UPDATED_AT);
      setSource("bundled");
    };
    try {
      const network = await NetInfo.fetch();
      const onlineNow = Boolean(network.isConnected && network.isInternetReachable !== false);
      setIsOnline(onlineNow);
      if (!onlineNow || !isOnline) { await fallback(); return; }
      const data = await api.rules.effective({ country, state: region || undefined });
      setRules(data.rules);
      const stored = await storeRules(country, region || undefined, data.rules);
      setUpdatedAt(stored.updatedAt);
      setSource("online");
    } catch {
      await fallback();
      setError("Live updates could not be reached, so PawPass is showing saved offline information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: Spacing[3] }}>
      <Card style={{ gap: Spacing[3] }}>
        <PawText variant="h3">Regulations by location</PawText>
        <PawText variant="caption" color={Colors.muted} style={{ lineHeight: 19 }}>
          View the national baseline together with any PawPass state, provincial, territorial, or UK nation layer currently available.
        </PawText>
        <SelectSheet
          label="Country"
          value={country}
          options={COUNTRIES.map(item => ({ value: item.code, label: item.name }))}
          onSelect={value => {
            setCountry(value as CountryCode);
            setRegion("");
            setRules(null);
          }}
        />
        <SelectSheet
          label={countryMeta.regionLabel}
          value={region}
          options={[
            { value: "", label: "National or federal rules only" },
            ...REGIONS[country].map(item => ({ value: item.code, label: item.name })),
          ]}
          onSelect={value => {
            setRegion(value);
            setRules(null);
          }}
        />
        <Button onPress={loadRules} loading={loading} fullWidth>Show My Rights</Button>
      </Card>

      {error ? <Alert variant="danger" title="Could not load regulations">{error}</Alert> : null}

      {rules ? (
        <>
          <Alert variant={source === "online" ? "info" : "warn"} title={source === "online" ? "Current online information" : "Offline rights information"}>
            {source === "online" ? "This copy was refreshed from PawPass." : source === "saved" ? "You are viewing the latest version previously saved on this phone." : "You are viewing the rights summary packaged with this app."} Last updated {new Date(updatedAt).toLocaleDateString()}.
          </Alert>
          <Alert variant="info" title="Rules currently applied">
            {rules.layers.length > 1
              ? `PawPass combined ${rules.layers.join(" + ").replace(/_/g, " ")} guidance for this selection.`
              : region
                ? "The national or federal baseline is shown. A separate reviewed local summary may not yet be published."
                : "The national or federal baseline is shown."}
          </Alert>

          {rules.jurisdictionReviewedAt ? (
            <Alert variant="info" title="Jurisdiction review date">
              This jurisdiction summary was last reviewed against its official sources on {new Date(`${rules.jurisdictionReviewedAt}T00:00:00`).toLocaleDateString()}.
            </Alert>
          ) : null}

          {rules.jurisdictionReviewStatus === "baseline_only" ? (
            <Alert variant="warn" title="Detailed jurisdiction review pending">
              PawPass has not yet completed a source-by-source review for this state, province, or territory. The national baseline and official sources are shown without guessing at local rights.
            </Alert>
          ) : null}

          {rules.rightsSections?.map(section => (
            <Card key={section.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: Spacing[2], marginBottom: Spacing[2] }}>
                <PawText variant="h3">{section.title}</PawText>
                <PawText variant="micro" color={section.status === "verified" ? Colors.accent : section.status === "pending" ? Colors.warn : Colors.info}>
                  {section.status === "verified" ? "VERIFIED" : section.status === "pending" ? "REVIEW PENDING" : "BASELINE"}
                </PawText>
              </View>
              <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>{section.summary}</PawText>
              {section.bullets.map((bullet, index) => (
                <PawText key={index} variant="body" color={Colors.muted} style={{ lineHeight: 22, marginTop: Spacing[2] }}>• {bullet}</PawText>
              ))}
              {section.citations.map((citation, index) => citation.url ? (
                <TouchableOpacity key={`${citation.ref}-${index}`} onPress={() => Linking.openURL(citation.url!)} style={{ paddingTop: Spacing[3] }}>
                  <PawText variant="caption" color={Colors.info} weight="semibold">{citation.label ?? citation.ref} →</PawText>
                </TouchableOpacity>
              ) : null)}
            </Card>
          ))}

          {rules.allowedQuestions.length ? <Card>
            <PawText variant="label" color={Colors.accent} style={{ marginBottom: Spacing[2] }}>QUESTIONS OR INFORMATION A BUSINESS MAY REQUEST</PawText>
            {rules.allowedQuestions.map((item, index) => (
              <PawText key={item.id ?? index} variant="body" color={Colors.muted} style={{ lineHeight: 22, marginBottom: 6 }}>
                • {item.question}
              </PawText>
            ))}
          </Card> : null}

          {rules.prohibitedActions.length ? <Card>
            <PawText variant="label" color={Colors.danger} style={{ marginBottom: Spacing[2] }}>WHAT A BUSINESS MAY NOT DO</PawText>
            {rules.prohibitedActions.map((item, index) => (
              <View key={item.id ?? index} style={{ marginBottom: Spacing[2] }}>
                <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>• {item.action}</PawText>
                {item.citation ? <PawText variant="micro" color={Colors.dim}>{item.citation}</PawText> : null}
              </View>
            ))}
          </Card> : null}

          <Card style={{ borderColor: Colors.danger, borderWidth: 1 }}>
            <PawText variant="label" color={Colors.danger} style={{ marginBottom: Spacing[2] }}>DOCUMENT AN ACCESS CONCERN</PawText>
            <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>
              Store the date, location and details in PawPass. This may affect the place's PawPass access rating, but it does not begin legal action, mediation, or direct follow-up by PawPass.
            </PawText>
            {rules.escalationGuidance?.map(step => (
              <TouchableOpacity key={step.id} disabled={!step.url} onPress={() => step.url && Linking.openURL(step.url)} style={{ paddingTop: Spacing[3] }}>
                <PawText variant="body" color={step.url ? Colors.info : Colors.muted}>{step.step}{step.url ? " →" : ""}</PawText>
              </TouchableOpacity>
            ))}
            <View style={{ marginTop: Spacing[3] }}>
              <Button onPress={() => router.push("/complaint/new")} fullWidth>Document an access concern</Button>
            </View>
          </Card>

          {rules.citations?.length ? (
            <Card>
              <PawText variant="label" color={Colors.info} style={{ marginBottom: Spacing[2] }}>OFFICIAL SOURCES</PawText>
              {rules.citations.map((citation, index) => (
                <TouchableOpacity
                  key={`${citation.ref}-${index}`}
                  disabled={!citation.url}
                  onPress={() => citation.url && Linking.openURL(citation.url)}
                  style={{ paddingVertical: Spacing[2] }}
                >
                  <PawText variant="body" color={citation.url ? Colors.info : Colors.muted} weight="semibold">
                    {citation.label ?? citation.ref}{citation.url ? " →" : ""}
                  </PawText>
                </TouchableOpacity>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
