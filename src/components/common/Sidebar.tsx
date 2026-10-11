import React from 'react';
import {
  Radio,
  Users,
  Shield,
  Trophy,
  History,
  UserPlus,
  Key,
  Settings,
  Star,
  Activity,
  Volume2,
  VolumeX,
  LogOut,
  LogIn,
  X,
  Flame,
  LayoutTemplate,
  Server,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useAuctionStore } from '../../store/auction.store';
import { api } from '../../services/api';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  layoutMode: 'topbar' | 'sidebar';
  onToggleLayoutMode: () => void;
  onOpenAdminSettings?: () => void;
  onOpenIconModal?: () => void;
  onOpenTeamModal?: () => void;
  onOpenCredentialsModal?: () => void;
  onOpenRenderWakeup?: () => void;
  onOpenServerModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  layoutMode,
  onToggleLayoutMode,
  onOpenAdminSettings,
  onOpenIconModal,
  onOpenCredentialsModal,
  onOpenRenderWakeup,
  onOpenServerModal,
}) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { state, isConnected, soundMuted, toggleSound } = useAuctionStore();

  // If players list is not yet loaded in auction store, fetch immediately so menu count matches
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
  const playersCount = state?.players?.length || 0;
  const teamsCount = state?.teams?.length || 0;

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0c101a] border-r border-slate-800/80 text-slate-200">
      {/* Brand & Mobile Close */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div
          onClick={() => handleNavClick(isAuthenticated ? 'arena' : 'login')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform shrink-0">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-sm tracking-wider text-white">
                AUCTION <span className="text-amber-400">ARENA</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="uppercase font-semibold tracking-wider">{auctionStatus}</span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Public Registration Link */}
        <button
          onClick={() => handleNavClick('register')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'register'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Player Registration</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
            Public
          </span>
        </button>

        {/* Public #WatchList Link */}
        <button
          onClick={() => handleNavClick('watchlist')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'watchlist'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Live #WatchList</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
            Live Sync
          </span>
        </button>

        <div className="pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3">
          {isAuthenticated ? 'Tournament Arena' : 'Portal Access'}
        </div>

        {/* If Not Authenticated: Show prompt or locked states */}
        {!isAuthenticated ? (
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('login')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Official Sign In</span>
            </button>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400">
              🔒 Sign in as Admin or Team Owner to access live bidding, team squads, and management.
            </div>
          </div>
        ) : (
          /* Authenticated Navigation */
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('arena')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'arena'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Live Auction Arena</span>
              </div>
              {auctionStatus === 'ACTIVE' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('watchlist')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'watchlist'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                <span>#WatchList</span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('players')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'players'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Players Pool</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {playersCount}
              </span>
            </button>

            <button
              onClick={() => handleNavClick('teams')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'teams'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Teams</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {teamsCount}
              </span>
            </button>

            {user?.role === 'TEAM' && (
              <button
                onClick={() => handleNavClick('team-dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentTab === 'team-dashboard'
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>My Team Squad</span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('history')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'history'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Audit History</span>
            </button>

            {/* Admin Management Section */}
            {user?.role === 'ADMIN' && (
              <div className="pt-3 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 px-3 pb-1">
                  Admin Control Desk
                </div>

                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    currentTab === 'admin-dashboard'
                      ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Admin Analytics</span>
                </button>

                {onOpenCredentialsModal && (
                  <button
                    onClick={() => {
                      onOpenCredentialsModal();
                      onCloseMobile();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Key className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Team Logins</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                      Table
                    </span>
                  </button>
                )}

                {onOpenAdminSettings && (
                  <button
                    onClick={() => {
                      onOpenAdminSettings();
                      onCloseMobile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Auction Settings</span>
                  </button>
                )}

                {onOpenIconModal && (
                  <button
                    onClick={() => {
                      onOpenIconModal();
                      onCloseMobile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>Icon Players (2 Max)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Actions & Layout Switcher */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-slate-950/40">
        {/* Navigation Style Toggle */}
        <button
          onClick={onToggleLayoutMode}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          title="Switch between Top Bar and Side Navigation Bar"
        >
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            <span>Navigation Style</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono uppercase">
            {layoutMode === 'sidebar' ? 'Sidebar' : 'Topbar'}
          </span>
        </button>

        {/* Quick Tools Row */}
        <div className="grid grid-cols-3 gap-1.5">
          {onOpenRenderWakeup && (
            <button
              onClick={onOpenRenderWakeup}
              title="Render Cloud DB Health & Ping"
              className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 flex items-center justify-center gap-1 text-[11px]"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">DB</span>
            </button>
          )}

          {onOpenServerModal && (
            <button
              onClick={onOpenServerModal}
              title="Server Endpoint Configuration"
              className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center gap-1 text-[11px]"
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Host</span>
            </button>
          )}

          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center gap-1 text-[11px]"
          >
            {soundMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="hidden sm:inline">{soundMuted ? 'Mute' : 'Audio'}</span>
          </button>
        </div>

        {/* User Card */}
        {isAuthenticated && user ? (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white truncate">{user.name || user.username}</div>
              <div className="text-[10px] text-amber-400/90 font-mono uppercase tracking-wider">
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleNavClick('login')}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Sidebar (when in sidebar mode) */}
      {layoutMode === 'sidebar' && (
        <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
          {navContent}
        </aside>
      )}

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
