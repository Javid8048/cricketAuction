import React, { useState, useEffect } from 'react';
import {
  Gavel,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  Shield,
  ArrowUpRight,
  Sparkles,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';
import { Team } from '../../types';

interface ManualBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'OVERRIDE' | 'TEAM_BID';
  onSuccess?: () => void;
}

export const ManualBidModal: React.FC<ManualBidModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'OVERRIDE',
  onSuccess,
}) => {
  const { state, placeBid, updateCurrentBid, showToast } = useAuctionStore();
  const auction = state?.auction;
  const activePlayer = state?.activePlayer;
  const currentBid = state?.currentBid || 0;
  const highestBidTeam = state?.highestBidTeam;
  const teams: Team[] = state?.teams || [];

  const [mode, setMode] = useState<'OVERRIDE' | 'TEAM_BID'>(initialMode);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number | string>(100);
  const [teamSearch, setTeamSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute minimum valid bid for Team Bid mode
  const minTeamBid = !highestBidTeam
    ? Math.max(0, activePlayer?.basePrice || 0)
    : Math.max(0, currentBid + 50);

  // Initialize form state whenever modal opens or active player changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setTeamSearch('');
      setMode(initialMode);

      const defaultBid = mode === 'OVERRIDE'
        ? (currentBid || activePlayer?.basePrice || 100)
        : (!highestBidTeam ? Math.max(100, activePlayer?.basePrice || 100) : currentBid + 100);
      setBidAmount(defaultBid);

      // Pre-select current leading team or first eligible team
      if (highestBidTeam?.id) {
        setSelectedTeamId(highestBidTeam.id);
      } else if (teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teams[0].id);
      }
    }
  }, [isOpen, activePlayer?.id, currentBid, highestBidTeam?.id]);

  if (!isOpen) return null;

  const numericBid = bidAmount === '' ? 0 : Number(bidAmount);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Team validation checks
  const isHighestBidder = selectedTeam && highestBidTeam && selectedTeam.id === highestBidTeam.id;
  const squadCount = selectedTeam?.squad?.length ?? selectedTeam?.squadSize ?? 0;
  const maxSquad = selectedTeam?.maxSquadSize || 12;
  const isSquadFull = squadCount >= maxSquad;
  const isPurseShortage = selectedTeam ? selectedTeam.remainingPurse < numericBid : false;
  const isOverseasLimitReached = Boolean(
    activePlayer?.isOverseas &&
      selectedTeam &&
      (selectedTeam.overseasCount || 0) >= selectedTeam.maxOverseas
  );

  const isFormValid = mode === 'OVERRIDE'
    ? Boolean(activePlayer) && numericBid >= 0 && numericBid <= 15000 && (!selectedTeam || !isPurseShortage)
    : Boolean(activePlayer) &&
      Boolean(selectedTeamId) &&
      numericBid >= 0 &&
      numericBid <= 15000 &&
      numericBid >= minTeamBid &&
      !isHighestBidder &&
      !isPurseShortage &&
      !isSquadFull &&
      !isOverseasLimitReached;

  // Filter teams by search
  const filteredTeams = teams.filter((t) => {
    if (!teamSearch.trim()) return true;
    const term = teamSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.shortName.toLowerCase().includes(term) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(term))
    );
  });

  const handleQuickIncrement = (inc: number) => {
    setErrorMsg(null);
    const base = isNaN(numericBid) ? 0 : numericBid;
    setBidAmount(Math.min(15000, base + inc));
  };

  const handleSetPresetAmount = (preset: number) => {
    setErrorMsg(null);
    setBidAmount(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlayer) {
      setErrorMsg('No active player on the auction block. Please select a player first.');
      return;
    }

    if (numericBid < 0 || numericBid > 15000) {
      setErrorMsg('Bid price must be between ₹0 and ₹15,000.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (mode === 'OVERRIDE') {
        // Direct price override to any amount between 0 and 15,000
        await updateCurrentBid(numericBid, selectedTeamId || null);
        showToast(`Bid amount updated to ${formatRupees(numericBid)}!`, 'success');
      } else {
        // Incremental bid on behalf of team
        if (!selectedTeamId) {
          setErrorMsg('Please select a team to place the bid for.');
          setIsSubmitting(false);
          return;
        }
        if (isHighestBidder) {
          setErrorMsg(`${selectedTeam?.name} already holds the highest bid.`);
          setIsSubmitting(false);
          return;
        }
        if (isPurseShortage) {
          setErrorMsg(`${selectedTeam?.name} has only ${formatRupees(selectedTeam?.remainingPurse || 0)} available purse.`);
          setIsSubmitting(false);
          return;
        }
        await placeBid(numericBid, selectedTeamId);
        showToast(`Manual bid of ${formatRupees(numericBid)} placed for ${selectedTeam?.name}!`, 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply bid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overridePresets = [0, 100, 200, 500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commissioner: Update Bid Amount (₹0 – ₹15,000)"
      maxWidth="max-w-2xl"
    >
      {!activePlayer ? (
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Active Player on Auction Block</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Please choose a player from the roster and click &quot;Put on Block&quot; before updating bids.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Close Window
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('OVERRIDE');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'OVERRIDE'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Direct Bid Update (₹0 – ₹15,000)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('TEAM_BID');
                setErrorMsg(null);
                const defaultBid = !highestBidTeam
                  ? Math.max(100, activePlayer?.basePrice || 100)
                  : Math.max(100, currentBid + 100);
                setBidAmount(defaultBid);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'TEAM_BID'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Place Bid on Behalf of Team</span>
            </button>
          </div>

          {/* Active Player Status Banner */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#171f33] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                {activePlayer.profileImage ? (
                  <img
                    src={activePlayer.profileImage}
                    alt={activePlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-extrabold text-white truncate font-display">
                    {activePlayer.name}
                  </span>
                  {activePlayer.isOverseas && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      ✈️ Overseas
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activePlayer.role} • {activePlayer.country || 'Domestic'} • Base: {formatRupees(activePlayer.basePrice)}
                </div>
              </div>
            </div>

            {/* Current Leading Bid Display */}
            <div className="w-full sm:w-auto bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-left sm:text-right shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                CURRENT BID
              </span>
              <div className="text-lg font-black font-mono text-amber-300">
                {formatRupees(currentBid || activePlayer.basePrice)}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Leader: {highestBidTeam ? highestBidTeam.shortName : 'None (Awaiting)'}
              </span>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Bid Amount Configuration */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Bid Amount (₹0 – ₹15,000)</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Range: ₹0 – ₹15,000
              </span>
            </div>

            {/* Number Input with Currency Symbol */}
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm font-mono font-bold text-amber-400">
                ₹
              </span>
              <input
                type="number"
                min="0"
                max="15000"
                step="50"
                value={bidAmount}
                onChange={(e) => {
                  setBidAmount(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-lg font-mono font-black text-white focus:outline-none focus:border-amber-500"
                placeholder="0 - 15000"
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mr-1">
                Quick Inc:
              </span>
              {[
                { label: '+ ₹100', val: 100 },
                { label: '+ ₹200', val: 200 },
                { label: '+ ₹500', val: 500 },
                { label: '+ ₹1,000', val: 1000 },
                { label: '+ ₹2,500', val: 2500 },
                { label: '+ ₹5,000', val: 5000 },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleQuickIncrement(chip.val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 text-white font-mono font-bold text-xs transition-all active:scale-95 flex items-center gap-1"
                >
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Absolute Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mr-1">
                Presets:
              </span>
              {overridePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSetPresetAmount(preset)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border transition-all ${
                    numericBid === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {formatRupees(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Target Team Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {mode === 'OVERRIDE'
                    ? 'Assign to Leading Team (Optional)'
                    : 'Select Franchise to Bid For'}
                </span>
              </label>
              {mode === 'OVERRIDE' && (
                <span className="text-[10px] text-slate-400">
                  {selectedTeam ? selectedTeam.name : 'No team change (price only)'}
                </span>
              )}
            </div>

            {/* Team Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search team by name or owner..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Team Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {mode === 'OVERRIDE' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamId('');
                    setErrorMsg(null);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    !selectedTeamId
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">Keep Current Leader</span>
                  <span className="text-[10px] text-slate-400">
                    {highestBidTeam ? highestBidTeam.shortName : 'None'}
                  </span>
                </button>
              )}

              {filteredTeams.map((t) => {
                const isSelected = selectedTeamId === t.id;
                const isLeader = highestBidTeam?.id === t.id;
                const canAfford = t.remainingPurse >= numericBid;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(t.id);
                      setErrorMsg(null);
                    }}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                        <span className="font-bold text-xs text-white truncate">{t.shortName}</span>
                      </div>
                      {isLeader && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          LEADER
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className={canAfford ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                        {formatRupees(t.remainingPurse)}
                      </span>
                      <span className="text-slate-500">
                        {t.squad?.length || 0}/{t.maxSquadSize || 12}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact Preview */}
          {selectedTeam && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Roster & Purse Preview: {selectedTeam.name}</span>
                <span className="font-mono text-amber-400 font-bold">
                  Target: {formatRupees(numericBid)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Purse After Deduction</span>
                  <span className={`font-mono font-bold ${isPurseShortage ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatRupees(Math.max(0, selectedTeam.remainingPurse - numericBid))}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Squad Slots</span>
                  <span className="font-mono font-bold text-slate-200">
                    {squadCount}/{maxSquad} Players
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Gavel className="w-4 h-4 text-slate-950" />
              <span>
                {isSubmitting
                  ? 'Applying Bid...'
                  : mode === 'OVERRIDE'
                  ? `Set Current Bid to ${formatRupees(numericBid)}`
                  : selectedTeam
                  ? `Place Bid for ${selectedTeam.shortName} (${formatRupees(numericBid)})`
                  : 'Place Manual Bid'}
              </span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
