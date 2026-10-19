import React, { useState } from 'react';
import { Timer, ArrowUpRight, ShieldAlert, Sparkles, Check, AlertCircle, Zap, Gavel } from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { useAuthStore } from '../../store/auth.store';
import { formatRupees } from '../../utils/currency';
import { ManualAssignPlayerModal } from '../admin/ManualAssignPlayerModal';
import { ManualBidModal } from '../admin/ManualBidModal';

export const LiveBiddingArea: React.FC = () => {
  const {
    state,
    secondsLeft,
    isTimerWarning,
    isTimerUrgent,
    lastBidFlash,
    isBidding,
    placeBid,
  } = useAuctionStore();

  const { user } = useAuthStore();
  const [customBidInput, setCustomBidInput] = useState('');
  const [biddingError, setBiddingError] = useState<string | null>(null);
  const [isManualAssignOpen, setIsManualAssignOpen] = useState(false);
  const [isManualBidOpen, setIsManualBidOpen] = useState(false);

  const auction = state?.auction;
  const currentBid = state?.currentBid || 0;
  const highestBidTeam = state?.highestBidTeam;
  const activePlayer = state?.activePlayer;
  const userTeam = state?.teams.find((t) => t.id === user?.teamId);

  const isAuctionActive = auction?.status === 'ACTIVE';
  const isTeamUser = user?.role === 'TEAM';
  const isAdmin = user?.role === 'ADMIN';
  const isHighestBidder = userTeam && highestBidTeam?.id === userTeam.id;
  const isOverseasLimitReached = Boolean(activePlayer?.isOverseas && userTeam && (userTeam.overseasCount || 0) >= userTeam.maxOverseas);

  // Dynamic tournament increment amounts (+ ₹100, + ₹200, + ₹500, + ₹1,000)
  const getDynamicIncrements = () => {
    return [
      { label: '+ ₹100', amount: 100 },
      { label: '+ ₹200', amount: 200 },
      { label: '+ ₹500', amount: 500 },
      { label: '+ ₹1,000', amount: 1000 },
    ];
  };

  const standardIncrements = getDynamicIncrements();

  const handleStandardBid = async (inc: number) => {
    setBiddingError(null);
    try {
      const nextAmount = currentBid + inc;
      await placeBid(nextAmount, userTeam?.id);
    } catch (err: any) {
      setBiddingError(err.message);
    }
  };

  const handleBaseBid = async () => {
    setBiddingError(null);
    try {
      await placeBid(undefined, userTeam?.id);
    } catch (err: any) {
      setBiddingError(err.message);
    }
  };

  const handleCustomBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBiddingError(null);
    const parsed = parseInt(customBidInput, 10);
    if (isNaN(parsed) || parsed <= currentBid) {
      setBiddingError(`Please enter a valid bid amount greater than current bid (${formatRupees(currentBid)}).`);
      return;
    }

    try {
      await placeBid(parsed, userTeam?.id);
      setCustomBidInput('');
    } catch (err: any) {
      setBiddingError(err.message);
    }
  };

  // Timer visual styles
  const timerStyle = isTimerUrgent
    ? 'text-rose-500 scale-110 animate-urgent-timer'
    : isTimerWarning
    ? 'text-amber-400 animate-pulse'
    : 'text-emerald-400';

  return (
    <div className="bg-[#121724]/95 border border-slate-800/90 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between backdrop-blur-md">
      {/* Top Header: Current Bid Label & Live Countdown Timer */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase font-semibold">
              CURRENT BID AMOUNT
            </span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Live team bidding in progress
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-3 bg-[#171f33] px-4 py-2 rounded-2xl border border-slate-700/60 shadow-inner">
            <Timer
              className={`w-5 h-5 ${
                auction?.timerEnabled === false
                  ? 'text-slate-400'
                  : isTimerUrgent
                  ? 'text-rose-400 animate-spin'
                  : isTimerWarning
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono tracking-widest text-slate-400 font-bold uppercase">
                {auction?.timerEnabled === false ? 'TIMER' : 'BID TIMER'}
              </span>
              <span className={`text-2xl font-black font-mono tracking-widest transition-all ${
                auction?.timerEnabled === false ? 'text-slate-400 text-lg' : timerStyle
              }`}>
                {auction?.timerEnabled === false ? 'MANUAL' : `00:${String(secondsLeft).padStart(2, '0')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Centerpiece: Massive Animated Current Bid Amount */}
        <div className="my-6 text-center py-6 px-4 rounded-3xl bg-gradient-to-b from-[#182035]/80 to-[#101626]/90 border border-amber-500/20 relative overflow-hidden shadow-2xl">
          {/* Glowing flash effect when new bid lands */}
          <div
            className={`absolute inset-0 bg-amber-500/20 pointer-events-none transition-opacity duration-500 ${
              lastBidFlash ? 'opacity-100 scale-105' : 'opacity-0'
            }`}
          />

          <div className="relative z-10">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>LEADING BID</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div
              className={`text-4xl sm:text-6xl font-black font-mono tracking-tight transition-transform duration-300 ${
                lastBidFlash ? 'scale-110 text-amber-300' : 'text-white'
              }`}
            >
              {formatRupees(currentBid)}
            </div>

            {/* Highest Bidder Display */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                HIGHEST BIDDER:
              </span>

              {highestBidTeam ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 shadow-md">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: highestBidTeam.primaryColor }}
                  />
                  <span className="font-extrabold text-sm sm:text-base text-white font-display">
                    {highestBidTeam.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({highestBidTeam.shortName})
                  </span>
                </div>
              ) : (
                <span className="text-xs font-mono font-semibold text-slate-400 italic">
                  Awaiting Opening Bid ({formatRupees(activePlayer?.basePrice || 0)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bidding Validation Status & Error Alert */}
      {biddingError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{biddingError}</span>
        </div>
      )}

      {/* Team Bidding Controls */}
      <div className="bg-[#161d2e] p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            PLACE TEAM BID
          </span>

          {userTeam && (
            <span className="text-xs font-mono font-semibold text-amber-400">
              Remaining: {formatRupees(userTeam.remainingPurse)}
            </span>
          )}
        </div>

        {/* If Spectator (Not Logged in as Team or Admin) */}
        {!isTeamUser && !isAdmin && (
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <p className="text-xs text-slate-300 font-medium">
              You are currently viewing in <span className="text-amber-400 font-bold">Spectator Mode</span>.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sign in with your Team credentials to participate in live bidding on this player.
            </p>
          </div>
        )}

        {/* If Logged in and It's Team User or Admin */}
        {(isTeamUser || isAdmin) && (
          <div>
            {isHighestBidder ? (
              <div className="p-3 mb-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2 font-semibold">
                <Check className="w-4 h-4" />
                <span>You currently hold the highest bid on this player!</span>
              </div>
            ) : null}

            {isOverseasLimitReached && (
              <div className="p-3 mb-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Overseas Limit Reached ({userTeam?.maxOverseas} max). Cannot bid on overseas players.</span>
              </div>
            )}

            {/* Standard Increments Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {!highestBidTeam && (
                <button
                  type="button"
                  disabled={!isAuctionActive || isBidding || isOverseasLimitReached}
                  onClick={handleBaseBid}
                  className="col-span-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Open Bid at Base Price ({formatRupees(activePlayer?.basePrice)})</span>
                </button>
              )}

              {standardIncrements.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  disabled={!isAuctionActive || isBidding || isHighestBidder || isOverseasLimitReached}
                  onClick={() => handleStandardBid(btn.amount)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-amber-500/50 text-white font-extrabold text-xs font-mono transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Bid Submission Form */}
            <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">
                  ₹ :
                </span>
                <input
                  type="number"
                  step="50"
                  min={currentBid + 100}
                  value={customBidInput}
                  onChange={(e) => setCustomBidInput(e.target.value)}
                  placeholder={`Custom ₹ (min ${formatRupees(currentBid + 100)})`}
                  disabled={!isAuctionActive || isBidding || isHighestBidder || isOverseasLimitReached}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!isAuctionActive || isBidding || isHighestBidder || isOverseasLimitReached || !customBidInput}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                Custom Bid
              </button>
            </form>

            {/* Commissioner Override Controls */}
            {isAdmin && activePlayer && (
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Commissioner Controls:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsManualBidOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    title="Open Manual Bid Pop-up to place bid on behalf of any team"
                  >
                    <Gavel className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manual Bid (Pop-up)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualAssignOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>Sold To Team (Manual Assign)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Assignment Modal */}
      <ManualAssignPlayerModal
        isOpen={isManualAssignOpen}
        onClose={() => setIsManualAssignOpen(false)}
        defaultPlayerId={activePlayer?.id}
        player={activePlayer}
      />

      {/* Manual Bid Modal */}
      <ManualBidModal
        isOpen={isManualBidOpen}
        onClose={() => setIsManualBidOpen(false)}
      />
    </div>
  );
};
