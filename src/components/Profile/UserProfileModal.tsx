import { User } from '../../types/index.ts';
import { X, MessageCircle, Hand, MapPin, Briefcase, Star, Sparkles, Mail, AtSign } from 'lucide-react';
import { formatDistance } from '../../utils/geo.ts';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onStartChat: (user: User) => void;
  onWaveUser: (user: User) => void;
  onToggleFriend: (user: User) => void;
}

export function UserProfileModal({
  user,
  onClose,
  onStartChat,
  onWaveUser,
  onToggleFriend,
}: UserProfileModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner with Close button */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar floating over banner */}
          <div className="relative -mt-14 mb-3 flex items-end justify-between">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-900 shadow-xl"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                }`}
                title={user.isOnline ? 'Online now' : 'Offline'}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFriend(user)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  user.isFriend
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={user.isFriend ? 'Connected' : 'Add to connections'}
              >
                <Star className={`w-4 h-4 ${user.isFriend ? 'fill-amber-400' : ''}`} />
              </button>
              <button
                onClick={() => onWaveUser(user)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Hand className="w-4 h-4" />
                <span>Wave</span>
              </button>
            </div>
          </div>

          {/* User names & handle */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{user.name}</span>
            </h2>
            <div className="text-xs text-indigo-400 font-medium">@{user.username}</div>
          </div>

          {/* Status quote card */}
          {user.statusMessage && (
            <div className="my-3 px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 italic flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>"{user.statusMessage}"</span>
            </div>
          )}

          {/* Location & Details specs */}
          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="truncate">
                <div className="text-slate-400 text-[10px]">Location</div>
                <div className="font-semibold text-slate-200 truncate">
                  {user.neighborhood ? `${user.neighborhood}, ${user.city}` : user.city}
                </div>
                {user.distanceKm !== undefined && (
                  <div className="text-[10px] text-indigo-400">{formatDistance(user.distanceKm)}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
              <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <div className="text-slate-400 text-[10px]">Occupation / Role</div>
                <div className="font-semibold text-slate-200 truncate">
                  {user.occupation || 'Member'}
                </div>
                <div className="text-[10px] text-emerald-400">
                  {user.isOnline ? 'Online now' : user.lastActive}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="my-3">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">About</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                {user.bio}
              </p>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onStartChat(user);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Live Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
