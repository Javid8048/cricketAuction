import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Trophy,
  Shield,
  Star,
  Globe,
  IndianRupee,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { api } from '../../services/api';
import { Player, Team } from '../../types';
import { formatRupees } from '../../utils/currency';

interface SpectatorHoldingsHubProps {
  onViewPlayerProfile: (playerId: string) => void;
}

export const SpectatorHoldingsHub: React.FC<SpectatorHoldingsHubProps> = ({
  onViewPlayerProfile,
}) => {
  const { state } = useAuctionStore();
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [fallbackPlayers, setFallbackPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Fetch full players list if not yet provided in state
  useEffect(() => {
    if (!state?.players || state.players.length === 0) {
      api.getPlayers().then(setFallbackPlayers).catch(console.error);
    }
  }, [state?.players]);

  const teams: Team[] = state?.teams || [];
  const players: Player[] = (state?.players && state.players.length > 0)
    ? state.players
    : fallbackPlayers;

  // Macro Metrics
  const totalPool = players.length;
  const soldPlayers = players.filter((p) => p.status === 'SOLD');
  const unsoldCount = players.filter((p) => p.status === 'UNSOLD').length;
  const upcomingCount = players.filter((p) => p.status === 'UPCOMING').length;
  const inAuctionCount = players.filter((p) => p.status === 'IN_AUCTION').length;
  const defaultPurse = state?.auction?.defaultPurse || 15000;
  const totalSpent = teams.reduce((acc, t) => {
    const squadSpent = t.squad?.reduce((sum, sp) => sum + (sp.price || 0), 0) || 0;
    return acc + squadSpent;
  }, 0);

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  // Filtered Players
  const filteredPlayers = players.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const sNoMatch = `#${p.sNo}` === q || `${p.sNo}` === q || p.sNo.toString().includes(q);
      const nameMatch = p.name.toLowerCase().includes(q);
      const teamMatch = p.teamPlayer?.team?.name.toLowerCase().includes(q) ||
        p.teamPlayer?.team?.shortName.toLowerCase().includes(q);
      if (!sNoMatch && !nameMatch && !teamMatch) return false;
    }

    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;

    return true;
  });

  return (
    <div className="mt-8 bg-[#0c101a] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Section Title */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              LIVE SPECTATOR INTELLIGENCE
            </span>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">• Real-time Sync</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mt-1.5">
            TOURNAMENT TEAMS & PLAYER SQUADS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track real-time purse balances, players holding by team, and complete tournament draft catalog.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 w-full lg:w-auto p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'teams'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Teams & Holding ({teams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'players'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players Pool ({players.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-5">
        <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total Teams</span>
          <div className="text-lg font-black font-mono text-white mt-0.5">{teams.length}</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Player Pool</span>
          <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">{totalPool}</div>
        </div>

        <div className="bg-slate-900/70 border border-emerald-500/30 p-3 rounded-2xl text-center">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Sold / Held</span>
          <div className="text-lg font-black font-mono text-emerald-300 mt-0.5">{soldPlayers.length}</div>
        </div>

        <div className="bg-slate-900/70 border border-rose-500/30 p-3 rounded-2xl text-center">
          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">Unsold</span>
          <div className="text-lg font-black font-mono text-rose-300 mt-0.5">{unsoldCount}</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-2xl text-center">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Upcoming</span>
          <div className="text-lg font-black font-mono text-slate-200 mt-0.5">{upcomingCount}</div>
        </div>

        <div className="bg-slate-900/70 border border-amber-500/30 p-3 rounded-2xl text-center">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Total Spent</span>
          <div className="text-lg font-black font-mono text-amber-300 mt-0.5">{formatRupees(totalSpent)}</div>
        </div>
      </div>

      {/* TAB 1: TEAMS & PLAYERS HOLDING BY TEAM */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-display uppercase tracking-wide">
                Participating Teams & Holding Squads
              </h3>
              <p className="text-xs text-slate-400">
                Each team can bid for up to 12 members with a tournament purse limit of {formatRupees(defaultPurse)}.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {teams.length} teams
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-300">No Teams Registered Yet</div>
              <p className="text-xs text-slate-500 mt-1">
                Teams will appear here once configured by the Tournament Commissioner.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {teams.map((team) => {
                const squad = team.squad || [];
                const maxSquad = team.maxSquadSize || 12;
                const pursePercent = team.totalPurse > 0
                  ? Math.max(0, Math.min(100, (team.remainingPurse / team.totalPurse) * 100))
                  : 100;
                const squadSpent = squad.reduce((sum, sp) => sum + (sp.price || 0), 0);
                const isExpanded = expandedTeams[team.id] ?? true; // expanded by default for full view

                return (
                  <div
                    key={team.id}
                    className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all relative overflow-hidden"
                  >
                    {/* Top Team Color Stripe */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: team.primaryColor || '#f59e0b' }}
                    />

                    <div>
                      {/* Team Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-black font-display text-sm text-white shadow-md shrink-0 border border-white/10"
                            style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                          >
                            {team.shortName || team.name.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm sm:text-base leading-tight">
                              {team.name}
                            </h4>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                              {team.ownerName && <span>Owner: <strong className="text-slate-300">{team.ownerName}</strong></span>}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700 shrink-0">
                          {team.shortName}
                        </span>
                      </div>

                      {/* Purse Financials Bar */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                            Purse Balance
                          </span>
                          <span className="font-mono font-black text-amber-400 text-sm">
                            {formatRupees(team.remainingPurse)} LEFT
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
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

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Total Purse: {formatRupees(team.totalPurse)}</span>
                          <span>Spent: {formatRupees(squadSpent)}</span>
                        </div>
                      </div>

                      {/* Squad Metrics Pill Row */}
                      <div className="grid grid-cols-2 gap-2 mb-3.5 text-xs">
                        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Squad Size</span>
                          <span className="font-mono font-bold text-white">
                            {squad.length} / {maxSquad}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Icon Players</span>
                          <span className="font-mono font-bold text-amber-400">
                            {squad.filter((sp) => sp.isIcon || sp.player?.isIcon).length} / 2
                          </span>
                        </div>
                      </div>

                      {/* PLAYERS HOLDING BY TEAM (SQUAD ROSTER) */}
                      <div className="border-t border-slate-800/80 pt-3">
                        <div
                          onClick={() => toggleTeamExpand(team.id)}
                          className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Players Holding ({squad.length})</span>
                          </div>
                          <button className="text-slate-400 hover:text-white">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="space-y-1.5">
                            {squad.length === 0 ? (
                              <div className="py-4 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-[11px] text-slate-500 italic">
                                No players acquired yet. Team is active in live bidding.
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {squad.map((sp: any, idx: number) => {
                                  const p = sp.player || sp;
                                  const isIcon = sp.isIcon || p.isIcon;
                                  return (
                                    <div
                                      key={p.id || idx}
                                      onClick={() => onViewPlayerProfile(p.id)}
                                      className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                                      title="Click to view player stats"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-5 h-5 rounded-md bg-slate-800 font-mono text-[10px] text-slate-300 flex items-center justify-center font-bold shrink-0">
                                          #{p.sNo || idx + 1}
                                        </span>
                                        <img
                                          src={p.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`}
                                          alt={p.name}
                                          className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`;
                                          }}
                                        />
                                        <div className="min-w-0">
                                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate flex items-center gap-1.5">
                                            <span>{p.name}</span>
                                            {isIcon && (
                                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40 shrink-0">
                                                ★ Icon
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            {p.role} {p.isOverseas ? '• Overseas' : ''}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <div className="font-mono font-bold text-xs text-amber-400">
                                          {formatRupees(sp.price || p.basePrice || 0)}
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-mono">Bought</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULL PLAYERS DRAFT CATALOG */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {/* Search & Filters Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player by S.No (e.g. 1) or Name or Team..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                {(['ALL', 'IN_AUCTION', 'SOLD', 'UPCOMING', 'UNSOLD'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      statusFilter === status
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status === 'ALL'
                      ? 'All'
                      : status === 'IN_AUCTION'
                      ? 'Live'
                      : status === 'SOLD'
                      ? 'Sold'
                      : status === 'UPCOMING'
                      ? 'Upcoming'
                      : 'Unsold'}
                  </button>
                ))}
              </div>

              {/* Role Dropdown */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Roles</option>
                <option value="Batter">Batters</option>
                <option value="Bowler">Bowlers</option>
                <option value="All-Rounder">All-Rounders</option>
                <option value="Wicketkeeper">Wicketkeepers</option>
              </select>
            </div>
          </div>

          {/* Players Table / Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-300">No Players Match Filter</div>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for a different S.No, player name, or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPlayers.map((player) => {
                const isSold = player.status === 'SOLD';
                const isLive = player.status === 'IN_AUCTION';
                const isUnsold = player.status === 'UNSOLD';
                const team = player.teamPlayer?.team;

                return (
                  <div
                    key={player.id}
                    onClick={() => onViewPlayerProfile(player.id)}
                    className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div>
                      {/* Top Header: S.No + Role + Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                          S.No #{player.sNo}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isSold
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isLive
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : isUnsold
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isLive ? '🔴 Live' : player.status}
                        </span>
                      </div>

                      {/* Player Profile Brief */}
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={player.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`}
                          alt={player.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`;
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors truncate">
                            {player.name}
                          </h4>
                          <div className="text-[11px] text-slate-400">
                            {player.role} • {player.age} yrs
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {player.country} {player.isOverseas ? '(Overseas)' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Base Price & Styles */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono mb-3">
                        <div>
                          <div className="text-slate-500 text-[10px]">Base Price</div>
                          <div className="text-slate-300 font-bold">{formatRupees(player.basePrice)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-500 text-[10px]">Category</div>
                          <div className="text-slate-300 font-semibold truncate">{player.category || 'Local'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status / Acquiring Team */}
                    <div className="pt-2 border-t border-slate-800/80">
                      {isSold && team ? (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: team.primaryColor || '#10b981' }}
                            />
                            <span className="font-bold text-white truncate text-[11px]">
                              {team.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 text-xs shrink-0">
                            {formatRupees(player.teamPlayer?.price || player.basePrice)}
                          </span>
                        </div>
                      ) : isLive ? (
                        <div className="text-center py-1 text-xs font-bold text-amber-300 font-mono animate-pulse">
                          🔥 Currently on Bidding Block
                        </div>
                      ) : isUnsold ? (
                        <div className="text-center py-1 text-xs font-bold text-rose-400 font-mono">
                          Unsold in Round 1
                        </div>
                      ) : (
                        <div className="text-center py-1 text-xs text-slate-400 font-mono">
                          Awaiting Hammer Call
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
