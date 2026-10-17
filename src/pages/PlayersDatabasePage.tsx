import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, Globe, Award, Info, Trash2, Edit, Star, MapPin, Users, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { Player } from '../types';
import { formatRupees } from '../utils/currency';
import { PlayerProfileModal } from '../components/player/PlayerProfileModal';
import { Modal } from '../components/common/Modal';
import { ManualAssignPlayerModal } from '../components/admin/ManualAssignPlayerModal';
import { useAuthStore } from '../store/auth.store';
import { useAuctionStore } from '../store/auction.store';

interface PlayersDatabasePageProps {
  onNavigateToRegister?: () => void;
}

export const PlayersDatabasePage: React.FC<PlayersDatabasePageProps> = ({ onNavigateToRegister }) => {
  const { user } = useAuthStore();
  const storePlayers = useAuctionStore((s) => s.state?.players);
  const [players, setPlayers] = useState<Player[]>(storePlayers || []);
  const [loading, setLoading] = useState(!storePlayers || storePlayers.length === 0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [assignModalPlayerId, setAssignModalPlayerId] = useState<string | null>(null);

  // New Player Modal for Admin
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    country: 'India',
    age: 24,
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    basePrice: 100,
    category: 'Local',
    matches: 10,
    runs: 250,
    battingAvg: 25,
    strikeRate: 125,
    wickets: 0,
    economy: 0,
    highestScore: 54,
  });

  const isAdmin = user?.role === 'ADMIN';

  const loadPlayers = () => {
    setLoading(true);
    api
      .getPlayers()
      .then((data) => {
        setPlayers(data);
        useAuctionStore.getState().refreshPlayers();
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
    return true;
  });

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlayer(newPlayer);
      setIsCreateModalOpen(false);
      loadPlayers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!isAdmin) {
      alert('Only Admin can delete players.');
      return;
    }
    if (!window.confirm('Delete this player permanently? Only Admin has permission.')) return;
    try {
      await api.deletePlayer(id);
      loadPlayers();
      useAuctionStore.getState().refreshPlayers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header and Admin Add Player */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            PLAYER REGISTRY ({players.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete registered cricketer pool available for the auction player draft.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (onNavigateToRegister) {
                onNavigateToRegister();
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Player</span>
          </button>
        )}
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
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-white text-sm font-display truncate">
                      {p.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{p.country}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">{p.role}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Age {p.age} {p.place && `• ${p.place}`}
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
                  onClick={() => setSelectedPlayerId(p.id)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dossier</span>
                </button>

                {isAdmin && (
                  <button
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

      {/* Admin Add Player Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Cricketer"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreatePlayer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
              <input
                required
                type="text"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                placeholder="e.g. Tarun Gill"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Country</label>
              <input
                required
                type="text"
                value={newPlayer.country}
                onChange={(e) => setNewPlayer({ ...newPlayer, country: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                placeholder="e.g. India, Australia"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Age</label>
              <input
                type="number"
                value={newPlayer.age}
                onChange={(e) => setNewPlayer({ ...newPlayer, age: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Role</label>
              <select
                value={newPlayer.role}
                onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="Marquee">Marquee</option>
                <option value="Capped">Capped</option>
                <option value="Uncapped">Uncapped</option>
                <option value="Emerging">Emerging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Base Price (₹)</label>
              <input
                type="number"
                step="1000000"
                value={newPlayer.basePrice}
                onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Batting Style</label>
              <input
                type="text"
                value={newPlayer.battingStyle}
                onChange={(e) => setNewPlayer({ ...newPlayer, battingStyle: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Add to Catalog
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Manual Assign Player to Team Modal */}
      <ManualAssignPlayerModal
        isOpen={Boolean(assignModalPlayerId)}
        onClose={() => setAssignModalPlayerId(null)}
        defaultPlayerId={assignModalPlayerId}
        onSuccess={loadPlayers}
      />
    </div>
  );
};
