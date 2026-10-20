import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { api } from '../../services/api';
import { Team } from '../../types';
import { useAuctionStore } from '../../store/auction.store';
import { formatRupees } from '../../utils/currency';
import { compressImageFile, formatBytes, CompressionResult } from '../../utils/imageCompressor';

interface PlayerRegisterPageProps {
  onBackToArena: () => void;
  onOpenLogin?: () => void;
}

export const PlayerRegisterPage: React.FC<PlayerRegisterPageProps> = ({ onBackToArena, onOpenLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    age: '',
    place: '',
    phone: '',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    basePrice: 100,
    profileImage: '',
    belongingTeamName: '',
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPlayer, setRegisteredPlayer] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [estimatedSNo, setEstimatedSNo] = useState<number>(1);

  // Hidden file inputs for direct trigger
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current player count to show next S.No and fetch teams for LOV
  useEffect(() => {
    async function initData() {
      try {
        const [players, teamsData] = await Promise.all([
          api.getPlayers(),
          api.getTeams().catch(() => []),
        ]);
        if (Array.isArray(teamsData)) {
          setTeams(teamsData);
        }
        if (Array.isArray(players) && players.length > 0) {
          const maxSNo = Math.max(...players.map((p) => p.sNo || 0));
          setEstimatedSNo(maxSNo + 1);
        } else {
          setEstimatedSNo(1);
        }
      } catch (e) {
        setEstimatedSNo(1);
      }
    }
    initData();
  }, []);

  // Form Validation
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = 'Full Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (formData.dob) {
    const birthDate = new Date(formData.dob);
    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      errors.dob = 'Please select a valid past date';
    }
  }

  if (!formData.age) {
    errors.age = 'Age is required';
  } else {
    const ageNum = Number(formData.age);
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 65) {
      errors.age = 'Age must be between 12 and 65';
    }
  }

  if (!formData.place.trim()) {
    errors.place = 'Place / Location is required';
  } else if (formData.place.trim().length < 2) {
    errors.place = 'Place must be at least 2 characters';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Auto-calculate age from DOB
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
    setTouched((prev) => ({ ...prev, dob: true, age: true }));
  };

  // Image File Processor with Canvas-based Compression
  const processImageFile = async (file: File) => {
    setIsCompressing(true);
    setApiError(null);
    try {
      // Compress to max 800x800 JPEG quality 0.75 (yields ~40KB - 80KB)
      const result = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
        format: 'image/jpeg',
      });
      setCompressionInfo(result);
      setFormData((prev) => ({ ...prev, profileImage: result.dataUrl }));
      setTouched((prev) => ({ ...prev, profileImage: true }));
    } catch (err: any) {
      setApiError(err.message || 'Failed to process and compress photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset file input value so user can re-select same file if desired
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setCompressionInfo(null);
    setFormData((prev) => ({ ...prev, profileImage: '' }));
  };

  const handleCopyLink = () => {
    const url = window.location.href.split('#')[0] + '#register';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      dob: true,
      age: true,
      place: true,
      phone: true,
      profileImage: true,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Fallback silhouette image if user didn't upload photo
      const finalImage =
        formData.profileImage ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

      const payload = {
        name: formData.name.trim(),
        dob: formData.dob || undefined,
        age: Number(formData.age) || 22,
        place: formData.place.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        battingStyle: formData.battingStyle,
        bowlingStyle: formData.bowlingStyle,
        basePrice: 100,
        belongingTeamId: formData.belongingTeamName.trim() || undefined,
        belongingTeamName: formData.belongingTeamName.trim() || undefined,
        profileImage: finalImage,
      };

      const res = await api.registerPlayerPublic(payload);
      setRegisteredPlayer(res.player);
      // Refresh auction store so player pool count in menu updates immediately
      useAuctionStore.getState().refreshPlayers();
    } catch (err: any) {
      setApiError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 px-3 sm:px-6 bg-[#090d16] text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto">
        {/* Share Link Banner */}
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-transparent border border-amber-500/25 rounded-2xl flex items-center justify-between gap-3 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Public Tournament Registration Link</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all text-[11px] shadow-sm shadow-amber-500/20 active:scale-95 shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Success Screen */}
        {registeredPlayer ? (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
              Registration Confirmed
            </span>

            <h2 className="text-2xl font-black text-white mt-3 mb-1">
              Welcome, {registeredPlayer.name}!
            </h2>

            <div className="inline-block mt-2 mb-4 px-5 py-2.5 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-inner">
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                Your Official Serial Number:
              </span>
              <div className="text-3xl font-black text-amber-400 font-mono tracking-wider">
                S.No #{registeredPlayer.sNo}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Role:</span>
                <span className="text-white font-semibold">{registeredPlayer.role}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Batting / Bowling:</span>
                <span className="text-white font-semibold">
                  {registeredPlayer.battingStyle} • {registeredPlayer.bowlingStyle}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Place / Location:</span>
                <span className="text-white font-semibold">{registeredPlayer.place || 'Not provided'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Starting Base Price:</span>
                <span className="text-amber-400 font-mono font-bold">
                  {formatRupees(registeredPlayer.basePrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Belongs to Team:</span>
                <span className="font-semibold text-white">
                  {registeredPlayer.belongingTeamId || registeredPlayer.belongingTeamName || registeredPlayer.belongingTeam?.name ? (
                    <span className="text-amber-300 font-bold">
                      {registeredPlayer.belongingTeamId || registeredPlayer.belongingTeamName || registeredPlayer.belongingTeam?.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">Independent / Open Pool</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Auction Status:</span>
                <span className="text-emerald-400 font-semibold">
                  In Auction Pool (Ready for Bidding)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setRegisteredPlayer(null);
                  setFormData({
                    name: '',
                    dob: '',
                    age: '',
                    place: '',
                    phone: '',
                    role: 'All-Rounder',
                    battingStyle: 'Right-hand bat',
                    bowlingStyle: 'Right-arm medium',
                    basePrice: 100,
                    profileImage: '',
                    belongingTeamName: '',
                  });
                  setCompressionInfo(null);
                  setTouched({});
                  setEstimatedSNo((prev) => prev + 1);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Register Another Player
              </button>

              <button
                type="button"
                onClick={onBackToArena}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20"
              >
                View Tournament Arena
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                  Player Registration
                </h1>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                  Next S.No: #{estimatedSNo}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fill in your cricket details to enter the live mega auction draft. Starting BID:{' '}
                <strong className="text-amber-400">₹100</strong>.
              </p>
            </div>

            {apiError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload with Mobile Camera, Gallery, and Files Selection */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white">
                    Player Photo / Selfie
                  </label>
                  {compressionInfo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1 border border-emerald-500/30">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      Compressed: {formatBytes(compressionInfo.compressedSizeBytes)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Avatar */}
                  <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group shadow-inner">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-7 h-7 text-slate-500 mx-auto mb-1 group-hover:text-amber-400 transition-colors" />
                        <span className="text-[9px] text-slate-500 block">No photo</span>
                      </div>
                    )}

                    {isCompressing && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] text-amber-400 font-mono font-bold">
                        Optimizing...
                      </div>
                    )}
                  </div>

                  {/* Upload Action Options */}
                  <div className="flex-1 w-full space-y-2">
                    <p className="text-[11px] text-slate-400 text-center sm:text-left">
                      Select how you want to upload your photo on your mobile phone or PC:
                    </p>

                    {/* 3 Mobile Actions: Camera, Gallery, Files */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. Camera */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[11px] font-semibold"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>Camera</span>
                      </button>

                      {/* 2. Photo Gallery / Library */}
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[11px] font-semibold"
                      >
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span>Gallery</span>
                      </button>

                      {/* 3. Browse Files */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[11px] font-semibold"
                      >
                        <FolderOpen className="w-4 h-4 text-emerald-400" />
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
                          onClick={handleRemoveImage}
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

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => handleBlur('name')}
                    placeholder="e.g. Mohammed Farooq"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors ${
                      touched.name && errors.name
                        ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                </div>
                {touched.name && errors.name && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* DOB & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      onBlur={() => handleBlur('dob')}
                      className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors ${
                        touched.dob && errors.dob
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {touched.dob && errors.dob && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.dob}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Age (Years) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="65"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    onBlur={() => handleBlur('age')}
                    placeholder="e.g. 24"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors font-mono ${
                      touched.age && errors.age
                        ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                  {touched.age && errors.age && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>

              {/* Place / City & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Place / Native City <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={formData.place}
                      onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                      onBlur={() => handleBlur('place')}
                      placeholder="e.g. Chennai, Madurai"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors ${
                        touched.place && errors.place
                          ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                          : 'border-slate-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {touched.place && errors.place && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.place}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / WhatsApp Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onBlur={() => handleBlur('phone')}
                      placeholder="e.g. 9876543210"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors font-mono ${
                        touched.phone && errors.phone
                          ? 'border-rose-500 focus:border-rose-400 bg-rose-950/10'
                          : 'border-slate-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Player Specialization / Role <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setFormData({ ...formData, role })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.role === role
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batting & Bowling Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batting Style
                  </label>
                  <select
                    value={formData.battingStyle}
                    onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Right-hand bat">Right-hand bat</option>
                    <option value="Left-hand bat">Left-hand bat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bowling Style
                  </label>
                  <select
                    value={formData.bowlingStyle}
                    onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Right-arm fast">Right-arm fast</option>
                    <option value="Right-arm medium">Right-arm medium</option>
                    <option value="Right-arm spin">Right-arm off-spin</option>
                    <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                    <option value="Left-arm fast">Left-arm fast</option>
                    <option value="Left-arm spin">Left-arm spin</option>
                    <option value="None">None (Pure Batter)</option>
                  </select>
                </div>
              </div>

              {/* Belonging Team LOV (Optional) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-white">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Belongs to Team / Club (Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Enter manually
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.belongingTeamName}
                    onChange={(e) => setFormData({ ...formData, belongingTeamName: e.target.value })}
                    placeholder="Type your team or club name (e.g. Sunrise CC, Local XI, etc.)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {formData.belongingTeamName ? (
                    <span className="text-amber-300 font-medium">
                      You belong to <strong>{formData.belongingTeamName}</strong>. In the auction, players are shuffled into the pool so that even though you belong to this club, you can be bid on and played by any other team!
                    </span>
                  ) : (
                    <span>
                      Independent / New talent (leave blank if free agent). You will be shuffled into the auction pool and can be bid on by any team.
                    </span>
                  )}
                </p>
              </div>

              {/* Base Price Note */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    Starting Base Price: {formatRupees(100)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    All player auctions will start from ₹100 INR.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Currency</span>
                  <span className="text-xs font-bold font-mono text-amber-400">INR (₹)</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBackToArena}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing || Object.keys(errors).length > 0}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Registering Player...' : isCompressing ? 'Compressing Photo...' : 'Submit Player Registration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
