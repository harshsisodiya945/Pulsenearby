import { User, Conversation } from '../../types/index.ts';
import { MessageSquare, MessageCircle, MapPin, Sparkles, Clock, CheckCheck } from 'lucide-react';
import { formatDistance } from '../../utils/geo.ts';

interface ConversationsListProps {
  conversations: Conversation[];
  allUsers: User[];
  onOpenChat: (user: User) => void;
  onExploreMap: () => void;
}

export function ConversationsList({
  conversations,
  allUsers,
  onOpenChat,
  onExploreMap,
}: ConversationsListProps) {
  // If no active conversations yet, display quick suggestions from nearby people
  const suggestedPeople = allUsers.filter((u) => u.isOnline).slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/60">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span>Direct Messages & Chats</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time conversations with people in your local area.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mx-auto">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No chats started yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Say hello to someone on the interactive map or pick one of the active nearby people below to begin chatting!
              </p>
            </div>
            <button
              onClick={onExploreMap}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              Explore Interactive Map
            </button>

            {/* Quick Suggestions if any users exist */}
            {suggestedPeople.length > 0 && (
              <div className="pt-6 border-t border-slate-800/80 text-left">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Online Right Now Near You</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestedPeople.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => onOpenChat(person)}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800 group-hover:ring-indigo-500"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white group-hover:text-indigo-300 truncate">
                            {person.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {person.neighborhood || person.city} • {person.distanceKm ? formatDistance(person.distanceKm) : ''}
                          </div>
                        </div>
                      </div>
                      <button className="px-2.5 py-1 bg-indigo-600/30 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0">
                        Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const user = conv.user;
              return (
                <div
                  key={user.id}
                  onClick={() => onOpenChat(user)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 shadow-lg flex items-center justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                          {user.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">@{user.username}</span>
                        {user.distanceKm !== undefined && (
                          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40">
                            {formatDistance(user.distanceKm)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5 max-w-md">
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">{conv.lastMessage.timestamp}</span>
                    {conv.unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-sm">
                        {conv.unreadCount} new
                      </span>
                    ) : (
                      <CheckCheck className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
