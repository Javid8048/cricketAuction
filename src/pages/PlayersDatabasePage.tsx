import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  Globe,
  Award,
  Info,
  Trash2,
  Edit,
  Edit2,
  Star,
  MapPin,
  Users,
  User,
  Phone,
  Calendar,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  FileCheck,
  RotateCcw,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
  Gavel,
  UserCheck,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { Player, Team } from '../types';
import { formatRupees } from '../utils/currency';
import { getCustomOwnTeam } from '../utils/customTeams';
import { compressImageFile, formatBytes, CompressionResult } from '../utils/imageCompressor';
import { exportToCsv } from '../utils/csvExport';
import { PlayerProfileModal } from '../components/player/PlayerProfileModal';
import { PlayerEditModal } from '../components/player/PlayerEditModal';
import { Modal } from '../components/common/Modal';
import { ManualAssignPlayerModal } from '../components/admin/ManualAssignPlayerModal';
import { useAuthStore } from '../store/auth.store';
import { useAuctionStore } from '../store/auction.store';

interface PlayersDatabasePageProps {
  onNavigateToRegister?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const PlayersDatabasePage: React.FC<PlayersDatabasePageProps> = ({
  onNavigateToRegister,
  onSelectTab,
}) => {
  const { user } = useAuthStore();
  const { showToast } = useAuctionStore();
  const storePlayers = useAuctionStore((s) => s.state?.players);
  const [players, setPlayers] = useState<Player[]>(storePlayers || []);
  const [loading, setLoading] = useState(!storePlayers || storePlayers.length === 0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [belongingTeamFilter, setBelongingTeamFilter] = useState('ALL');
  const [soldToTeamFilter, setSoldToTeamFilter] = useState('ALL');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [assignModalPlayerId, setAssignModalPlayerId] = useState<string | null>(null);

  // Teams list for LOV selection
  const [teams, setTeams] = useState<Team[]>([]);

  // Edit Player Modal for Admin
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  // New Player Modal for Admin
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const initialNewPlayer = {
    name: '',
    country: 'India',
    dob: '',
    age: '22',
    place: '',
    phone: '',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    basePrice: 100,
    category: 'Local Talent',
    profileImage: '',
    belongingTeamName: '',
    teamId: '',
    matches: 0,
    runs: 0,
    battingAvg: 0,
    strikeRate: 0,
    wickets: 0,
    economy: 0,
    highestScore: 0,
  };
  const [newPlayer, setNewPlayer] = useState(initialNewPlayer);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCareerStats, setShowCareerStats] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'ADMIN';

  const loadPlayers = () => {
    setLoading(true);
    Promise.all([api.getPlayers(), api.getTeams()])
      .then(([playersData, teamsData]) => {
        setPlayers(playersData || []);
        setTeams(teamsData || []);
        if (Array.isArray(playersData)) {
          useAuctionStore.getState().setPlayers(playersData);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (storePlayers && storePlayers.length > 0) {
      setPlayers(storePlayers);
      setLoading(false);
    }
  }, [storePlayers]);

  const estimatedSNo = players.length > 0 ? Math.max(...players.map((p) => p.sNo || 0)) + 1 : 1;

  const handleDobChange = (dobValue: string) => {
    let calculatedAge = '';
    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age > 0 && age < 80) {
        calculatedAge = String(age);
      }
    }
    setNewPlayer((prev) => ({
      ...prev,
      dob: dobValue,
      age: calculatedAge || prev.age,
    }));
  };

  const processImageFile = async (file: File) => {
    setIsCompressing(true);
    setCreateError(null);
    try {
      const result = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
        format: 'image/jpeg',
      });
      setCompressionInfo(result);
      setNewPlayer((prev) => ({ ...prev, profileImage: result.dataUrl }));
    } catch (err: any) {
      setCreateError(err.message || 'Failed to process and compress photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setCompressionInfo(null);
    setNewPlayer((prev) => ({ ...prev, profileImage: '' }));
  };

  const filteredPlayers = players.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const sNoStr = String(p.sNo || '');
      const matchSNo = sNoStr === q || sNoStr.includes(q) || `sno ${sNoStr}`.includes(q) || `#${sNoStr}`.includes(q);
      const matchPlace = p.place ? p.place.toLowerCase().includes(q) : false;
      if (!matchName && !matchSNo && !matchPlace) return false;
    }
    if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (belongingTeamFilter !== 'ALL') {
      if (belongingTeamFilter === 'NONE') {
        if (p.belongingTeamId || p.belongingTeam) return false;
      } else {
        if (p.belongingTeamId !== belongingTeamFilter && p.belongingTeam?.id !== belongingTeamFilter) return false;
      }
    }
    if (soldToTeamFilter !== 'ALL') {
      if (soldToTeamFilter === 'NONE') {
        if (p.status === 'SOLD' || p.teamPlayer?.team) return false;
      } else {
        const soldTeamId = p.teamPlayer?.team?.id || p.teamPlayer?.teamId;
        if (p.status !== 'SOLD' || soldTeamId !== soldToTeamFilter) return false;
      }
    }
    return true;
  });

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) {
      setCreateError('Player Full Name is required.');
      return;
    }
    setIsSubmittingPlayer(true);
    setCreateError(null);
    try {
      const payload = {
        ...newPlayer,
        name: newPlayer.name.trim(),
        age: Number(newPlayer.age) || 22,
        basePrice: Number(newPlayer.basePrice) || 100,
        place: newPlayer.place.trim(),
        phone: newPlayer.phone.trim(),
        belongingTeamName: newPlayer.belongingTeamName ? newPlayer.belongingTeamName.trim() : undefined,
        teamId: newPlayer.teamId || undefined,
        isOverseas: newPlayer.country ? newPlayer.country.toLowerCase() !== 'india' : false,
        profileImage:
          newPlayer.profileImage ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      };
      const created = await api.createPlayer(payload);
      if (created) {
        setPlayers((prev) => [created, ...prev]);
        useAuctionStore.getState().setPlayers([created, ...players]);
      }
      setIsCreateModalOpen(false);
      setNewPlayer(initialNewPlayer);
      setCompressionInfo(null);
      showToast('Player registered successfully!', 'success');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create player.');
    } finally {
      setIsSubmittingPlayer(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!isAdmin) {
      alert('Only Admin can delete players.');
      return;
    }
    if (!window.confirm('Delete this player permanently? Only Admin has permission.')) return;

    // Instant optimistic update
    const previousPlayers = [...players];
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    useAuctionStore.getState().setPlayers(players.filter((p) => p.id !== id));
    showToast('Player removed.', 'info');

    try {
      await api.deletePlayer(id);
      loadPlayers();
    } catch (err: any) {
      // Revert if delete failed
      setPlayers(previousPlayers);
      useAuctionStore.getState().setPlayers(previousPlayers);
      alert(err.message || 'Failed to remove player.');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'S.No',
      'Name',
      'Role',
      'Category',
      'Country',
      'Age',
      'Place',
      'Phone',
      'Base Price (Rs)',
      'Status',
      'Belongs To Team',
      'Drafted Team',
      'Final Price (Rs)',
    ];
    const rows = filteredPlayers.map((p) => [
      p.sNo || '',
      p.name,
      p.role,
      p.category || '',
      p.country,
      p.age,
      p.place || '',
      p.phone || '',
      p.basePrice,
      p.status,
      p.belongingTeamName || p.belongingTeam?.name || '',
      p.teamPlayer?.team?.name || '',
      p.currentPrice || '',
    ]);
    exportToCsv('cricket_players_registry.csv', headers, rows);
    showToast('Exported players registry to CSV', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white font-display">
            PLAYER REGISTRY ({players.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete registered cricketer pool available for the auction player draft.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            title="Export filtered players list to CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
                  title="Open Public Player Registration Form"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Public Form</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Player</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121724] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Player Name, S.No (e.g. 1) or Place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="Batter">Batters</option>
            <option value="Bowler">Bowlers</option>
            <option value="All-Rounder">All-Rounders</option>
            <option value="Wicketkeeper">Wicketkeepers</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Marquee">Marquee</option>
            <option value="Capped">Capped</option>
            <option value="Uncapped">Uncapped</option>
            <option value="Emerging">Emerging</option>
            <option value="Local Talent">Local Talent</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="IN_AUCTION">In Auction</option>
            <option value="SOLD">Sold</option>
            <option value="UNSOLD">Unsold</option>
          </select>

          {/* Belonging Team Filter */}
          <select
            value={belongingTeamFilter}
            onChange={(e) => setBelongingTeamFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            title="Filter by Player Belongs To (Home Team Affiliation)"
          >
            <option value="ALL">🏠 Belongs to: All Teams</option>
            <option value="NONE">Independent / Free Agents</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                🏠 Belongs to: {t.name} ({t.shortName})
              </option>
            ))}
          </select>

          {/* Sold To Team Filter */}
          <select
            value={soldToTeamFilter}
            onChange={(e) => setSoldToTeamFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            title="Filter by Player Sold To (Tournament Drafted Team)"
          >
            <option value="ALL">🏆 Sold to: All Teams</option>
            <option value="NONE">Not Sold / In Open Pool</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                🏆 Sold to: {t.name} ({t.shortName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Players Catalog Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading players catalog...</div>
      ) : players.length === 0 ? (
        <div className="bg-[#121724] border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Cricketers Registered Yet</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Players can register themselves directly using the public registration link, or the Commissioner can add players manually.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#register"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Open Public Player Form
            </a>
            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Player Manually
              </button>
            )}
          </div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 italic">No players matched your search or filter criteria.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((p) => (
            <div
              key={p.id}
              className="bg-[#121724] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
                      S.No #{p.sNo || '-'}
                    </span>
                    {p.isIcon && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold flex items-center gap-0.5 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-yellow-400" />
                        ICON
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      p.status === 'SOLD'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : p.status === 'UNSOLD'
                        ? 'bg-rose-500/20 text-rose-300'
                        : p.status === 'IN_AUCTION'
                        ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={p.profileImage}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-white text-sm font-display truncate">
                      {p.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{p.country}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">{p.role}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                      Age {p.age} {p.place && `• ${p.place}`}
                    </div>
                    {/* Team Affiliation and Squad Status Badges */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(() => {
                        const pOwnTeamName = getCustomOwnTeam(p.id) || p.belongingTeamName || p.belongingTeam?.name || (p.belongingTeamId ? teams.find(t => t.id === p.belongingTeamId)?.name : null);
                        const pOwnTeam = p.belongingTeam || (p.belongingTeamId ? teams.find(t => t.id === p.belongingTeamId) : null);
                        return pOwnTeamName ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border truncate max-w-full"
                            style={{
                              borderColor: pOwnTeam?.primaryColor ? `${pOwnTeam.primaryColor}55` : 'rgba(245, 158, 11, 0.4)',
                              backgroundColor: pOwnTeam?.primaryColor ? `${pOwnTeam.primaryColor}20` : 'rgba(245, 158, 11, 0.1)',
                              color: pOwnTeam?.primaryColor || '#fbbf24',
                            }}
                            title={`Own Team: ${pOwnTeamName} (Can be bid on and played by any team in auction)`}
                          >
                            <Shield className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">Own Team: {pOwnTeamName}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-medium"
                            title="Independent talent / Free Agent (Can be bid on by any team)"
                          >
                            <Shield className="w-2.5 h-2.5 text-slate-600" />
                            <span>Own Team: Open Pool</span>
                          </span>
                        );
                      })()}

                      {p.status === 'SOLD' && p.teamPlayer?.team ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border truncate max-w-full"
                          style={{
                            borderColor: `${p.teamPlayer.team.primaryColor}66`,
                            backgroundColor: `${p.teamPlayer.team.primaryColor}30`,
                            color: p.teamPlayer.team.primaryColor,
                          }}
                          title={`Drafted & Sold to ${p.teamPlayer.team.name} for ${formatRupees(p.teamPlayer.price || p.currentPrice || 0)}`}
                        >
                          <Award className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Sold to: {p.teamPlayer.team.name}</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 font-medium"
                          title="Not sold yet. In open auction pool."
                        >
                          <span>Sold to: Not Sold (In Pool)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">BASE PRICE</span>
                    <div className="font-mono font-bold text-amber-400">{formatRupees(p.basePrice)}</div>
                  </div>

                  {p.currentPrice && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-mono">SOLD FOR</span>
                      <div className="font-mono font-bold text-emerald-400">
                        {formatRupees(p.currentPrice)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(p.id)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dossier</span>
                </button>

                {isAdmin && p.status === 'UNSOLD' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Put ${p.name} on the auction block and start BID immediately?`)) return;
                      try {
                        await api.selectPlayer(p.id);
                        showToast(`⚡ ${p.name} is now LIVE on the auction block!`, 'success');
                        onSelectTab?.('arena');
                      } catch (err: any) {
                        showToast(err.message || 'Failed to start bidding', 'error');
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 transition-all active:scale-95 shrink-0"
                    title="Put unsold player on auction block and start bidding"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Start BID</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerToEdit(p);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    title="Edit player dossier & team"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setAssignModalPlayerId(p.id)}
                    className="py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Sold To: Manually assign player to team"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sold To</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeletePlayer(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Detail Modal */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />

      {/* Edit Player Modal for Admin */}
      <PlayerEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setPlayerToEdit(null);
        }}
        player={playerToEdit}
        teams={teams}
        onSuccess={(updated?: any) => {
          if (updated && updated.id) {
            setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            useAuctionStore.getState().setPlayers(players.map((p) => (p.id === updated.id ? updated : p)));
          } else {
            loadPlayers();
          }
          showToast('Player updated successfully!', 'success');
        }}
      />

      {/* Admin Add Player Modal (Matches Public Player Registration) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewPlayer(initialNewPlayer);
          setCompressionInfo(null);
          setCreateError(null);
        }}
        title="Register New Cricketer"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePlayer} className="space-y-4 text-xs">
          {/* Header Subtext with Next S.No Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <p className="text-slate-400 text-[11px]">
              Add a new player to the registry catalog. Starting Bid: <strong className="text-amber-400">₹100</strong>.
            </p>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold border border-amber-500/30 shrink-0">
              Assigned S.No: #{estimatedSNo}
            </span>
          </div>

          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{createError}</span>
            </div>
          )}

          {/* Photo Upload with Mobile Camera, Gallery, and Files Selection + Canvas Compression */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white">
                Player Photo / Avatar
              </label>
              {compressionInfo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30">
                  <FileCheck className="w-3 h-3 text-emerald-400" />
                  Optimized: {formatBytes(compressionInfo.compressedSizeBytes)}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Preview Avatar */}
              <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group shadow-inner">
                {newPlayer.profileImage ? (
                  <img
                    src={newPlayer.profileImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[9px] text-slate-500 block">No photo</span>
                  </div>
                )}

                {isCompressing && (
                  <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center text-[10px] text-amber-400 font-mono font-bold">
                    Optimizing...
                  </div>
                )}
              </div>

              {/* Upload Actions */}
              <div className="flex-1 w-full space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-semibold"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gallery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-semibold"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Files</span>
                  </button>
                </div>

                {/* Hidden Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <p className="text-[10px] text-slate-400 leading-tight">
                  Mobile camera or image file automatically auto-compressed to tiny web payload (under ~100KB).
                </p>

                {newPlayer.profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 mt-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <input
                required
                type="text"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Virat Kohli"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Country</label>
              <input
                required
                type="text"
                value={newPlayer.country}
                onChange={(e) => setNewPlayer({ ...newPlayer, country: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="e.g. India"
              />
            </div>
          </div>

          {/* DOB & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                value={newPlayer.dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Age</label>
              <input
                type="number"
                min="12"
                max="80"
                value={newPlayer.age}
                onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                placeholder="22"
              />
            </div>
          </div>

          {/* Place and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Place / City / Origin</span>
              </label>
              <input
                type="text"
                value={newPlayer.place}
                onChange={(e) => setNewPlayer({ ...newPlayer, place: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Mumbai, Chennai"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Contact Phone</span>
              </label>
              <input
                type="tel"
                value={newPlayer.phone}
                onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          {/* Role and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Role</label>
              <select
                value={newPlayer.role}
                onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category</label>
              <select
                value={newPlayer.category}
                onChange={(e) => setNewPlayer({ ...newPlayer, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Local Talent">Local Talent</option>
                <option value="Marquee">Marquee</option>
                <option value="Capped">Capped</option>
                <option value="Uncapped">Uncapped</option>
                <option value="Emerging">Emerging</option>
              </select>
            </div>
          </div>

          {/* Base Price presets */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Base Price (₹) - Starting Bid
            </label>
            <input
              type="number"
              step="50"
              min="100"
              value={newPlayer.basePrice}
              onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[100, 200, 300, 500, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNewPlayer({ ...newPlayer, basePrice: preset })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  newPlayer.basePrice === preset
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {formatRupees(preset)}
              </button>
            ))}
          </div>

          {/* Batting & Bowling Styles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Batting Style</label>
              <select
                value={newPlayer.battingStyle}
                onChange={(e) => setNewPlayer({ ...newPlayer, battingStyle: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Right-hand bat">Right-hand bat</option>
                <option value="Left-hand bat">Left-hand bat</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Bowling Style</label>
              <select
                value={newPlayer.bowlingStyle}
                onChange={(e) => setNewPlayer({ ...newPlayer, bowlingStyle: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Right-arm medium">Right-arm medium</option>
                <option value="Right-arm fast">Right-arm fast</option>
                <option value="Right-arm spin / off-break">Right-arm spin / off-break</option>
                <option value="Left-arm medium">Left-arm medium</option>
                <option value="Left-arm fast">Left-arm fast</option>
                <option value="Left-arm orthodox spin">Left-arm orthodox spin</option>
                <option value="None">None / Pure Batter</option>
              </select>
            </div>
          </div>

          {/* ASSIGNED TEAM (MANUAL INPUT) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Belongs to Team / Club Name (Manual)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Enter manually
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={newPlayer.belongingTeamName}
                onChange={(e) => setNewPlayer({ ...newPlayer, belongingTeamName: e.target.value })}
                placeholder="Type team or club name (e.g. Chennai Super Kings, Local Club XI, etc.)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {newPlayer.belongingTeamName ? (
                <span className="text-amber-300 font-medium">
                  Player belongs to <strong>{newPlayer.belongingTeamName}</strong>. All players are shuffled into the pool so that even though they belong to this club, they can be bid on and played by any other team!
                </span>
              ) : (
                <span>Independent / New player (leave empty if free agent). Shuffled into the pool and can be bid on and played by any team.</span>
              )}
            </p>
          </div>

          {/* Optional Career Stats Accordion */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCareerStats(!showCareerStats)}
              className="w-full px-3 py-2 bg-slate-950/60 hover:bg-slate-900 flex items-center justify-between text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              <span>Optional Career Statistics</span>
              {showCareerStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showCareerStats && (
              <div className="p-3 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Matches</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlayer.matches}
                    onChange={(e) => setNewPlayer({ ...newPlayer, matches: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Runs</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlayer.runs}
                    onChange={(e) => setNewPlayer({ ...newPlayer, runs: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Highest Score</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlayer.highestScore}
                    onChange={(e) => setNewPlayer({ ...newPlayer, highestScore: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Wickets</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlayer.wickets}
                    onChange={(e) => setNewPlayer({ ...newPlayer, wickets: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmittingPlayer}
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewPlayer(initialNewPlayer);
                setCompressionInfo(null);
                setCreateError(null);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPlayer || isCompressing}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmittingPlayer ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Cricketer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Manual Assign Player to Team Modal */}
      <ManualAssignPlayerModal
        isOpen={Boolean(assignModalPlayerId)}
        onClose={() => setAssignModalPlayerId(null)}
        defaultPlayerId={assignModalPlayerId}
        player={players.find((p) => p.id === assignModalPlayerId) || null}
        onSuccess={loadPlayers}
      />
    </div>
  );
};
