import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Team } from '../types';
import { formatRupees } from '../utils/currency';
import { Users, Globe, Trophy, Shield, Plus, Edit2, Star, Phone, MapPin, Key, Lock, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useAuctionStore } from '../store/auction.store';
import { TeamFormModal } from '../components/admin/TeamFormModal';
import { IconPlayerModal } from '../components/admin/IconPlayerModal';
import { FranchiseCredentialsModal } from '../components/admin/FranchiseCredentialsModal';

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

  const isAdmin = user?.role === 'ADMIN';

  const loadTeams = () => {
    setLoading(true);
    api
      .getTeams()
      .then(setTeams)
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

  const handleConfirmDeleteSingle = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTeam(teamToDelete.id);
      setTeamToDelete(null);
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
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete all teams.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400">Loading teams...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            PARTICIPATING TEAMS ({teams.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered teams competing with purse limit ₹15,000 and max 12 members squad.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {teams.length > 0 && (
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors shadow-sm"
                title="Delete all participating teams"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete All Teams</span>
              </button>
            )}

            <button
              onClick={() => setIsCredentialsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors shadow-sm"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Team Logins Table</span>
            </button>

            <button
              onClick={handleOpenAddTeam}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Add New Team
            </button>
          </div>
        )}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teams.map((t) => {
            const pursePercent = Math.max(0, Math.min(100, (t.remainingPurse / t.totalPurse) * 100));
            const iconCount = t.squad?.filter((sp) => sp.isIcon || sp.player?.isIcon).length || 0;

            return (
              <div
                key={t.id}
                className="bg-[#121724] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all"
              >
                {/* Team Accent Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: t.primaryColor }}
                />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base text-white shadow-lg border border-white/20 shrink-0"
                        style={{ backgroundColor: t.primaryColor }}
                      >
                        {t.shortName || t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white leading-tight">{t.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            {t.shortName}
                          </span>
                          {iconCount > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                              {iconCount} Icon{iconCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditTeam(t)}
                          className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Edit team details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTeamToDelete(t)}
                          className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                          title={`Delete ${t.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Owner & Contact Details */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 space-y-1 text-xs">
                    {t.ownerName && (
                      <div className="text-slate-300 font-medium flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Owner:</span>
                        <span>{t.ownerName}</span>
                      </div>
                    )}
                    {t.phone && (
                      <div className="text-slate-400 text-[11px] font-mono flex items-center justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span>{t.phone}</span>
                      </div>
                    )}
                    {isAdmin && t.loginUsername && (
                      <div className="text-cyan-400 text-[11px] font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-400" /> Login:
                        </span>
                        <span className="bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-800/40">
                          {t.loginUsername}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Purse Tracker */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Remaining Purse</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatRupees(t.remainingPurse)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pursePercent}%`,
                          backgroundColor:
                            pursePercent > 50
                              ? '#10b981'
                              : pursePercent > 20
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Total: {formatRupees(t.totalPurse)}</span>
                      <span>{pursePercent.toFixed(0)}% Left</span>
                    </div>
                  </div>

                  {/* Squad Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <div className="flex items-baseline justify-between w-full">
                        <span className="text-slate-400 text-[11px]">Squad</span>
                        <span className="font-mono font-bold text-white">
                          {t.squad?.length || 0} / {t.maxSquadSize || 12}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <div className="flex items-baseline justify-between w-full">
                        <span className="text-slate-400 text-[11px]">Icons</span>
                        <span className="font-mono font-bold text-amber-400">
                          {iconCount} / 2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Squad Roster Preview */}
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Roster ({t.squad?.length || 0})
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleManageIcons(t.id)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>Manage Icons</span>
                        </button>
                      )}
                    </div>

                    {t.squad && t.squad.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {t.squad.map((sp: any) => {
                          const isIconPlayer = sp.isIcon || sp.player?.isIcon;
                          return (
                            <div
                              key={sp.id}
                              className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${
                                isIconPlayer
                                  ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-200'
                                  : 'bg-slate-900/40 text-slate-300'
                              }`}
                            >
                              <span className="truncate flex items-center gap-1">
                                {isIconPlayer && (
                                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 shrink-0" />
                                )}
                                {sp.player?.name}
                              </span>
                              <span className="font-mono text-amber-400 font-bold shrink-0 ml-1">
                                {formatRupees(sp.price)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600 italic py-1">No players signed yet.</div>
                    )}
                  </div>
                </div>

                {/* Admin Quick Action Button on Footer of Card */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleManageIcons(t.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Star className="w-3 h-3" />
                      <span>Assign Icon (₹2,500)</span>
                    </button>
                    <button
                      onClick={() => setTeamToDelete(t)}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      title={`Delete ${t.name}`}
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Team Form Modal (Create or Edit) */}
      <TeamFormModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          loadTeams();
        }}
        teamToEdit={teamToEdit}
      />

      {/* Admin Icon Player Modal */}
      <IconPlayerModal
        isOpen={isIconModalOpen}
        onClose={() => {
          setIsIconModalOpen(false);
          loadTeams();
        }}
        selectedTeamId={selectedTeamIdForIcons}
      />

      {/* Admin Franchise Credentials Table Modal */}
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
