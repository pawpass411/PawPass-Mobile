import type { ParkListing } from "./api";

function listingPriority(park: ParkListing) {
  if (park.isVerified) return 0;
  if (park.reviewCount > 0) return 1;
  if (park.source === "google_only") return 3;
  return 2;
}

export function sortAndFilterParks(parks: ParkListing[], reviewedOnly: boolean) {
  return parks
    .filter((park) => !reviewedOnly || park.reviewCount > 0)
    .sort((a, b) => {
      const priorityDifference = listingPriority(a) - listingPriority(b);
      if (priorityDifference !== 0) return priorityDifference;

      const aDistance = a.drivingDistanceMiles ?? a.distanceMiles ?? Number.MAX_SAFE_INTEGER;
      const bDistance = b.drivingDistanceMiles ?? b.distanceMiles ?? Number.MAX_SAFE_INTEGER;
      return aDistance - bDistance;
    });
}
