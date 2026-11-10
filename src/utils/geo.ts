import { CityHub } from '../types/index.ts';

/**
 * Calculate distance between two lat/lng coordinates in kilometers using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Pre-defined global cities for quick jump and testing
 */
export const POPULAR_CITIES: CityHub[] = [
  { name: 'San Francisco, CA', country: 'USA', latitude: 37.7749, longitude: -122.4194 },
  { name: 'New York, NY', country: 'USA', latitude: 40.7128, longitude: -74.006 },
  { name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832 },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
];

/**
 * Offsets a coordinate by dx, dy kilometers
 */
export function offsetCoordinates(
  lat: number,
  lng: number,
  dxKm: number,
  dyKm: number
): { latitude: number; longitude: number } {
  // 1 degree latitude ~= 111 km
  const dLat = dyKm / 111;
  // 1 degree longitude ~= 111 * cos(latitude)
  const dLng = dxKm / (111 * Math.cos(toRad(lat)));
  return {
    latitude: Number((lat + dLat).toFixed(6)),
    longitude: Number((lng + dLng).toFixed(6)),
  };
}
