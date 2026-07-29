export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoPosition {
  coords: GeoPoint;
  accuracy: number;
  timestamp: number;
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
 * @returns distancia en metros
 */
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
