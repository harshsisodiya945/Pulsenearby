import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, X, Sparkles, Navigation } from 'lucide-react';
import { POPULAR_CITIES } from '../../utils/geo.ts';
import { CityHub } from '../../types/index.ts';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  locationQuery: string;
  onLocationChange: (loc: string) => void;
  radiusKm: number;
  onRadiusChange: (r: number) => void;
  onlineOnly: boolean;
  onOnlineOnlyChange: (online: boolean) => void;
  onSelectCityHub: (hub: CityHub) => void;
  onUseCurrentLocation: () => void;
  isDetectingLocation: boolean;
  totalFound: number;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  locationQuery,
  onLocationChange,
  radiusKm,
  onRadiusChange,
  onlineOnly,
  onOnlineOnlyChange,
  onSelectCityHub,
  onUseCurrentLocation,
  isDetectingLocation,
  totalFound,
}: SearchFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 z-20 space-y-2.5">
      {/* Top search inputs row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 max-w-7xl mx-auto">
        {/* Username / Name search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people by username (@handle) or name..."
            className="w-full pl-10 pr-9 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location search input & city selector */}
        <div className="relative flex-1">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Filter location (e.g. Connaught Place, New Delhi, London)..."
            className="w-full pl-10 pr-24 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {locationQuery && (
              <button
                onClick={() => onLocationChange('')}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Pick famous city hub"
            >
              Cities
            </button>
          </div>

          {/* Quick city dropdown modal */}
          {showCityPicker && (
            <div className="absolute left-0 top-full mt-1 w-full sm:w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-40 max-h-72 overflow-y-auto">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Jump to City Hubs
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      onSelectCityHub(city);
                      setShowCityPicker(false);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left hover:bg-indigo-950/70 text-slate-200 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{city.name}</span>
                    <span className="text-[10px] text-slate-500">{city.country}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls: GPS Detect & Filter Drawer Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUseCurrentLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Use device GPS location"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Locating...' : 'GPS Detect'}</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              showFilters || onlineOnly || radiusKm !== 25
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(onlineOnly || radiusKm !== 25) && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded filters panel (Distance & Online toggle only - no interests) */}
      {showFilters && (
        <div className="pt-2 border-t border-slate-800/80 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Radius presets */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">Proximity Radius:</span>
              <div className="flex items-center gap-1.5">
                {[2, 5, 10, 25, 50, 100].map((r) => (
                  <button
                    key={r}
                    onClick={() => onRadiusChange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      radiusKm === r
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Online only toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlineOnly}
                  onChange={(e) => onOnlineOnlyChange(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Online Only
                </span>
              </label>
            </div>

            {/* Total count badge */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong className="text-white">{totalFound}</strong> people found
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
