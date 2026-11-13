import { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../../types/index.ts';
import { Send, X, Hand, MapPin, CheckCheck, Smile, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio.ts';
import { isUserMatch } from '../../utils/userMatcher.ts';

interface ChatDrawerProps {
  partner: User;
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, text: string, type?: 'text' | 'wave' | 'location') => void;
  onClose: () => void;
  onWaveUser: (user: User) => void;
}

export function ChatDrawer({
  partner,
  currentUser,
  messages,
  onSendMessage,
  onClose,
  onWaveUser,
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages between current user and partner using robust user matching
  const thread = messages.filter((m) => {
    const isFromMeToPartner =
      isUserMatch(currentUser, m.senderId) && isUserMatch(partner, m.receiverId);
    const isFromPartnerToMe =
      isUserMatch(partner, m.senderId) && isUserMatch(currentUser, m.receiverId);
    return isFromMeToPartner || isFromPartnerToMe;
  });

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSend = (textToSend?: string, type: 'text' | 'wave' | 'location' = 'text') => {
    const text = (textToSend || inputText).trim();
    if (!text && type === 'text') return;

    onSendMessage(partner.id, text, type);
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
    handleSend(
      `📍 Dropped pin near ${currentUser.neighborhood || currentUser.city} (${currentUser.latitude.toFixed(4)}, ${currentUser.longitude.toFixed(4)})`,
      'location'
    );
  };

  const icebreakers = [
    '👋 Hey neighbor!',
    '☕ Want to grab coffee?',
    '💻 Love your profile tags!',
    '🗺️ What are the best spots nearby?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 md:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/80"
            />
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                partner.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm truncate flex items-center gap-1.5">
              <span>{partner.name}</span>
              {partner.isFriend && <span className="text-amber-400 text-xs">★ Connected</span>}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
              <span>@{partner.username}</span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">
                {partner.distanceKm !== undefined
                  ? partner.distanceKm < 1
                    ? `${Math.round(partner.distanceKm * 1000)}m away`
                    : `${partner.distanceKm.toFixed(1)} km away`
                  : partner.city}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onWaveUser(partner)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
            title="Send Wave 👋"
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate italic">"{partner.statusMessage}"</span>
        <span className="text-[11px] text-emerald-400 font-medium whitespace-nowrap ml-2">
          {partner.isOnline ? 'Active Now' : partner.lastActive}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
        {thread.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
            <div className="w-14 h-14 rounded-full bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-1">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-white text-sm">Start a conversation with {partner.name.split(' ')[0]}</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              They are located about{' '}
              <strong className="text-indigo-300">
                {partner.distanceKm ? partner.distanceKm.toFixed(1) + ' km' : 'nearby'}
              </strong>{' '}
              in {partner.neighborhood || partner.city}. Say hi or use an icebreaker below!
            </p>

            {/* Icebreakers */}
            <div className="w-full space-y-1.5 pt-2">
              {icebreakers.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(text)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 border border-slate-700 text-xs text-slate-200 hover:text-indigo-300 transition-all cursor-pointer font-medium"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          thread.map((msg) => {
            const isMe = isUserMatch(currentUser, msg.senderId);
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {msg.type === 'wave' && <span className="mr-1">👋</span>}
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

      {/* Quick icebreakers bar */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={handleShareLocation}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <MapPin className="w-3 h-3 text-rose-400" />
          Share Spot
        </button>
        <button
          onClick={() => handleSend('☕ Coffee run soon?')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          ☕ Coffee?
        </button>
        <button
          onClick={() => handleSend('👋 Quick wave!')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          👋 Wave
        </button>
      </div>

      {/* Input bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${partner.name.split(' ')[0]}...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg transition-all cursor-pointer"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
