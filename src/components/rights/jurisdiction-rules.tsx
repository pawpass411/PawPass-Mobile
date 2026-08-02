import { useState } from "react";
import { Linking, Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { api, EffectiveRules } from "../../lib/api";
import { COUNTRIES, CountryCode, REGIONS } from "../../lib/jurisdictions";
import { Colors, Radius, Spacing } from "../../lib/theme";
import { Alert, Button, Card, PawText } from "../ui";

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
  const countryMeta = COUNTRIES.find(item => item.code === country)!;

  const loadRules = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.rules.effective({ country, state: region || undefined });
      setRules(data.rules);
    } catch (caught) {
      setRules(null);
      setError(caught instanceof Error ? caught.message : "Rights information is unavailable right now.");
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
          <Alert variant="info" title="Rules currently applied">
            {rules.layers.length > 1
              ? `PawPass combined ${rules.layers.join(" + ").replace(/_/g, " ")} guidance for this selection.`
              : region
                ? "The national or federal baseline is shown. A separate reviewed local summary may not yet be published."
                : "The national or federal baseline is shown."}
          </Alert>

          <Card>
            <PawText variant="label" color={Colors.accent} style={{ marginBottom: Spacing[2] }}>QUESTIONS A BUSINESS MAY ASK</PawText>
            {rules.allowedQuestions.map((item, index) => (
              <PawText key={item.id ?? index} variant="body" color={Colors.muted} style={{ lineHeight: 22, marginBottom: 6 }}>
                • {item.question}
              </PawText>
            ))}
          </Card>

          <Card>
            <PawText variant="label" color={Colors.danger} style={{ marginBottom: Spacing[2] }}>WHAT A BUSINESS MAY NOT DO</PawText>
            {rules.prohibitedActions.map((item, index) => (
              <View key={item.id ?? index} style={{ marginBottom: Spacing[2] }}>
                <PawText variant="body" color={Colors.muted} style={{ lineHeight: 22 }}>• {item.action}</PawText>
                {item.citation ? <PawText variant="micro" color={Colors.dim}>{item.citation}</PawText> : null}
              </View>
            ))}
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
