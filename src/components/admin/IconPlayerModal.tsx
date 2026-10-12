import React, { useState, useEffect } from 'react';
import { Star, X, Search, Shield, UserCheck, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { Team, Player } from '../../types';
import { api } from '../../services/api';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';

interface IconPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId?: string;
}

export const IconPlayerModal: React.FC<IconPlayerModalProps> = ({
  isOpen,
  onClose,
  selectedTeamId,
}) => {
  const { state, showToast, initState } = useAuctionStore();
  const teams = state?.teams || [];

  const [activeTeamId, setActiveTeamId] = useState<string>(selectedTeamId || teams[0]?.id || '');
  const [upcomingPlayers, setUpcomingPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const iconPrice = state?.auction?.iconPlayerPrice || 2500;

  useEffect(() => {
    if (selectedTeamId) {
      setActiveTeamId(selectedTeamId);
    } else if (teams.length > 0 && !activeTeamId) {
      setActiveTeamId(teams[0].id);
    }
  }, [selectedTeamId, teams]);

  // Fetch upcoming players available for Icon selection
  useEffect(() => {
    if (!isOpen) return;
    async function fetchUpcoming() {
      setLoadingPlayers(true);
      try {
        const players = await api.getPlayers({ status: 'UPCOMING' });
        setUpcomingPlayers(players);
      } catch (err) {
        console.error('Failed to load upcoming players:', err);
      } finally {
        setLoadingPlayers(false);
      }
    }
    fetchUpcoming();
  }, [isOpen]);

  if (!isOpen || !activeTeam) return null;

  const currentIcons = activeTeam.squad?.filter((sp) => sp.isIcon || sp.player?.isIcon) || [];
  const canAddMoreIcons = currentIcons.length < 2;

  // Filter players by S.No or Name
  const filteredPlayers = upcomingPlayers.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return String(p.sNo) === q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
  });

  const handleAssignIcon = async (player: Player) => {
    if (!canAddMoreIcons) {
      showToast(`Team already has maximum of 2 Icon players.`, 'error');
      return;
    }
    if (activeTeam.remainingPurse < iconPrice) {
      showToast(`Insufficient purse! Team needs ${formatRupees(iconPrice)}.`, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await api.assignIconPlayer(activeTeam.id, player.id, iconPrice);
      showToast(`${player.name} assigned as Icon player for ${activeTeam.name}!`, 'success');
      await initState();
      // Remove from upcoming list
      setUpcomingPlayers((prev) => prev.filter((p) => p.id !== player.id));
    } catch (err: any) {
      showToast(err.message || 'Failed to assign Icon player.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveIcon = async (player: Player) => {
    setIsProcessing(true);
    try {
      await api.removeIconPlayer(activeTeam.id, player.id);
      showToast(`${player.name} removed from Icon players (+${formatRupees(iconPrice)} refunded)!`, 'success');
      await initState();
      // Refresh upcoming players
      const players = await api.getPlayers({ status: 'UPCOMING' });
      setUpcomingPlayers(players);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove Icon player.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-4 sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Icon Players (Max 2 Per Team)</h3>
              <p className="text-xs text-slate-400">
                Icon players are chosen before bidding. Cost: <strong className="text-amber-400">{formatRupees(iconPrice)}</strong> (deducted from purse).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selector Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Team:</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTeamId(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTeamId === t.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                <span>{t.shortName}</span>
                <span className="text-[10px] opacity-75">
                  ({(t.squad?.filter((sp) => sp.isIcon || sp.player?.isIcon).length || 0)}/2)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Team Status Card */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTeam.primaryColor }} />
              {activeTeam.name}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Owner: {activeTeam.ownerName || 'Not specified'} • Phone: {activeTeam.phone || 'N/A'}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">REMAINING PURSE</span>
              <span className="text-amber-400 font-bold">{formatRupees(activeTeam.remainingPurse)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SQUAD</span>
              <span className="text-white font-bold">{activeTeam.squadSize || 0}/{activeTeam.maxSquadSize || 12}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ICON PLAYERS</span>
              <span className="text-cyan-400 font-bold">{currentIcons.length}/2</span>
            </div>
          </div>
        </div>

        {/* Current Icon Players Assigned */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Current Icon Players ({currentIcons.length}/2)
          </h4>
          {currentIcons.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 text-center">
              No Icon players assigned yet. Select up to 2 players from below.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentIcons.map((sp) => (
                <div
                  key={sp.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={sp.player.profileImage}
                      alt={sp.player.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-400 font-mono">#{sp.player.sNo}</span>
                        <span>{sp.player.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sp.player.role} • Cost: {formatRupees(sp.price)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRemoveIcon(sp.player)}
                    title="Remove Icon player & refund purse"
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign New Icon Player List */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Available Players Pool
            </h4>
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search S.No or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {loadingPlayers ? (
              <div className="text-xs text-slate-500 text-center py-6">Loading players...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">No matching upcoming players found.</div>
            ) : (
              filteredPlayers.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-850 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.profileImage}
                      alt={p.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                          #{p.sNo}
                        </span>
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.role} • {p.place || p.country}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || !canAddMoreIcons || activeTeam.remainingPurse < iconPrice}
                    onClick={() => handleAssignIcon(p)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 shrink-0 shadow-sm shadow-amber-500/10 active:scale-95"
                  >
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>Assign ({formatRupees(iconPrice)})</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
