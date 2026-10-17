import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Zap,
  Users,
  Shield,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  LayoutTemplate,
  IndianRupee,
  ArrowLeft,
  Flame,
  Trash2,
} from 'lucide-react';
import { useAuctionStore } from '../store/auction.store';
import { api } from '../services/api';
import { formatRupees } from '../utils/currency';

interface AdminSettingsPageProps {
  onBackToArena: () => void;
  layoutMode: 'topbar' | 'sidebar';
  onLayoutModeChange: (mode: 'topbar' | 'sidebar') => void;
  themeMode?: 'dark' | 'light';
  onThemeModeChange?: (mode: 'dark' | 'light') => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  onBackToArena,
  layoutMode,
  onLayoutModeChange,
  themeMode = 'dark',
  onThemeModeChange,
}) => {
  const { state, showToast, isStandaloneMode, deleteAllTeams } = useAuctionStore();
  const auction = state?.auction;

  const [timerEnabled, setTimerEnabled] = useState(auction?.timerEnabled !== false);
  const [defaultTimerSec, setDefaultTimerSec] = useState(auction?.defaultTimerSec || 10);
  const [autoSell, setAutoSell] = useState(auction?.autoSell !== false);
  const [defaultPurse, setDefaultPurse] = useState(auction?.defaultPurse || 15000);
  const [defaultSquadLimit, setDefaultSquadLimit] = useState(auction?.defaultSquadLimit || 12);
  const [iconPlayerPrice, setIconPlayerPrice] = useState(auction?.iconPlayerPrice || 2500);
  const [defaultBasePrice, setDefaultBasePrice] = useState(auction?.defaultBasePrice || 100);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeletingTeams, setIsDeletingTeams] = useState(false);

  useEffect(() => {
    if (auction) {
      setTimerEnabled(auction.timerEnabled !== false);
      setDefaultTimerSec(auction.defaultTimerSec || 10);
      setAutoSell(auction.autoSell !== false);
      setDefaultPurse(auction.defaultPurse || 15000);
      setDefaultSquadLimit(auction.defaultSquadLimit || 12);
      setIconPlayerPrice(auction.iconPlayerPrice || 2500);
      setDefaultBasePrice(auction.defaultBasePrice || 100);
    }
  }, [auction]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (isStandaloneMode) {
        if (state?.auction) {
          state.auction.timerEnabled = timerEnabled;
          state.auction.defaultTimerSec = defaultTimerSec;
          state.auction.autoSell = autoSell;
          state.auction.defaultPurse = defaultPurse;
          state.auction.defaultSquadLimit = defaultSquadLimit;
          state.auction.iconPlayerPrice = iconPlayerPrice;
          state.auction.defaultBasePrice = defaultBasePrice;
        }
        showToast('Settings saved in Standalone Simulation!', 'success');
      } else {
        await api.updateAuctionSettings({
          timerEnabled,
          defaultTimerSec,
          autoSell,
          defaultPurse,
          defaultSquadLimit,
          iconPlayerPrice,
          defaultBasePrice,
        });
        showToast('Auction settings updated successfully!', 'success');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAuction = async () => {
    if (
      !window.confirm(
        'Are you sure you want to RESET the entire tournament auction? All current round bids will be wiped, team purses will be reset to their assigned tournament purse, and players will return to upcoming pool.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      if (isStandaloneMode) {
        showToast('Auction reset in simulation mode.', 'info');
      } else {
        await api.resetAuction();
        showToast('Auction reset successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reset auction', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAllTeams = async () => {
    if (
      !window.confirm(
        'WARNING: Are you sure you want to delete ALL tournament teams? All franchise logins will be removed and signed players will return to the upcoming draft pool.'
      )
    ) {
      return;
    }
    setIsDeletingTeams(true);
    try {
      if (isStandaloneMode) {
        showToast('All teams deleted in simulation mode.', 'info');
      } else {
        await deleteAllTeams();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete all teams', 'error');
    } finally {
      setIsDeletingTeams(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 animate-in fade-in">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToArena}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Arena</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                COMMISSIONER CONTROL DESK
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mt-1">
              AUCTION COMMISSIONER SETTINGS
            </h1>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Row 1: Appearance & Layout Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Theme Mode */}
          <div className="bg-[#121724] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Sun className="w-5 h-5 text-amber-400" />
              <span>Display Theme Mode</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toggle between Dark Arena broadcast mode and high-contrast Light mode with dark typography.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onThemeModeChange && onThemeModeChange('dark')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                  themeMode === 'dark'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Arena Mode</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeModeChange && onThemeModeChange('light')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                  themeMode === 'light'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Clean Light Mode</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Style */}
          <div className="bg-[#121724] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <LayoutTemplate className="w-5 h-5 text-cyan-400" />
              <span>Navigation Layout Style</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose between top header navigation bar or full side navigation drawer.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onLayoutModeChange('topbar')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                  layoutMode === 'topbar'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                <span>Top Navigation Bar</span>
              </button>

              <button
                type="button"
                onClick={() => onLayoutModeChange('sidebar')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                  layoutMode === 'sidebar'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <LayoutTemplate className="w-4 h-4 rotate-90" />
                <span>Side Navigation Bar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Automation & Hammer Timer Rules */}
        <div className="bg-[#121724] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-base border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Auction Automation & Hammer Timer</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Sell Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Auto-Sell to Highest Bidder
                </label>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  When timer reaches 0, automatically sell player to highest bidder. If disabled, Admin manually clicks Sell.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSell}
                onChange={(e) => setAutoSell(e.target.checked)}
                className="w-5 h-5 rounded accent-amber-500 cursor-pointer mt-1"
              />
            </div>

            {/* Timer Enable Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Enable Bid Countdown Timer
                </label>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Enable countdown timer for live bids. If disabled, auction stage remains open until manual call.
                </p>
              </div>
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                className="w-5 h-5 rounded accent-amber-500 cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Timer Seconds Slider */}
          {timerEnabled && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  Default Bid Timer Duration
                </span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {defaultTimerSec} Seconds
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={defaultTimerSec}
                onChange={(e) => setDefaultTimerSec(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5s (Lightning)</span>
                <span>10s (Recommended)</span>
                <span>30s</span>
                <span>60s (Standard)</span>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Financials & Tournament Limits */}
        <div className="bg-[#121724] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-base border-b border-slate-800 pb-3">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <span>Tournament Purse, Squad & Valuation Rules (₹ Rupees)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Standard Team Purse */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Default Team Purse
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">₹</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={defaultPurse}
                  onChange={(e) => setDefaultPurse(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">Purse for newly created teams ({formatRupees(defaultPurse)})</p>
            </div>

            {/* Squad Members Limit */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Max Squad Limit
              </label>
              <input
                type="number"
                min="5"
                max="25"
                value={defaultSquadLimit}
                onChange={(e) => setDefaultSquadLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400">Members limit per team (Max {defaultSquadLimit})</p>
            </div>

            {/* Icon Player Valuation */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Icon Player Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">₹</span>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={iconPlayerPrice}
                  onChange={(e) => setIconPlayerPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">Fixed deduction per Icon ({formatRupees(iconPlayerPrice)})</p>
            </div>

            {/* Default Base Price */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Starting Base Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={defaultBasePrice}
                  onChange={(e) => setDefaultBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">Initial bid starting price ({formatRupees(defaultBasePrice)})</p>
            </div>
          </div>
        </div>

        {/* Row 4: Danger Zone */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Danger Zone (Reset Tournament Stage)</span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Resetting the auction clears all active bids, resets all team remaining purses to their assigned total purse, and re-enqueues players to the upcoming draft pool.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetAuction}
              className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isResetting ? 'Resetting Auction...' : 'Reset Auction to Round 1'}</span>
            </button>

            <button
              type="button"
              disabled={isDeletingTeams}
              onClick={handleDeleteAllTeams}
              className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>{isDeletingTeams ? 'Deleting All Teams...' : 'Delete All Teams (Purge)'}</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onBackToArena}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
