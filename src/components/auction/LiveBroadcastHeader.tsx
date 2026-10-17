import React from 'react';
import { Play, Pause, FastForward, CheckCircle, XCircle, RotateCcw, ShieldAlert, Wifi } from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';

export const LiveBroadcastHeader: React.FC = () => {
  const { state, isStandaloneMode, adminActionStandalone } = useAuctionStore();
  const { user } = useAuthStore();

  const auction = state?.auction;
  const isAdmin = user?.role === 'ADMIN';

  const handleAction = async (actionName: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      if (isStandaloneMode) {
        await adminActionStandalone(actionName);
      } else {
        if (actionName === 'pause') await api.pauseAuction();
        else if (actionName === 'resume' || actionName === 'start') await api.startAuction();
        else if (actionName === 'sell') await api.sellPlayer();
        else if (actionName === 'unsold') await api.markUnsold();
        else if (actionName === 'next') await api.nextPlayer();
        else if (actionName === 'reset') await api.resetAuction();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="bg-[#121724]/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-4 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Tournament Badge & Round */}
        <div className="flex items-center gap-4">
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
              <h1 className="text-base sm:text-lg font-extrabold text-white font-display tracking-wide">
                {auction?.name || 'PREMIER CRICKET MEGA AUCTION 2026'}
              </h1>
              {isStandaloneMode && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30 flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5 text-blue-400" />
                  GitHub Live Sim
                </span>
              )}
              {!user && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 flex items-center gap-1">
                  <span>SPECTATOR</span>
                  <span className="opacity-70 font-normal">#WatchLive</span>
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
          <div className="flex flex-wrap items-center gap-2 bg-[#171f30] px-3 py-2 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider mr-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin:</span>
            </div>

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

            <button
              onClick={() => handleAction('sell', 'Sell current player to highest bidder?')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 text-xs font-semibold transition-colors"
              title="Confirm Sold"
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Sold
            </button>

            <button
              onClick={() => handleAction('unsold', 'Mark player as unsold?')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600/30 text-rose-200 hover:bg-rose-600/50 text-xs font-semibold transition-colors"
              title="Confirm Unsold"
            >
              <XCircle className="w-3 h-3 text-rose-400" />
              Unsold
            </button>

            <button
              onClick={() => handleAction('next')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 text-xs font-semibold transition-colors"
              title="Advance to next player in lot"
            >
              <FastForward className="w-3 h-3 text-purple-300" />
              Next
            </button>

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
    </div>
  );
};
