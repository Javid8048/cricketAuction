import React, { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Flame, Lock, User, ArrowRight, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenRegister?: () => void;
  onOpenWatchList?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onOpenRegister, onOpenWatchList }) => {
  const { login, isLoading, error } = useAuthStore();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Field validation
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
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-[#121724] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glowing aura */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/25">
            <Flame className="w-7 h-7 text-slate-950 fill-slate-950" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">OFFICIAL SIGN IN</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tournament User Desk & Team Portals
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                onBlur={() => handleBlur('username')}
                placeholder="Enter your username or email"
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
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
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.password && errors.password
                    ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                    : 'border-slate-700 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Authenticating...' : 'Enter Auction Arena'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Live Spectator #WatchList Link */}
        {onOpenWatchList && (
          <div className="mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Spectating or following the live auction?</span>
            </div>
            <button
              type="button"
              onClick={onOpenWatchList}
              className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live #WatchList</span>
            </button>
          </div>
        )}

        {/* Public Player Registration Link */}
        {onOpenRegister && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Are you a Cricketer entering the draft?</span>
            </div>
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 shadow-sm transition-all"
            >
              Register as Player
            </button>
          </div>
        )}

        {/* Security / Help Note */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Authorized tournament personnel only. Contact the tournament user for team portal credentials.
          </p>
        </div>
      </div>
    </div>
  );
};
