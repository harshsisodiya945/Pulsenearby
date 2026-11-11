import { User, Conversation } from '../../types/index.ts';
import { Map, Users, MessageSquare, Radio, LogOut, UserPlus } from 'lucide-react';

export type ActiveTab = 'map' | 'directory' | 'chats';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: User;
  onOpenEditProfile: () => void;
  onOpenAddUser: () => void;
  onLogout: () => void;
  conversations: Conversation[];
  onOpenChatWithUser: (user: User) => void;
  onlineCount: number;
  totalNearbyCount: number;
  onOpenLocationPicker?: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  currentUser,
  onOpenEditProfile,
  onOpenAddUser,
  onLogout,
  conversations,
  onOpenChatWithUser,
  onlineCount,
  totalNearbyCount,
  onOpenLocationPicker,
}: NavbarProps) {
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <header className="bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Live Radar */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Pulse<span className="text-indigo-400">Nearby</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                LIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                <strong className="text-emerald-400 font-semibold">{onlineCount}</strong> online near
              </span>
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-white underline decoration-indigo-500/60 hover:decoration-indigo-400 transition-colors cursor-pointer"
                title="Click to set your exact city or location"
              >
                <span>{currentUser.neighborhood || currentUser.city}</span>
                <span className="text-[9px] text-indigo-400/80 font-normal">(change)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80">
          <button
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">Social Map</span>
          </button>

          <button
            onClick={() => onTabChange('directory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">People</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
              {totalNearbyCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('chats')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chats</span>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {totalUnread}
              </span>
            )}
          </button>
        </nav>

        {/* Right User Actions: Add Person, Profile & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddUser}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            title="Register a new person"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Person</span>
          </button>

          {/* Profile pill */}
          <button
            onClick={onOpenEditProfile}
            className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all cursor-pointer text-left group"
            title="Edit Profile"
          >
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400">@{currentUser.username}</div>
            </div>

            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/80"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                  currentUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                }`}
              />
            </div>
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-950/70 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-700/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
