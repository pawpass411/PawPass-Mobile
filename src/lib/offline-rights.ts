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
    { id:"definitions", title:"Definitions and important distinctions", summary:"Ordinary ADA public access covers trained service dogs. Psychiatric task work qualifies; emotional support alone does not. Trained miniature horses receive a separate reasonable-modification assessment.", bullets:["Direct-threat decisions must be individualized and based on objective evidence, not fear, breed, or stereotypes.", "Housing, employment, air travel, transportation, and education use distinct legal frameworks."], citations:[{ref:"28 CFR 35.104",url:"https://www.ecfr.gov/current/title-28/section-35.104"},{ref:"28 CFR 36.104",url:"https://www.ecfr.gov/current/title-28/section-36.104"}], status:"verified" },
    { id:"housing", title:"Housing", summary:"Housing rights are separate from ordinary ADA public access and can involve the Fair Housing Act, Section 504, state law, and individual accommodation facts.", bullets:["HUD changed its Fair Housing Act enforcement approach in May 2026.", "Private court claims and state or local protections may differ from HUD's enforcement approach."], citations:[{ref:"HUD — Assistance Animals",url:"https://www.hud.gov/helping-americans/assistance-animals"}], status:"verified" },
    { id:"employment", title:"Workplace", summary:"A service animal at work is generally considered through the ADA Title I reasonable-accommodation process.", bullets:["Employees may request a disability-related accommodation.", "The employer and employee should engage in an interactive process."], citations:[{ref:"EEOC — Reasonable Accommodation",url:"https://www.eeoc.gov/laws/guidance/enforcement-guidance-reasonable-accommodation-and-undue-hardship-under-ada"}], status:"verified" },
    { id:"air_travel", title:"Air travel", summary:"Air travel is governed by the Air Carrier Access Act and Department of Transportation rules, not ordinary ADA public-access rules.", bullets:["Airlines recognize qualifying trained service dogs under DOT rules.", "Airlines may require applicable U.S. DOT forms."], citations:[{ref:"U.S. DOT — Service Animals",url:"https://www.transportation.gov/individuals/aviation-consumer-protection/final-rule-traveling-air-service-animals"}], status:"verified" },
    { id:"education", title:"Schools and government programs", summary:"Schools and government programs may involve ADA Title II, Section 504, IDEA, and state law.", bullets:["Public schools are generally covered by ADA Title II and Section 504.", "An individual student's education plan and requested accommodation remain fact-specific."], citations:[...sources.US,{ref:"U.S. Department of Education - Section 504",url:"https://www.ed.gov/laws-and-policy/individuals-disabilities/section-504"}], status:"baseline" },
    { id:"public_transit", title:"Public transportation", summary:"ADA transportation rules separately require covered public transportation providers to permit service animals in vehicles and facilities.", bullets:["This includes covered bus, rail, and paratransit services.", "Airline travel follows different federal rules."], citations:[{ref:"49 CFR 37.167(d)",url:"https://www.ecfr.gov/current/title-49/section-37.167"}], status:"verified" },
    { id:"federal_property", title:"Certain federal facilities", summary:"Some federal facilities have agency-specific service-animal provisions; these are not general rules for every public or private property.", bullets:["36 CFR 1280.6 applies specifically to NARA facilities.", "6 CFR 139.80 applies to federal property covered by that DHS regulation."], citations:[{ref:"36 CFR 1280.6",url:"https://www.ecfr.gov/current/title-36/section-1280.6"},{ref:"6 CFR 139.80",url:"https://www.ecfr.gov/current/title-6/section-139.80"}], status:"verified" },
    { id:"disaster_assistance", title:"Disaster assistance", summary:"FEMA's Individuals and Households Program can include eligible assistance for loss or injury of a service animal. This is not a general public-access rule.", bullets:["Eligibility depends on the declared disaster and FEMA program requirements."], citations:[{ref:"44 CFR 206.119(b)(3)(iv)",url:"https://www.ecfr.gov/current/title-44/section-206.119"}], status:"verified" },
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
