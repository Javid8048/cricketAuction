import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatRupees } from '../utils/currency';
import { History, CheckCircle2, XCircle, ArrowUpRight, Search, Filter } from 'lucide-react';

export const AuctionHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bids' | 'results'>('results');
  const [bids, setBids] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [results, setResults] = useState<{ sold: any[]; unsold: any[] }>({ sold: [], unsold: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyData, resultsData] = await Promise.all([
        api.getAuctionHistory(),
        api.getAuctionResults(),
      ]);
      setBids(historyData.bids || []);
      setEvents(historyData.events || []);
      setResults(resultsData || { sold: [], unsold: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            AUCTION AUDIT TRAIL & LEDGER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log of all bid increments, player assignments, and official auction events.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#121724] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'results'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Concluded Lots ({results.sold.length + results.unsold.length})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'bids'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Bids ({bids.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading audit history...</div>
      ) : activeTab === 'results' ? (
        <div className="space-y-6">
          {/* Sold Players Section */}
          <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-extrabold text-emerald-400 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Successfully Acquired Cricketers ({results.sold.length})</span>
            </h3>

            {results.sold.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">No players sold yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Base Price</th>
                      <th className="py-3 px-3">Final Sale Price</th>
                      <th className="py-3 px-3">Winning Team</th>
                      <th className="py-3 px-3">Total Bids</th>
                      <th className="py-3 px-3">Sold Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {results.sold.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2.5">
                          <img
                            src={s.player.profileImage}
                            alt={s.player.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${s.player.name}`;
                            }}
                          />
                          <span>{s.player.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{s.player.role}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {formatRupees(s.basePrice)}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-amber-400">
                          {formatRupees(s.finalPrice)}
                        </td>
                        <td className="py-3 px-3">
                          {s.winningTeam && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: s.winningTeam.primaryColor }}
                              />
                              {s.winningTeam.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {s.bids?.length || 1} bids
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                          {s.soldAt ? new Date(s.soldAt).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Unsold Players Section */}
          <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-extrabold text-rose-400 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>Unsold Cricketers ({results.unsold.length})</span>
            </h3>

            {results.unsold.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">No unsold players yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Country</th>
                      <th className="py-3 px-3">Base Price</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {results.unsold.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2.5">
                          <img
                            src={u.player.profileImage}
                            alt={u.player.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700 opacity-80"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${u.player.name}`;
                            }}
                          />
                          <span>{u.player.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{u.player.role}</td>
                        <td className="py-3 px-3 text-slate-400">{u.player.country}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {formatRupees(u.basePrice)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            UNSOLD
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* All Bids Tab */
        <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Granular Bid Logs ({bids.length})
          </h3>

          {bids.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 italic">No bids placed in arena yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Team</th>
                    <th className="py-3 px-3">Bid Amount</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium font-mono">
                  {bids.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-500">{b.bidNumber}</td>
                      <td className="py-3 px-3 font-sans font-bold text-white">{b.player?.name}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-white text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: b.team?.primaryColor || '#f59e0b' }}
                          />
                          {b.team?.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-400">{formatRupees(b.amount)}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(b.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
