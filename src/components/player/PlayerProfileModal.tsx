import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Player } from '../../types';
import { api } from '../../services/api';
import { formatRupees } from '../../utils/currency';
import { Globe, Award, Shield, User, Trophy, Calendar } from 'lucide-react';

interface PlayerProfileModalProps {
  playerId: string | null;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ playerId, onClose }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      return;
    }
    setLoading(true);
    api
      .getPlayerById(playerId)
      .then((data) => setPlayer(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (!playerId) return null;

  return (
    <Modal isOpen={!!playerId} onClose={onClose} title="Player Profile Dossier" maxWidth="max-w-3xl">
      {loading || !player ? (
        <div className="py-12 text-center text-slate-400">Loading player dossier...</div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-[#161d2e] p-6 rounded-2xl border border-slate-800">
            <img
              src={player.profileImage}
              alt={player.name}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-amber-500/50 shadow-xl shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`;
              }}
            />

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {player.category}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    player.status === 'SOLD'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : player.status === 'UNSOLD'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {player.status}
                </span>
                {player.isOverseas && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Overseas
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white font-display">{player.name}</h2>
              <p className="text-sm text-slate-400 font-medium">
                {player.country} • Age {player.age} • {player.role}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Batting Style: </span>
                  <span className="text-slate-200 font-semibold">{player.battingStyle}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Bowling Style: </span>
                  <span className="text-slate-200 font-semibold">{player.bowlingStyle}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Player Belongs To (Home Affiliation):</span>
                    </span>
                    <span className="text-amber-300 font-bold">
                      {player.belongingTeamName || player.belongingTeam?.name
                        ? `${player.belongingTeamName || player.belongingTeam?.name} (Can play for any team)`
                        : 'Independent / Free Agent (Open Pool)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/60">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Player Sold To (Drafted Franchise):</span>
                    </span>
                    <span className={player.status === 'SOLD' && player.teamPlayer?.team ? 'text-emerald-400 font-bold' : 'text-slate-500 font-medium'}>
                      {player.status === 'SOLD' && player.teamPlayer?.team
                        ? `${player.teamPlayer.team.name} (${formatRupees(player.teamPlayer.price || player.currentPrice || 0)})`
                        : 'Not Sold / In Open Pool'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auction Valuation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#141b2b] p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">BASE VALUATION</span>
              <div className="text-lg font-black font-mono text-amber-400 mt-1">
                {formatRupees(player.basePrice)}
              </div>
            </div>

            <div className="bg-[#141b2b] p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">AUCTION STATUS</span>
              <div className="text-lg font-black font-mono text-white mt-1">
                {player.status}
              </div>
            </div>

            <div className="bg-[#141b2b] p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">FINAL PURCHASE</span>
              <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                {player.currentPrice ? formatRupees(player.currentPrice) : '—'}
              </div>
            </div>
          </div>

          {/* Acquired Team if Sold */}
          {player.teamPlayer?.team && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                  style={{ backgroundColor: player.teamPlayer.team.primaryColor }}
                >
                  {player.teamPlayer.team.shortName}
                </div>
                <div>
                  <div className="text-xs text-emerald-300 font-semibold uppercase">Acquired By</div>
                  <div className="text-sm font-bold text-white">{player.teamPlayer.team.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Winning Price</div>
                <div className="text-sm font-extrabold font-mono text-emerald-400">
                  {formatRupees(player.teamPlayer.price)}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Career Stats */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Official T20 Career Records
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Matches</div>
                <div className="text-base font-extrabold text-white font-mono mt-1">{player.matches}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Runs</div>
                <div className="text-base font-extrabold text-amber-300 font-mono mt-1">{player.runs}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Bat Avg</div>
                <div className="text-base font-extrabold text-slate-200 font-mono mt-1">{player.battingAvg}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Strike Rate</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono mt-1">{player.strikeRate}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">High Score</div>
                <div className="text-base font-extrabold text-purple-300 font-mono mt-1">{player.highestScore}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Wickets</div>
                <div className="text-base font-extrabold text-cyan-400 font-mono mt-1">{player.wickets}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Economy</div>
                <div className="text-base font-extrabold text-slate-200 font-mono mt-1">{player.economy || '—'}</div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Best Bowling</div>
                <div className="text-base font-extrabold text-cyan-300 font-mono mt-1">{player.bestBowling || '0/0'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
