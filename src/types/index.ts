export interface User {
  id: string;
  username: string;
  name: string; // Real Name
  email?: string;
  password?: string;
  avatar: string;
  bio: string;
  latitude: number;
  longitude: number;
  city: string;
  neighborhood: string;
  isOnline: boolean;
  lastActive: string;
  statusMessage: string;
  distanceKm?: number;
  isFriend?: boolean;
  age?: number;
  occupation?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  type?: 'text' | 'wave' | 'location';
}

export interface Conversation {
  user: User;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface SearchFilterState {
  searchQuery: string;
  locationQuery: string;
  radiusKm: number;
  onlineOnly: boolean;
}

export interface CityHub {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}
