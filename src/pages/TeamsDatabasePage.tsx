import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Team } from '../types';
import { formatRupees } from '../utils/currency';
import { exportToCsv } from '../utils/csvExport';
import {
  Users,
  Globe,
  Trophy,
  Shield,
  Plus,
  Edit2,
  Star,
  Phone,
  MapPin,
  Key,
  Lock,
  Check,
  Trash2,
  AlertTriangle,
  Download,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useAuctionStore } from '../store/auction.store';
import { TeamFormModal } from '../components/admin/TeamFormModal';
import { IconPlayerModal } from '../components/admin/IconPlayerModal';
import { FranchiseCredentialsModal } from '../components/admin/FranchiseCredentialsModal';
import { TeamDetailsModal } from '../components/admin/TeamDetailsModal';
import { PlayerProfileModal } from '../components/player/PlayerProfileModal';

export const TeamsDatabasePage: React.FC = () => {
  const { user } = useAuthStore();
  const { deleteTeam, deleteAllTeams, showToast } = useAuctionStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [selectedTeamIdForIcons, setSelectedTeamIdForIcons] = useState<string | undefined>(undefined);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  // Delete State
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Team Details & Player Dossier Modals
  const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<Team | null>(null);
  const [selectedPlayerIdForModal, setSelectedPlayerIdForModal] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const loadTeams = () => {
    setLoading(true);
    api
      .getTeams()
      .then((data) => {
        setTeams(data);
        if (selectedTeamForDetails) {
          const fresh = data.find((t: Team) => t.id === selectedTeamForDetails.id);
          if (fresh) setSelectedTeamForDetails(fresh);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsTeamModalOpen(true);
  };

  const handleOpenAddTeam = () => {
    setTeamToEdit(null);
    setIsTeamModalOpen(true);
  };

  const handleManageIcons = (teamId: string) => {
    setSelectedTeamIdForIcons(teamId);
    setIsIconModalOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
  };

  const handleConfirmDeleteSingle = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTeam(teamToDelete.id);
      setTeamToDelete(null);
      if (selectedTeamForDetails?.id === teamToDelete.id) {
        setSelectedTeamForDetails(null);
      }
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete team.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await deleteAllTeams();
      setIsDeleteAllModalOpen(false);
      if (selectedTeamForDetails) {
        setSelectedTeamForDetails(null);
      }
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete all teams.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export: All Teams Summary
  const handleExportTeamsList = () => {
    if (teams.length === 0) {
      alert('No teams registered yet.');
      return;
    }

    const headers = [
      'Team Name',
      'Short Code',
      'Owner Name',
      'Phone Number',
      'Location / Address',
      'Total Purse (INR)',
      'Remaining Purse (INR)',
      'Spent Purse (INR)',
      'Current Squad Size',
      'Max Squad Size',
      'Icon Players Count',
      'Overseas Players Count',
      'Batters Count',
      'Bowlers Count',
      'All-Rounders Count',
      'Wicketkeepers Count',
    ];

    const rows = teams.map((t) => {
      const squad = t.squad || [];
      const iconCount = squad.filter((sp) => sp.isIcon || sp.player?.isIcon).length;
      const overseasCount = squad.filter((sp) => sp.player?.isOverseas).length;
      const batters = squad.filter((sp) => sp.player?.role === 'Batter').length;
      const bowlers = squad.filter((sp) => sp.player?.role === 'Bowler').length;
      const allRounders = squad.filter((sp) => sp.player?.role === 'All-Rounder').length;
      const wicketkeepers = squad.filter((sp) => sp.player?.role === 'Wicketkeeper').length;
      const totalSpent = t.totalPurse - t.remainingPurse;

      return [
        t.name,
        t.shortName,
        t.ownerName || '',
        t.phone || '',
        t.address || '',
        t.totalPurse,
        t.remainingPurse,
        totalSpent,
        squad.length,
        t.maxSquadSize || 12,
        iconCount,
        overseasCount,
        batters,
        bowlers,
        allRounders,
        wicketkeepers,
      ];
    });

    exportToCsv('cricket_auction_teams_summary.csv', headers, rows);
  };

  // CSV Export: Single Team Squad Roster
  const handleExportTeamRoster = (team: Team) => {
    const squad = team.squad || [];
    if (squad.length === 0) {
      alert(`Team "${team.name}" does not have any players in their squad yet.`);
      return;
    }

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
      'Purchased Price (INR)',
    ];

    const rows = squad.map((sp) => {
      const p = sp.player;
      return [
        team.name,
        p?.sNo || '—',
        p?.name || 'Unknown',
        p?.role || '—',
        p?.category || '—',
        sp.isIcon || p?.isIcon ? 'YES' : 'NO',
        p?.battingStyle || '—',
        p?.bowlingStyle || '—',
        p?.place || '—',
        p?.country || 'India',
        p?.basePrice || 100,
        sp.price || p?.currentPrice || 100,
      ];
    });

    const safeFilename = `${team.shortName || team.name}_squad_roster.csv`.replace(/\s+/g, '_');
    exportToCsv(safeFilename, headers, rows);
  };

  // CSV Export: All Teams Roster Combined
  const handleExportAllRosters = () => {
    const allSquadRows: any[] = [];

    teams.forEach((team) => {
      const squad = team.squad || [];
      squad.forEach((sp) => {
        const p = sp.player;
        allSquadRows.push([
          team.name,
          team.shortName,
          p?.sNo || '—',
          p?.name || 'Unknown',
          p?.role || '—',
          p?.category || '—',
          sp.isIcon || p?.isIcon ? 'YES' : 'NO',
          p?.battingStyle || '—',
          p?.bowlingStyle || '—',
          p?.place || '—',
          p?.country || 'India',
          p?.basePrice || 100,
          sp.price || p?.currentPrice || 100,
        ]);
      });
    });

    if (allSquadRows.length === 0) {
      alert('No rostered players across any teams yet.');
      return;
    }

    const headers = [
      'Team Name',
      'Team Code',
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

    exportToCsv('all_teams_players_roster.csv', headers, allSquadRows);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400">Loading teams...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white font-display">
            PARTICIPATING TEAMS ({teams.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered tournament teams competing with purse ₹15,000 and max 12 squad members. Click any team to inspect details and roster.
          </p>
        </div>

        {/* Global Header Actions: CSV Downloads & Admin Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Team List CSV */}
          <button
            type="button"
            onClick={handleExportTeamsList}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-xs transition-colors shadow-sm"
            title="Download Teams Summary CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Teams CSV</span>
          </button>

          {/* Download All Rosters CSV */}
          <button
            type="button"
            onClick={handleExportAllRosters}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-xs transition-colors shadow-sm"
            title="Download All Team Rosters Combined CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download All Rosters</span>
          </button>

          {isAdmin && (
            <>
              {teams.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors shadow-sm"
                  title="Delete all participating teams"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete All Teams</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors shadow-sm"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Logins Table</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddTeam}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {teams.length === 0 ? (
        <div className="bg-[#121724] border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Teams Registered Yet</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            The tournament is starting fresh with a clean slate. As Commissioner, create your participating teams and assign each owner their unique login username and password.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAddTeam}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Team
            </button>
          )}
        </div>
      ) : (
        /* Team Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teams.map((t) => {
            const pursePercent = Math.max(0, Math.min(100, (t.remainingPurse / t.totalPurse) * 100));
            const iconCount = t.squad?.filter((sp) => sp.isIcon || sp.player?.isIcon).length || 0;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTeamForDetails(t)}
                className="bg-[#121724] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group transition-all cursor-pointer hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-0.5"
              >
                {/* Team Accent Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: t.primaryColor }}
                />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black font-display text-white text-lg shadow-md group-hover:scale-105 transition-transform overflow-hidden relative"
                        style={{ backgroundColor: t.primaryColor }}
                      >
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.shortName
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight group-hover:text-amber-400 transition-colors">
                          {t.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400">{t.shortName}</span>
                          {iconCount > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                              {iconCount} Icon{iconCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons on Card Top */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Quick Download Team Players CSV */}
                      <button
                        type="button"
                        onClick={() => handleExportTeamRoster(t)}
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Download Team Players CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Admin Edit Team */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleEditTeam(t)}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Edit team details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Admin Delete Team */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(t)}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title={`Delete ${t.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Owner & Contact Details */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 space-y-1 text-xs">
                    {t.ownerName && (
                      <div className="text-slate-300 font-medium flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Owner:</span>
                        <span className="truncate ml-1">{t.ownerName}</span>
                      </div>
                    )}
                    {t.phone && (
                      <div className="text-slate-400 text-[11px] font-mono flex items-center justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span>{t.phone}</span>
                      </div>
                    )}
                    {t.address && (
                      <div className="text-slate-400 text-[11px] flex items-center justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="truncate ml-1">{t.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Purse Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-400">Remaining Purse</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">
                        {formatRupees(t.remainingPurse)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pursePercent}%`,
                          backgroundColor: pursePercent > 20 ? t.primaryColor : '#EF4444',
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Spent: {formatRupees(t.totalPurse - t.remainingPurse)}</span>
                      <span>Total: {formatRupees(t.totalPurse)}</span>
                    </div>
                  </div>

                  {/* Squad Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <div className="text-[10px] text-slate-500">Squad</div>
                        <div className="font-bold text-white font-mono">
                          {t.squadSize || t.squad?.length || 0} / {t.maxSquadSize || 12}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <div className="text-[10px] text-slate-500">Overseas</div>
                        <div className="font-bold text-white font-mono">
                          {t.overseasCount || 0} / {t.maxOverseas || 4}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role composition */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/40 font-mono">
                    <span>🏏 {t.batters || 0} Bat</span>
                    <span>⚾ {t.bowlers || 0} Bowl</span>
                    <span>⚡ {t.allRounders || 0} AR</span>
                    <span>🧤 {t.wicketkeepers || 0} WK</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div
                  className="pt-3 border-t border-slate-800 flex items-center gap-2 mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTeamForDetails(t)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Users className="w-3 h-3 text-amber-400" />
                    <span>View Roster</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleManageIcons(t.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      title="Assign Icon Player"
                    >
                      <Star className="w-3 h-3" />
                      <span>Icon</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(t)}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      title={`Delete ${t.name}`}
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Details & Full Players Roster Modal */}
      <TeamDetailsModal
        isOpen={!!selectedTeamForDetails}
        onClose={() => setSelectedTeamForDetails(null)}
        team={selectedTeamForDetails}
        isAdmin={isAdmin}
        onEditTeam={(team) => {
          setSelectedTeamForDetails(null);
          handleEditTeam(team);
        }}
        onDeleteTeam={(team) => {
          handleDeleteTeam(team);
        }}
        onManageIcons={(teamId) => {
          handleManageIcons(teamId);
        }}
        onSelectPlayer={(playerId) => {
          setSelectedPlayerIdForModal(playerId);
        }}
      />

      {/* Player Profile Dossier Modal (Triggerable from inside Team Details) */}
      <PlayerProfileModal
        playerId={selectedPlayerIdForModal}
        onClose={() => setSelectedPlayerIdForModal(null)}
      />

      {/* Add / Edit Team Modal */}
      <TeamFormModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          loadTeams();
        }}
        teamToEdit={teamToEdit}
      />

      {/* Icon Players Assignment Modal */}
      <IconPlayerModal
        isOpen={isIconModalOpen}
        onClose={() => {
          setIsIconModalOpen(false);
          loadTeams();
        }}
        selectedTeamId={selectedTeamIdForIcons}
      />

      {/* Admin Team Credentials Table Modal */}
      <FranchiseCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => {
          setIsCredentialsModalOpen(false);
          loadTeams();
        }}
        onOpenCreateTeam={() => {
          setIsCredentialsModalOpen(false);
          handleOpenAddTeam();
        }}
      />

      {/* Delete Single Team Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Team</h3>
                <p className="text-xs text-slate-400">Confirm deletion of tournament team</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                  style={{ backgroundColor: teamToDelete.primaryColor }}
                >
                  {teamToDelete.shortName}
                </div>
                <div>
                  <div className="font-bold text-white">{teamToDelete.name}</div>
                  {teamToDelete.ownerName && (
                    <div className="text-[11px] text-slate-400">Owner: {teamToDelete.ownerName}</div>
                  )}
                </div>
              </div>

              {teamToDelete.squad && teamToDelete.squad.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{teamToDelete.squad.length} signed player(s)</strong> will be released back to the <strong>Upcoming</strong> auction pool.
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  This team has no signed players. Franchise login and budget records will be removed.
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete <strong>{teamToDelete.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete Team'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Teams Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete All Teams</h3>
                <p className="text-xs text-rose-400">Danger: Bulk tournament deletion</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs text-rose-200">
              <p>
                You are about to delete <strong>ALL {teams.length} teams</strong> from the tournament.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>All franchise login accounts will be removed</li>
                <li>All team purse allocations will be cleared</li>
                <li>All rostered players will return to the Upcoming pool</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting All...' : `Delete All ${teams.length} Teams`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
