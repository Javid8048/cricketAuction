import React from 'react';
import { Award, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';

export const SoldUnsoldBanner: React.FC = () => {
  const { soldOverlay, unsoldOverlay, dismissOverlay } = useAuctionStore();

  if (!soldOverlay && !unsoldOverlay) return null;

  if (soldOverlay) {
    const { player, winningTeam, finalPrice, formattedPrice } = soldOverlay;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95">
        <div className="w-full max-w-lg bg-[#111728] border-2 border-amber-500 rounded-3xl p-8 shadow-2xl relative text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={dismissOverlay}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Gavel Strike Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/30 animate-bounce">
              <svg className="w-9 h-9 transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m14 13-7.5 7.5c-.8.8-2 .8-2.8 0s-.8-2 0-2.8L11.2 10.2" />
                <path d="m16 16 6-6" />
                <path d="m8 8 6-6" />
                <path d="m9 7 8 8" />
                <path d="m21 11-8-8" />
              </svg>
            </div>
          </div>

          {/* SOLD Header */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold font-mono tracking-widest uppercase text-sm mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>PLAYER SOLD</span>
          </div>

          {/* Player avatar & name */}
          <div className="relative mx-auto w-28 h-28 mb-4">
            <img
              src={player.profileImage}
              alt={player.name}
              className="w-full h-full rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`;
              }}
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            {player.name}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {player.country} • {player.role}
          </p>

          {/* Price & Winning Team Callout */}
          <div className="my-6 p-5 rounded-2xl bg-[#162035] border border-amber-500/30">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
              SOLD TO
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-display flex items-center justify-center gap-2">
              {winningTeam.logoUrl ? (
                <img src={winningTeam.logoUrl} alt={winningTeam.name} className="w-6 h-6 rounded-full object-cover border border-white/30" />
              ) : (
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: winningTeam.primaryColor }}
                />
              )}
              <span>{winningTeam.name}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase">FINAL PRICE</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {formattedPrice || formatRupees(finalPrice)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Amount deducted from team purse • Player added to squad roster
          </p>
        </div>
      </div>
    );
  }

  if (unsoldOverlay) {
    const { player, basePrice, formattedBasePrice } = unsoldOverlay;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95">
        <div className="w-full max-w-md bg-[#16131c] border-2 border-rose-500/60 rounded-3xl p-8 shadow-2xl relative text-center">
          <button
            onClick={dismissOverlay}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold font-mono tracking-widest uppercase text-sm mb-6">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>PLAYER UNSOLD</span>
          </div>

          <div className="relative mx-auto w-24 h-24 mb-4">
            <img
              src={player.profileImage}
              alt={player.name}
              className="w-full h-full rounded-2xl object-cover border-2 border-rose-500/50 shadow-xl opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`;
              }}
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-display">
            {player.name}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {player.country} • {player.role}
          </p>

          <div className="my-5 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Base Price: </span>
            <span className="text-base font-bold font-mono text-slate-200">
              {formattedBasePrice || formatRupees(basePrice)}
            </span>
            <div className="text-[11px] text-slate-500 mt-1">
              Eligible for re-auction round if requested by teams
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
