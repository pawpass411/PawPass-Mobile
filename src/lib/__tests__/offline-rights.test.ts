import { bundledRules } from "../offline-rights";
import { US_SDIT_LAWS } from "../us-sdit-laws";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("bundled offline rights", () => {
  it("includes all 50 states and the District of Columbia", () => {
    expect(Object.keys(US_SDIT_LAWS)).toHaveLength(51);
  });
  it.each(["US", "CA", "GB"] as const)("provides a usable %s national baseline", country => {
    const rules = bundledRules(country);
    expect(rules.jurisdiction.country).toBe(country);
    expect(rules.rightsSections.length).toBeGreaterThanOrEqual(2);
    expect(rules.citations.length).toBeGreaterThan(0);
  });

  it("includes Colorado service-animal-in-training protection", () => {
    const rules = bundledRules("US", "CO");
    const training = rules.rightsSections.find(section => section.id === "in_training");
    expect(rules.layers).toContain("STATE");
    expect(training?.status).toBe("verified");
    expect(training?.summary).toContain("disabled individual");
  });

  it("reports a trainer-access law without overstating unverified conditions", () => {
    const rules = bundledRules("US", "WY");
    expect(rules.jurisdictionReviewStatus).toBe("partial");
    expect(rules.layers).toContain("STATE");
    expect(rules.rightsSections.find(section => section.id === "in_training")?.summary).toContain("public-access protection");
  });

  it("does not claim Hawaii has a trainer-access statute", () => {
    const rules = bundledRules("US", "HI");
    expect(rules.layers).not.toContain("STATE");
    expect(rules.rightsSections.find(section => section.id === "in_training")?.summary).toContain("no statewide trainer-access statute");
  });

  it("shows state-specific restrictions instead of generic access language", () => {
    expect(bundledRules("US", "GA").rightsSections.find(section => section.id === "in_training")?.summary).toContain("agent or employee");
    expect(bundledRules("US", "VA").rightsSections.find(section => section.id === "in_training")?.bullets.join(" ")).toContain("six months");
  });
});
