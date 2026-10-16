"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Pencil,
  Briefcase,
  Building2,
  CheckCircle,
  Zap,
} from "lucide-react";
import EditProfileModal, { UserProfileData } from "./EditProfileModal";

interface UserProfileCardProps {
  profile: UserProfileData;
  onUpdateProfile: (updated: UserProfileData) => Promise<void>;
  currentStreak?: number;
}

export default function UserProfileCard({
  profile,
  onUpdateProfile,
}: UserProfileCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(true);

  // Daily hours stats (e.g. 2.5h / 4h = ~62%)
  const dailyTarget = profile.dailyHours || 4;
  const completedHours = 2.5;
  const progressPercent = Math.min(100, Math.round((completedHours / dailyTarget) * 100));

  // SVG Circular progress params
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative surface-2 rim-gradient spotlight p-5 overflow-hidden transition-all"
      >
        {/* Card Header Row */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          {/* Left Title + Session # */}
          <div className="flex items-center gap-2.5">
            <span className="pip-live shrink-0" />
            <span className="text-sm font-bold text-cyan-300 tracking-tight">
              Profile & Focus Hub
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/5 border border-white/5 text-zinc-400">
              SESSION #104
            </span>
          </div>

          {/* Right Controls: Focus Mode Toggle + Edit Profile Button */}
          <div className="flex items-center gap-4">
            {/* Focus Mode Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Focus Mode</span>
              <button
                type="button"
                onClick={() => setFocusMode(!focusMode)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                  focusMode ? "bg-cyan-500" : "bg-zinc-700"
                }`}
                title="Toggle Focus Mode"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    focusMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Pencil className="w-3.5 h-3.5 text-zinc-400" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Left: Avatar + User Info */}
          <div className="flex items-center gap-4">
            {/* Avatar Box with Cyan border glow */}
            <div
              onClick={() => setIsEditModalOpen(true)}
              role="button"
              tabIndex={0}
              title="Click to edit profile & emoji"
              className="relative cursor-pointer group/avatar shrink-0"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-950/40 via-zinc-900 to-[#10141E] border border-cyan-500/40 group-hover/avatar:border-cyan-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover/avatar:scale-105 transition-all duration-200">
                {profile.avatarEmoji && profile.avatarEmoji !== "🧑‍💻" ? (
                  profile.avatarEmoji
                ) : (
                  <Zap className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0B0F17] border border-cyan-400/50 text-cyan-400">
                <CheckCircle className="w-3.5 h-3.5 fill-cyan-400/20" />
              </div>
            </div>

            {/* User Name & Roles */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {profile.name || "Developer"}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" /> PRO WORKSPACE
                </span>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-[#0B0F17] text-zinc-300 font-medium px-2.5 py-1 rounded-lg border border-white/10">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{profile.targetRole || "Software Development Engineer"}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 font-medium px-2.5 py-1 rounded-lg border border-cyan-500/30">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{profile.targetCompany || "Google / Tier-1 Tech"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Daily Goal & Circular Progress */}
          <div className="flex items-center gap-4 bg-[#0B0F17]/60 border border-white/5 px-4 py-2.5 rounded-xl">
            <div className="space-y-0.5 text-right md:text-left">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                DAILY GOAL
              </p>
              <p className="text-xs font-bold text-white font-mono">
                {completedHours}h / {dailyTarget}h completed
              </p>
              <p className="text-[11px] text-cyan-400 font-medium">
                Cyber Slate Active
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
                {/* Background circle */}
                <circle
                  cx="26"
                  cy="26"
                  r={radius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="4"
                  fill="transparent"
                />
                {/* Foreground progress circle */}
                <circle
                  cx="26"
                  cy="26"
                  r={radius}
                  stroke="rgb(var(--accent-rgb))"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="ring-neon transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-bold text-white">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={onUpdateProfile}
      />
    </>
  );
}
