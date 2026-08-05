import { bundledUkRules } from "../uk-rights";

describe("bundled UK rights", () => {
  it("contains offline guidance for all UK nations", () => {
    for (const code of ["ENG","SCT","WLS","NIR"]) expect(bundledUkRules(code)).not.toBeNull();
  });

  it("keeps Northern Ireland's legal framework separate", () => {
    const rules=bundledUkRules("NIR")!;
    expect(rules.rightsSections[0].summary).toContain("Disability Discrimination Act 1995");
    expect(rules.rightsSections[0].summary).not.toContain("ADA");
  });
});
