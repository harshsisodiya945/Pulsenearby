import { User, ChatMessage } from '../types/index.ts';
import { calculateDistance } from '../utils/geo.ts';

export const INITIAL_CURRENT_USER: User = {
  id: 'user_harsh_original',
  username: 'harshsisodiya9425',
  name: 'Harsh Sisodiya',
  email: 'harshsisodiya9425@gmail.com',
  password: 'password123',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  bio: 'Fullstack developer exploring social platforms with live location & chat.',
  latitude: 28.6139,
  longitude: 77.2090,
  city: 'New Delhi',
  neighborhood: 'Central',
  isOnline: true,
  lastActive: 'Active now',
  statusMessage: 'Online on PulseNearby',
  age: 24,
  occupation: 'Developer',
};

const STORAGE_USERS_KEY = 'pulsenearby_original_users';
const STORAGE_MESSAGES_KEY = 'pulsenearby_original_messages';
const AUTH_SESSION_KEY = 'pulsenearby_active_session';

/**
 * Retrieve real registered users from storage
 */
export function getStoredUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [INITIAL_CURRENT_USER];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_CURRENT_USER];
  } catch {
    return [INITIAL_CURRENT_USER];
  }
}

/**
 * Save real users to persistent storage
 */
export function saveStoredUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to storage', err);
  }
}

/**
 * Session storage helpers
 */
export function getSavedSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(user: User | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save session', err);
  }
}

/**
 * Retrieve chat messages from persistent storage
 */
export function getStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save chat messages to persistent storage
 */
export function saveStoredMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save messages to storage', err);
  }
}

/**
 * Calculate dynamic distances for real registered users relative to the given center point
 */
export function calculateUserDistances(
  users: User[],
  centerLat: number,
  centerLng: number
): User[] {
  return users.map((user) => ({
    ...user,
    distanceKm: calculateDistance(centerLat, centerLng, user.latitude, user.longitude),
  }));
}
