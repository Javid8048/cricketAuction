import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Users,
  X,
  Search,
  Sparkles,
  Trophy,
  Plane,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuctionStore } from '../../store/auction.store';
import { Player, Team } from '../../types';
import { formatRupees } from '../../utils/currency';

interface ManualAssignPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlayerId?: string | null;
  player?: Player | null;
  onSuccess?: () => void;
}

export const ManualAssignPlayerModal: React.FC<ManualAssignPlayerModalProps> = ({
  isOpen,
  onClose,
  defaultPlayerId,
  player: directPlayer,
  onSuccess,
}) => {
  const { state, manuallyAssignPlayer, showToast } = useAuctionStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [isChangingPlayer, setIsChangingPlayer] = useState(false);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [amount, setAmount] = useState<number | string>(100);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getDefaultPrice = (p?: Player | null) => {
    if (p?.basePrice && p.basePrice >= 100 && p.basePrice <= 2500) {
      return p.basePrice;
    }
    return 100;
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsChangingPlayer(false);
      setPlayerSearch('');

      // Fetch fresh teams and players
      api.getTeams()
        .then((data) => {
          setTeams(data);
          if (data.length > 0 && !selectedTeamId) {
            setSelectedTeamId(data[0].id);
          }
        })
        .catch(console.error);

      api.getPlayers()
        .then((data) => {
          setPlayers(data);
          // Resolve initial player
          let targetId = directPlayer?.id || defaultPlayerId;
          if (!targetId && state?.activePlayer?.id) {
            targetId = state.activePlayer.id;
          }
          if (targetId) {
            setSelectedPlayerId(targetId);
            const found = data.find((p) => p.id === targetId) || directPlayer || state?.activePlayer;
            if (found) setAmount(getDefaultPrice(found));
          } else if (data.length > 0) {
            setSelectedPlayerId(data[0].id);
            setAmount(getDefaultPrice(data[0]));
          }
        })
        .catch(console.error);
    }
  }, [isOpen, defaultPlayerId, directPlayer?.id, state?.activePlayer?.id]);

  if (!isOpen) return null;

  // Resolve current player object
  const selectedPlayer =
    (directPlayer && directPlayer.id === selectedPlayerId ? directPlayer : null) ||
    players.find((p) => p.id === selectedPlayerId) ||
    (state?.activePlayer?.id === selectedPlayerId ? state.activePlayer : null) ||
    directPlayer ||
    null;

  const currentTeams = teams.length > 0 ? teams : (state?.teams || []);
  const selectedTeam = currentTeams.find((t) => t.id === selectedTeamId) || currentTeams[0];

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setIsChangingPlayer(false);
    setErrorMsg(null);
    const p = players.find((item) => item.id === playerId);
    if (p) {
      setAmount(getDefaultPrice(p));
    }
  };

  const numericAmount = amount === '' ? 0 : Number(amount);
  const isPurseInsufficient = Boolean(selectedTeam && selectedTeam.remainingPurse < numericAmount);
  const currentSquadCount = selectedTeam ? (selectedTeam.squad?.length ?? selectedTeam.squadSize ?? 0) : 0;
  const maxSquad = selectedTeam?.maxSquadSize || 12;
  const isSquadFull = currentSquadCount >= maxSquad;
  const isOverseasLimitReached = Boolean(
    selectedPlayer?.isOverseas &&
      selectedTeam &&
      (selectedTeam.overseasCount || 0) >= selectedTeam.maxOverseas
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !selectedTeamId) {
      setErrorMsg('Please select both a player and a franchise team.');
      return;
    }
    const finalPrice = amount === '' ? 0 : Number(amount);
    if (isNaN(finalPrice)) {
      setErrorMsg('Please enter a valid price.');
      return;
    }
    if (finalPrice < 100) {
      setErrorMsg('Price must be at least ₹100.');
      return;
    }
    if (finalPrice > 2500) {
      setErrorMsg('Price cannot exceed ₹2,500.');
      return;
    }
    if (isPurseInsufficient) {
      setErrorMsg(
        `Insufficient purse! ${selectedTeam?.name} has only ${formatRupees(selectedTeam?.remainingPurse || 0)} available.`
      );
      return;
    }
    if (isSquadFull) {
      setErrorMsg(
        `Squad limit reached! ${selectedTeam?.name} already has ${currentSquadCount}/${maxSquad} players.`
      );
      return;
    }
    if (isOverseasLimitReached) {
      setErrorMsg(
        `Overseas limit reached! ${selectedTeam?.name} already has maximum overseas players allowed.`
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await manuallyAssignPlayer(selectedPlayerId, selectedTeamId, finalPrice);
      showToast(
        `Sold! ${selectedPlayer?.name} manually awarded to ${selectedTeam?.name} for ${formatRupees(finalPrice)}!`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete manual assignment.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [
    { label: '₹100', value: 100 },
    ...(selectedPlayer?.basePrice &&
    selectedPlayer.basePrice >= 100 &&
    selectedPlayer.basePrice <= 2500 &&
    selectedPlayer.basePrice !== 100
      ? [{ label: `Base (₹${selectedPlayer.basePrice})`, value: selectedPlayer.basePrice }]
      : []),
    { label: '₹200', value: 200 },
    { label: '₹500', value: 500 },
    { label: '₹1,000', value: 1000 },
    { label: '₹1,500', value: 1500 },
    { label: '₹2,000', value: 2000 },
    { label: '₹2,500', value: 2500 },
  ];

  // Filter players when switching player
  const filteredPlayers = players.filter((p) => {
    if (!playerSearch.trim()) return true;
    const term = playerSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term) ||
      (p.country && p.country.toLowerCase().includes(term)) ||
      (p.sNo && String(p.sNo).includes(term))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Award Player to Franchise (Manual Assign)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Header S.No Badge & Description (Like Edit Cricketer Dossier) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <p className="text-slate-400 text-[11px]">
            Direct commissioner gavel award & team transfer with purse deduction.
          </p>
          {selectedPlayer && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold border border-amber-500/30 shrink-0">
              S.No #{selectedPlayer.sNo || '?'}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="break-words">{errorMsg}</span>
          </div>
        )}

        {/* DEDICATED PLAYER DOSSIER CARD (Like Edit Cricketer Dossier) */}
        {selectedPlayer && !isChangingPlayer ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950/90 via-[#141a2c] to-slate-950/90 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                  {selectedPlayer.profileImage ? (
                    <img
                      src={selectedPlayer.profileImage}
                      alt={selectedPlayer.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedPlayer.name}`;
                      }}
                    />
                  ) : (
                    <Users className="w-8 h-8 text-amber-400" />
                  )}
                  {selectedPlayer.isOverseas && (
                    <span className="absolute bottom-1 right-1 bg-cyan-500 text-slate-950 p-1 rounded-full shadow" title="Overseas Player">
                      <Plane className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white font-display truncate">
                      {selectedPlayer.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold">
                      {selectedPlayer.role}
                    </span>
                    {selectedPlayer.category && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        {selectedPlayer.category}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>Country: <strong className="text-slate-200">{selectedPlayer.country || 'India'}</strong></span>
                    {selectedPlayer.place && (
                      <>
                        <span>•</span>
                        <span>Place: <strong className="text-slate-200">{selectedPlayer.place}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span>Base Price: <strong className="text-amber-400 font-mono">{formatRupees(selectedPlayer.basePrice)}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Own Team:{' '}
                      <strong className="text-amber-300">
                        {selectedPlayer.belongingTeamName || selectedPlayer.belongingTeam?.name || (selectedPlayer.belongingTeamId ? teams.find(t => t.id === selectedPlayer.belongingTeamId)?.name : null) || 'Independent / Open Pool'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Player button */}
              <button
                type="button"
                onClick={() => setIsChangingPlayer(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-all shrink-0"
                title="Select a different player"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Change Player</span>
              </button>
            </div>

            {/* Current Status Badge */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Current Auction State:</span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  selectedPlayer.status === 'SOLD'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : selectedPlayer.status === 'IN_AUCTION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : selectedPlayer.status === 'UNSOLD'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {selectedPlayer.status === 'SOLD' && selectedPlayer.teamPlayer?.team
                  ? `SOLD TO ${selectedPlayer.teamPlayer.team.shortName} (${formatRupees(selectedPlayer.teamPlayer.price)})`
                  : selectedPlayer.status}
              </span>
            </div>
          </div>
        ) : (
          /* Player Selection / Search Mode (Only when switching or if no player loaded) */
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Cricketer to Award</span>
              </label>
              {selectedPlayer && (
                <button
                  type="button"
                  onClick={() => setIsChangingPlayer(false)}
                  className="text-[11px] text-amber-400 hover:underline font-bold"
                >
                  Back to {selectedPlayer.name}
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by player name, role, or jersey #..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              {playerSearch && (
                <button
                  type="button"
                  onClick={() => setPlayerSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">No players match your search</div>
              ) : (
                filteredPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePlayerChange(p.id)}
                    className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between border ${
                      p.id === selectedPlayerId
                        ? 'bg-amber-500/20 border-amber-500/60 text-white'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-amber-400 font-bold w-7 shrink-0">
                        #{p.sNo || '?'}
                      </span>
                      <span className="font-bold text-xs truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400">({p.role} • {p.country})</span>
                    </div>
                    <span className="font-mono text-xs text-amber-400 shrink-0 font-bold">
                      {formatRupees(p.basePrice)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: TARGET FRANCHISE SELECTION */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Select Winning Franchise</span>
            </label>
            {selectedTeam && (
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Purse: {formatRupees(selectedTeam.remainingPurse)}
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {currentTeams.map((t) => {
                const sq = t.squad?.length ?? t.squadSize ?? 0;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName}) — Purse: {formatRupees(t.remainingPurse)} | Squad: {sq}/{t.maxSquadSize || 12}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* SECTION 2: FINAL TRANSFER / SOLD PRICE (₹) */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Final Transfer / Sold Price (₹)</span>
            </label>
            <span className="text-[10px] text-amber-300 font-mono">
              Limit: ₹100 – ₹2,500
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-mono font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="100"
              max="2500"
              step="50"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg(null);
              }}
              required
              placeholder="100"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mr-1">
              Presets:
            </span>
            {quickAmounts.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setAmount(q.value)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 ${
                  Number(amount) === q.value
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: LIVE PURSE & SQUAD IMPACT PREVIEW */}
        {selectedTeam && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Roster & Purse Impact Preview: {selectedTeam.name}</span>
              <span className="font-mono text-emerald-400 font-bold">
                Award Amount: {formatRupees(numericAmount)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 block">Available Purse</span>
                <span className="font-mono font-bold text-slate-300 text-[11px] block mt-0.5">
                  {formatRupees(selectedTeam.remainingPurse)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 block">Purse After Deduction</span>
                <span
                  className={`font-mono font-bold text-[11px] block mt-0.5 ${
                    isPurseInsufficient ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatRupees(Math.max(0, selectedTeam.remainingPurse - numericAmount))}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block">Squad Capacity</span>
                <span className="font-mono font-bold text-slate-200 text-[11px] block mt-0.5">
                  {currentSquadCount + 1} / {maxSquad} Players
                </span>
              </div>
            </div>

            {isPurseInsufficient && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Franchise does not have enough purse balance for this transfer!</span>
              </div>
            )}

            {isSquadFull && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Squad is full ({maxSquad} maximum members)!</span>
              </div>
            )}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              loading ||
              !selectedPlayerId ||
              !selectedTeamId ||
              isPurseInsufficient ||
              isSquadFull ||
              isOverseasLimitReached ||
              amount === '' ||
              numericAmount < 100 ||
              numericAmount > 2500
            }
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>
              {loading
                ? 'Processing Assignment...'
                : selectedPlayer && selectedTeam
                ? `Award ${selectedPlayer.name} to ${selectedTeam.shortName} (${formatRupees(numericAmount)})`
                : 'Confirm Manual Assignment'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
