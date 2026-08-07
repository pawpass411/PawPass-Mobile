import type { ParkListing } from "../api";
import { sortAndFilterParks } from "../park-listing";

function park(overrides: Partial<ParkListing>): ParkListing {
  return {
    id: overrides.id ?? "park",
    name: overrides.name ?? "Test Park",
    city: overrides.city ?? "Denver",
    state: overrides.state ?? "CO",
    lat: overrides.lat ?? 39.7392,
    lng: overrides.lng ?? -104.9903,
    reviewCount: overrides.reviewCount ?? 0,
    isVerified: overrides.isVerified ?? false,
    source: overrides.source ?? "pawpass",
    ...overrides,
  } as ParkListing;
}

describe("sortAndFilterParks", () => {
  it("places verified and PawPass-reviewed parks before unrated listings", () => {
    const results = sortAndFilterParks([
      park({ id: "google", source: "google_only", distanceMiles: 1 }),
      park({ id: "unrated", distanceMiles: 2 }),
      park({ id: "reviewed", reviewCount: 1, distanceMiles: 20 }),
      park({ id: "verified", isVerified: true, distanceMiles: 50 }),
    ], false);

    expect(results.map((result) => result.id)).toEqual(["verified", "reviewed", "unrated", "google"]);
  });

  it("sorts parks with equal priority by driving distance", () => {
    const results = sortAndFilterParks([
      park({ id: "far", reviewCount: 1, drivingDistanceMiles: 30 }),
      park({ id: "near", reviewCount: 1, drivingDistanceMiles: 4 }),
    ], false);

    expect(results.map((result) => result.id)).toEqual(["near", "far"]);
  });

  it("shows only PawPass-reviewed parks when the Reviewed filter is enabled", () => {
    const results = sortAndFilterParks([
      park({ id: "unrated" }),
      park({ id: "reviewed", reviewCount: 2 }),
    ], true);

    expect(results.map((result) => result.id)).toEqual(["reviewed"]);
  });

  it("does not mutate the API result array", () => {
    const original = [
      park({ id: "far", reviewCount: 1, distanceMiles: 10 }),
      park({ id: "near", reviewCount: 1, distanceMiles: 1 }),
    ];

    sortAndFilterParks(original, false);
    expect(original.map((result) => result.id)).toEqual(["far", "near"]);
  });
});
