import React from 'react';
import { Globe, Award, Shield, Zap, Target, Flame, Info, Star, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { Player } from '../../types';
import { formatRupees } from '../../utils/currency';
import { useAuctionStore } from '../../store/auction.store';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';

interface PlayerCardProps {
  player: Player | null;
  onViewProfile: (playerId: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onViewProfile }) => {
  const { state, showToast } = useAuctionStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  if (!player) {
    const unsoldPlayers = state?.players?.filter((p) => p.status === 'UNSOLD') || [];

    return (
      <div className="bg-[#121724]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[480px]">
        <div className="w-20 h-20 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
          <Award className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-300 font-display">No Player on Auction Block</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">
          Auction is currently waiting for the admin to introduce the next player lot.
        </p>

        {unsoldPlayers.length > 0 && isAdmin && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 max-w-xs w-full animate-in fade-in">
            <span className="text-xs text-rose-300 font-bold block mb-1">
              ⚠️ {unsoldPlayers.length} Unsold Player{unsoldPlayers.length > 1 ? 's' : ''} in Catalog
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              You can start round 2 for all unsold players or pick one to bid.
            </p>
            <button
              onClick={async () => {
                try {
                  await api.reauctionUnsold();
                  showToast('Round 2 initiated! Unsold players are now on the block.', 'success');
                } catch (err: any) {
                  showToast(err.message || 'Failed to re-auction unsold players', 'error');
                }
              }}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Start BID for Unsold ({unsoldPlayers.length})</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    Batter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Bowler: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'All-Rounder': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Wicketkeeper: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  const roleBadgeStyle = roleColors[player.role] || 'bg-slate-700 text-slate-200 border-slate-600';

  return (
    <div className="bg-[#121724]/95 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col backdrop-blur-md">
      {/* Top Banner Tag */}
      <div className="px-5 py-2.5 bg-gradient-to-r from-slate-900 via-[#182033] to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black">
            S.No: #{player.sNo || 1}
          </span>
          {player.isIcon && (
            <span className="px-2 py-0.5 rounded-lg bg-yellow-500/25 border border-yellow-500/50 text-yellow-300 font-bold text-[10px] flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-yellow-400" />
              ICON PLAYER
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {player.isOverseas ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Overseas
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Domestic
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {player.category}
          </span>
        </div>
      </div>

      {/* Player Image & Name Hero */}
      <div className="p-4 sm:p-6 relative">
        <div className="flex items-center gap-3.5 sm:gap-5">
          <div className="relative group shrink-0">
            <img
              src={player.profileImage}
              alt={player.name}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl shadow-black/60 group-hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback avatar
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`;
              }}
            />
            <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
              AGE {player.age}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-white font-display truncate">
                {player.name}
              </h2>
            </div>

            <div className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-1">
              <span className="font-semibold text-slate-300">{player.country}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${roleBadgeStyle}`}>
                {player.role}
              </span>
            </div>

            {/* Place / DOB / Local details */}
            {(player.place || player.dob) && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                {player.place && (
                  <span className="flex items-center gap-1 text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {player.place}
                  </span>
                )}
                {player.dob && (
                  <span className="flex items-center gap-1 text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    {player.dob}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-slate-400 space-y-0.5">
              <div className="flex items-center gap-1 truncate">
                <span className="text-slate-500">Bat:</span>
                <span className="text-slate-300 font-medium">{player.battingStyle}</span>
              </div>
              <div className="flex items-center gap-1 truncate">
                <span className="text-slate-500">Bowl:</span>
                <span className="text-slate-300 font-medium">{player.bowlingStyle}</span>
              </div>
            </div>

            {/* Belonging Team Badge */}
            <div className="mt-2.5">
              {player.belongingTeam ? (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-sm"
                  style={{
                    borderColor: `${player.belongingTeam.primaryColor}55`,
                    backgroundColor: `${player.belongingTeam.primaryColor}20`,
                    color: player.belongingTeam.primaryColor,
                  }}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Home Team: {player.belongingTeam.name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Team: Not Selected</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Base Price Bar */}
        <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            BASE PRICE
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-amber-400">
            {formatRupees(player.basePrice)}
          </span>
        </div>
      </div>

      {/* Career Statistics Matrix */}
      <div className="px-6 pb-6 pt-1 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span>Career T20 Performance</span>
            <button
              onClick={() => onViewProfile(player.id)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] lowercase"
            >
              <Info className="w-3.5 h-3.5" />
              <span>full profile</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Matches</div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono mt-0.5">
                {player.matches}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Runs</div>
              <div className="text-sm sm:text-base font-extrabold text-amber-300 font-mono mt-0.5">
                {player.runs}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Strike Rate</div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                {player.strikeRate}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Bat Avg</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-200 font-mono mt-0.5">
                {player.battingAvg}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">High Score</div>
              <div className="text-sm sm:text-base font-extrabold text-purple-300 font-mono mt-0.5">
                {player.highestScore}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Wickets</div>
              <div className="text-sm sm:text-base font-extrabold text-cyan-400 font-mono mt-0.5">
                {player.wickets}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Economy</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-200 font-mono mt-0.5">
                {player.economy || '—'}
              </div>
            </div>

            <div className="bg-[#182033]/70 border border-slate-800 rounded-xl p-2.5 col-span-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Best Bowling</div>
              <div className="text-sm sm:text-base font-extrabold text-cyan-300 font-mono mt-0.5">
                {player.bestBowling || '0/0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
