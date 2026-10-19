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
  Clock,
  Gavel,
} from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { api } from '../../services/api';
import { Player, Team } from '../../types';
import { formatRupees } from '../../utils/currency';
import { ManualAssignPlayerModal } from './ManualAssignPlayerModal';
import { ManualBidModal } from './ManualBidModal';

export const AdminControlPanel: React.FC = () => {
  const { state, isStandaloneMode, adminActionStandalone, manuallyAssignPlayer } = useAuctionStore();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isManualBidModalOpen, setIsManualBidModalOpen] = useState(false);

  const auction = state?.auction;
  const activePlayer = state?.activePlayer;
  const teams = state?.teams || [];

  useEffect(() => {
    api.getPlayers().then(setAllPlayers).catch(console.error);
  }, [state?.auction?.activePlayerId]);



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



  const isTimerEnabled = auction?.timerEnabled !== false;
  const timerSec = auction?.defaultTimerSec || 10;

  const handleToggleTimer = async () => {
    setLoadingAction(true);
    try {
      if (isStandaloneMode) {
        await adminActionStandalone('update_settings', { timerEnabled: !isTimerEnabled });
      } else {
        await api.updateAuctionSettings({ timerEnabled: !isTimerEnabled });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle timer');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="bg-[#121724] border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm sm:text-base font-extrabold text-white font-display uppercase tracking-wider">
            AUCTIONEER COMMAND DESK
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
            COMMISSIONER ACCESS
          </span>

          {/* Instant 1-Click BID Timer ON/OFF Toggle */}
          <button
            type="button"
            onClick={handleToggleTimer}
            disabled={loadingAction}
            title={isTimerEnabled ? 'Click to switch to Manual Auction Mode (Timer Disabled)' : 'Click to enable countdown BID timer'}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm active:scale-95 disabled:opacity-50 ${
              isTimerEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isTimerEnabled ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span>⏱️ Timer: {isTimerEnabled ? `ON (${timerSec}s)` : 'OFF (Manual)'}</span>
          </button>
        </div>

        {/* Commissioner Header Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Manual Bid Pop-up Modal Button */}
          <button
            type="button"
            onClick={() => setIsManualBidModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Open Manual Bid Pop-up Modal to place a bid on behalf of any team"
          >
            <Gavel className="w-3.5 h-3.5 text-amber-400" />
            <span>Manual Bid (Pop-up)</span>
          </button>

          {/* Manual Assign Pop-up Modal Button */}
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 hover:from-emerald-500/30 hover:to-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Open Manual Assign Pop-up Modal"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manual Assign (Pop-up)</span>
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

      {/* AUCTIONEER COMMAND ACTIONS & BID FLOW */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Auctioneer Control Actions (Live BID & Gavel Flow)</span>
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
              className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10"
            >
              <Play className="w-5 h-5 text-emerald-400" />
              <span>START AUCTION</span>
            </button>
          )}

          {/* START BIDDING TIMER */}
          <button
            onClick={() => handleAction('start', () => api.startBidding())}
            disabled={loadingAction}
            className="p-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 shadow-md shadow-sky-500/10"
          >
            <Play className="w-5 h-5 text-sky-400" />
            <span>START BID TIMER</span>
          </button>

          {/* MANUAL BID FOR TEAM (POP-UP) */}
          <button
            onClick={() => setIsManualBidModalOpen(true)}
            disabled={loadingAction || !auction?.activePlayerId}
            className="p-3 rounded-xl bg-gradient-to-b from-sky-500/25 to-sky-600/15 hover:from-sky-500/35 hover:to-sky-600/25 border-2 border-sky-500/60 text-sky-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-sky-500/10"
            title="Open separate Manual Bid Pop-up to place a bid for any team"
          >
            <Gavel className="w-5 h-5 text-sky-400" />
            <span>MANUAL BID</span>
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

          {/* SOLD TO TEAM (MANUAL ASSIGN POP-UP) */}
          <button
            onClick={() => setIsAssignModalOpen(true)}
            disabled={loadingAction}
            className="p-3 rounded-xl bg-gradient-to-b from-amber-500/25 to-amber-600/15 hover:from-amber-500/35 hover:to-amber-600/25 border-2 border-amber-500/60 text-amber-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-amber-500/10"
            title="Open separate Manual Assign Pop-up to assign player to team"
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
        player={activePlayer}
        onSuccess={() => {
          api.getPlayers().then(setAllPlayers).catch(console.error);
        }}
      />

      {/* Manual Bid Modal */}
      <ManualBidModal
        isOpen={isManualBidModalOpen}
        onClose={() => setIsManualBidModalOpen(false)}
      />
    </div>
  );
};
