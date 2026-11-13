import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Conversation, ChatMessage } from '../../types/index.ts';
import {
  MessageSquare,
  MessageCircle,
  MapPin,
  Sparkles,
  Send,
  Hand,
  Search,
  ArrowLeft,
  CheckCheck,
  Compass,
} from 'lucide-react';
import { formatDistance } from '../../utils/geo.ts';
import { isUserMatch } from '../../utils/userMatcher.ts';
import { sound } from '../../utils/audio.ts';

interface ConversationsListProps {
  conversations: Conversation[];
  allUsers: User[];
  currentUser: User;
  messages: ChatMessage[];
  selectedPartner: User | null;
  onSelectPartner: (user: User | null) => void;
  onSendMessage: (receiverId: string, text: string, type?: 'text' | 'wave' | 'location') => void;
  onWaveUser: (user: User) => void;
  onExploreMap: () => void;
}

export function ConversationsList({
  conversations,
  allUsers,
  currentUser,
  messages,
  selectedPartner,
  onSelectPartner,
  onSendMessage,
  onWaveUser,
  onExploreMap,
}: ConversationsListProps) {
  const [inputText, setInputText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didUserGoBackRef = useRef(false);

  const handleSelectConversation = (user: User) => {
    didUserGoBackRef.current = false;
    onSelectPartner(user);
  };

  const handleBackToList = () => {
    didUserGoBackRef.current = true;
    onSelectPartner(null);
  };

  // Auto-select the unread or latest conversation on initial load unless user explicitly went back
  useEffect(() => {
    if (!selectedPartner && !didUserGoBackRef.current && conversations.length > 0) {
      const unreadConv = conversations.find((c) => c.unreadCount > 0);
      const targetUser = unreadConv ? unreadConv.user : conversations[0].user;
      onSelectPartner(targetUser);
    }
  }, [conversations, selectedPartner, onSelectPartner]);

  // Messages thread for the active conversation
  const activeThread = useMemo(() => {
    if (!selectedPartner) return [];
    return messages.filter((m) => {
      const isFromMeToPartner =
        isUserMatch(currentUser, m.senderId) && isUserMatch(selectedPartner, m.receiverId);
      const isFromPartnerToMe =
        isUserMatch(selectedPartner, m.senderId) && isUserMatch(currentUser, m.receiverId);
      return isFromMeToPartner || isFromPartnerToMe;
    });
  }, [messages, currentUser, selectedPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread]);

  const handleSend = (textToSend?: string, type: 'text' | 'wave' | 'location' = 'text') => {
    if (!selectedPartner) return;
    const text = (textToSend || inputText).trim();
    if (!text && type === 'text') return;

    onSendMessage(selectedPartner.id, text, type);
    setInputText('');
    sound.playMessageChime();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleShareLocation = () => {
    if (!currentUser) return;
    handleSend(
      `📍 Shared location near ${currentUser.neighborhood || currentUser.city} (${currentUser.latitude.toFixed(4)}, ${currentUser.longitude.toFixed(4)})`,
      'location'
    );
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!filterQuery.trim()) return conversations;
    const q = filterQuery.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.user.name.toLowerCase().includes(q) ||
        c.user.username.toLowerCase().includes(q) ||
        c.lastMessage.text.toLowerCase().includes(q)
    );
  }, [conversations, filterQuery]);

  // Other nearby people who can be messaged (excluding current user and existing conversation partners)
  const nearbyDiscoverablePeople = useMemo(() => {
    const existingPartnerIds = new Set(conversations.map((c) => c.user.id));
    return allUsers.filter(
      (u) =>
        !isUserMatch(currentUser, u) &&
        !existingPartnerIds.has(u.id) &&
        (filterQuery.trim() === '' ||
          u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(filterQuery.toLowerCase()))
    );
  }, [allUsers, currentUser, conversations, filterQuery]);

  const icebreakers = [
    '👋 Hey neighbor!',
    '☕ Up for coffee sometime?',
    '📍 Let’s meet nearby!',
    '🗺️ What are the top hangout spots here?',
  ];

  return (
    <div className="flex-1 flex h-full w-full bg-slate-950 overflow-hidden">
      {/* LEFT COLUMN: Conversations List & Search */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0 ${
          selectedPartner ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Messages & Chats</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              {conversations.length} active
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search chats or find people..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {filteredConversations.length === 0 && conversations.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No active chats</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with people near you on the map or pick someone from the suggested list below!
              </p>
              <button
                onClick={onExploreMap}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Map</span>
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const user = conv.user;
              const isSelected = selectedPartner && isUserMatch(selectedPartner, user);

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectConversation(user)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/70 border border-indigo-500/60 shadow-md'
                      : 'hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-800"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold text-xs truncate ${
                            isSelected ? 'text-indigo-200' : 'text-white'
                          }`}
                        >
                          {user.name}
                        </span>
                        {user.distanceKm !== undefined && (
                          <span className="text-[10px] font-medium text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800/40 shrink-0">
                            {formatDistance(user.distanceKm)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[180px]">
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-slate-500">{conv.lastMessage.timestamp}</span>
                    {conv.unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm animate-pulse">
                        {conv.unreadCount} new
                      </span>
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5 text-indigo-400/80" />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Quick Discover People to message */}
          {nearbyDiscoverablePeople.length > 0 && (
            <div className="pt-4 pb-2">
              <div className="px-2 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Nearby People to Chat</span>
              </div>
              <div className="space-y-1">
                {nearbyDiscoverablePeople.slice(0, 5).map((person) => (
                  <div
                    key={person.id}
                    onClick={() => handleSelectConversation(person)}
                    className="p-2 rounded-xl hover:bg-slate-800/80 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-800"
                        />
                        {person.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                          {person.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {person.neighborhood || person.city}{' '}
                          {person.distanceKm ? `• ${formatDistance(person.distanceKm)}` : ''}
                        </div>
                      </div>
                    </div>
                    <button className="px-2 py-0.5 text-[11px] font-semibold text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 rounded-md transition-colors">
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Conversation */}
      <div
        className={`flex-1 flex flex-col h-full bg-slate-950 overflow-hidden ${
          !selectedPartner ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedPartner ? (
          <>
            {/* Active Chat Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  title="Back to all chats"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative shrink-0">
                  <img
                    src={selectedPartner.avatar}
                    alt={selectedPartner.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/80"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      selectedPartner.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm truncate">{selectedPartner.name}</h3>
                    <span className="text-[11px] text-slate-400">@{selectedPartner.username}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="text-emerald-400 font-medium">
                      {selectedPartner.isOnline ? 'Active Now' : selectedPartner.lastActive}
                    </span>
                    <span>•</span>
                    <span className="text-indigo-400 font-semibold">
                      {selectedPartner.distanceKm !== undefined
                        ? formatDistance(selectedPartner.distanceKm) + ' away'
                        : selectedPartner.city}
                    </span>
                    <span>•</span>
                    <span className="truncate italic">{selectedPartner.neighborhood || selectedPartner.city}</span>
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onWaveUser(selectedPartner)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Send friendly wave 👋"
                >
                  <Hand className="w-4 h-4" />
                  <span className="hidden sm:inline">Wave 👋</span>
                </button>
              </div>
            </div>

            {/* Chat Thread Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 bg-slate-950/60">
              {activeThread.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-1">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-white text-base">
                    Start conversation with {selectedPartner.name.split(' ')[0]}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    They are located in <strong className="text-indigo-300">{selectedPartner.neighborhood || selectedPartner.city}</strong>{' '}
                    ({selectedPartner.distanceKm ? formatDistance(selectedPartner.distanceKm) + ' away' : 'nearby'}).
                    Say hello or pick a quick starter below!
                  </p>

                  <div className="w-full max-w-sm space-y-1.5 pt-3">
                    {icebreakers.map((text, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(text)}
                        className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/90 border border-slate-800 text-xs text-slate-200 hover:text-indigo-300 transition-all cursor-pointer font-medium"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeThread.map((msg) => {
                  const isMe = isUserMatch(currentUser, msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-lg ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        {msg.type === 'wave' && <span className="mr-1.5">👋</span>}
                        {msg.type === 'location' && <span className="mr-1.5">📍</span>}
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500 px-1">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starters Toolbar */}
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
              <button
                onClick={handleShareLocation}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap text-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Share Spot</span>
              </button>
              <button
                onClick={() => handleSend('☕ Grab coffee nearby?')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap text-xs"
              >
                ☕ Coffee?
              </button>
              <button
                onClick={() => handleSend('👋 Quick wave!')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap text-xs"
              >
                👋 Wave
              </button>
              <button
                onClick={() => handleSend('🗺️ What are good spots around here?')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap text-xs"
              >
                🗺️ Best spots?
              </button>
            </div>

            {/* Message Composer Input Area */}
            <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type a message to ${selectedPartner.name.split(' ')[0]}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition-all cursor-pointer shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* Empty placeholder if no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-xl">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select a chat to begin</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Choose a conversation from the left or start a new chat with someone nearby.
              </p>
            </div>
            <button
              onClick={onExploreMap}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              Explore Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
