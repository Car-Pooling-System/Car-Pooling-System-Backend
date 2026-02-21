export const GRID_SIZE = 0.02; // ~2km buffer

export const latLngToGrid = (lat, lng, size = 0.05) => {
  const latIdx = Math.floor(lat / size);
  const lngIdx = Math.floor(lng / size);
  return `${latIdx}_${lngIdx}`;
};
