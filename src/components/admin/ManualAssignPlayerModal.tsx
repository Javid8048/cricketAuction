import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle, IndianRupee, Users, ArrowRight, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuctionStore } from '../../store/auction.store';
import { Player, Team } from '../../types';
import { formatRupees } from '../../utils/currency';

interface ManualAssignPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlayerId?: string | null;
  onSuccess?: () => void;
}

export const ManualAssignPlayerModal: React.FC<ManualAssignPlayerModalProps> = ({
  isOpen,
  onClose,
  defaultPlayerId,
  onSuccess,
}) => {
  const { state, manuallyAssignPlayer } = useAuctionStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const getDefaultPrice = (p?: Player | null) => {
    if (p?.basePrice && p.basePrice >= 100 && p.basePrice <= 2500) {
      return p.basePrice;
    }
    return 100;
  };

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [amount, setAmount] = useState<number | string>(100);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // Fetch fresh players & teams
      api.getPlayers()
        .then((data) => {
          setPlayers(data);
          if (defaultPlayerId) {
            setSelectedPlayerId(defaultPlayerId);
            const found = data.find((p) => p.id === defaultPlayerId);
            if (found) setAmount(getDefaultPrice(found));
          } else if (state?.activePlayer?.id) {
            setSelectedPlayerId(state.activePlayer.id);
            setAmount(getDefaultPrice(state.activePlayer));
          } else if (data.length > 0) {
            setSelectedPlayerId(data[0].id);
            setAmount(getDefaultPrice(data[0]));
          }
        })
        .catch(console.error);

      api.getTeams()
        .then((data) => {
          setTeams(data);
          if (data.length > 0 && !selectedTeamId) {
            setSelectedTeamId(data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, defaultPlayerId, state?.activePlayer?.id]);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || state?.activePlayer;
  const selectedTeam = (teams.length > 0 ? teams : (state?.teams || [])).find((t) => t.id === selectedTeamId);

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setErrorMsg(null);
    const p = players.find((item) => item.id === playerId);
    if (p) {
      setAmount(getDefaultPrice(p));
    }
  };

  const numericAmount = amount === '' ? 0 : Number(amount);
  const remainingPurseAfter = selectedTeam ? selectedTeam.remainingPurse - numericAmount : 0;
  const isPurseInsufficient = Boolean(selectedTeam && selectedTeam.remainingPurse < numericAmount);
  const currentSquadCount = selectedTeam ? (selectedTeam.squad?.length ?? selectedTeam.squadSize ?? 0) : 0;
  const maxSquad = selectedTeam?.maxSquadSize || 12;
  const isSquadFull = currentSquadCount >= maxSquad;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !selectedTeamId) {
      setErrorMsg('Please select both a player and a team.');
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
      setErrorMsg(`Insufficient purse! ${selectedTeam?.name} has only ${formatRupees(selectedTeam?.remainingPurse || 0)}.`);
      return;
    }
    if (isSquadFull) {
      setErrorMsg(`Squad limit reached! ${selectedTeam?.name} already has ${currentSquadCount}/${maxSquad} players.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await manuallyAssignPlayer(selectedPlayerId, selectedTeamId, finalPrice);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign player.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [
    { label: '₹100', value: 100 },
    ...(selectedPlayer?.basePrice && selectedPlayer.basePrice >= 100 && selectedPlayer.basePrice <= 2500 && selectedPlayer.basePrice !== 100
      ? [{ label: `Base (₹${selectedPlayer.basePrice})`, value: selectedPlayer.basePrice }]
      : []),
    { label: '₹200', value: 200 },
    { label: '₹500', value: 500 },
    { label: '₹1,000', value: 1000 },
    { label: '₹1,500', value: 1500 },
    { label: '₹2,000', value: 2000 },
    { label: '₹2,500', value: 2500 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin: Sold To Team (Manual Assignment)"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-200">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300">
          <Shield className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>Commissioner Override:</strong> Directly assign player to team. The specified amount will be immediately deducted from their purse.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Choose Player */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            1. Select Player to Assign
          </label>
          <select
            value={selectedPlayerId}
            onChange={(e) => handlePlayerChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sNo ? `[#${p.sNo}] ` : ''}{p.name} ({p.country} • {p.role} • Base {formatRupees(p.basePrice)}) [{p.status}]
              </option>
            ))}
          </select>
          {selectedPlayer && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <img
                src={selectedPlayer.profileImage}
                alt={selectedPlayer.name}
                className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedPlayer.name}`;
                }}
              />
              <div className="text-xs">
                <div className="font-bold text-white">{selectedPlayer.name}</div>
                <div className="text-slate-400 text-[11px]">
                  {selectedPlayer.role} • Base Price: <span className="font-mono text-amber-400 font-bold">{formatRupees(selectedPlayer.basePrice)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Choose Team */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            2. Select Target Team
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setErrorMsg(null);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {(teams.length > 0 ? teams : (state?.teams || [])).map((t) => {
              const sq = t.squad?.length ?? t.squadSize ?? 0;
              return (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.shortName}) — Purse: {formatRupees(t.remainingPurse)} | Squad: {sq}/{t.maxSquadSize || 12}
                </option>
              );
            })}
          </select>
        </div>

        {/* 3. Transfer Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Final Transfer Price (₹)
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              Must be ₹100 – ₹2,500
            </span>
          </div>
          <div className="relative mb-2">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="100"
              max="2500"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg(null);
              }}
              required
              placeholder="Enter transfer price (₹100 - ₹2,500)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setAmount(q.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                  Number(amount) === q.value
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            💡 Commissioner override: Price must be between ₹100 and ₹2,500. Amount will be deducted from team's purse.
          </p>
          {amount !== '' && (numericAmount < 100 || numericAmount > 2500) && (
            <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Price must be between ₹100 and ₹2,500.</span>
            </p>
          )}
        </div>

        {/* 4. Live Purse Deduction Preview Card */}
        {selectedTeam && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Team Purse & Squad Impact Preview
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-slate-800/80">
                <span className="text-[10px] text-slate-400 block">CURRENT PURSE</span>
                <span className="font-mono text-xs font-bold text-white">
                  {formatRupees(selectedTeam.remainingPurse)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-rose-300 block">DEDUCTION</span>
                <span className="font-mono text-xs font-bold text-rose-400">
                  -{formatRupees(numericAmount)}
                </span>
              </div>
              <div className={`p-2 rounded-lg border ${
                isPurseInsufficient
                  ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <span className="text-[10px] block opacity-80">NEW PURSE</span>
                <span className="font-mono text-xs font-bold">
                  {formatRupees(remainingPurseAfter)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">Squad Size Impact:</span>
              <span className={`font-mono font-bold ${isSquadFull ? 'text-rose-400' : 'text-slate-200'}`}>
                {currentSquadCount} / {maxSquad} players → <span className="text-amber-400">{currentSquadCount + 1} / {maxSquad}</span>
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isPurseInsufficient || isSquadFull || amount === '' || numericAmount < 100 || numericAmount > 2500}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            {loading ? 'Processing...' : `Confirm & Assign for ${formatRupees(numericAmount)}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
