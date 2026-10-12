import React, { useEffect, useState } from 'react';
import {
  Users,
  Trophy,
  DollarSign,
  TrendingUp,
  Download,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { formatRupees, CRORE } from '../utils/currency';

const ROLE_COLORS: Record<string, string> = {
  Batter: '#3b82f6',
  Bowler: '#10b981',
  'All-Rounder': '#f59e0b',
  Wicketkeeper: '#a855f7',
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    setLoading(true);
    api
      .getDashboardStats()
      .then((data: DashboardStats) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleExportCSV = () => {
    if (!stats || !stats.recentPurchases) return;
    const headers = 'Player Name,Country,Role,Base Price,Final Price,Winning Team\n';
    const rows = stats.recentPurchases
      .map(
        (p: any) =>
          `"${p.player.name}","${p.player.country}","${p.player.role}","${p.basePrice}","${p.finalPrice || ''}","${
            p.winningTeam?.name || ''
          }"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cricket_auction_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400">
        Loading analytics dashboard...
      </div>
    );
  }

  const { summary, spendingByTeam, soldByRole, soldByCountry, priceDistribution, recentPurchases } = stats;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white font-display">
            AUCTION INTELLIGENCE DASHBOARD
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time macroeconomic analysis, team spending patterns, and player valuation metrics.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20"
        >
          <Download className="w-4 h-4" />
          Export Results (CSV)
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total Pool</span>
          <div className="text-xl font-black font-mono text-white mt-1">{summary.totalPlayers}</div>
        </div>

        <div className="bg-[#121724] border border-emerald-500/30 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Sold</span>
          <div className="text-xl font-black font-mono text-emerald-300 mt-1">{summary.soldCount}</div>
        </div>

        <div className="bg-[#121724] border border-rose-500/30 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">Unsold</span>
          <div className="text-xl font-black font-mono text-rose-300 mt-1">{summary.unsoldCount}</div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Remaining</span>
          <div className="text-xl font-black font-mono text-cyan-300 mt-1">{summary.remainingCount}</div>
        </div>

        <div className="bg-[#121724] border border-amber-500/30 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Total Spent</span>
          <div className="text-xl font-black font-mono text-amber-400 mt-1">
            {formatRupees(summary.totalSpent)}
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Avg Price</span>
          <div className="text-xl font-black font-mono text-white mt-1">
            {formatRupees(summary.avgPrice)}
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Top Buy</span>
          <div className="text-base font-black font-mono text-amber-300 mt-1 truncate">
            {summary.highestPurchase ? formatRupees(summary.highestPurchase.finalPrice) : '—'}
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Team */}
        <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Total Expenditure by Team (₹ Rupees)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={spendingByTeam.map((t: any) => ({
                  name: t.shortName,
                  spent: t.totalSpent || 0,
                  remaining: t.remainingPurse || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  formatter={(val: any) => [formatRupees(Number(val)), '']}
                />
                <Bar dataKey="spent" fill="#f59e0b" name="Spent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Players Sold by Role */}
        <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Acquisitions by Player Role
          </h3>
          <div className="h-64 flex items-center justify-center">
            {soldByRole.every((r: any) => r.count === 0) ? (
              <div className="text-xs text-slate-500 italic">No sold players yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={soldByRole}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.role}: ${entry.count}`}
                  >
                    {soldByRole.map((entry: any) => (
                      <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Price Distribution */}
        <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Price Bracket Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Players Sold by Country */}
        <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            International Demographics
          </h3>
          <div className="h-64">
            {soldByCountry.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                No international players sold yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={soldByCountry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="country" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Purchases Table */}
      <div className="bg-[#121724] border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
          Recent Completed Acquisitions
        </h3>
        {recentPurchases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            No completed player sales yet. Start the auction to watch records generate in real time!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Final Price</th>
                  <th className="py-3 px-4">Acquiring Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentPurchases.map((sp: any) => (
                  <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <img
                        src={sp.player.profileImage}
                        alt={sp.player.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${sp.player.name}`;
                        }}
                      />
                      <span>{sp.player.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{sp.player.role}</td>
                    <td className="py-3 px-4 text-slate-400">{sp.player.country}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatRupees(sp.basePrice)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {formatRupees(sp.finalPrice)}
                    </td>
                    <td className="py-3 px-4">
                      {sp.winningTeam && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: sp.winningTeam.primaryColor }}
                          />
                          {sp.winningTeam.name}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
