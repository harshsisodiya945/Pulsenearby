import { useState, useMemo, useEffect } from 'react';
import { User, ChatMessage, Conversation, CityHub } from './types/index.ts';
import {
  INITIAL_CURRENT_USER,
  getStoredUsers,
  saveStoredUsers,
  getStoredMessages,
  saveStoredMessages,
  calculateUserDistances,
  getSavedSession,
  saveSession,
} from './data/mockUsers.ts';
import { Navbar, ActiveTab } from './components/Navbar/Navbar.tsx';
import { SearchFilterBar } from './components/Search/SearchFilterBar.tsx';
import { SocialMap } from './components/Map/SocialMap.tsx';
import { PeopleList } from './components/Directory/PeopleList.tsx';
import { ChatDrawer } from './components/Chat/ChatDrawer.tsx';
import { ConversationsList } from './components/Chat/ConversationsList.tsx';
import { UserProfileModal } from './components/Profile/UserProfileModal.tsx';
import { EditProfileModal } from './components/Profile/EditProfileModal.tsx';
import { AddUserModal } from './components/Directory/AddUserModal.tsx';
import { LocationPickerModal } from './components/Map/LocationPickerModal.tsx';
import { LoginPage } from './components/Auth/LoginPage.tsx';
import { sound } from './utils/audio.ts';
import { detectRealLocation, reverseGeocode, geocodeSearch } from './utils/geo.ts';
import { Hand, X, Navigation } from 'lucide-react';

// Normalizes message fields so camelCase senderId/receiverId are guaranteed
function normalizeMessage(m: any): ChatMessage {
  let ts = m.timestamp || m.created_at || '';
  if (typeof ts === 'string' && ts.includes('T')) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      ts = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return {
    id: String(m.id),
    senderId: String(m.senderId || m.sender_id || ''),
    receiverId: String(m.receiverId || m.receiver_id || ''),
    text: String(m.text || m.content || ''),
    timestamp: ts || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: Boolean(m.isRead ?? m.is_read),
    type: m.type || m.message_type || 'text',
  };
}

export default function App() {
  // Authentic registered users
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => getStoredUsers());

  // Current session user (null by default so app asks for login every time)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Authentic chat messages with guaranteed normalization
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getStoredMessages().map(normalizeMessage);
  });

  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');

  // Interactive Modals and Drawers
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [waveToast, setWaveToast] = useState<{ senderName: string; text: string } | null>(null);

  // Sync users & all messages with Express backend on startup
  useEffect(() => {
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRegisteredUsers(data);
          saveStoredUsers(data);
        }
      })
      .catch(() => {});

    fetch('/api/messages')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeMessage);
          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((m) => map.set(m.id, m));
            normalized.forEach((m) => map.set(m.id, m));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize users and messages to storage
  useEffect(() => {
    saveStoredUsers(registeredUsers);
  }, [registeredUsers]);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  // Synchronize active session
  useEffect(() => {
    saveSession(currentUser);
  }, [currentUser]);

  // Attempt to auto-detect true location on startup if still on default New Delhi
  useEffect(() => {
    if (currentUser) {
      const isDefaultDelhi =
        Math.abs(currentUser.latitude - 28.6139) < 0.001 &&
        Math.abs(currentUser.longitude - 77.209) < 0.001;

      if (isDefaultDelhi) {
        handleUseCurrentLocation(true);
      }
    }
  }, []);

  // Dynamically compute distances from current user location to each real user
  const allUsers = useMemo(() => {
    if (!currentUser) return [];
    return calculateUserDistances(registeredUsers, currentUser.latitude, currentUser.longitude);
  }, [registeredUsers, currentUser]);

  // Filtered users matching search criteria (Username, Location, Distance, Online only - no interests)
  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    return allUsers
      .filter((user) => {
        // Exclude current user from nearby list
        if (user.id === currentUser.id) return false;

        // Radius filter
        if (user.distanceKm !== undefined && user.distanceKm > radiusKm) {
          // If searching for a specific distant city or username, allow match
          if (!locationQuery && !searchQuery) return false;
        }

        // Online only filter
        if (onlineOnly && !user.isOnline) {
          return false;
        }

        // Username / Real Name search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim().replace(/^@/, '');
          const matchesUsername = user.username.toLowerCase().includes(q);
          const matchesName = user.name.toLowerCase().includes(q);
          if (!matchesUsername && !matchesName) return false;
        }

        // Location / City search
        if (locationQuery.trim()) {
          const loc = locationQuery.toLowerCase().trim();
          const matchesCity = user.city.toLowerCase().includes(loc);
          const matchesNeigh = user.neighborhood.toLowerCase().includes(loc);
          if (!matchesCity && !matchesNeigh) return false;
        }

        return true;
      })
      .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }, [allUsers, currentUser, radiusKm, onlineOnly, searchQuery, locationQuery]);

  // Compute conversations list
  const conversations: Conversation[] = useMemo(() => {
    if (!currentUser) return [];
    const map = new Map<string, { lastMessage: ChatMessage; unreadCount: number }>();

    messages.forEach((m) => {
      const partnerId = m.senderId === currentUser.id ? m.receiverId : m.senderId;
      const current = map.get(partnerId);
      const isUnread = !m.isRead && m.receiverId === currentUser.id;

      if (!current) {
        map.set(partnerId, {
          lastMessage: m,
          unreadCount: isUnread ? 1 : 0,
        });
      } else {
        current.lastMessage = m;
        if (isUnread) current.unreadCount += 1;
      }
    });

    const list: Conversation[] = [];
    map.forEach((value, partnerId) => {
      const partner = allUsers.find((u) => u.id === partnerId);
      if (partner) {
        list.push({
          user: partner,
          lastMessage: value.lastMessage,
          unreadCount: value.unreadCount,
        });
      }
    });

    return list.sort((a, b) => {
      const parseTime = (ts: string) => {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) return d.getTime();
        const d2 = new Date(`1970/01/01 ${ts}`);
        if (!isNaN(d2.getTime())) return d2.getTime();
        return 0;
      };
      return parseTime(b.lastMessage.timestamp) - parseTime(a.lastMessage.timestamp);
    });
  }, [messages, currentUser, allUsers]);

  // Online count in current area
  const onlineCount = useMemo(() => {
    return allUsers.filter((u) => u.isOnline && (u.distanceKm ?? 999) <= radiusKm).length;
  }, [allUsers, radiusKm]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveSession(user);
    setWaveToast({
      senderName: 'Welcome',
      text: `Logged in as ${user.name} (@${user.username})`,
    });
  };

  const handleRegisterUser = (newUser: User) => {
    setRegisteredUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);

    // Call Express backend
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveSession(null);
    setSelectedUserForChat(null);
    setSelectedUserForProfile(null);
  };

  // Add a new user to platform
  const handleAddUser = (newUser: User) => {
    setRegisteredUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});

    setWaveToast({
      senderName: 'User Added',
      text: `${newUser.name} (@${newUser.username}) added to network!`,
    });
  };

  // Delete a user
  const handleDeleteUser = (id: string) => {
    setRegisteredUsers((prev) => prev.filter((u) => u.id !== id));
    fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  // Real GPS & Network detection handler
  const handleUseCurrentLocation = async (silent = false) => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectRealLocation();
      if (currentUser) {
        const updated: User = {
          ...currentUser,
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: loc.city,
          neighborhood: loc.neighborhood || loc.city,
        };
        setCurrentUser(updated);
        handleRegisterUser(updated);

        fetch(`/api/users/${currentUser.id}/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: loc.latitude,
            longitude: loc.longitude,
            city: loc.city,
            neighborhood: loc.neighborhood,
          }),
        }).catch(() => {});

        setWaveToast({
          senderName: 'Location Detected',
          text: `📍 Set to ${loc.city}${loc.country ? `, ${loc.country}` : ''} (${loc.source === 'gps' ? 'Live GPS' : 'Network IP'})`,
        });
      }
    } catch {
      if (!silent) {
        setWaveToast({
          senderName: 'Location Notice',
          text: 'Could not access GPS. Please allow browser location or click anywhere on the map to set your pin.',
        });
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Jump to searched city/location
  const handleLocationSearch = async (query: string) => {
    if (!query.trim() || !currentUser) return;
    setIsDetectingLocation(true);
    try {
      const result = await geocodeSearch(query);
      if (result) {
        const updated: User = {
          ...currentUser,
          latitude: result.latitude,
          longitude: result.longitude,
          city: result.city,
          neighborhood: result.neighborhood || result.city,
        };
        setCurrentUser(updated);
        handleRegisterUser(updated);

        fetch(`/api/users/${currentUser.id}/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.city,
            neighborhood: result.neighborhood,
          }),
        }).catch(() => {});

        setWaveToast({
          senderName: 'Location Updated',
          text: `📍 Moved to ${result.city}`,
        });
      } else {
        setWaveToast({
          senderName: 'City Not Found',
          text: `Could not find coordinates for "${query}". Try another city name.`,
        });
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Jump to pre-defined global city hub
  const handleSelectCityHub = (city: CityHub) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
      neighborhood: 'Central',
    };
    setCurrentUser(updated);
    handleRegisterUser(updated);
    setLocationQuery('');

    fetch(`/api/users/${currentUser.id}/location`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: city.latitude, longitude: city.longitude, city: city.name }),
    }).catch(() => {});

    setWaveToast({
      senderName: 'City Hub',
      text: `📍 Jumped to ${city.name}`,
    });
  };

  // Relocate current user manually on map click
  const handleChangeUserLocation = async (lat: number, lng: number) => {
    if (!currentUser) return;
    const geo = await reverseGeocode(lat, lng);
    const updated: User = {
      ...currentUser,
      latitude: lat,
      longitude: lng,
      city: geo.city,
      neighborhood: geo.neighborhood,
    };
    setCurrentUser(updated);
    handleRegisterUser(updated);

    fetch(`/api/users/${currentUser.id}/location`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        city: geo.city,
        neighborhood: geo.neighborhood,
      }),
    }).catch(() => {});

    setWaveToast({
      senderName: 'Location Updated',
      text: `📍 Pin set to ${geo.neighborhood}, ${geo.city}`,
    });
  };

  // Chat message sending
  const handleSendMessage = (
    receiverId: string,
    text: string,
    type: 'text' | 'wave' | 'location' = 'text'
  ) => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.id,
      receiverId,
      text,
      timestamp: timeStr,
      isRead: false,
      type,
    };

    setMessages((prev) => [...prev, newMsg]);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId,
        text,
        type,
      }),
    }).catch(() => {});
  };

  // Wave at a user
  const handleWaveUser = (user: User) => {
    if (!currentUser) return;
    sound.playWaveChime();
    handleSendMessage(user.id, `Sent a wave 👋 to ${user.name}!`, 'wave');
    setWaveToast({
      senderName: user.name,
      text: `You waved at ${user.name}!`,
    });
  };

  // Connect / Star user
  const handleToggleFriend = (user: User) => {
    const updated = registeredUsers.map((u) =>
      u.id === user.id ? { ...u, isFriend: !u.isFriend } : u
    );
    setRegisteredUsers(updated);
  };

  // Start chat with user
  const handleStartChat = (user: User) => {
    setSelectedUserForProfile(null);
    setSelectedUserForChat(user);

    if (currentUser) {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user.id && m.receiverId === currentUser.id ? { ...m, isRead: true } : m
        )
      );

      // Fetch thread from backend
      fetch(`/api/messages/${currentUser.id}/${user.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((thread) => {
          if (Array.isArray(thread) && thread.length > 0) {
            const normalizedThread = thread.map(normalizeMessage);
            setMessages((prev) => {
              const other = prev.filter(
                (m) =>
                  !(
                    (m.senderId === currentUser.id && m.receiverId === user.id) ||
                    (m.senderId === user.id && m.receiverId === currentUser.id)
                  )
              );
              return [...other, ...normalizedThread];
            });
          }
        })
        .catch(() => {});
    }
  };

  // Profile save
  const handleSaveProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const next = { ...currentUser, ...updated };
    setCurrentUser(next);
    handleRegisterUser(next);
  };

  // If not authenticated, render Login Page with Real Name, Username, Email, and Password
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenEditProfile={() => setIsEditingProfile(true)}
        onOpenAddUser={() => setIsAddingUser(true)}
        onLogout={handleLogout}
        conversations={conversations}
        onOpenChatWithUser={handleStartChat}
        onlineCount={onlineCount}
        totalNearbyCount={filteredUsers.length}
        onOpenLocationPicker={() => setIsPickingLocation(true)}
      />

      {/* Search & Discovery Filter Bar */}
      {(activeTab === 'map' || activeTab === 'directory') && (
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          locationQuery={locationQuery}
          onLocationChange={setLocationQuery}
          onLocationSearch={handleLocationSearch}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onlineOnly={onlineOnly}
          onOnlineOnlyChange={setOnlineOnly}
          onSelectCityHub={handleSelectCityHub}
          onUseCurrentLocation={() => handleUseCurrentLocation(false)}
          isDetectingLocation={isDetectingLocation}
          totalFound={filteredUsers.length}
        />
      )}

      {/* Real location helper banner if currently on default New Delhi */}
      {currentUser &&
        Math.abs(currentUser.latitude - 28.6139) < 0.001 &&
        Math.abs(currentUser.longitude - 77.209) < 0.001 && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>
                Default location (<strong>New Delhi</strong>) active. On laptops, ISPs often route traffic through Delhi.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPickingLocation(true)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Set My Real City
              </button>
              <button
                onClick={() => handleUseCurrentLocation(false)}
                disabled={isDetectingLocation}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>{isDetectingLocation ? 'Detecting...' : 'Try GPS'}</span>
              </button>
            </div>
          </div>
        )}

      {/* Main Viewport Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'map' && (
          <SocialMap
            currentUser={currentUser}
            users={filteredUsers}
            radiusKm={radiusKm}
            onSelectUser={(u) => setSelectedUserForProfile(u)}
            onStartChat={handleStartChat}
            onWaveUser={handleWaveUser}
            onChangeUserLocation={handleChangeUserLocation}
            onDetectRealLocation={() => handleUseCurrentLocation(false)}
            isDetectingLocation={isDetectingLocation}
            onOpenLocationPicker={() => setIsPickingLocation(true)}
          />
        )}

        {activeTab === 'directory' && (
          <PeopleList
            users={filteredUsers}
            onSelectUser={(u) => setSelectedUserForProfile(u)}
            onStartChat={handleStartChat}
            onWaveUser={handleWaveUser}
            onToggleFriend={handleToggleFriend}
            onDeleteUser={handleDeleteUser}
            onOpenAddUser={() => setIsAddingUser(true)}
            searchQuery={searchQuery}
            locationQuery={locationQuery}
          />
        )}

        {activeTab === 'chats' && (
          <ConversationsList
            conversations={conversations}
            allUsers={allUsers}
            onOpenChat={handleStartChat}
            onExploreMap={() => setActiveTab('map')}
          />
        )}
      </main>

      {/* Slide-over Live Chat Drawer */}
      {selectedUserForChat && (
        <ChatDrawer
          partner={selectedUserForChat}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={() => setSelectedUserForChat(null)}
          onWaveUser={handleWaveUser}
        />
      )}

      {/* User Profile Details Modal */}
      <UserProfileModal
        user={selectedUserForProfile}
        onClose={() => setSelectedUserForProfile(null)}
        onStartChat={handleStartChat}
        onWaveUser={handleWaveUser}
        onToggleFriend={handleToggleFriend}
      />

      {/* Edit Current User Profile Modal */}
      {isEditingProfile && (
        <EditProfileModal
          currentUser={currentUser}
          onSave={handleSaveProfile}
          onClose={() => setIsEditingProfile(false)}
        />
      )}

      {/* Add Real User Modal */}
      {isAddingUser && (
        <AddUserModal
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onClose={() => setIsAddingUser(false)}
        />
      )}

      {/* Location Picker / City Selector Modal */}
      {isPickingLocation && currentUser && (
        <LocationPickerModal
          currentUser={currentUser}
          onClose={() => setIsPickingLocation(false)}
          onUpdateLocation={(lat, lng, city, neighborhood) => {
            const updated: User = {
              ...currentUser,
              latitude: lat,
              longitude: lng,
              city,
              neighborhood,
            };
            setCurrentUser(updated);
            handleRegisterUser(updated);

            fetch(`/api/users/${currentUser.id}/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: lat, longitude: lng, city, neighborhood }),
            }).catch(() => {});

            setWaveToast({
              senderName: 'Location Set',
              text: `📍 Set to ${city}!`,
            });
          }}
          onDetectGPS={() => handleUseCurrentLocation(false)}
          isDetectingGPS={isDetectingLocation}
        />
      )}

      {/* Notification Toast */}
      {waveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-indigo-500/80 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300">
            <Hand className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-indigo-300">{waveToast.senderName}: </span>
            <span className="text-slate-200">{waveToast.text}</span>
          </div>
          <button
            onClick={() => setWaveToast(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
