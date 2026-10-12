import React, { useState } from 'react';
import { Play, Pause, FastForward, CheckCircle, XCircle, RotateCcw, ShieldAlert, Wifi, Gavel, Clock, Eye } from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import { ManualSellModal } from '../admin/ManualSellModal';

export const LiveBroadcastHeader: React.FC = () => {
  const { state, isStandaloneMode, adminActionStandalone } = useAuctionStore();
  const { user } = useAuthStore();
  const [isManualSellOpen, setIsManualSellOpen] = useState(false);

  const auction = state?.auction;
  const isAdmin = user?.role === 'ADMIN';

  const handleAction = async (actionName: string, confirmMsg?: string, payload?: any) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      if (isStandaloneMode) {
        await adminActionStandalone(actionName, payload);
      } else {
        if (actionName === 'pause') await api.pauseAuction();
        else if (actionName === 'resume' || actionName === 'start') await api.startAuction();
        else if (actionName === 'sell') await api.sellPlayer();
        else if (actionName === 'unsold') await api.markUnsold();
        else if (actionName === 'next') await api.nextPlayer();
        else if (actionName === 'reset') await api.resetAuction();
        else if (actionName === 'toggle_timer') {
          const nextEnabled = auction?.timerEnabled === false ? true : false;
          await api.updateAuctionSettings({ timerEnabled: nextEnabled });
        }
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleTimer = () => {
    const nextEnabled = auction?.timerEnabled === false ? true : false;
    handleAction('toggle_timer', undefined, { timerEnabled: nextEnabled });
  };

  return (
    <div className="bg-[#121724]/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl mb-3 sm:mb-4 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Tournament Badge & Round */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  auction?.status === 'ACTIVE'
                    ? 'bg-emerald-400'
                    : auction?.status === 'PAUSED'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  auction?.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : auction?.status === 'PAUSED'
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
                }`}
              />
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              {auction?.status === 'ACTIVE' ? 'LIVE ON AIR' : auction?.status || 'IDLE'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-extrabold text-white font-display tracking-wide">
                {auction?.name || 'PREMIER CRICKET MEGA AUCTION 2026'}
              </h1>
              {isStandaloneMode && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30 flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5 text-blue-400" />
                  GitHub Live Sim
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>ROUND {auction?.currentRound || 1}</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">TEAM BIDDING STAGE</span>
            </div>
          </div>
        </div>

        {/* Right: Admin Quick Action Strip */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-[#171f30] p-2 sm:px-3 sm:py-2 rounded-xl border border-amber-500/30 w-full md:w-auto">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider mr-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin:</span>
            </div>

            {/* Quick Timer ON/OFF Button */}
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                auction?.timerEnabled !== false
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              }`}
              title="Click to toggle Timer ON/OFF (Manual Mode)"
            >
              <Clock className="w-3 h-3" />
              <span>{auction?.timerEnabled !== false ? 'Timer: ON' : 'Timer: OFF'}</span>
            </button>

            {/* Play/Pause */}
            {auction?.status === 'ACTIVE' ? (
              <button
                onClick={() => handleAction('pause')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors"
                title="Pause bidding"
              >
                <Pause className="w-3 h-3" />
                Pause
              </button>
            ) : (
              <button
                onClick={() => handleAction('start')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
                title="Start or Resume bidding"
              >
                <Play className="w-3 h-3" />
                {auction?.status === 'PAUSED' ? 'Resume' : 'Start'}
              </button>
            )}

            {/* Manual Sell to Team Modal Trigger */}
            <button
              onClick={() => setIsManualSellOpen(true)}
              disabled={auction?.status !== 'ACTIVE' || !auction?.activePlayerId}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/25 to-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 text-xs font-bold border border-emerald-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Directly sell player to any selected team"
            >
              <Gavel className="w-3 h-3 text-emerald-300" />
              Manual Sell
            </button>

            {/* Sold to highest bidder */}
            <button
              onClick={() => handleAction('sell', 'Sell current player to highest bidder?')}
              disabled={auction?.status !== 'ACTIVE' || !auction?.activePlayerId || !auction?.highestBidTeamId}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Confirm Sold to Highest Bidder"
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Sold
            </button>

            {/* Mark Unsold */}
            <button
              onClick={() => handleAction('unsold', 'Mark player as unsold?')}
              disabled={auction?.status !== 'ACTIVE' || !auction?.activePlayerId}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600/30 text-rose-200 hover:bg-rose-600/50 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Confirm Unsold"
            >
              <XCircle className="w-3 h-3 text-rose-400" />
              Unsold
            </button>

            {/* Next Player */}
            <button
              onClick={() => handleAction('next')}
              disabled={auction?.status !== 'ACTIVE'}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Advance to next player in lot"
            >
              <FastForward className="w-3 h-3 text-purple-300" />
              Next
            </button>

            {/* Share #WatchList Link */}
            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + '#WatchList';
                navigator.clipboard.writeText(url);
                alert('Live #WatchList link copied to clipboard: ' + url);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/30 transition-colors"
              title="Copy public #WatchList link for spectators"
            >
              <Eye className="w-3 h-3 text-amber-400" />
              #WatchList
            </button>

            {/* Reset Auction */}
            <button
              onClick={() => handleAction('reset', 'Are you sure you want to RESET the entire auction?')}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 text-xs transition-colors"
              title="Reset Auction"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Sell to Team Modal */}
      <ManualSellModal
        isOpen={isManualSellOpen}
        onClose={() => setIsManualSellOpen(false)}
      />
    </div>
  );
};
