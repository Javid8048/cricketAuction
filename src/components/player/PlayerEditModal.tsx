import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Globe,
  Calendar,
  MapPin,
  Phone,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  FileCheck,
  RotateCcw,
  AlertCircle,
  Shield,
  Save,
  ChevronDown,
  ChevronUp,
  Trophy,
  IndianRupee,
} from 'lucide-react';
import { Player, Team } from '../../types';
import { api } from '../../services/api';
import { formatRupees } from '../../utils/currency';
import { compressImageFile, formatBytes, CompressionResult } from '../../utils/imageCompressor';
import { Modal } from '../common/Modal';

interface PlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  teams: Team[];
  onSuccess: (updatedPlayer?: any) => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  isOpen,
  onClose,
  player,
  teams,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    country: 'India',
    dob: '',
    age: '24',
    place: '',
    phone: '',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    basePrice: 100,
    category: 'Local Talent',
    profileImage: '',
    belongingTeamName: '',
    belongingTeamId: '',
    soldToTeamId: '',
    soldPrice: 100,
    matches: 0,
    runs: 0,
    battingAvg: 0,
    strikeRate: 0,
    wickets: 0,
    economy: 0,
    highestScore: 0,
  });

  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCareerStats, setShowCareerStats] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player && isOpen) {
      const existingSoldPrice = player.teamPlayer?.price || player.currentPrice || player.basePrice || 200;
      setFormData({
        name: player.name || '',
        country: player.country || 'India',
        dob: player.dob || '',
        age: String(player.age || 24),
        place: player.place || '',
        phone: player.phone || '',
        role: player.role || 'All-Rounder',
        battingStyle: player.battingStyle || 'Right-hand bat',
        bowlingStyle: player.bowlingStyle || 'Right-arm medium',
        basePrice: player.basePrice || 100,
        category: player.category || 'Local Talent',
        profileImage: player.profileImage || '',
        belongingTeamName: player.belongingTeamName || player.belongingTeam?.name || '',
        belongingTeamId: player.belongingTeamId || player.belongingTeam?.id || '',
        soldToTeamId: (player.status === 'SOLD' && (player.teamPlayer?.teamId || player.teamPlayer?.team?.id)) ? (player.teamPlayer?.teamId || player.teamPlayer?.team?.id || '') : '',
        soldPrice: existingSoldPrice >= 100 && existingSoldPrice <= 2500 ? existingSoldPrice : 100,
        matches: player.matches || 0,
        runs: player.runs || 0,
        battingAvg: player.battingAvg || 0,
        strikeRate: player.strikeRate || 0,
        wickets: player.wickets || 0,
        economy: player.economy || 0,
        highestScore: player.highestScore || 0,
      });
      setCompressionInfo(null);
      setErrorMsg(null);
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

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
    setFormData((prev) => ({
      ...prev,
      dob: dobValue,
      age: calculatedAge || prev.age,
    }));
  };

  const processImageFile = async (file: File) => {
    setIsCompressing(true);
    setErrorMsg(null);
    try {
      const result = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
        format: 'image/jpeg',
      });
      setCompressionInfo(result);
      setFormData((prev) => ({ ...prev, profileImage: result.dataUrl }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process and compress photo.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Player Full Name is required.');
      return;
    }

    if (formData.soldToTeamId) {
      const price = Number(formData.soldPrice);
      if (isNaN(price) || price < 100 || price > 2500) {
        setErrorMsg('Final Transfer / Sold Price must be between ₹100 and ₹2,500.');
        return;
      }

      const targetTeam = teams.find((t) => t.id === formData.soldToTeamId);
      const existingTeamPlayer = player.teamPlayer;
      const isSameTeam = Boolean(
        existingTeamPlayer &&
        (existingTeamPlayer.teamId === formData.soldToTeamId || existingTeamPlayer.team?.id === formData.soldToTeamId)
      );
      const currentPriceDeducted = isSameTeam && existingTeamPlayer ? (existingTeamPlayer.price || 0) : 0;
      const effectiveRemaining = (targetTeam?.remainingPurse || 0) + currentPriceDeducted;

      if (targetTeam && effectiveRemaining < price) {
        setErrorMsg(
          `Insufficient purse! ${targetTeam.name} has only ${formatRupees(targetTeam.remainingPurse)} remaining.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let matchedTeamId: string | null = null;
      if (formData.belongingTeamName && formData.belongingTeamName.trim()) {
        const trimmed = formData.belongingTeamName.trim().toLowerCase();
        const found = teams.find(
          (t) => t.name.toLowerCase() === trimmed || t.shortName.toLowerCase() === trimmed
        );
        if (found) {
          matchedTeamId = found.id;
        }
      }

      const effectiveBelongingTeamId = matchedTeamId || (formData.belongingTeamId && formData.belongingTeamId !== 'NONE' ? formData.belongingTeamId : 'NONE');

      const payload: any = {
        name: formData.name.trim(),
        country: formData.country || 'India',
        dob: formData.dob || null,
        age: Number(formData.age) || 24,
        place: formData.place ? formData.place.trim() : null,
        phone: formData.phone ? formData.phone.trim() : null,
        role: formData.role || 'All-Rounder',
        battingStyle: formData.battingStyle || 'Right-hand bat',
        bowlingStyle: formData.bowlingStyle || 'Right-arm medium',
        basePrice: Number(formData.basePrice) > 0 ? Number(formData.basePrice) : 100,
        category: formData.category || 'Local Talent',
        profileImage: formData.profileImage || player.profileImage,
        belongingTeamName: formData.belongingTeamName && formData.belongingTeamName.trim() ? formData.belongingTeamName.trim() : null,
        belongingTeamId: effectiveBelongingTeamId,
        soldToTeamId: formData.soldToTeamId ? formData.soldToTeamId : 'NONE',
        soldPrice: formData.soldToTeamId ? Number(formData.soldPrice) : null,
        matches: Number(formData.matches) || 0,
        runs: Number(formData.runs) || 0,
        battingAvg: Number(formData.battingAvg) || 0,
        strikeRate: Number(formData.strikeRate) || 0,
        wickets: Number(formData.wickets) || 0,
        economy: Number(formData.economy) || 0,
        highestScore: Number(formData.highestScore) || 0,
      };

      let updated;
      try {
        updated = await api.updatePlayer(player.id, payload);
      } catch (err: any) {
        // Fallback retry if deployed backend rejects belongingTeamName as unknown argument
        if (err.message && (err.message.includes('belongingTeamName') || err.message.includes('Unknown argument'))) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.belongingTeamName;
          updated = await api.updatePlayer(player.id, fallbackPayload);
        } else {
          throw err;
        }
      }

      const finalPlayer = {
        ...player,
        ...updated,
        belongingTeamName: formData.belongingTeamName ? formData.belongingTeamName.trim() : null,
      };

      onSuccess(finalPlayer);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update cricketer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Cricketer Dossier" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Header S.No Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <p className="text-slate-400 text-[11px]">
            Update player details, career statistics, or team assignment.
          </p>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold border border-amber-500/30 shrink-0">
            S.No #{player.sNo}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Photo Upload with Mobile Camera, Gallery, and Files Selection */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-white">Player Photo / Avatar</label>
            {compressionInfo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30">
                <FileCheck className="w-3 h-3 text-emerald-400" />
                Optimized: {formatBytes(compressionInfo.compressedSizeBytes)}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group shadow-inner">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-500 block">No photo</span>
                </div>
              )}

              {isCompressing && (
                <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center text-[10px] text-amber-400 font-mono font-bold">
                  Optimizing...
                </div>
              )}
            </div>

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

              {formData.profileImage && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    {compressionInfo
                      ? `${formatBytes(compressionInfo.originalSizeBytes)} ➔ ${formatBytes(
                          compressionInfo.compressedSizeBytes
                        )}`
                      : 'Photo attached'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompressionInfo(null);
                      setFormData((prev) => ({ ...prev, profileImage: '' }));
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Name & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Mohammed Farooq"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Country</label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                required
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                placeholder="e.g. India"
              />
            </div>
          </div>
        </div>

        {/* DOB & Age */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Date of Birth</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Age (Years) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="12"
              max="65"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              placeholder="24"
            />
          </div>
        </div>

        {/* Place & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Native Place / City <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Chennai, Madurai"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Phone / WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Role, Category & Base Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All-Rounder">All-Rounder</option>
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="Wicketkeeper">Wicketkeeper</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Local Talent">Local Talent</option>
              <option value="Icon Player">Icon Player</option>
              <option value="Capped">Capped</option>
              <option value="Emerging">Emerging</option>
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Starting Base Price</label>
            <input
              type="number"
              step="50"
              min="50"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Base Price Quick Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
          {[100, 200, 500, 1000, 2500].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setFormData({ ...formData, basePrice: preset })}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                formData.basePrice === preset
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
              value={formData.battingStyle}
              onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Right-hand bat">Right-hand bat</option>
              <option value="Left-hand bat">Left-hand bat</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Bowling Style</label>
            <select
              value={formData.bowlingStyle}
              onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
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

        {/* OPTION 1: PLAYER OWN TEAM (HOME TEAM / CLUB AFFILIATION) */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Player Own Team (Home Club / Team Name)</span>
            </span>
            <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Open to Any Team
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="registered-teams-list"
              value={formData.belongingTeamName}
              onChange={(e) => setFormData({ ...formData, belongingTeamName: e.target.value })}
              placeholder="e.g. Chennai Super Kings, Local Club XI, Independent, etc."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <datalist id="registered-teams-list">
              {teams.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {formData.belongingTeamName ? (
              <span className="text-amber-300 font-medium">
                🛡️ Own Team: <strong>{formData.belongingTeamName}</strong>.
                <span className="text-slate-400 block mt-0.5">
                  <em>Note: This is an auction tournament, hence this player is in the open draft pool and can be bid on and played by ANY team!</em>
                </span>
              </span>
            ) : (
              <span className="text-slate-400">
                🌐 Independent talent (Open Pool). Placed in open pool and can be bid on by any team.
              </span>
            )}
          </p>
        </div>

        {/* OPTION 2: PLAYER SOLD TO (TOURNAMENT DRAFTED TEAM & SQUAD STATUS) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-950/80 border border-emerald-500/30 space-y-3">
          <label className="block text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Option 2: Player Sold To (Tournament Drafted Team)</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              formData.soldToTeamId
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {formData.soldToTeamId ? 'SOLD & DRAFTED' : 'UNASSIGNED / IN POOL'}
            </span>
          </label>

          <div className="relative">
            <select
              value={formData.soldToTeamId}
              onChange={(e) => setFormData({ ...formData, soldToTeamId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Not Sold / In Open Pool (Upcoming in Auction) --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.shortName}) • Purse: {formatRupees(t.remainingPurse)}
                </option>
              ))}
            </select>
          </div>

          {formData.soldToTeamId ? (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Final Transfer / Sold Price (₹)</span>
                </label>
                <span className="text-[10px] text-amber-300 font-mono">
                  Price: ₹100 to ₹2,500
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="100"
                  max="2500"
                  step="50"
                  value={formData.soldPrice}
                  onChange={(e) => setFormData({ ...formData, soldPrice: Number(e.target.value) })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 500"
                />

                <div className="flex items-center gap-1">
                  {[100, 200, 500, 1000, 2000, 2500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, soldPrice: preset })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        Number(formData.soldPrice) === preset
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {formatRupees(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const targetTeam = teams.find((t) => t.id === formData.soldToTeamId);
                const isSameTeam = Boolean(
                  player.teamPlayer &&
                  (player.teamPlayer.teamId === formData.soldToTeamId || player.teamPlayer.team?.id === formData.soldToTeamId)
                );
                const refund = isSameTeam && player.teamPlayer ? (player.teamPlayer.price || 0) : 0;
                const effectivePurse = (targetTeam?.remainingPurse || 0) + refund;
                const remAfter = effectivePurse - (Number(formData.soldPrice) || 0);
                return (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span>
                      Team: <strong className="text-white">{targetTeam?.name}</strong>
                    </span>
                    <span className={remAfter < 0 ? 'text-rose-400 font-bold' : 'text-emerald-300 font-mono'}>
                      Purse after draft: {formatRupees(remAfter)}
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Player is not drafted to any squad yet. In the auction arena, they will remain in the UPCOMING queue.
            </p>
          )}
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
                  value={formData.matches}
                  onChange={(e) => setFormData({ ...formData, matches: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Runs</label>
                <input
                  type="number"
                  min="0"
                  value={formData.runs}
                  onChange={(e) => setFormData({ ...formData, runs: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Highest Score</label>
                <input
                  type="number"
                  min="0"
                  value={formData.highestScore}
                  onChange={(e) => setFormData({ ...formData, highestScore: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Wickets</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wickets}
                  onChange={(e) => setFormData({ ...formData, wickets: Number(e.target.value) })}
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
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
