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
  Gavel,
  Clock,
  Settings,
} from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { api } from '../../services/api';
import { Player } from '../../types';
import { formatRupees } from '../../utils/currency';
import { ManualSellModal } from './ManualSellModal';
import { AdminSettingsModal } from './AdminSettingsModal';

export const AdminControlPanel: React.FC = () => {
  const { state, isStandaloneMode, adminActionStandalone, showToast } = useAuctionStore();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [isManualSellOpen, setIsManualSellOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  const auction = state?.auction;

  useEffect(() => {
    api.getPlayers().then(setAllPlayers).catch(console.error);
  }, [state?.auction?.activePlayerId]);

  const handleAction = async (actionKey: string, apiFn: () => Promise<any>, confirmMsg?: string, payload?: any) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setLoadingAction(true);
    try {
      if (isStandaloneMode) {
        await adminActionStandalone(actionKey, payload);
      } else {
        await apiFn();
      }
    } catch (err: any) {
      console.error(`API call failed for ${actionKey}:`, err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Server action failed';
      showToast(errorMsg, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleManualSelect = async () => {
    if (!selectedPlayerId) return;
    handleAction('select_player', () => api.selectPlayer(selectedPlayerId), undefined, selectedPlayerId);
  };

  const handleToggleTimer = async () => {
    const nextEnabled = auction?.timerEnabled === false ? true : false;
    handleAction(
      'toggle_timer',
      () => api.updateAuctionSettings({ timerEnabled: nextEnabled }),
      undefined,
      { timerEnabled: nextEnabled }
    );
  };

  return (
    <div className="bg-[#121724] border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header bar with Status Badges and Quick Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-extrabold text-white font-display uppercase tracking-wider">
            AUCTIONEER COMMAND DESK
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Quick Timer ON/OFF Toggle */}
          <button
            onClick={handleToggleTimer}
            disabled={loadingAction}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 ${
              auction?.timerEnabled !== false
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title="Click to toggle Timer ON/OFF (Manual Mode)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {auction?.timerEnabled !== false
                ? `TIMER: ON (${auction?.defaultTimerSec || 10}s)`
                : 'TIMER: OFF (MANUAL)'}
            </span>
          </button>

          {/* Quick Settings Modal trigger */}
          <button
            onClick={() => setIsAdminSettingsOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
            title="Tournament & Auction Settings"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings</span>
          </button>

          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
            USER ACCESS
          </span>
        </div>
      </div>

      {/* Manual Player Selection */}
      <div className="mb-6 bg-[#161d2e] p-4 rounded-xl border border-slate-800">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Introduce Player to Auction Block
        </label>
        <div className="flex gap-2">
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Choose player from catalog --</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.country} • {p.role} • {formatRupees(p.basePrice)}) [{p.status}]
              </option>
            ))}
          </select>
          <button
            onClick={handleManualSelect}
            disabled={!selectedPlayerId || loadingAction}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-40"
          >
            Put on Block
          </button>
        </div>
      </div>

      {/* Controls Grid */}
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
          disabled={loadingAction || !auction?.activePlayerId || auction?.status !== 'ACTIVE'}
          className="p-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 text-sky-400" />
          <span>START BID TIMER</span>
        </button>

        {/* MANUAL SELL TO TEAM */}
        <button
          onClick={() => setIsManualSellOpen(true)}
          disabled={loadingAction || !auction?.activePlayerId || auction?.status !== 'ACTIVE'}
          className="p-3 rounded-xl bg-gradient-to-b from-amber-500/25 to-emerald-600/25 hover:from-amber-500/35 hover:to-emerald-600/35 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Directly sell current player to any team for a custom price"
        >
          <Gavel className="w-5 h-5 text-emerald-300" />
          <span>MANUAL SELL TO TEAM</span>
        </button>

        {/* CONFIRM SOLD (Highest Bidder) */}
        <button
          onClick={() => handleAction('sell', () => api.sellPlayer(), 'Manually confirm player as SOLD to highest bidder?')}
          disabled={loadingAction || !auction?.activePlayerId || auction?.status !== 'ACTIVE' || !auction?.highestBidTeamId}
          className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>SELL TO HIGHEST BIDDER</span>
        </button>

        {/* MARK UNSOLD */}
        <button
          onClick={() => handleAction('unsold', () => api.markUnsold(), 'Mark current player as UNSOLD?')}
          disabled={loadingAction || !auction?.activePlayerId || auction?.status !== 'ACTIVE'}
          className="p-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <XCircle className="w-5 h-5 text-rose-400" />
          <span>MARK UNSOLD</span>
        </button>

        {/* NEXT PLAYER */}
        <button
          onClick={() => handleAction('next', () => api.nextPlayer())}
          disabled={loadingAction || auction?.status !== 'ACTIVE'}
          className="p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FastForward className="w-5 h-5 text-purple-400" />
          <span>NEXT PLAYER</span>
        </button>

        {/* SKIP PLAYER */}
        <button
          onClick={() => handleAction('next', () => api.skipPlayer(), 'Skip this player for now?')}
          disabled={loadingAction || !auction?.activePlayerId || auction?.status !== 'ACTIVE'}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-5 h-5 text-slate-400" />
          <span>SKIP PLAYER</span>
        </button>

        {/* RE-AUCTION UNSOLD */}
        <button
          onClick={() => handleAction('start', () => api.reauctionUnsold(), 'Initiate Round 2 for all UNSOLD players?')}
          disabled={loadingAction}
          className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-5 h-5 text-blue-400" />
          <span>RE-AUCTION UNSOLD</span>
        </button>

        {/* RESET AUCTION */}
        <button
          onClick={() =>
            handleAction(
              'reset',
              () => api.resetAuction(),
              'WARNING: This will reset all team budgets, erase all bids, and revert all 50 players back to UPCOMING. Proceed?'
            )
          }
          disabled={loadingAction}
          className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-5 h-5 text-rose-400" />
          <span>RESET AUCTION</span>
        </button>
      </div>

      {/* Manual Sell to Team Modal */}
      <ManualSellModal
        isOpen={isManualSellOpen}
        onClose={() => setIsManualSellOpen(false)}
      />

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
      />
    </div>
  );
};
