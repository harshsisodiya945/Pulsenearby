import { useState } from 'react';
import { User } from '../../types/index.ts';
import { Radio, Mail, Lock, User as UserIcon, AtSign, Eye, EyeOff, MapPin, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  registeredUsers: User[];
  onRegisterUser: (user: User) => void;
}

export function LoginPage({
  onLoginSuccess,
  registeredUsers,
  onRegisterUser,
}: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [realName, setRealName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('New Delhi');

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = (email || username).trim().toLowerCase().replace(/^@/, '');
    const cleanPassword = password.trim();

    if (!identifier || !cleanPassword) {
      setError('Please provide both your email/username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate with backend API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: cleanPassword }),
      });

      if (res.ok) {
        const user = await res.json();
        setIsLoading(false);
        onLoginSuccess(user);
        return;
      }

      if (res.status === 401) {
        setIsLoading(false);
        setError('Incorrect password. Please try again.');
        return;
      }

      if (res.status === 404) {
        setIsLoading(false);
        setError(`No account found for "${identifier}". Please check or click "Create account".`);
        return;
      }
    } catch {
      // Backend offline: proceed to strict local storage verification
    }

    // 2. Strict Local Verification
    const matched = registeredUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === identifier) ||
        (u.username && u.username.toLowerCase() === identifier)
    );

    if (!matched) {
      setIsLoading(false);
      setError(`No account found for "${identifier}". Please check or click "Create account".`);
      return;
    }

    // Strict password match (default Harsh Sisodiya password is 'password123')
    const expectedPassword =
      matched.password || (matched.username === 'harshsisodiya9425' ? 'password123' : null);

    if (!expectedPassword || expectedPassword !== cleanPassword) {
      setIsLoading(false);
      setError('Incorrect password. Please try again.');
      return;
    }

    setIsLoading(false);
    onLoginSuccess(matched);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = realName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanUsername || !cleanEmail || !cleanPassword) {
      setError('Please fill in all fields (real name, username, email, and password).');
      return;
    }

    // Check if username or email already taken
    const existing = registeredUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (existing) {
      setError('Username or email is already registered. Please sign in instead.');
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}_${cleanUsername}`,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      bio: `Hi, I'm ${cleanName} on PulseNearby.`,
      latitude: 28.6139,
      longitude: 77.2090,
      city: city.trim() || 'New Delhi',
      neighborhood: 'Central',
      isOnline: true,
      lastActive: 'Active now',
      statusMessage: 'Available on PulseNearby',
    };

    onRegisterUser(newUser);
    onLoginSuccess(newUser);
  };

  // Quick prefill Harsh Sisodiya credentials for easy testing
  const handleQuickSignIn = () => {
    setEmail('harshsisodiya9425@gmail.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl z-10">
        {/* App Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-xl shadow-indigo-600/20 mb-3 text-white">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Pulse<span className="text-indigo-400">Nearby</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegistering
              ? 'Create your account to discover and chat with people nearby'
              : 'Sign in to access your live social map & nearby chat'}
          </p>
        </div>

        {/* Tab switch between Sign In and Create Account */}
        <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegistering
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegistering
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {!isRegistering ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com or @username"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Sign In */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleQuickSignIn}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Continue as Harsh Sisodiya (harshsisodiya9425)
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Real Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Real Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="e.g. Harsh Sisodiya"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username (@handle) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. harshsisodiya"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-10 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              <span>Create Account & Join</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          PulseNearby Live Network • Real-time Location & Nearby Chat
        </div>
      </div>
    </div>
  );
}
