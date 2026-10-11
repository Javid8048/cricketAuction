import React, { useState, useMemo } from 'react';
import {
  Radio,
  Users,
  Globe,
  Shield,
  Trophy,
  Eye,
  Copy,
  Check,
  Clock,
  Sparkles,
  Flame,
  Search,
  Star,
  Coins,
  Zap,
  LogIn,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuctionStore } from '../store/auction.store';
import { useAuthStore } from '../store/auth.store';
import { formatRupees } from '../utils/currency';
import { Player, Team } from '../types';

interface WatchListPageProps {
  onOpenLogin?: () => void;
}

export const WatchListPage: React.FC<WatchListPageProps> = ({ onOpenLogin }) => {
  const {
    state,
    secondsLeft,
    isTimerWarning,
    isTimerUrgent,
    lastBidFlash,
    isConnected,
    showToast,
  } = useAuctionStore();
  const { isAuthenticated } = useAuthStore();

  const [activeView, setActiveView] = useState<'teams' | 'sold-registry' | 'marquee'>('teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  const auction = state?.auction;
  const activePlayer = state?.activePlayer;
  const highestBidTeam = state?.highestBidTeam;
  const currentBid = state?.currentBid || 0;
  const teams = state?.teams || [];

  // Compute aggregated stats
  const allSoldEntries = useMemo(() => {
    const list: Array<{
      team: Team;
      price: number;
      isIcon?: boolean;
      player: Player;
    }> = [];

    teams.forEach((t) => {
      if (t.squad && Array.isArray(t.squad)) {
        t.squad.forEach((sp: any) => {
          if (sp.player) {
            list.push({
              team: t,
              price: sp.price,
              isIcon: sp.isIcon || sp.player?.isIcon,
              player: sp.player,
            });
          }
        });
      }
    });

    return list.sort((a, b) => b.price - a.price);
  }, [teams]);

  const totalSpentAcrossTournament = useMemo(() => {
    return allSoldEntries.reduce((sum, item) => sum + item.price, 0);
  }, [allSoldEntries]);

  const highestPurchase = useMemo(() => {
    if (allSoldEntries.length === 0) return null;
    return allSoldEntries[0];
  }, [allSoldEntries]);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '#WatchList';
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      showToast('Live WatchList link copied! Share with spectators.', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // Filtered teams
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        (t.ownerName && t.ownerName.toLowerCase().includes(q)) ||
        (t.squad && t.squad.some((sp: any) => sp.player?.name?.toLowerCase().includes(q)))
    );
  }, [teams, searchQuery]);

  // Filtered sold players
  const filteredSoldPlayers = useMemo(() => {
    return allSoldEntries.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.team.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole =
        selectedRoleFilter === 'ALL' || item.player.role.toLowerCase() === selectedRoleFilter.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [allSoldEntries, searchQuery, selectedRoleFilter]);

  const timerStyle = isTimerUrgent
    ? 'text-rose-500 scale-105 animate-pulse'
    : isTimerWarning
    ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <div className="max-w-[1700px] mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* 1. Header Broadcast Bar */}
      <div className="bg-[#121724]/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Eye className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-wider">
                  PREMIER CRICKET MEGA AUCTION 2026
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  #WatchList Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time spectator feed: follow live bids, participating teams, and every player bought in sync.
              </p>
            </div>
          </div>

          {/* Right Header Status Badges & Controls */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            {/* Live Socket Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isConnected ? 'Socket Sync: Real-Time' : 'Reconnecting...'}
              </span>
            </div>

            {/* Auction Status Badge */}
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border ${
                auction?.status === 'ACTIVE'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 animate-pulse'
                  : auction?.status === 'PAUSED'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {auction?.status === 'ACTIVE' ? 'LIVE ON AIR' : auction?.status || 'IDLE'}
            </span>

            {/* Copy Shareable WatchList Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="Copy shareable link for friends & spectators"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share #WatchList'}</span>
            </button>

            {/* Sign In button for unauthorized viewers */}
            {!isAuthenticated && onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Live Auction Block (Active Player Bidding Stage) */}
      {auction?.status === 'ACTIVE' && activePlayer ? (
        <div className="bg-gradient-to-r from-[#141b2e] via-[#101726] to-[#141b2e] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle glowing animated background light */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Player details (5 cols) */}
            <div className="lg:col-span-5 flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <img
                  src={activePlayer.profileImage || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=240'}
                  alt={activePlayer.name}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl"
                />
                <span className="absolute -top-2 -left-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black font-mono shadow-md uppercase tracking-wider">
                  ON BLOCK
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-2xl font-black text-white font-display truncate">
                    {activePlayer.name}
                  </h3>
                  {activePlayer.isOverseas && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                      ✈ Overseas
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                  <span>{activePlayer.country}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{activePlayer.role}</span>
                  <span>•</span>
                  <span>Age {activePlayer.age}</span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs font-mono">
                  <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">BASE PRICE</span>
                    <span className="text-white font-bold">{formatRupees(activePlayer.basePrice)}</span>
                  </div>
                  {activePlayer.category && (
                    <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">SET</span>
                      <span className="text-amber-300 font-bold">{activePlayer.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bidding Centerpiece (4 cols) */}
            <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden shadow-inner">
              <div
                className={`absolute inset-0 bg-amber-500/20 pointer-events-none transition-opacity duration-500 ${
                  lastBidFlash ? 'opacity-100 scale-105' : 'opacity-0'
                }`}
              />

              <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CURRENT HIGHEST BID</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>

              <div
                className={`text-3xl sm:text-5xl font-black font-mono tracking-tight transition-transform duration-300 ${
                  lastBidFlash ? 'scale-110 text-amber-300' : 'text-white'
                }`}
              >
                {formatRupees(currentBid)}
              </div>

              {/* Leading Team */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">LEADING TEAM:</span>
                {highestBidTeam ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 shadow-md">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: highestBidTeam.primaryColor || '#f59e0b' }}
                    />
                    <span className="text-xs font-bold text-white">{highestBidTeam.name}</span>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-slate-500 italic">No bids placed yet</span>
                )}
              </div>
            </div>

            {/* Timer and Live Sync Indicator (3 cols) */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>AUCTION TIMER</span>
              </div>

              <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest">
                {auction.timerEnabled === false ? (
                  <span className="text-slate-400 text-xl font-bold">MANUAL MODE</span>
                ) : (
                  <span className={timerStyle}>00:{String(secondsLeft).padStart(2, '0')}</span>
                )}
              </div>

              <span className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                {auction.timerEnabled === false
                  ? 'Manual gavel control by User'
                  : 'Automatic gavel on countdown zero'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#121724]/70 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 text-amber-400 font-mono text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AUCTION ARENA IS READY</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {auction?.status === 'PAUSED'
              ? 'Auction is Currently Paused by User'
              : 'Awaiting Next Player to be Introduced on the Block'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
            All teams and bought player rosters below are synced live via WebSockets. As soon as bidding resumes, this screen updates in real time.
          </p>
        </div>
      )}

      {/* 3. Tournament Highlights Dashboard Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#121724] border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">TEAMS COMPETING</div>
            <div className="text-lg sm:text-xl font-black text-white font-mono">{teams.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121724] border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">PLAYERS BOUGHT</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {allSoldEntries.length}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121724] border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">TOTAL SPENT</div>
            <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
              {formatRupees(totalSpentAcrossTournament)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121724] border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase">TOP HAMMER BUY</div>
            <div className="text-sm font-extrabold text-white truncate">
              {highestPurchase ? highestPurchase.player.name : 'None yet'}
            </div>
            {highestPurchase && (
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {formatRupees(highestPurchase.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121724] p-3.5 rounded-2xl border border-slate-800">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveView('teams')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'teams'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            All Teams & Squads ({teams.length})
          </button>

          <button
            onClick={() => setActiveView('sold-registry')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'sold-registry'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            Bought Players Registry ({allSoldEntries.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeView === 'teams' ? 'Search team or player...' : 'Search player or team...'}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 5. Main Content: View 1 (Teams & Their Bought Players) */}
      {activeView === 'teams' && (
        <div>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 bg-[#121724] rounded-3xl border border-slate-800 text-slate-400">
              No teams matching "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTeams.map((team) => {
                const squad = team.squad || [];
                const squadCount = squad.length;
                const maxSquad = team.maxSquadSize || 12;
                const pursePercent = Math.max(0, Math.min(100, (team.remainingPurse / team.totalPurse) * 100));
                const totalSpent = team.totalPurse - team.remainingPurse;
                const iconCount = squad.filter((sp: any) => sp.isIcon || sp.player?.isIcon).length;

                return (
                  <div
                    key={team.id}
                    className="bg-[#121724] border border-slate-800 rounded-2xl flex flex-col justify-between shadow-xl overflow-hidden hover:border-slate-700 transition-all duration-300 relative group"
                  >
                    {/* Top Team Accent Bar */}
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: team.primaryColor || '#f59e0b' }}
                    />

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      {/* Team Header */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg border border-white/20 shrink-0"
                              style={{ backgroundColor: team.primaryColor || '#f59e0b' }}
                            >
                              {team.shortName || team.name.slice(0, 3).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-extrabold text-white truncate leading-tight">
                                {team.name}
                              </h3>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>{team.shortName}</span>
                                {team.ownerName && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">Owner: {team.ownerName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {iconCount > 0 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 shrink-0">
                              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                              <span>{iconCount} Icon</span>
                            </span>
                          )}
                        </div>

                        {/* Purse Tracker */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 mb-3.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Remaining Purse</span>
                            <span className="font-mono font-black text-amber-400 text-sm">
                              {formatRupees(team.remainingPurse)}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pursePercent}%`,
                                backgroundColor:
                                  pursePercent > 50
                                    ? '#10b981'
                                    : pursePercent > 20
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Spent: {formatRupees(totalSpent)}</span>
                            <span>{pursePercent.toFixed(0)}% Budget Left</span>
                          </div>
                        </div>

                        {/* Squad Count & Overseas */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3.5 font-mono">
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-500" /> Squad:
                            </span>
                            <span className="font-bold text-white">
                              {squadCount} / {maxSquad}
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Globe className="w-3 h-3 text-cyan-400" /> Overseas:
                            </span>
                            <span className="font-bold text-cyan-300">
                              {team.overseasCount ?? 0} / {team.maxOverseas}
                            </span>
                          </div>
                        </div>

                        {/* Purchased Players Section */}
                        <div className="border-t border-slate-800/80 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                              <span>Purchased Players ({squadCount})</span>
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Live Roster
                            </span>
                          </div>

                          {squad.length === 0 ? (
                            <div className="py-6 text-center rounded-xl bg-slate-950/40 border border-slate-850">
                              <p className="text-xs text-slate-500 italic">
                                No players acquired yet.
                              </p>
                              <span className="text-[10px] text-slate-600 block mt-0.5">
                                Ready for live bidding in next lot.
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {squad.map((sp: any) => {
                                const isIcon = sp.isIcon || sp.player?.isIcon;
                                const p = sp.player;
                                if (!p) return null;

                                return (
                                  <div
                                    key={sp.id}
                                    className={`p-2 rounded-xl flex items-center justify-between gap-2 transition-all ${
                                      isIcon
                                        ? 'bg-yellow-500/10 border border-yellow-500/25'
                                        : 'bg-slate-950/60 border border-slate-800/80 hover:bg-slate-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={
                                          p.profileImage ||
                                          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=80'
                                        }
                                        alt={p.name}
                                        className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs font-bold text-white truncate">
                                            {p.name}
                                          </span>
                                          {isIcon && (
                                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 shrink-0" />
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                          <span>{p.role}</span>
                                          {p.isOverseas && (
                                            <span className="text-cyan-400 text-[9px] font-mono">
                                              [OS]
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bought Price */}
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-mono font-black text-amber-400 block">
                                        {formatRupees(sp.price)}
                                      </span>
                                      <span className="text-[9px] font-mono text-emerald-400 uppercase">
                                        SOLD
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Main Content: View 2 (All Bought Players Registry) */}
      {activeView === 'sold-registry' && (
        <div className="bg-[#121724] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-white font-display uppercase tracking-wider">
                ALL BOUGHT PLAYERS REGISTRY ({allSoldEntries.length})
              </h3>
              <p className="text-xs text-slate-400">
                Complete real-time log of players purchased by teams throughout the tournament
              </p>
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedRoleFilter === role
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 border border-slate-750 text-slate-300 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {filteredSoldPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No bought players matching your search or filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSoldPlayers.map((item, idx) => (
                <div
                  key={`${item.player.id}-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        item.player.profileImage ||
                        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100'
                      }
                      alt={item.player.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {item.player.name}
                        </span>
                        {item.isIcon && (
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{item.player.role}</span>
                        <span>•</span>
                        <span>{item.player.country}</span>
                      </div>
                      {/* Purchasing Team Badge */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.team.primaryColor || '#f59e0b' }}
                        />
                        <span className="text-[11px] font-bold text-slate-200 truncate font-display">
                          {item.team.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hammer Price */}
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-amber-400 block">
                      {formatRupees(item.price)}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                      SOLD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
