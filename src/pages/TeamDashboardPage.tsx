import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import { Team, Player } from '../types';
import { formatRupees } from '../utils/currency';
import { Users, Globe, Trophy, DollarSign, Award, Shield } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const TeamDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      setLoading(true);
      api
        .getTeamById(user.teamId)
        .then((data: Team) => setTeam(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.teamId]);

  if (!user || user.role !== 'TEAM') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-400">
        Please log in with a Team account to view the team command center.
      </div>
    );
  }

  if (loading || !team) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-400">
        Loading team squad records...
      </div>
    );
  }

  const squad = team.squad || [];
  const overseasCount = team.overseasCount ?? squad.filter((sp: any) => sp.player.isOverseas).length;
  const battersCount = squad.filter((sp: any) => sp.player.role === 'Batter').length;
  const bowlersCount = squad.filter((sp: any) => sp.player.role === 'Bowler').length;
  const allRoundersCount = squad.filter((sp: any) => sp.player.role === 'All-Rounder').length;
  const keepersCount = squad.filter((sp: any) => sp.player.role === 'Wicketkeeper').length;

  const roleData = [
    { name: 'Batters', count: battersCount, color: '#3b82f6' },
    { name: 'Bowlers', count: bowlersCount, color: '#10b981' },
    { name: 'All-Rounders', count: allRoundersCount, color: '#f59e0b' },
    { name: 'Wicketkeepers', count: keepersCount, color: '#a855f7' },
  ].filter((d) => d.count > 0);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Team Header Hero */}
      <div
        className="p-4 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
        style={{
          backgroundColor: '#121724',
          borderColor: team.primaryColor + '60',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl border border-white/20 overflow-hidden relative"
            style={{ backgroundColor: team.primaryColor }}
          >
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              team.logoText
            )}
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              TEAM SQUAD ROSTER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
              {team.name}
            </h1>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <div className="text-xs text-slate-400 font-mono">REMAINING PURSE</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {formatRupees(team.remainingPurse)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Spent: {formatRupees(team.totalPurse - team.remainingPurse)} / {formatRupees(team.totalPurse)}
          </div>
        </div>
      </div>

      {/* KPI Roster Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Squad Size</span>
          <div className="text-xl font-black font-mono text-white mt-1">
            {squad.length} / {team.maxSquadSize}
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Overseas</span>
          <div className="text-xl font-black font-mono text-cyan-300 mt-1">
            {overseasCount} / {team.maxOverseas}
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Player Price</span>
          <div className="text-lg font-black font-mono text-slate-200 mt-1">
            {formatRupees(team.avgPlayerPrice || 0)}
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Highest Purchase</span>
          <div className="text-lg font-black font-mono text-amber-400 mt-1">
            {formatRupees(team.highestPurchase || 0)}
          </div>
        </div>

        <div className="bg-[#121724] border border-slate-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Purse Capacity</span>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {((team.remainingPurse / team.totalPurse) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Squad Composition Breakdown & Squad Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Composition Donut */}
        <div className="bg-[#121724] border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Squad Role Balance
          </h3>
          {roleData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500 italic">
              No players purchased yet.
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {roleData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-blue-400">Batters:</span>
              <span className="font-bold text-white">{battersCount}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-emerald-400">Bowlers:</span>
              <span className="font-bold text-white">{bowlersCount}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-amber-400">All-Round:</span>
              <span className="font-bold text-white">{allRoundersCount}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-purple-400">Keepers:</span>
              <span className="font-bold text-white">{keepersCount}</span>
            </div>
          </div>
        </div>

        {/* Squad Table */}
        <div className="lg:col-span-2 bg-[#121724] border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-4">
            Purchased Players Roster
          </h3>

          {squad.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 italic">
              Your team has not won any player bids yet. Head over to the Live Arena to start bidding!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Country</th>
                    <th className="py-3 px-3">Price Paid</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {squad.map((sp: any) => (
                    <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2.5">
                        <img
                          src={sp.player.profileImage}
                          alt={sp.player.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${sp.player.name}`;
                          }}
                        />
                        <span>{sp.player.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{sp.player.role}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {sp.player.country} {sp.player.isOverseas && '✈️'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {formatRupees(sp.price)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ACQUIRED
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
    </div>
  );
};
