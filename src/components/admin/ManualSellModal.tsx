import React, { useState, useEffect } from 'react';
import { Gavel, X, Check, Trophy, AlertCircle, Coins, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { api } from '../../services/api';
import { formatRupees } from '../../utils/currency';

interface ManualSellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualSellModal: React.FC<ManualSellModalProps> = ({ isOpen, onClose }) => {
  const { state, isStandaloneMode, adminActionStandalone, showToast } = useAuctionStore();
  const activePlayer = state?.activePlayer;
  const teams = state?.teams || [];
  const currentBid = state?.currentBid || 0;

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<number>(100);
  const [customPriceInput, setCustomPriceInput] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset fields when modal opens or active player changes
  useEffect(() => {
    if (isOpen && activePlayer) {
      const defaultPrice = currentBid > 0 ? currentBid : activePlayer.basePrice;
      setSalePrice(defaultPrice);
      setCustomPriceInput(String(defaultPrice));
      setSelectedTeamId(state?.highestBidTeam?.id || '');
      setErrorMsg(null);
    }
  }, [isOpen, activePlayer?.id, currentBid, state?.highestBidTeam?.id]);

  if (!isOpen) return null;

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedTeamSquadCount = selectedTeam?.squad?.length ?? selectedTeam?.squadSize ?? 0;
  const selectedTeamMaxSquad = selectedTeam?.maxSquadSize || 12;
  const isPurseShortage = selectedTeam ? selectedTeam.remainingPurse < salePrice : false;
  const isSquadFull = selectedTeam ? selectedTeamSquadCount >= selectedTeamMaxSquad : false;

  const handlePriceChange = (value: number) => {
    const valid = Math.max(0, value);
    setSalePrice(valid);
    setCustomPriceInput(String(valid));
    setErrorMsg(null);
  };

  const handleQuickIncrement = (inc: number) => {
    handlePriceChange(salePrice + inc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlayer) {
      setErrorMsg('No active player on the auction block.');
      return;
    }
    if (!selectedTeamId) {
      setErrorMsg('Please select a target team to sell this player to.');
      return;
    }
    if (!salePrice || salePrice <= 0) {
      setErrorMsg('Please enter a valid sale price greater than 0.');
      return;
    }
    if (isPurseShortage) {
      setErrorMsg(`${selectedTeam?.name} only has ${formatRupees(selectedTeam?.remainingPurse || 0)} available purse.`);
      return;
    }
    if (isSquadFull) {
      setErrorMsg(`${selectedTeam?.name} already has a full squad (${selectedTeamMaxSquad} players).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isStandaloneMode) {
        await adminActionStandalone('sell', { teamId: selectedTeamId, price: salePrice });
      } else {
        await api.sellPlayer(selectedTeamId, salePrice);
      }
      showToast(
        `Sold! ${activePlayer.name} manually awarded to ${selectedTeam?.name} for ${formatRupees(salePrice)}!`,
        'success'
      );
      onClose();
    } catch (err: any) {
      console.warn('Manual sell failed:', err);
      setErrorMsg(err.message || 'Failed to complete manual sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-4 sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-display uppercase tracking-wider">
                MANUAL SELL TO TEAM
              </h3>
              <p className="text-xs text-slate-400">
                Directly sell and assign the active player to any selected team
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

        {!activePlayer ? (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-white mb-1">No Active Player on Block</h4>
            <p className="text-xs text-slate-400 mb-4">
              Please put a player on the auction block first before performing a manual sale.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Active Player Info Strip */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
              <img
                src={activePlayer.profileImage || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120'}
                alt={activePlayer.name}
                className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-white truncate">{activePlayer.name}</h4>
                  {activePlayer.isOverseas && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                      ✈ Overseas
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{activePlayer.country}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">{activePlayer.role}</span>
                  <span>•</span>
                  <span>Base: {formatRupees(activePlayer.basePrice)}</span>
                </div>
              </div>
              {currentBid > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Current Bid</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">{formatRupees(currentBid)}</div>
                </div>
              )}
            </div>

            {/* 2. Step 1: Select Target Team */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>1. Select Purchasing Team</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {teams.length} teams participating
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {teams.map((t) => {
                  const isSelected = t.id === selectedTeamId;
                  const squadCount = t.squad?.length ?? t.squadSize ?? 0;
                  const maxSquad = t.maxSquadSize || 12;
                  const canAfford = t.remainingPurse >= salePrice;
                  const isFull = squadCount >= maxSquad;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        setErrorMsg(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      } ${!canAfford || isFull ? 'opacity-70' : ''}`}
                    >
                      {/* Team Logo/Color Badge */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black font-display shrink-0 text-white shadow-inner"
                        style={{ backgroundColor: t.primaryColor || '#f59e0b' }}
                      >
                        {t.shortName || t.name.substring(0, 3).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white truncate">{t.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className={canAfford ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                            {formatRupees(t.remainingPurse)}
                          </span>
                          <span className={isFull ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {squadCount}/{maxSquad}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Step 2: Sale Price */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Final Sale Price</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {formatRupees(salePrice)}
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={customPriceInput}
                    onChange={(e) => {
                      setCustomPriceInput(e.target.value);
                      const parsed = parseInt(e.target.value, 10);
                      if (!isNaN(parsed)) handlePriceChange(parsed);
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    placeholder="Enter sale price..."
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handlePriceChange(activePlayer.basePrice)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-[11px] font-mono text-slate-300 transition-colors"
                >
                  Base ({formatRupees(activePlayer.basePrice)})
                </button>
                {currentBid > activePlayer.basePrice && (
                  <button
                    type="button"
                    onClick={() => handlePriceChange(currentBid)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-[11px] font-mono text-emerald-400 font-semibold transition-colors"
                  >
                    Current ({formatRupees(currentBid)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleQuickIncrement(100)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-[11px] font-mono text-amber-400 font-semibold transition-colors"
                >
                  + ₹100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickIncrement(200)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-[11px] font-mono text-amber-400 font-semibold transition-colors"
                >
                  + ₹200
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickIncrement(500)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-[11px] font-mono text-amber-400 font-semibold transition-colors"
                >
                  + ₹500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickIncrement(1000)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-[11px] font-mono text-amber-400 font-semibold transition-colors"
                >
                  + ₹1,000
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selected Team Summary Warning */}
            {selectedTeam && isPurseShortage && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {selectedTeam.name} does not have enough purse ({formatRupees(selectedTeam.remainingPurse)}) to cover {formatRupees(salePrice)}.
                </span>
              </div>
            )}

            {selectedTeam && isSquadFull && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  {selectedTeam.name} already reached the maximum squad size of {selectedTeamMaxSquad} players.
                </span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTeamId || !salePrice || isPurseShortage || isSquadFull || isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing...' : 'Confirm Manual Sale'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
