import { bundledCanadianRules } from "../canadian-rights";

describe("bundled Canadian rights", () => {
  it("has a province/territory-specific offline summary for all 13 jurisdictions", () => {
    for (const code of ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"]) {
      expect(bundledCanadianRules(code)).not.toBeNull();
    }
  });

  it("uses Nova Scotia's identification and training scheme offline", () => {
    const rules = bundledCanadianRules("NS")!;
    expect(rules.allowedQuestions[0].question).toContain("Nova Scotia identification card");
    expect(rules.rightsSections.find(section => section.id === "in_training")?.summary).toContain("accredited service-dog training school");
    expect(JSON.stringify(rules)).not.toContain("DOJ ADA");
  });
});
