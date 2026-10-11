import React, { useState, useEffect } from 'react';
import { Settings, Clock, Check, X, Shield, KeyRound, AlertCircle, Coins, Users, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, showToast, initState } = useAuctionStore();
  const auction = state?.auction;

  const [autoSell, setAutoSell] = useState<boolean>(auction?.autoSell !== undefined ? auction.autoSell : true);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(auction?.timerEnabled !== undefined ? auction.timerEnabled : true);
  const [defaultTimerSec, setDefaultTimerSec] = useState<number>(auction?.defaultTimerSec || 10);
  const [defaultPurse, setDefaultPurse] = useState<number>(auction?.defaultPurse || 15000);
  const [defaultSquadLimit, setDefaultSquadLimit] = useState<number>(auction?.defaultSquadLimit || 12);
  const [iconPlayerPrice, setIconPlayerPrice] = useState<number>(auction?.iconPlayerPrice || 2500);

  useEffect(() => {
    if (isOpen && auction) {
      setAutoSell(auction.autoSell !== undefined ? auction.autoSell : true);
      setTimerEnabled(auction.timerEnabled !== undefined ? auction.timerEnabled : true);
      setDefaultTimerSec(auction.defaultTimerSec || 10);
      setDefaultPurse(auction.defaultPurse || 15000);
      setDefaultSquadLimit(auction.defaultSquadLimit || 12);
      setIconPlayerPrice(auction.iconPlayerPrice || 2500);
    }
  }, [isOpen, auction?.id, auction?.timerEnabled, auction?.autoSell, auction?.defaultTimerSec]);

  // Password reset state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateAuctionSettings({
        autoSell,
        timerEnabled,
        defaultTimerSec: Number(defaultTimerSec),
        defaultPurse: Number(defaultPurse),
        defaultSquadLimit: Number(defaultSquadLimit),
        iconPlayerPrice: Number(iconPlayerPrice),
      });
      await initState();
      showToast('Tournament & Auction settings saved successfully!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ text: 'New password must be at least 4 characters.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', error: true });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMsg(null);
    try {
      await api.resetPassword(newPassword, currentPassword);
      setPasswordMsg({ text: 'Admin password changed successfully!', error: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordSection(false), 2000);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Failed to change password.', error: true });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Admin & Tournament Settings</h3>
              <p className="text-xs text-slate-400">Manage auction automation, timers, and tournament rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          {/* 1. Auto-Sell vs Manual Sell */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block">Auto-Sell Player</label>
                <p className="text-[11px] text-slate-400">
                  {autoSell
                    ? 'Automatically sells player to highest bidder when timer reaches 0.'
                    : 'Timer finishes and waits for Admin to manually confirm Sold or Unsold.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSell(!autoSell)}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  autoSell ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    autoSell ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Timer Enable / Disable & Duration */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Countdown Bid Timer
                </label>
                <p className="text-[11px] text-slate-400">
                  {timerEnabled
                    ? 'Countdown runs on every bid.'
                    : 'Timer is DISABLED. Auction is 100% manual controlled by Admin.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  timerEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    timerEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {timerEnabled && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Timer Duration (Seconds)
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDefaultTimerSec(sec)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        defaultTimerSec === sec
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-750 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Tournament Limits: Purse, Squad, Icon Player */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Tournament Budget & Roster Limits
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Team Purse
                </label>
                <input
                  type="number"
                  value={defaultPurse}
                  onChange={(e) => setDefaultPurse(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500">{formatRupees(defaultPurse)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Max Squad Size
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={defaultSquadLimit}
                  onChange={(e) => setDefaultSquadLimit(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500">{defaultSquadLimit} Members</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Icon Player Cost
                </label>
                <input
                  type="number"
                  value={iconPlayerPrice}
                  onChange={(e) => setIconPlayerPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500">{formatRupees(iconPlayerPrice)}</span>
              </div>
            </div>
          </div>

          {/* 4. Reset Admin Password */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Admin Password
                </label>
                <p className="text-[11px] text-slate-400">Username: <strong className="text-white">KhaderMeeran</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                {showPasswordSection ? 'Hide' : 'Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className="mt-3 pt-3 border-t border-slate-850 space-y-2">
                {passwordMsg && (
                  <div
                    className={`p-2 rounded text-xs ${
                      passwordMsg.error
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mb-1.5"
                  />
                  <input
                    type="password"
                    placeholder="New Password (min 4 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mb-1.5"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mb-2"
                  />
                  <button
                    type="button"
                    disabled={isSavingPassword}
                    onClick={handleResetPassword}
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {isSavingPassword ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
