import React, { useState } from 'react';
import {
  X,
  Users,
  Globe,
  Star,
  Phone,
  MapPin,
  Key,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { Team, Player } from '../../types';
import { formatRupees } from '../../utils/currency';
import { exportToCsv } from '../../utils/csvExport';

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  isAdmin?: boolean;
  onEditTeam?: (team: Team) => void;
  onDeleteTeam?: (team: Team) => void;
  onManageIcons?: (teamId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  isOpen,
  onClose,
  team,
  isAdmin = false,
  onEditTeam,
  onDeleteTeam,
  onManageIcons,
  onSelectPlayer,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  if (!isOpen || !team) return null;

  const totalSpent = team.totalPurse - team.remainingPurse;
  const pursePercent = Math.max(0, Math.min(100, (team.remainingPurse / team.totalPurse) * 100));
  const squad = team.squad || [];
  const iconCount = squad.filter((sp) => sp.isIcon || sp.player?.isIcon).length;
  const overseasCount = squad.filter((sp) => sp.player?.isOverseas).length;

  const batters = squad.filter((sp) => sp.player?.role === 'Batter').length;
  const bowlers = squad.filter((sp) => sp.player?.role === 'Bowler').length;
  const allRounders = squad.filter((sp) => sp.player?.role === 'All-Rounder').length;
  const wicketkeepers = squad.filter((sp) => sp.player?.role === 'Wicketkeeper').length;

  const handleExportPlayersCsv = () => {
    const filename = `${team.name.replace(/\s+/g, '_')}_players_roster.csv`;
    const headers = [
      'Team Name',
      'Player S.No',
      'Player Name',
      'Role',
      'Category',
      'Is Icon Player',
      'Batting Style',
      'Bowling Style',
      'Native Place',
      'Country',
      'Base Price (INR)',
      'Sold Price (INR)',
    ];

    const rows = squad.map((sp) => [
      team.name,
      sp.player?.sNo || '-',
      sp.player?.name || 'Unknown',
      sp.player?.role || '-',
      sp.player?.category || 'General',
      sp.isIcon || sp.player?.isIcon ? 'YES' : 'NO',
      sp.player?.battingStyle || '-',
      sp.player?.bowlingStyle || '-',
      sp.player?.place || '-',
      sp.player?.country || 'India',
      sp.player?.basePrice || 100,
      sp.price,
    ]);

    exportToCsv(filename, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-4xl bg-[#0f1422] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Color Bar */}
        <div
          className="h-2.5 w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${team.primaryColor} 0%, ${team.secondaryColor} 100%)`,
          }}
        />

        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-[#141a2c] border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-xl border-2 border-white/20 shrink-0 overflow-hidden relative"
              style={{ backgroundColor: team.primaryColor }}
            >
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                team.logoText || team.shortName || team.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                  {team.name}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-700">
                  {team.shortName}
                </span>
                {iconCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {iconCount} Icon{iconCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {team.ownerName ? `Owner: ${team.ownerName}` : 'Registered Tournament Team'}
                {team.address ? ` • ${team.address}` : ''}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportPlayersCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors shadow-sm"
              title="Download Team Players CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Roster CSV</span>
            </button>

            {isAdmin && onEditTeam && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditTeam(team);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                title="Edit Team"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {isAdmin && onDeleteTeam && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTeam(team);
                }}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors"
                title="Delete Team"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Mobile Export Button */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={handleExportPlayersCsv}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Team Players (CSV)</span>
            </button>
          </div>

          {/* Team Info & Login strip */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {team.ownerName && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Owner</span>
                  <span className="font-medium text-white">{team.ownerName}</span>
                </div>
              </div>
            )}
            {team.phone && (
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Contact</span>
                  <span className="font-mono text-white">{team.phone}</span>
                </div>
              </div>
            )}
            {team.address && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Location / Base</span>
                  <span className="font-medium text-white">{team.address}</span>
                </div>
              </div>
            )}
            {isAdmin && team.loginUsername && (
              <div className="flex items-center gap-2 text-slate-300 sm:col-span-3 pt-2 border-t border-slate-800/60">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Login Username:</span>
                  <span className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {team.loginUsername}
                  </span>
                  {team.loginPassword && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Password:</span>
                      <span className="font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 text-xs">
                        {showPassword ? team.loginPassword : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Financial & Squad Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Remaining Purse */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Purse</span>
              <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {formatRupees(team.remainingPurse)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pursePercent}%`,
                    backgroundColor: pursePercent > 50 ? '#10b981' : pursePercent > 20 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block pt-0.5">
                {pursePercent.toFixed(0)}% available of {formatRupees(team.totalPurse)}
              </span>
            </div>

            {/* 2. Total Spent */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spent</span>
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatRupees(totalSpent)}
              </div>
              <span className="text-[10px] text-slate-500 block pt-1">
                Total Budget: {formatRupees(team.totalPurse)}
              </span>
            </div>

            {/* 3. Squad Capacity */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Squad Capacity</span>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                {squad.length} / {team.maxSquadSize || 12}
              </div>
              <span className="text-[10px] text-slate-500 block pt-1">
                Slots Remaining: {Math.max(0, (team.maxSquadSize || 12) - squad.length)}
              </span>
            </div>

            {/* 4. Icon Players */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Icon Players</span>
                {isAdmin && onManageIcons && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onManageIcons(team.id);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
                  >
                    Manage
                  </button>
                )}
              </div>
              <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {iconCount} / 2
              </div>
              <span className="text-[10px] text-slate-500 block pt-1">
                Overseas: {overseasCount} / {team.maxOverseas || 8}
              </span>
            </div>
          </div>

          {/* Squad Breakdown Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Roster Breakdown:</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium text-[11px]">
              Batters: <strong>{batters}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium text-[11px]">
              Bowlers: <strong>{bowlers}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium text-[11px]">
              All-Rounders: <strong>{allRounders}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-[11px]">
              Wicketkeepers: <strong>{wicketkeepers}</strong>
            </span>
          </div>

          {/* Squad Players Roster List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Squad Players Roster ({squad.length})</span>
              </h3>
              {squad.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportPlayersCsv}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              )}
            </div>

            {squad.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">No Players Signed Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  This team has not acquired any players in the auction or icon allocation yet.
                </p>
                {isAdmin && onManageIcons && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onManageIcons(team.id);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Assign Icon Player (₹2,500)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {squad.map((sp) => {
                  const p = sp.player;
                  const isIcon = sp.isIcon || p?.isIcon;

                  return (
                    <div
                      key={sp.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isIcon
                          ? 'bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 border-amber-500/40 shadow-sm shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Player Photo */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          {p?.profileImage ? (
                            <img
                              src={p.profileImage}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xs">
                              {p?.name?.slice(0, 2) || 'CR'}
                            </div>
                          )}
                          {isIcon && (
                            <div className="absolute top-0 right-0 bg-amber-500 p-0.5 rounded-bl">
                              <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                            </div>
                          )}
                        </div>

                        {/* Player Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                              <span>{p?.name}</span>
                              {p?.sNo && (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded font-bold">
                                  #{p.sNo}
                                </span>
                              )}
                            </h4>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-bold text-amber-400">
                                {formatRupees(sp.price)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {p?.role}
                            </span>
                            {isIcon && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                ICON
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {p?.place || p?.country || 'India'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                            <span className="truncate">
                              {p?.battingStyle} • {p?.bowlingStyle}
                            </span>
                            {onSelectPlayer && p?.id && (
                              <button
                                type="button"
                                onClick={() => onSelectPlayer(p.id)}
                                className="text-amber-400 hover:text-amber-300 font-bold ml-2 shrink-0 flex items-center gap-0.5"
                              >
                                <span>Dossier</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-[#141a2c] border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {team.name} • {squad.length} Player{squad.length !== 1 ? 's' : ''} Signed
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
