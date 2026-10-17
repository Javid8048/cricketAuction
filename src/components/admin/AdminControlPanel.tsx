import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  FastForward,
  CheckCircle2,
  XCircle,
  RotateCcw,
  SkipForward,
  RefreshCw,
  Shield,
  Zap,
  Radio,
  UserCheck,
  IndianRupee,
  AlertTriangle,
  Shuffle,
} from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { api } from '../../services/api';
import { Player, Team } from '../../types';
import { formatRupees } from '../../utils/currency';
import { ManualAssignPlayerModal } from './ManualAssignPlayerModal';

export const AdminControlPanel: React.FC = () => {
  const { state, isStandaloneMode, adminActionStandalone, manuallyAssignPlayer } = useAuctionStore();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Manual Assignment State
  const [activeTab, setActiveTab] = useState<'bidding' | 'manual'>('bidding');
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignAmount, setAssignAmount] = useState<number | string>(200);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const auction = state?.auction;
  const activePlayer = state?.activePlayer;
  const teams = state?.teams || [];

  useEffect(() => {
    api.getPlayers().then(setAllPlayers).catch(console.error);
  }, [state?.auction?.activePlayerId]);

  useEffect(() => {
    if (activePlayer) {
      const pPrice = activePlayer.basePrice;
      setAssignAmount(pPrice && pPrice > 100 && pPrice < 2500 ? pPrice : 200);
    }
    if (teams.length > 0 && !assignTeamId) {
      setAssignTeamId(teams[0].id);
    }
  }, [activePlayer?.id, teams]);

  const handleAction = async (
    actionKey: string,
    apiFn: () => Promise<any>,
    confirmMsg?: string,
    payload?: any
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setLoadingAction(true);
    try {
      if (isStandaloneMode) {
        await adminActionStandalone(actionKey, payload);
      } else {
        await apiFn();
      }
    } catch (err: any) {
      console.warn(`API call failed for ${actionKey}, falling back to standalone simulation:`, err);
      try {
        await adminActionStandalone(actionKey, payload);
      } catch (fallbackErr: any) {
        alert(fallbackErr.message || err.message);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleManualSelect = async () => {
    if (!selectedPlayerId) return;
    handleAction('select_player', () => api.selectPlayer(selectedPlayerId), undefined, selectedPlayerId);
  };

  const handleDirectManualAssign = async () => {
    if (!activePlayer) {
      alert('No active player on the block. Please put a player on the block first.');
      return;
    }
    if (!assignTeamId) {
      alert('Please select a team.');
      return;
    }
    const finalPrice = assignAmount === '' ? 0 : Number(assignAmount);
    if (isNaN(finalPrice) || finalPrice <= 100 || finalPrice >= 2500) {
      alert('Price must be greater than ₹100 and less than ₹2,500.');
      return;
    }

    const targetTeam = teams.find((t) => t.id === assignTeamId);
    if (targetTeam && targetTeam.remainingPurse < finalPrice) {
      setAssignError(
        `Insufficient purse! ${targetTeam.name} has only ${formatRupees(targetTeam.remainingPurse)}.`
      );
      return;
    }

    setLoadingAction(true);
    setAssignError(null);
    try {
      await manuallyAssignPlayer(activePlayer.id, assignTeamId, finalPrice);
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign player.');
    } finally {
      setLoadingAction(false);
    }
  };

  const selectedTargetTeam = teams.find((t) => t.id === assignTeamId);
  const remainingAfter = selectedTargetTeam
    ? selectedTargetTeam.remainingPurse - (Number(assignAmount) || 0)
    : 0;

  return (
    <div className="bg-[#121724] border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm sm:text-base font-extrabold text-white font-display uppercase tracking-wider">
            AUCTIONEER COMMAND DESK
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
            COMMISSIONER ACCESS
          </span>
        </div>

        {/* Two Options Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('bidding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bidding'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Option 1: Team BID Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Option 2: Sold To Team (Manual Assign)</span>
          </button>
        </div>
      </div>

      {/* Introduce Player to Auction Block */}
      <div className="mb-5 bg-[#161d2e] p-3.5 sm:p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Introduce Player to Auction Block
          </label>
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1"
          >
            <UserCheck className="w-3 h-3" />
            <span>Assign Any Player from Roster</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Choose player from catalog --</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sNo ? `[#${p.sNo}] ` : ''}{p.name} ({p.country} • {p.role} • {formatRupees(p.basePrice)}) [{p.status}]
              </option>
            ))}
          </select>
          <button
            onClick={handleManualSelect}
            disabled={!selectedPlayerId || loadingAction}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-40 shrink-0"
          >
            Put on Block
          </button>
        </div>
      </div>

      {/* OPTION 2: ADMIN ASSIGN PLAYER MANUALLY PANEL */}
      {activeTab === 'manual' && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                <Zap className="w-4 h-4 fill-slate-950" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Option 2: Direct Admin Team Allocation (Sold To Team)
                </h4>
                <p className="text-[11px] text-emerald-300">
                  Assign active player directly to a team. Amount will be deducted from their purse.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
            >
              Browse Catalog
            </button>
          </div>

          {assignError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{assignError}</span>
            </div>
          )}

          {activePlayer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              {/* Team Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Target Team (Sold To)
                </label>
                <select
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({formatRupees(t.remainingPurse)} Purse)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Assignment Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="101"
                    max="2499"
                    step="any"
                    value={assignAmount}
                    onChange={(e) => setAssignAmount(e.target.value)}
                    placeholder="Enter price (₹101 - ₹2,499)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleDirectManualAssign}
                  disabled={loadingAction || assignAmount === '' || Number(assignAmount) <= 100 || Number(assignAmount) >= 2500}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Sold To Team (Confirm)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              No player currently active on the auction block. Please put a player on the block above or use the catalog selector.
            </div>
          )}

          {/* Real-time purse math preview */}
          {selectedTargetTeam && activePlayer && (
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-slate-400">
                Purse impact on <strong className="text-white">{selectedTargetTeam.name}</strong>:
              </span>
              <span className="font-mono">
                <span className="text-slate-300">{formatRupees(selectedTargetTeam.remainingPurse)}</span>
                <span className="text-rose-400 font-bold"> - {formatRupees(Number(assignAmount) || 0)}</span>
                <span className="text-slate-400"> = </span>
                <strong className={remainingAfter < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {formatRupees(remainingAfter)} Left
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* OPTION 1: TEAM BIDDING CONTROLS & AUCTION FLOW */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Auctioneer Control Actions (Option 1: Live Team BID Flow)</span>
          {auction?.status === 'ACTIVE' && (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              AUCTION LIVE
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* START / PAUSE */}
          {auction?.status === 'ACTIVE' ? (
            <button
              onClick={() => handleAction('pause', () => api.pauseAuction())}
              disabled={loadingAction}
              className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
            >
              <Pause className="w-5 h-5 text-amber-400" />
              <span>PAUSE AUCTION</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction('start', () => api.startAuction())}
              disabled={loadingAction}
              className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
            >
              <Play className="w-5 h-5 text-emerald-400" />
              <span>{auction?.status === 'PAUSED' ? 'RESUME' : 'START AUCTION'}</span>
            </button>
          )}

          {/* START BIDDING TIMER */}
          <button
            onClick={() => handleAction('start', () => api.startBidding())}
            disabled={loadingAction || !auction?.activePlayerId}
            className="p-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Play className="w-5 h-5 text-sky-400" />
            <span>START BID TIMER</span>
          </button>

          {/* CONFIRM SOLD TO BIDDER */}
          <button
            onClick={() =>
              handleAction(
                'sell',
                () => api.sellPlayer(),
                'Manually confirm player as SOLD to highest bidder?'
              )
            }
            disabled={loadingAction || !auction?.activePlayerId}
            className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
            title="Sell to highest bid team"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>SELL TO BIDDER</span>
          </button>

          {/* SOLD TO TEAM (MANUAL ASSIGN) */}
          <button
            onClick={() => {
              setActiveTab('manual');
              setIsAssignModalOpen(true);
            }}
            disabled={loadingAction || !auction?.activePlayerId}
            className="p-3 rounded-xl bg-gradient-to-b from-amber-500/25 to-amber-600/15 hover:from-amber-500/35 hover:to-amber-600/25 border-2 border-amber-500/60 text-amber-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/10"
            title="Assign and sell player manually to chosen team with purse deduction"
          >
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>SOLD TO TEAM</span>
          </button>

          {/* MARK UNSOLD */}
          <button
            onClick={() =>
              handleAction('unsold', () => api.markUnsold(), 'Mark current player as UNSOLD?')
            }
            disabled={loadingAction || !auction?.activePlayerId}
            className="p-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>MARK UNSOLD</span>
          </button>

          {/* NEXT PLAYER */}
          <button
            onClick={() => handleAction('next', () => api.nextPlayer())}
            disabled={loadingAction}
            className="p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
          >
            <FastForward className="w-5 h-5 text-purple-400" />
            <span>NEXT PLAYER</span>
          </button>

          {/* SKIP PLAYER */}
          <button
            onClick={() => handleAction('next', () => api.skipPlayer(), 'Skip this player for now?')}
            disabled={loadingAction || !auction?.activePlayerId}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <SkipForward className="w-5 h-5 text-slate-400" />
            <span>SKIP PLAYER</span>
          </button>

          {/* RE-AUCTION UNSOLD */}
          <button
            onClick={() =>
              handleAction(
                'start',
                () => api.reauctionUnsold(),
                'Initiate Round 2 for all UNSOLD players?'
              )
            }
            disabled={loadingAction}
            className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <span>RE-AUCTION UNSOLD</span>
          </button>

          {/* SHUFFLE AUCTION POOL */}
          <button
            onClick={() =>
              handleAction(
                'shuffle',
                () => api.shuffleAuctionPool(),
                'Shuffle upcoming auction pool? All remaining players will be randomized in order so players from all teams are mixed.'
              )
            }
            disabled={loadingAction}
            className="p-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40"
            title="Randomly shuffle all upcoming players in the auction pool so players belonging to any team are thoroughly mixed"
          >
            <Shuffle className="w-5 h-5 text-indigo-400" />
            <span>SHUFFLE POOL</span>
          </button>

          {/* RESET AUCTION */}
          <button
            onClick={() =>
              handleAction(
                'reset',
                () => api.resetAuction(),
                'WARNING: This will reset all team budgets, erase all bids, and revert all players back to UPCOMING. Proceed?'
              )
            }
            disabled={loadingAction}
            className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <span>RESET AUCTION</span>
          </button>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      <ManualAssignPlayerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        defaultPlayerId={activePlayer?.id}
        onSuccess={() => {
          api.getPlayers().then(setAllPlayers).catch(console.error);
        }}
      />
    </div>
  );
};
