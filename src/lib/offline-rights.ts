import AsyncStorage from "@react-native-async-storage/async-storage";
import { EffectiveRules } from "./api";
import { sditSourceUrl, US_SDIT_LAWS } from "./us-sdit-laws";
import { bundledCanadianRules, CANADA_RIGHTS_REVIEWED_AT } from "./canadian-rights";
import { bundledUkRules } from "./uk-rights";

export const BUNDLED_RIGHTS_UPDATED_AT = CANADA_RIGHTS_REVIEWED_AT;
const CACHE_PREFIX = "pawpass:rights:v1:";

export type StoredRules = { rules: EffectiveRules; updatedAt: string };

const sources = {
  US: [
    { ref:"U.S. Department of Justice — Service Animals", url:"https://www.ada.gov/topics/service-animals/" },
    { ref:"ADA Service Animal FAQs", url:"https://www.ada.gov/resources/service-animals-faqs/" },
  ],
  CA: [
    { ref:"Government of Canada — Accessible Canada Act", url:"https://www.canada.ca/en/employment-social-development/programs/accessible-canada/act-summary.html" },
    { ref:"Canadian Transportation Agency — Service dogs guide", url:"https://otc-cta.gc.ca/eng/publication/service-dogs-a-guide" },
  ],
  GB: [
    { ref:"Equality and Human Rights Commission — Assistance dogs", url:"https://www.equalityhumanrights.com/guidance/assistance-dogs-guide-businesses-and-service-providers" },
    { ref:"GOV.UK — Equality Act 2010 guidance", url:"https://www.gov.uk/guidance/equality-act-2010-guidance" },
  ],
} as const;

export function bundledRules(country:"US"|"CA"|"GB", state?:string): EffectiveRules {
  if (country === "CA") {
    const canadian = bundledCanadianRules(state);
    if (canadian) return canadian;
  }
  if (country === "GB") {
    const uk = bundledUkRules(state);
    if (uk) return uk;
  }
  const isColorado = country === "US" && state === "CO";
  const isDistrictOfColumbia = country === "US" && state === "DC";
  const stateTrainerLaw = country === "US" && state ? US_SDIT_LAWS[state] : undefined;
  const hasStateTrainerLaw = stateTrainerLaw?.scope !== "none" && Boolean(stateTrainerLaw);
  const citations = [...sources[country]];
  const publicSummary = country === "US"
    ? "Federal ADA public-access rules apply to trained service dogs used by a person with a disability. State law may add protections."
    : country === "CA"
      ? "Public access is primarily governed by provincial or territorial human-rights and accessibility law; federal rules cover federally regulated organizations."
      : state === "NIR"
        ? "Northern Ireland uses separate disability-discrimination legislation and reasonable-adjustment duties."
        : "The Equality Act 2010 requires service providers to avoid disability discrimination and consider reasonable adjustments.";
  const trainingSummary = stateTrainerLaw
    ? stateTrainerLaw.scope === "none"
      ? "The federal ADA does not cover service animals in training, and no statewide trainer-access statute is currently identified for this jurisdiction."
      : `${stateTrainerLaw.trainer} ${stateTrainerLaw.scope === "restricted" ? "Access is conditional or limited under this state law." : "State law provides public-access protection while training."}`
        : country === "US" && state === "HI"
          ? "The federal ADA does not cover service animals in training, and the current national state-law tracker does not identify a Hawaii trainer-access statute. A business may still grant permission voluntarily."
    : country === "US"
      ? "The federal ADA does not require public accommodations to admit service animals in training. State law may provide broader protection; detailed review for this state may still be pending."
      : country === "CA"
        ? "Service-animal-in-training access varies by province or territory. Check the applicable local law and official source."
        : "There is not one universal UK public-access rule for every assistance dog in training; confirm the nation and setting.";
  const allowedQuestions = country === "US" ? [
    { id:"us-q1", question:"Is the dog a service animal required because of a disability?" },
    { id:"us-q2", question:"What work or task has the dog been trained to perform?" },
  ] : [];
  const prohibitedActions = country === "US" ? [
    { id:"us-p1", action:"Require certification, registration, or an ID card as a condition of entry", citation:"28 CFR 36.302(c)" },
    { id:"us-p2", action:"Ask about the nature or extent of the person's disability", citation:"28 CFR 36.302(c)" },
    { id:"us-p3", action:"Require the dog to demonstrate its task", citation:"28 CFR 36.302(c)" },
    { id:"us-p4", action:"Charge a pet fee or deposit for a service animal", citation:"28 CFR 36.302(c)(3)" },
  ] : [];
  const sections: EffectiveRules["rightsSections"] = [
    { id:"public_access", title:"Public places", summary:publicSummary, bullets:allowedQuestions.map(item => item.question), citations, status:state ? "pending" : "baseline" },
    { id:"in_training", title:"Service animals in training", summary:trainingSummary, bullets:stateTrainerLaw ? [stateTrainerLaw.conditions, `Citation: ${stateTrainerLaw.citation}`, stateTrainerLaw.scope === "restricted" ? "This provision may not cover every owner-trainer. Confirm that you meet the statutory trainer definition before relying on access." : "The animal remains subject to applicable control, behavior, safety, and damage-liability rules."].filter((item):item is string => Boolean(item)) : [], citations:stateTrainerLaw ? [{ref:stateTrainerLaw.citation,url:sditSourceUrl(stateTrainerLaw)}] : [], status:stateTrainerLaw ? "verified" : "pending" },
  ];
  if (country === "US") sections.push(
    { id:"housing", title:"Housing", summary:"Housing rights are separate from ordinary ADA public access and can involve the Fair Housing Act, Section 504, state law, and individual accommodation facts.", bullets:["HUD changed its Fair Housing Act enforcement approach in May 2026.", "Private court claims and state or local protections may differ from HUD's enforcement approach."], citations:[{ref:"HUD — Assistance Animals",url:"https://www.hud.gov/helping-americans/assistance-animals"}], status:"verified" },
    { id:"employment", title:"Workplace", summary:"A service animal at work is generally considered through the ADA Title I reasonable-accommodation process.", bullets:["Employees may request a disability-related accommodation.", "The employer and employee should engage in an interactive process."], citations:[{ref:"EEOC — Reasonable Accommodation",url:"https://www.eeoc.gov/laws/guidance/enforcement-guidance-reasonable-accommodation-and-undue-hardship-under-ada"}], status:"verified" },
    { id:"air_travel", title:"Air travel", summary:"Air travel is governed by the Air Carrier Access Act and Department of Transportation rules, not ordinary ADA public-access rules.", bullets:["Airlines recognize qualifying trained service dogs under DOT rules.", "Airlines may require applicable U.S. DOT forms."], citations:[{ref:"U.S. DOT — Service Animals",url:"https://www.transportation.gov/individuals/aviation-consumer-protection/final-rule-traveling-air-service-animals"}], status:"verified" },
    { id:"education", title:"Schools and government programs", summary:"Schools and government programs may involve ADA Title II, Section 504, IDEA, and state law.", bullets:[], citations:[...sources.US], status:"baseline" },
  );
  return { jurisdiction:{country,state:state || null,county:null,city:null}, allowedQuestions, prohibitedActions, citations, notes:["Bundled PawPass educational summary. Official-source links require internet."], layers:isColorado || isDistrictOfColumbia || hasStateTrainerLaw ? ["FEDERAL","STATE"] : ["FEDERAL"], jurisdictionReviewStatus:isColorado || isDistrictOfColumbia ? "verified" : state ? "partial" : "partial", rightsSections:sections };
}

export async function readStoredRules(country:string, state?:string): Promise<StoredRules|null> {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${country}:${state || "national"}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredRules; } catch { return null; }
}

export async function storeRules(country:string, state:string|undefined, rules:EffectiveRules) {
  const stored = { rules, updatedAt:new Date().toISOString() };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${country}:${state || "national"}`, JSON.stringify(stored));
  return stored;
}
