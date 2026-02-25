/**
 * Finds index of closest polyline point to given lat/lng
 * @param {Array<[number, number]>} path - decoded polyline [lng, lat]
 * @param {{lat: number, lng: number}} point
 */
export const findClosestPointIndex = (path, point) => {
  let minDistance = Infinity;
  let closestIndex = -1;

  path.forEach((coord, index) => {
    // coord is [lng, lat]
    const lng = coord[0];
    const lat = coord[1];

    const dLat = lat - point.lat;
    const dLng = lng - point.lng;

    const distance = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};
