import React, { useState, useEffect } from 'react';
import { Server, Activity, CheckCircle2, RefreshCw, Zap, X } from 'lucide-react';
import { api, getBackendUrl } from '../../services/api';

interface RenderWakeupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RenderWakeupModal: React.FC<RenderWakeupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'FAILED'>('CONNECTING');
  const backendUrl = getBackendUrl();

  useEffect(() => {
    if (!isOpen) return;

    setSecondsLeft(45);
    setStatus('CONNECTING');

    // Countdown interval
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Health polling interval every 3 seconds
    const pollHealth = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/health`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok') {
            setStatus('ACTIVE');
            clearInterval(pollHealth);
            clearInterval(countdown);
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1200);
          }
        }
      } catch (e) {
        // Still waking up
      }
    }, 3000);

    return () => {
      clearInterval(countdown);
      clearInterval(pollHealth);
    };
  }, [isOpen, backendUrl, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {status === 'ACTIVE' ? (
          <div className="py-6 animate-in zoom-in-90">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">Server is Active!</h3>
            <p className="text-xs text-emerald-400 font-medium">Connected to Render Cloud Database</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Animated Loader Graphic */}
            <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-ping opacity-30" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-slate-700 flex items-center justify-center shadow-lg relative">
                <Server className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
              Application DB is Loading • 45s
            </span>

            <h3 className="text-lg font-black text-white mb-1">
              Backend Cloud Server Waking Up
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-sm mx-auto">
              The Render application DB is currently spinning up from cold sleep. This free cloud instance takes <strong className="text-amber-400">up to 45 seconds</strong> to initialize. Please hold on!
            </p>

            {/* Countdown Seconds Left Card with Live Progress Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                <span>Database Wakeup Timer</span>
                <span className="text-amber-400 font-mono font-bold">{Math.round(((45 - secondsLeft) / 45) * 100)}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mb-3 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000 ease-linear shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(5, ((45 - secondsLeft) / 45) * 100))}%` }}
                />
              </div>

              <div className="text-4xl font-black text-amber-400 font-mono tracking-tight">
                {secondsLeft}s
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1.5 font-mono">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span>Auto-connecting to {backendUrl.replace(/^https?:\/\//, '')}...</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors"
              >
                Continue in Standalone Mode
              </button>
              <button
                type="button"
                onClick={() => setSecondsLeft(45)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Restart 45s Ping</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
