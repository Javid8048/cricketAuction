import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, Activity, RefreshCw, Zap, ShieldAlert } from 'lucide-react';
import { api, getBackendUrl } from '../../services/api';

interface DbConnectionGatekeeperProps {
  onConnected: () => void;
  onBypass?: () => void;
}

export const DbConnectionGatekeeper: React.FC<DbConnectionGatekeeperProps> = ({
  onConnected,
  onBypass,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(45);
  const [status, setStatus] = useState<'CHECKING' | 'CONNECTED' | 'RETRYING'>('CHECKING');
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const backendUrl = getBackendUrl();

  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;
    let countdownInterval: any = null;

    // Check connection with 5s timeout
    const checkConnection = async () => {
      try {
        const isHealthy = await api.checkHealth(5000);
        if (!isMounted) return false;

        if (isHealthy) {
          setStatus('CONNECTED');
          if (pollInterval) clearInterval(pollInterval);
          if (countdownInterval) clearInterval(countdownInterval);
          setTimeout(() => {
            if (isMounted) onConnected();
          }, 600);
          return true;
        } else {
          setStatus('RETRYING');
          setAttemptCount((prev) => prev + 1);
          return false;
        }
      } catch (err) {
        if (isMounted) {
          setStatus('RETRYING');
          setAttemptCount((prev) => prev + 1);
        }
        return false;
      }
    };

    // First probe
    checkConnection().then((connected) => {
      if (connected) return;

      // Start countdown timer if not connected immediately
      countdownInterval = setInterval(() => {
        if (!isMounted) return;
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Once countdown completes, auto-connect to landing page so the user is never stuck
            if (countdownInterval) clearInterval(countdownInterval);
            if (pollInterval) clearInterval(pollInterval);
            setTimeout(() => {
              if (isMounted) onConnected();
            }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start regular polling every 3s
      pollInterval = setInterval(async () => {
        if (!isMounted) return;
        const ok = await checkConnection();
        if (ok && pollInterval) {
          clearInterval(pollInterval);
        }
      }, 3000);
    });

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [onConnected]);

  const handleManualRetry = async () => {
    setStatus('CHECKING');
    setSecondsLeft(45);
    const isHealthy = await api.checkHealth(5000);
    if (isHealthy) {
      setStatus('CONNECTED');
      setTimeout(() => onConnected(), 600);
    } else {
      setStatus('RETRYING');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080b11] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center overflow-hidden animate-in fade-in zoom-in-95">
        {status === 'CONNECTED' ? (
          <div className="py-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white font-display mb-1">Database Connected</h2>
            <p className="text-xs text-slate-400 font-mono">Launching Live Arena...</p>
          </div>
        ) : (
          <div className="py-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Database className="w-8 h-8 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Verifying DB Connection • Probe #{attemptCount}</span>
            </div>

            <h2 className="text-xl font-black text-white font-display mb-2">
              Cricket Auction Arena
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-sm mx-auto">
              Checking database connectivity. If the backend cloud instance is waking from sleep, it takes{' '}
              <strong className="text-amber-400">up to 45 seconds</strong> to initialize.
            </p>

            {/* Countdown timer card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2 font-mono">
                <span>Cloud DB Wakeup</span>
                <span className="text-amber-400 font-bold">{Math.round(((45 - secondsLeft) / 45) * 100)}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mb-3 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(5, ((45 - secondsLeft) / 45) * 100))}%` }}
                />
              </div>

              <div className="text-4xl font-black text-amber-400 font-mono tracking-tight">
                {secondsLeft}s
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1.5 font-mono">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span className="truncate max-w-[280px]">Probing {backendUrl.replace(/^https?:\/\//, '')}/health</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleManualRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Retry DB Connection</span>
              </button>

              {onBypass && (
                <button
                  type="button"
                  onClick={onBypass}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                  title="Continue without waiting for cloud DB (offline mode)"
                >
                  Offline Bypass
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
