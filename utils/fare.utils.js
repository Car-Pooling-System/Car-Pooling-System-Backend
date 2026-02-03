import haversine from "haversine-distance";

/**
 * Calculates distance along route between pickup & drop
 */
export function calculateSegmentDistance(routeCoords, pickupIdx, dropIdx) {
  let distance = 0;

  for (let i = pickupIdx; i < dropIdx; i++) {
    const [lng1, lat1] = routeCoords[i];
    const [lng2, lat2] = routeCoords[i + 1];

    distance += haversine(
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 }
    );
  }

  return distance / 1000; // km
}