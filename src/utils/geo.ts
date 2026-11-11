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

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  city: string;
  neighborhood: string;
  country?: string;
  source: 'gps' | 'ip';
}

/**
 * Reverse geocode lat/lng to city and neighborhood using OpenStreetMap Nominatim (Free, no key needed)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; neighborhood: string; country: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error('Geocoding response not ok');
    const data = await res.json();
    const addr = data.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.state_district || 'My City';
    const neighborhood =
      addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.road || 'Local Area';
    const country = addr.country || '';
    return { city, neighborhood, country };
  } catch {
    return { city: 'Local Area', neighborhood: 'My Location', country: '' };
  }
}

/**
 * Forward geocode text search (e.g. "Mumbai", "Indore", "Connaught Place") to coordinates using Nominatim
 */
export async function geocodeSearch(
  query: string
): Promise<{ latitude: number; longitude: number; city: string; neighborhood: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lon = Number(parseFloat(item.lon).toFixed(6));
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.village || addr.state_district || item.name || query;
    const neighborhood = addr.neighbourhood || addr.suburb || addr.road || '';
    return { latitude: lat, longitude: lon, city, neighborhood };
  } catch {
    return null;
  }
}

/**
 * Detect user's true location via Browser Geolocation (high accuracy), falling back to IP-based location
 */
export async function detectRealLocation(): Promise<DetectedLocation> {
  // 1. Try Browser GPS
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        });
      });

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const geo = await reverseGeocode(lat, lng);

      return {
        latitude: lat,
        longitude: lng,
        city: geo.city,
        neighborhood: geo.neighborhood,
        country: geo.country,
        source: 'gps',
      };
    } catch {
      // Browser GPS denied or timed out; fall through to IP fallback
    }
  }

  // 2. Fallback to free IP geolocation (works even if browser GPS is blocked/denied)
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          latitude: Number(data.latitude.toFixed(6)),
          longitude: Number(data.longitude.toFixed(6)),
          city: data.city || data.region || 'Local Area',
          neighborhood: data.region || '',
          country: data.country || '',
          source: 'ip',
        };
      }
    }
  } catch {
    // Both failed
  }

  throw new Error('Unable to determine location automatically');
}

