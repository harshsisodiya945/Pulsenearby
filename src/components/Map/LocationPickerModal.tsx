import { useState } from 'react';
import { User, CityHub } from '../../types/index.ts';
import { X, MapPin, Search, Navigation, CheckCircle2, Globe, Crosshair } from 'lucide-react';
import { geocodeSearch, POPULAR_CITIES } from '../../utils/geo.ts';

interface LocationPickerModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateLocation: (lat: number, lng: number, city: string, neighborhood: string) => void;
  onDetectGPS: () => void;
  isDetectingGPS: boolean;
}

const REGIONAL_CITIES: CityHub[] = [
  { name: 'Indore', country: 'India', latitude: 22.7196, longitude: 75.8577 },
  { name: 'Bhopal', country: 'India', latitude: 23.2599, longitude: 77.4126 },
  { name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { name: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Pune', country: 'India', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Jaipur', country: 'India', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Hyderabad', country: 'India', latitude: 17.385, longitude: 78.4867 },
  { name: 'Ahmedabad', country: 'India', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Kolkata', country: 'India', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Lucknow', country: 'India', latitude: 26.8467, longitude: 80.9462 },
  { name: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794 },
];

export function LocationPickerModal({
  currentUser,
  onClose,
  onUpdateLocation,
  onDetectGPS,
  isDetectingGPS,
}: LocationPickerModalProps) {
  const [searchCity, setSearchCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Manual coordinate inputs
  const [customLat, setCustomLat] = useState(currentUser.latitude.toString());
  const [customLng, setCustomLng] = useState(currentUser.longitude.toString());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchAndSet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchCity.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await geocodeSearch(searchCity.trim());
      if (result) {
        onUpdateLocation(result.latitude, result.longitude, result.city, result.neighborhood || result.city);
        onClose();
      } else {
        setSearchError(`City "${searchCity}" not found. Try entering city name with state (e.g. "Indore, MP").`);
      }
    } catch {
      setSearchError('Error contacting location search service. Please try again or select from the list below.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectQuickCity = (city: CityHub) => {
    onUpdateLocation(city.latitude, city.longitude, city.name, 'Center');
    onClose();
  };

  const handleManualSave = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSearchError('Please enter valid coordinates (-90 to 90 lat, -180 to 180 lng).');
      return;
    }
    onUpdateLocation(Number(lat.toFixed(6)), Number(lng.toFixed(6)), currentUser.city, 'Custom Spot');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Set Your Exact Location</h2>
              <p className="text-xs text-slate-400">
                Currently set to: <strong className="text-indigo-400">{currentUser.city}</strong> ({currentUser.neighborhood || 'Local Area'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice explaining laptop / ISP network location */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Crosshair className="w-4 h-4 shrink-0" />
            <span>Why laptops detect the wrong city:</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Computers and home Wi-Fi do not have GPS chips. Internet providers (Jio, Airtel, etc.) route your connection through central servers (often New Delhi or Mumbai). Type your true city below to set your spot in 1 click!
          </p>
        </div>

        {/* City Search Form */}
        <form onSubmit={handleSearchAndSet} className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Search Your City or Area</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="e.g. Indore, Bhopal, Vijay Nagar, Pune, Jaipur..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching || !searchCity.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {isSearching ? 'Finding...' : 'Set City'}
            </button>
          </div>
          {searchError && <p className="text-xs text-rose-400 font-medium">{searchError}</p>}
        </form>

        {/* Quick-Pick Popular Indian Cities */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>🇮🇳 Quick Pick Major Indian Cities</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {REGIONAL_CITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSelectQuickCity(c)}
                className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                  currentUser.city.toLowerCase() === c.name.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200'
                }`}
              >
                <span className="truncate">{c.name}</span>
                {currentUser.city.toLowerCase() === c.name.toLowerCase() && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick-Pick Global Cities */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Global Hubs</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CITIES.slice(0, 6).map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSelectQuickCity(c)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {c.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* GPS Hardware Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onDetectGPS();
              onClose();
            }}
            disabled={isDetectingGPS}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetectingGPS ? 'animate-spin' : ''}`} />
            <span>Try Device GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
          >
            {showAdvanced ? 'Hide Coordinates' : 'Manual Lat/Lng'}
          </button>
        </div>

        {/* Manual Latitude / Longitude Inputs */}
        {showAdvanced && (
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300">Exact Coordinates</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Latitude</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Longitude</label>
                <input
                  type="text"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleManualSave}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Apply Coordinates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
