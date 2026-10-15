"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, User, Briefcase, Building2, Clock, Palette } from "lucide-react";
import { THEMES, ThemeMode, setStoredTheme } from "@/lib/theme";

export interface UserProfileData {
  id?: string;
  name: string;
  email?: string;
  avatarEmoji: string;
  targetRole: string;
  targetCompany: string;
  dailyHours: number;
  preferredTheme: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData;
  onSave: (updated: UserProfileData) => Promise<void>;
}

const EMOJI_CATEGORIES = [
  {
    name: "Tech & Dev",
    emojis: ["🧑‍💻", "💻", "⚡", "🤖", "🚀", "👾", "🛠️", "🛡️", "🌐", "☕"],
  },
  {
    name: "Ambition & Fire",
    emojis: ["🔥", "🦁", "🐯", "🦅", "🎯", "🏆", "💎", "👑", "🔱", "⚡"],
  },
  {
    name: "Mind & Focus",
    emojis: ["🧠", "🥋", "🧘", "📚", "💡", "🔬", "🔭", "🕯️", "🧭", "📈"],
  },
  {
    name: "Cool & Fun",
    emojis: ["😎", "🐱", "🦊", "🐼", "🥷", "🌌", "🪐", "🎨", "🎧", "🍀"],
  },
];

const SUGGESTED_ROLES = [
  "Full Stack Developer",
  "Backend Engineer",
  "Frontend Engineer",
  "DSA & Algo Specialist",
  "Systems Architect",
  "DevOps & Cloud Engineer",
];

const SUGGESTED_COMPANIES = [
  "Google / MAANG",
  "Amazon",
  "Tier-1 Tech",
  "High-Growth Startup",
  "FinTech / Quant",
];

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(profile.name || "");
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji || "🧑‍💻");
  const [targetRole, setTargetRole] = useState(profile.targetRole || "Software Developer");
  const [targetCompany, setTargetCompany] = useState(profile.targetCompany || "Tier-1 Tech");
  const [dailyHours, setDailyHours] = useState(profile.dailyHours || 4);
  const [preferredTheme, setPreferredTheme] = useState(profile.preferredTheme || "current");
  const [activeCategory, setActiveCategory] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({
        ...profile,
        name: name.trim(),
        avatarEmoji,
        targetRole: targetRole.trim(),
        targetCompany: targetCompany.trim(),
        dailyHours,
        preferredTheme,
      });
      // Also apply theme locally if changed
      setStoredTheme(preferredTheme as ThemeMode);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl p-6 md:p-8 text-zinc-100 selection:bg-white selection:text-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Edit Profile & Target</h2>
                <p className="text-xs text-zinc-400">Personalize your workspace identity & preparation focus</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Avatar Emoji Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Choose Your Avatar Emoji
              </label>
              
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900/60 border border-white/10">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-purple-500/20 border-2 border-cyan-400/50 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/10 transition-transform group-hover:scale-105">
                    {avatarEmoji}
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-zinc-950">
                    Active
                  </span>
                </div>
                <div className="text-xs text-zinc-400">
                  <p className="font-medium text-zinc-200">Selected Avatar Preview</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Pick any emoji below to represent you across your daily dashboard.
                  </p>
                </div>
              </div>

              {/* Category tabs */}
              <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-900/80 border border-white/5 overflow-x-auto">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveCategory(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      activeCategory === idx
                        ? "bg-white text-zinc-950 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      avatarEmoji === emoji
                        ? "bg-cyan-500/20 border-2 border-cyan-400 scale-110 shadow-md"
                        : "hover:bg-white/10 hover:scale-105 border border-transparent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Target Role Preparing For */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Role Preparing For
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer, SDE-2"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      targetRole === role
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Company / Tier */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Target Companies / Tier
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Tier-1 Tech, Fintech"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_COMPANIES.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setTargetCompany(comp)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      targetCompany === comp
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Hours & Theme Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Daily Target Hours */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Daily Focus Goal
                </label>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900 border border-white/10">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    {dailyHours}h / day
                  </span>
                </div>
              </div>

              {/* Theme Preference */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-purple-400" /> Workspace Theme
                </label>
                <select
                  value={preferredTheme}
                  onChange={(e) => setPreferredTheme(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all cursor-pointer"
                >
                  {THEMES.map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-950 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-white/10"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
