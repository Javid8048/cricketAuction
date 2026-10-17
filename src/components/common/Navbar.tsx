import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  Radio,
  Trophy,
  LogOut,
  Flame,
  Server,
  History,
  Settings,
  UserPlus,
  Activity,
  Key,
  Menu,
  LayoutTemplate,
  LogIn,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';
import { getBackendUrl, api } from '../../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  layoutMode: 'topbar' | 'sidebar';
  onToggleLayoutMode: () => void;
  onOpenMobileNav: () => void;
  isSpectatorMode?: boolean;
  onOpenAdminSettings?: () => void;
  onOpenIconModal?: () => void;
  onOpenTeamModal?: () => void;
  onOpenCredentialsModal?: () => void;
  onOpenRenderWakeup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  layoutMode,
  onToggleLayoutMode,
  onOpenMobileNav,
  isSpectatorMode,
  onOpenAdminSettings,
  onOpenIconModal,
  onOpenCredentialsModal,
  onOpenRenderWakeup,
}) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { state, isConnected, soundMuted, toggleSound } = useAuctionStore();
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getBackendUrl());

  React.useEffect(() => {
    if (!state?.players || state.players.length === 0) {
      api
        .getPlayers()
        .then((players) => {
          if (Array.isArray(players) && players.length > 0) {
            useAuctionStore.getState().setPlayers(players);
          }
        })
        .catch(console.error);
    }
  }, [state?.players]);

  const auctionStatus = state?.auction?.status || 'IDLE';
  const userTeam = Array.isArray(state?.teams) ? state.teams.find((t) => t.id === user?.teamId) : null;

  React.useEffect(() => {
    if (!state?.players || state.players.length === 0) {
      useAuctionStore.getState().refreshPlayers();
    }
  }, [state?.players]);

  return (
    <header className={`sticky top-0 z-40 bg-[#0c101a]/95 backdrop-blur-md border-b border-slate-800/80 ${layoutMode === 'sidebar' ? 'lg:hidden' : ''}`}>
      <div className="max-w-[1700px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Hamburger Drawer Toggle (Mobile & Tablet) */}
          <button
            onClick={onOpenMobileNav}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors border border-slate-700/60 lg:hidden"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand & Live Indicator */}
          <div
            onClick={() => onSelectTab(isAuthenticated ? 'arena' : 'login')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-sm sm:text-base tracking-wider text-white">
                  CRICKET AUCTION <span className="text-amber-400">ARENA</span>
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {isConnected ? 'LIVE FEED' : 'CONNECTING...'}
                </span>
                <span>•</span>
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    auctionStatus === 'ACTIVE'
                      ? 'text-emerald-400'
                      : auctionStatus === 'PAUSED'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {auctionStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links (Visible when Topbar mode is chosen & Authenticated or in Spectator Mode) */}
          {layoutMode === 'topbar' && (isAuthenticated || isSpectatorMode) && (
            <nav className="hidden lg:flex items-center gap-1 ml-2 text-xs sm:text-sm font-medium">
              <button
                onClick={() => onSelectTab('arena')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentTab === 'arena'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Live Arena
              </button>

              <button
                onClick={() => onSelectTab('watchlist')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentTab === 'watchlist'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                #WatchList
              </button>

              <button
                onClick={() => onSelectTab('players')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentTab === 'players'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Players ({state?.players?.length || 0})
              </button>

              <button
                onClick={() => onSelectTab('teams')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentTab === 'teams'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Teams ({state?.teams?.length || 0})
              </button>

              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => onSelectTab('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentTab === 'admin-dashboard'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Admin Desk
                </button>
              )}

              {user?.role === 'TEAM' && (
                <button
                  onClick={() => onSelectTab('team-dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentTab === 'team-dashboard'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                  My Squad
                </button>
              )}

              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => onSelectTab('settings')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentTab === 'settings'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  Settings
                </button>
              )}

              <button
                onClick={() => onSelectTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentTab === 'history'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                History
              </button>
            </nav>
          )}
        </div>

        {/* Center / Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Public Player Registration Button */}
          <button
            onClick={() => onSelectTab('register')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
              currentTab === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Register Player</span>
            <span className="sm:hidden">Register</span>
          </button>


          {/* Admin Settings & Icon Modals */}
          {user?.role === 'ADMIN' && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => onSelectTab('settings')}
                title="Auction Settings (Timer, Auto-sell, Squad Limit)"
                className={`p-2 rounded-xl transition-colors border ${
                  currentTab === 'settings'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-700/80 border-slate-700/60'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}

          {/* Layout Mode Toggle (Topbar vs Sidebar) */}
          <button
            onClick={onToggleLayoutMode}
            title={`Switch to ${layoutMode === 'topbar' ? 'Sidebar' : 'Topbar'} navigation`}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-700/80 transition-colors border border-slate-700/60 flex items-center gap-1"
          >
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline text-[11px] font-mono text-slate-300 uppercase">
              {layoutMode === 'topbar' ? 'Topbar' : 'Sidebar'}
            </span>
          </button>

          {/* Render Cloud Wakeup timer trigger */}
          {onOpenRenderWakeup && (
            <button
              onClick={onOpenRenderWakeup}
              title="Render Cloud DB Health & Ping"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-emerald-400 hover:bg-slate-700/80 transition-colors border border-slate-700/60"
            >
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Server / Backend Config */}
          <button
            onClick={() => setShowServerModal(true)}
            title="Backend Server Settings"
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-700/80 transition-colors border border-slate-700/60"
          >
            <Server className="w-4 h-4 text-amber-400" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-700/80 transition-colors border border-slate-700/60"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>

          {/* User Status / Auth Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {user.role === 'TEAM' && userTeam ? (
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: userTeam.primaryColor }}
                    />
                    <span className="text-xs font-bold text-white">{userTeam.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold">
                    Purse: {formatRupees(userTeam.remainingPurse)}
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-amber-300">
                    {user.name || user.username || 'Commission Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Commission Admin</span>
                </div>
              )}

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/30"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isSpectatorMode && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>SPECTATOR</span>
                </div>
              )}

              <button
                onClick={() => onSelectTab('watchlist')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  currentTab === 'watchlist'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                }`}
                title="Open Live Spectator WatchList"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>#WatchList</span>
              </button>

              <button
                onClick={() => onSelectTab('login')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
                title="Sign in as Team Owner or Commissioner"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSpectatorMode ? 'Official Sign In' : 'Sign In'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backend Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Backend Connection</h3>
                <p className="text-xs text-slate-400">Configure WebSocket & REST API endpoint</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Connect your deployed backend URL (Render, Railway, or local IP).
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Backend API & WebSocket URL
                </label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="e.g. https://cricketauctionbackend-ypoh.onrender.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Quick options:</div>
                <div>• <code className="text-amber-400">https://cricketauctionbackend-ypoh.onrender.com</code></div>
                <div>• <code className="text-cyan-400">http://192.168.29.136:5000</code> or <code className="text-cyan-400">http://localhost:5000</code></div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('caa_backend_url');
                  localStorage.removeItem('caa_backend_url');
                  window.location.reload();
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Reset to Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowServerModal(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (serverUrlInput.trim()) {
                      sessionStorage.setItem('caa_backend_url', serverUrlInput.trim());
                      localStorage.setItem('caa_backend_url', serverUrlInput.trim());
                    } else {
                      sessionStorage.removeItem('caa_backend_url');
                      localStorage.removeItem('caa_backend_url');
                    }
                    setShowServerModal(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Screens < lg, topbar mode only) */}
      {layoutMode === 'topbar' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c101a]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onSelectTab('register')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
            currentTab === 'register'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Register</span>
        </button>

        {isAuthenticated ? (
          <>
            <button
              onClick={() => onSelectTab('arena')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
                currentTab === 'arena'
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Arena</span>
            </button>

            <button
              onClick={() => onSelectTab('players')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
                currentTab === 'players'
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Players</span>
            </button>

            <button
              onClick={() => onSelectTab('teams')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
                currentTab === 'teams'
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Teams</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onSelectTab('admin-dashboard')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
                  currentTab === 'admin-dashboard'
                    ? 'text-amber-400 font-bold bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}

            {user?.role === 'TEAM' && (
              <button
                onClick={() => onSelectTab('team-dashboard')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
                  currentTab === 'team-dashboard'
                    ? 'text-cyan-400 font-bold bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Squad</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-around w-full">
            <button
              onClick={() => onSelectTab('watchlist')}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[10px] font-semibold transition-colors ${
                currentTab === 'watchlist'
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>#WatchList</span>
            </button>
            <button
              onClick={() => onSelectTab('login')}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[10px] font-semibold transition-colors ${
                currentTab === 'login'
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </nav>
    )}
    </header>
  );
};

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
