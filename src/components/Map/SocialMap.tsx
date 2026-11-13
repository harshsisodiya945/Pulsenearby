import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { User } from '../../types/index.ts';
import { Locate, Layers, Navigation, MessageCircle, Hand, UserCheck, Shield, MapPin } from 'lucide-react';

interface SocialMapProps {
  currentUser: User;
  users: User[];
  radiusKm: number;
  onSelectUser: (user: User) => void;
  onStartChat: (user: User) => void;
  onWaveUser: (user: User) => void;
  onChangeUserLocation: (lat: number, lng: number) => void;
  onDetectRealLocation?: () => void;
  isDetectingLocation?: boolean;
  onOpenLocationPicker?: () => void;
}

type MapTheme = 'dark' | 'light' | 'streets';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function SocialMap({
  currentUser,
  users,
  radiusKm,
  onSelectUser,
  onStartChat,
  onWaveUser,
  onChangeUserLocation,
  onDetectRealLocation,
  isDetectingLocation,
  onOpenLocationPicker,
}: SocialMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [isRelocating, setIsRelocating] = useState(false);
  const [isRadarSweeping, setIsRadarSweeping] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentUser.latitude, currentUser.longitude],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer based on theme (Ultra-fast CDN tiles, 100% free, NO API KEY)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Remove dark-tiles CSS filter class before reapplying
    container.classList.remove('dark-tiles');

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    let attribution = '&copy; <a href="https://www.esri.com/">Esri</a> contributors';
    let maxZoom = 19;

    if (mapTheme === 'dark') {
      // Hardware-accelerated night theme
      container.classList.add('dark-tiles');
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    } else if (mapTheme === 'streets') {
      // High-speed Akamai edge CDN street map (ultra-fast in India and globally)
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; <a href="https://www.esri.com/">Esri</a>';
    } else if (mapTheme === 'light') {
      // Clean standard OpenStreetMap
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    }

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom,
      subdomains: ['a', 'b', 'c'],
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(map);
  }, [mapTheme]);

  // Handle map click for relocation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isRelocating) {
        onChangeUserLocation(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        setIsRelocating(false);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isRelocating, onChangeUserLocation]);

  // Smoothly animate map when current user coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([currentUser.latitude, currentUser.longitude], map.getZoom() || 14, {
      duration: 1.2,
    });
  }, [currentUser.latitude, currentUser.longitude]);

  // Update Markers and Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Draw Radius Circle around Current User
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
    }

    const radiusMeters = radiusKm * 1000;
    radiusCircleRef.current = L.circle([currentUser.latitude, currentUser.longitude], {
      radius: radiusMeters,
      color: '#6366f1',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#4f46e5',
      fillOpacity: 0.08,
      dashArray: '5, 8',
    }).addTo(map);

    // 2. Add Current User Marker (DRAGGABLE: Click and drag anywhere!)
    const currentUserIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group">
          ${
            isRadarSweeping
              ? `<div class="absolute w-24 h-24 rounded-full border-2 border-indigo-500/40 bg-indigo-500/10 animate-radar pointer-events-none"></div>`
              : ''
          }
          <div class="absolute w-12 h-12 rounded-full bg-indigo-600/30 animate-ping-subtle"></div>
          <div class="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl ring-2 ring-indigo-400">
            <img src="${currentUser.avatar}" alt="${currentUser.name}" class="w-full h-full object-cover rounded-full pointer-events-none" />
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </div>
          <div class="absolute -top-7 px-2 py-0.5 bg-indigo-600 text-[10px] font-bold text-white rounded-full shadow-lg whitespace-nowrap flex items-center gap-1">
            <span>YOU</span>
            <span class="text-[9px] text-indigo-200 font-normal opacity-90">(Drag Me)</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const currentMarker = L.marker([currentUser.latitude, currentUser.longitude], {
      icon: currentUserIcon,
      zIndexOffset: 1000,
      draggable: true,
    }).addTo(markersLayer);

    currentMarker.on('dragend', (e) => {
      const target = e.target as L.Marker;
      const latlng = target.getLatLng();
      onChangeUserLocation(Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6)));
    });

    currentMarker.bindPopup(`
      <div class="p-3 w-64 text-slate-100 bg-slate-900 rounded-xl">
        <div class="flex items-center gap-2 mb-2">
          <img src="${escapeHtml(currentUser.avatar)}" class="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500" />
          <div>
            <div class="font-bold text-sm text-white">${escapeHtml(currentUser.name)} (You)</div>
            <div class="text-[11px] text-indigo-400">@${escapeHtml(currentUser.username)}</div>
          </div>
        </div>
        <p class="text-xs text-slate-300 italic mb-2">"${escapeHtml(currentUser.statusMessage)}"</p>
        <div class="text-[11px] text-slate-400 flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Broadcasting location in ${escapeHtml(currentUser.neighborhood || currentUser.city)}</span>
        </div>
      </div>
    `);

    // 3. Add Nearby Users Markers
    users.forEach((user) => {
      const isOnline = user.isOnline;
      const distStr = user.distanceKm !== undefined ? (user.distanceKm < 1 ? `${Math.round(user.distanceKm * 1000)}m` : `${user.distanceKm.toFixed(1)}km`) : '';

      const markerHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 group">
          ${isOnline ? '<div class="absolute w-10 h-10 rounded-full bg-emerald-500/20 animate-ping-subtle"></div>' : ''}
          <div class="relative w-10 h-10 rounded-full p-0.5 ${
            isOnline
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-2 ring-emerald-400/80 shadow-emerald-500/20'
              : 'bg-slate-700 ring-1 ring-slate-600'
          } shadow-lg">
            <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" class="w-full h-full object-cover rounded-full" />
            <span class="absolute bottom-0 right-0 w-3 h-3 ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'} border-2 border-slate-900 rounded-full"></span>
          </div>
          <div class="absolute -top-7 px-2 py-0.5 bg-slate-900/90 border border-slate-700/80 text-[10px] font-medium text-slate-200 rounded-md shadow-md whitespace-nowrap flex items-center gap-1 group-hover:bg-indigo-950 group-hover:border-indigo-500">
            <span>${escapeHtml(user.name.split(' ')[0])}</span>
            ${distStr ? `<span class="text-indigo-400 font-semibold">• ${escapeHtml(distStr)}</span>` : ''}
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'custom-nearby-marker',
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([user.latitude, user.longitude], {
        icon: userIcon,
      }).addTo(markersLayer);

      // Create interactive popup element
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3 w-64 text-slate-100 bg-slate-900 rounded-xl space-y-2.5';
      popupDiv.innerHTML = `
        <div class="flex items-center gap-2.5 cursor-pointer" id="popup-profile-${escapeHtml(user.id)}">
          <img src="${escapeHtml(user.avatar)}" class="w-10 h-10 rounded-full object-cover ring-2 ${isOnline ? 'ring-emerald-500' : 'ring-slate-600'}" />
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-white truncate flex items-center gap-1">
              <span>${escapeHtml(user.name)}</span>
              ${user.isFriend ? '<span class="text-xs text-amber-400" title="Connected">★</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-1">
              <span>@${escapeHtml(user.username)}</span>
              <span>•</span>
              <span class="text-indigo-400 font-semibold">${escapeHtml(distStr || 'Near you')}</span>
            </div>
          </div>
        </div>
        <p class="text-xs text-slate-300 italic line-clamp-2">"${escapeHtml(user.statusMessage || user.bio)}"</p>
        <div class="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button id="btn-chat-${escapeHtml(user.id)}" class="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Chat Live
          </button>
          <button id="btn-wave-${escapeHtml(user.id)}" class="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer" title="Send a Wave">
            👋 Wave
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const btnChat = document.getElementById(`btn-chat-${user.id}`);
        const btnWave = document.getElementById(`btn-wave-${user.id}`);
        const profileLink = document.getElementById(`popup-profile-${user.id}`);

        if (btnChat) {
          btnChat.onclick = () => {
            onStartChat(user);
            map.closePopup();
          };
        }
        if (btnWave) {
          btnWave.onclick = () => {
            onWaveUser(user);
          };
        }
        if (profileLink) {
          profileLink.onclick = () => {
            onSelectUser(user);
          };
        }
      });
    });
  }, [currentUser, users, radiusKm, isRadarSweeping, onSelectUser, onStartChat, onWaveUser]);

  // Center map on user
  const handleCenterOnMe = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentUser.latitude, currentUser.longitude], 15, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Relocation prompt banner */}
      {isRelocating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-indigo-600/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-indigo-400 animate-pulse text-xs md:text-sm font-medium">
          <Navigation className="w-4 h-4" />
          <span>Click anywhere on the map to set your new location</span>
          <button
            onClick={() => setIsRelocating(false)}
            className="ml-2 px-2 py-0.5 bg-black/30 hover:bg-black/50 rounded-full text-xs cursor-pointer font-semibold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Map Controls overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Set Exact Location Modal */}
        {onOpenLocationPicker && (
          <button
            onClick={onOpenLocationPicker}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-rose-400 border border-slate-700/80 shadow-lg backdrop-blur-sm transition-all cursor-pointer group"
            title="Set your exact city or area"
          >
            <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Detect Real Location */}
        {onDetectRealLocation && (
          <button
            onClick={onDetectRealLocation}
            disabled={isDetectingLocation}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 shadow-lg backdrop-blur-sm transition-all cursor-pointer group disabled:opacity-50"
            title="Detect My Real Live Location (GPS & IP)"
          >
            <Navigation className={`w-5 h-5 text-white ${isDetectingLocation ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`} />
          </button>
        )}

        {/* Center on Me */}
        <button
          onClick={handleCenterOnMe}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-sm transition-all cursor-pointer group"
          title="Center on my location"
        >
          <Locate className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-400" />
        </button>

        {/* Relocate Mode */}
        <button
          onClick={() => setIsRelocating(!isRelocating)}
          className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all cursor-pointer ${
            isRelocating
              ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
          }`}
          title="Change location pin"
        >
          <Navigation className="w-5 h-5 text-amber-400" />
        </button>

        {/* Radar Toggle */}
        <button
          onClick={() => setIsRadarSweeping(!isRadarSweeping)}
          className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all cursor-pointer ${
            isRadarSweeping
              ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
          }`}
          title={isRadarSweeping ? 'Radar pulse active' : 'Radar pulse paused'}
        >
          <div className="relative">
            <Shield className="w-5 h-5" />
            {isRadarSweeping && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
        </button>

        {/* Theme selector */}
        <div className="relative group">
          <button
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
            title="Map Tiles Theme"
          >
            <Layers className="w-5 h-5 text-cyan-400" />
          </button>
          <div className="hidden group-hover:flex flex-col absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl z-30 min-w-[120px]">
            <button
              onClick={() => setMapTheme('dark')}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                mapTheme === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              🌙 Night Dark
            </button>
            <button
              onClick={() => setMapTheme('light')}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                mapTheme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              ☀️ Clean Light
            </button>
            <button
              onClick={() => setMapTheme('streets')}
              className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                mapTheme === 'streets' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              🗺️ OpenStreet
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Map Status pill */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md text-xs text-slate-300">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-white">{users.filter((u) => u.isOnline).length}</span>
        <span>people online nearby</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Radius: {radiusKm} km</span>
      </div>
    </div>
  );
}
