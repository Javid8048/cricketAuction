import React, { useState, useEffect } from 'react';
import { Shield, Key, Eye, EyeOff, Copy, Check, Edit2, X, Search, RefreshCw, UserCheck, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuctionStore } from '../../store/auction.store';

interface FranchiseCredential {
  id: string;
  name: string;
  shortName: string;
  ownerName?: string | null;
  phone?: string | null;
  primaryColor: string;
  loginUsername?: string | null;
  loginPassword?: string | null;
  totalPurse: number;
  remainingPurse: number;
}

interface FranchiseCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTeam?: () => void;
}

export const FranchiseCredentialsModal: React.FC<FranchiseCredentialsModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateTeam,
}) => {
  const { showToast, deleteTeam } = useAuctionStore();
  const [credentials, setCredentials] = useState<FranchiseCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick edit state
  const [editingTeam, setEditingTeam] = useState<FranchiseCredential | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFranchiseCredentials();
      setCredentials(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load team credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCredentials();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePasswordVisibility = (teamId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleStartEdit = (team: FranchiseCredential) => {
    setEditingTeam(team);
    setEditUsername(team.loginUsername || '');
    setEditPassword(team.loginPassword || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTeam) return;
    if (!editUsername.trim() || !editPassword.trim()) {
      showToast('Username and password cannot be empty.', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      await api.updateFranchiseCredentials(editingTeam.id, {
        loginUsername: editUsername.trim(),
        loginPassword: editPassword.trim(),
      });
      showToast(`Credentials updated for ${editingTeam.name}!`, 'success');
      setEditingTeam(null);
      await fetchCredentials();
    } catch (err: any) {
      showToast(err.message || 'Failed to update credentials.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTeam = async (team: FranchiseCredential) => {
    if (!window.confirm(`Are you sure you want to delete ${team.name}? Any signed players will be returned to the draft pool.`)) return;
    try {
      await deleteTeam(team.id);
      await fetchCredentials();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete team.', 'error');
    }
  };

  const filteredCredentials = credentials.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.shortName.toLowerCase().includes(term) ||
      (t.loginUsername && t.loginUsername.toLowerCase().includes(term)) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Team Login Credentials Table
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                  {credentials.length} Teams
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Admin master view of team portal credentials. View, copy, or edit logins anytime.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by team name, short name, or username..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCredentials}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Refresh Credentials"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onOpenCreateTeam && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateTeam();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                Add Team
              </button>
            )}
          </div>
        </div>

        {/* Credentials Table / List */}
        <div className="overflow-y-auto flex-1 rounded-xl border border-slate-800 bg-slate-950/50">
          {filteredCredentials.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {credentials.length === 0
                ? 'No teams found. Click "Add Team" to create your first team with custom login credentials.'
                : 'No teams match your search query.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold sticky top-0">
                  <tr>
                    <th className="py-3 px-3">Team</th>
                    <th className="py-3 px-3">Owner & Phone</th>
                    <th className="py-3 px-3">Username</th>
                    <th className="py-3 px-3">Password</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCredentials.map((team) => {
                    const isPwVisible = visiblePasswords[team.id] || false;
                    return (
                      <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Franchise name & color badge */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-[11px] text-white shadow-sm shrink-0"
                              style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                            >
                              {team.shortName || team.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white">{team.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{team.shortName}</div>
                            </div>
                          </div>
                        </td>

                        {/* Owner & Phone */}
                        <td className="py-3 px-3">
                          <div className="text-slate-300 font-medium">{team.ownerName || '—'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{team.phone || '—'}</div>
                        </td>

                        {/* Username */}
                        <td className="py-3 px-3">
                          {team.loginUsername ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded text-[11px]">
                                {team.loginUsername}
                              </span>
                              <button
                                onClick={() => handleCopy(team.loginUsername!, `u-${team.id}`)}
                                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                                title="Copy Username"
                              >
                                {copiedKey === `u-${team.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Not set</span>
                          )}
                        </td>

                        {/* Password */}
                        <td className="py-3 px-3">
                          {team.loginPassword ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded text-[11px] min-w-[70px]">
                                {isPwVisible ? team.loginPassword : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(team.id)}
                                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                                title={isPwVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isPwVisible ? (
                                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(team.loginPassword!, `p-${team.id}`)}
                                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                                title="Copy Password"
                              >
                                {copiedKey === `p-${team.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Not set</span>
                          )}
                        </td>

                        {/* Action: Edit & Delete */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(team)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                              title="Edit Credentials"
                            >
                              <Edit2 className="w-3 h-3 text-amber-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title={`Delete ${team.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Edit Sub-Modal */}
        {editingTeam && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Edit Login: {editingTeam.name}</h4>
                </div>
                <button
                  onClick={() => setEditingTeam(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Team Login Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. csk_admin"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Team Login Password
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="e.g. CskPass@2026"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    The team owner will use this username and password to log in.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 shrink-0">
          <p className="text-[11px] text-slate-500">
            💡 Share these credentials directly with each team owner for private team portal access.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
