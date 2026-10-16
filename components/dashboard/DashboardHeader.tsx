"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  Flame,
  Plus,
  Settings,
  Menu,
  CheckCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { THEMES, ThemeMode, setStoredTheme } from "@/lib/theme";

interface DashboardHeaderProps {
  userName?: string;
  avatarEmoji?: string;
  onToggleSidebar?: () => void;
  preferredTheme?: string;
  onThemeChange?: (theme: string) => void;
  streakDays?: number;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardHeader({
  userName = "Developer",
  onToggleSidebar,
  preferredTheme = "current",
  onThemeChange,
  streakDays = 1,
}: DashboardHeaderProps) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleSelectTheme = (themeId: ThemeMode) => {
    setStoredTheme(themeId);
    if (onThemeChange) onThemeChange(themeId);
    setShowThemeMenu(false);
  };

  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 pt-1 select-none">
      {/* Left: Dynamic Greeting with slash and date */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span className="font-bold text-white tracking-tight flex items-center gap-1.5 font-sans text-base">
            <span suppressHydrationWarning>{getGreeting()}, {userName}</span>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          </span>

          <span className="text-zinc-600 font-sans">/</span>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span suppressHydrationWarning>{getTodayFormatted()}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300 font-medium">Daily Sprint active</span>
          </div>
        </div>
      </div>

      {/* Right: Streak & Quick Action Controls */}
      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
        {/* Streak Pill */}
        <div className="streak-aura inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold shadow-sm">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{streakDays} Day Streak</span>
        </div>

        {/* Quick Custom Note */}
        <Link
          href="/custom-notes"
          className="btn-quiet inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-200 hover:text-white text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          <span>Quick Note</span>
        </Link>

        {/* Planly Sprint */}
        <Link
          href="/planly"
          className="btn-haptic inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-950 text-xs font-bold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
          <span>+ AI Sprint</span>
        </Link>

        {/* Settings / Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-xl bg-[#10141E] hover:bg-[#141923] border border-white/10 text-zinc-400 hover:text-white transition-all"
            title="Workspace Settings & Theme"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-64 max-h-[320px] overflow-y-auto rounded-xl bg-[#0B0F17] border border-white/15 p-2 shadow-2xl z-30 space-y-1.5 select-none">
              <div className="flex items-center justify-between px-1 py-1 border-b border-white/10 mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Select Theme
                </span>
                <span className="text-[9px] font-mono text-zinc-500">{THEMES.length} Themes</span>
              </div>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-left ${
                    preferredTheme === theme.id
                      ? "bg-white text-zinc-950 font-semibold shadow-sm"
                      : "text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1 pr-1.5">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{theme.name}</span>
                      <span className="text-[9px] font-mono opacity-60 uppercase">{theme.mode}</span>
                    </div>
                    <div className="flex items-center gap-1 w-full">
                      {theme.palette.map((color, idx) => (
                        <span
                          key={idx}
                          className="h-1.5 flex-1 rounded-xs border border-black/10"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  {preferredTheme === theme.id && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
