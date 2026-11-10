import { User } from '../../types/index.ts';
import { MessageCircle, Hand, MapPin, Star, UserPlus, Filter, Trash2 } from 'lucide-react';
import { formatDistance } from '../../utils/geo.ts';

interface PeopleListProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onStartChat: (user: User) => void;
  onWaveUser: (user: User) => void;
  onToggleFriend: (user: User) => void;
  onDeleteUser?: (id: string) => void;
  onOpenAddUser: () => void;
  searchQuery: string;
  locationQuery: string;
}

export function PeopleList({
  users,
  onSelectUser,
  onStartChat,
  onWaveUser,
  onToggleFriend,
  onDeleteUser,
  onOpenAddUser,
  searchQuery,
  locationQuery,
}: PeopleListProps) {
  if (users.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/60">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Filter className="w-8 h-8 text-indigo-400/60" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No other people found</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          {searchQuery || locationQuery
            ? `No users match "${searchQuery || locationQuery}". Try adjusting your search query.`
            : 'No other people are registered yet in this area. You can add people to the social network.'}
        </p>
        <button
          onClick={onOpenAddUser}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Person</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/60">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span>People in Network</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-xs font-bold border border-slate-700">
              {users.length}
            </span>
          </h2>
          <button
            onClick={onOpenAddUser}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Person</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const distStr = user.distanceKm !== undefined ? formatDistance(user.distanceKm) : user.city;
            return (
              <div
                key={user.id}
                className="bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-4 shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top row: Avatar, Info, Connect */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      onClick={() => onSelectUser(user)}
                      className="flex items-center gap-3 cursor-pointer min-w-0"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800 group-hover:ring-indigo-500 transition-all"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                            user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.isFriend && <span className="text-amber-400 text-xs">★</span>}
                        </div>
                        <div className="text-xs text-slate-400">@{user.username}</div>
                        <div className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{distStr}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFriend(user)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                        user.isFriend
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                      }`}
                      title={user.isFriend ? 'Connected' : 'Connect'}
                    >
                      <Star className={`w-3.5 h-3.5 ${user.isFriend ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Status Quote */}
                  {user.statusMessage && (
                    <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 italic line-clamp-1">
                      "{user.statusMessage}"
                    </div>
                  )}

                  {/* Bio */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {user.bio}
                  </p>
                </div>

                {/* Card footer action buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onStartChat(user)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={() => onWaveUser(user)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-700"
                    title="Send a Wave 👋"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>Wave</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
