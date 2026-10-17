import React from 'react';
import { Users, Globe, Award, Sparkles } from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';

export const TeamStatusPanel: React.FC = () => {
  const { state } = useAuctionStore();

  const teams = state?.teams || [];
  const highestBidTeamId = state?.auction?.highestBidTeamId;
  const maxPurse = state?.auction?.defaultPurse || 15000;

  return (
    <div className="bg-[#121724]/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col h-full backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider">
            TEAM STANDINGS
          </h3>
          <span className="text-[11px] text-slate-400">{teams.length} Participating Teams</span>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded bg-slate-800/90 text-amber-400 font-mono font-bold border border-slate-700/60">
          MAX PURSE {formatRupees(maxPurse)}
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
        {teams.map((team) => {
          const isHighest = team.id === highestBidTeamId;
          const teamTotal = team.totalPurse || maxPurse;
          const pursePercent = teamTotal > 0 ? Math.max(0, Math.min(100, (team.remainingPurse / teamTotal) * 100)) : 100;

          return (
            <div
              key={team.id}
              className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                isHighest
                  ? 'bg-[#18253b] border-amber-500/80 shadow-lg shadow-amber-500/10 scale-[1.02]'
                  : 'bg-[#151c2d]/70 hover:bg-[#182033] border-slate-800/80'
              }`}
            >
              {/* Highlight strip for current bidder */}
              {isHighest && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: team.primaryColor }}
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-md shrink-0 border border-white/20"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    {team.logoText}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white font-display truncate">
                        {team.name}
                      </span>
                      {isHighest && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black uppercase tracking-wider animate-pulse flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          BIDDER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        {team.squadSize ?? 0}/{team.maxSquadSize}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        {team.overseasCount ?? 0}/{team.maxOverseas} OS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining Purse */}
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black font-mono text-amber-400">
                    {formatRupees(team.remainingPurse)}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">PURSE LEFT</div>
                </div>
              </div>

              {/* Purse Bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pursePercent}%`,
                    backgroundColor: pursePercent < 25 ? '#ef4444' : pursePercent < 50 ? '#f59e0b' : team.primaryColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
