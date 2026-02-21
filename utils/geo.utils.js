export const GRID_SIZE = 0.02; // ~2km buffer

export const latLngToGrid = (lat, lng, size = 0.05) => {
  const latIdx = Math.floor(lat / size + 1e-10);
  const lngIdx = Math.floor(lng / size + 1e-10);
  return `${latIdx}_${lngIdx}`;
};
