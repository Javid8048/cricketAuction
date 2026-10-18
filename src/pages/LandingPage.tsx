import React, { useState } from 'react';
import {
  Flame,
  Shield,
  Users,
  Lock,
  User,
  ArrowRight,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Tv,
  Copy,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface LandingPageProps {
  onSuccess: () => void;
  onOpenRegister: () => void;
  onEnterSpectator?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSuccess,
  onOpenRegister,
  onEnterSpectator,
}) => {
  const { login, isLoading, error } = useAuthStore();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Validation
  const errors: Record<string, string> = {};
  if (!usernameOrEmail.trim()) {
    errors.username = 'Username or email is required';
  }
  if (!password) {
    errors.password = 'Password is required';
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (Object.keys(errors).length > 0) return;

    try {
      await login(usernameOrEmail.trim(), password);
      onSuccess();
    } catch (err) {}
  };


  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Tournament Title */}
      <div className="text-center max-w-2xl mx-auto mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mb-4 shadow-sm">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span>OFFICIAL MEGA CRICKET AUCTION 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-none">
          CRICKET AUCTION <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">ARENA</span>
        </h1>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-lg bg-[#121724]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl z-10">
        {/* Glow Accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Unified Portal Header */}
        <div className="p-4 mb-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-display">
                Portal Sign In
              </h2>
              <p className="text-[11px] text-slate-400">
                Single sign-in for Team Owners & Tournament Commissioners
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-amber-300">
              <Users className="w-3.5 h-3.5" />
              <span>Team Desk</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Commissioner Desk</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                onBlur={() => handleBlur('username')}
                placeholder="Enter username or email"
                className={`w-full bg-slate-900 border rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.username && errors.username
                    ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                    : 'border-slate-700 focus:border-amber-500'
                }`}
              />
            </div>
            {touched.username && errors.username && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter password"
                className={`w-full bg-slate-900 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.password && errors.password
                    ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                    : 'border-slate-700 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Arena'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Public Player Registration Box */}
        <div className="mt-5 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-emerald-300 w-full sm:w-auto">
            <UserPlus className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Entering the Player Draft?</div>
              <div className="text-[11px] text-slate-400">Register name, role, photo, and receive your S.No</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center"
          >
            Register as Player
          </button>
        </div>

        {/* Watch Live Auction as Audience Spectator Button Card */}
        {onEnterSpectator && (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-blue-950/50 border border-cyan-500/40 shadow-xl relative overflow-hidden">
            {/* Header info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Tv className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-white text-xs sm:text-sm tracking-wide">
                    Audience Spectator View
                  </span>
                  <a
                    href="#WatchLive"
                    onClick={(e) => {
                      e.preventDefault();
                      onEnterSpectator();
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                    title="Direct Spectator URL (#WatchLive)"
                  >
                    #WatchLive
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Live scoreboard, real-time team bids, holding squads & audio gavel
                </div>
              </div>
            </div>

            {/* Responsive Actions */}
            <div className="mt-3.5 flex flex-col sm:flex-row items-stretch gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const liveUrl = `${window.location.origin}${window.location.pathname}#WatchLive`;
                  navigator.clipboard.writeText(liveUrl).then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }).catch(() => {});
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                title="Copy spectator direct URL (#WatchLive)"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px] font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onEnterSpectator}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
                <span className="truncate">Watch Live Auction</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
