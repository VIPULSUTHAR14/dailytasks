"use client";

import React, { useState } from "react";
import { Bell, Search, Plus, Terminal, User, CheckCircle, ExternalLink, Sparkles, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkspaceHeaderProps {
  children?: React.ReactNode;
  activeTrack?: string;
  sprintNumber?: number;
  sprintProgress?: number;
  onNewAction?: () => void;
  newActionLabel?: string;
  onToggleSidebar?: () => void;
}

export default function WorkspaceHeader({
  children,
  activeTrack,
  sprintNumber,
  sprintProgress,
  onNewAction,
  newActionLabel = "New",
  onToggleSidebar,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="w-full h-14 bg-[#0B0F17] border-b border-[#1E293B] px-3.5 sm:px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shrink-0 select-none">
      {/* Left Breadcrumbs + Mobile Navigation Toggle */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        {/* Mobile Menu Hamburger Button */}
        <button
          type="button"
          onClick={() => {
            if (onToggleSidebar) {
              onToggleSidebar();
            } else {
              window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"));
            }
          }}
          className="md:hidden p-1.5 rounded-lg bg-[#141923] border border-[#1E293B] text-zinc-300 hover:text-white hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={17} />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer" onClick={() => router.push("/tasks")}>
            AlgoCraft
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-white font-medium">Workspace</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
        {/* Track Badge */}
        {activeTrack && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141923] border border-[#1E293B] text-[11px] font-medium text-cyan-400">
            <Terminal size={12} className="text-cyan-400 shrink-0" />
            <span>{activeTrack}</span>
          </div>
        )}

        {/* Sprint Progress Pill */}
        {sprintNumber !== undefined && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141923] border border-[#1E293B] text-[11px] text-zinc-300">
            <span className="font-semibold text-zinc-200">Sprint {sprintNumber}</span>
            {sprintProgress !== undefined && (
              <>
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{sprintProgress}%</span>
              </>
            )}
          </div>
        )}

        {/* Contextual Custom Actions */}
        {children}

        {/* Notifications Icon with popover toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-[#141923] border border-transparent hover:border-[#1E293B] transition-colors relative"
            title="Notifications"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0B0F17]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#10141E] border border-[#1E293B] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-xs font-bold uppercase tracking-wider text-white">System Feed</span>
                <span className="text-[10px] font-mono text-cyan-400">Live Sync</span>
              </div>
              <div className="py-3 space-y-2.5 text-xs">
                <div className="p-2 rounded bg-[#141923] border border-[#1E293B]/60 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-zinc-200 font-medium">Sprint 4 targets active</p>
                    <p className="text-[10px] text-zinc-500">Sliding Window & DP milestone on track</p>
                  </div>
                </div>
                <div className="p-2 rounded bg-[#141923] border border-[#1E293B]/60 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-zinc-200 font-medium">Daily Cadence Shield</p>
                    <p className="text-[10px] text-zinc-500">Deep focus block starts in 15m</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Action Button */}
        {onNewAction && (
          <button
            onClick={onNewAction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold rounded shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{newActionLabel}</span>
          </button>
        )}

        {/* User Profile Avatar Pill */}
        <div className="flex items-center gap-2 pl-1 border-l border-[#1E293B]/80">
          <div className="relative group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#141923] border border-[#1E293B] flex items-center justify-center text-cyan-400 hover:border-cyan-500/40 transition-colors">
              <User size={15} />
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0F17]" />

            {/* Quick Profile Tooltip / Card */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#10141E] border border-[#1E293B] rounded-xl shadow-2xl p-3 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              <p className="text-xs font-bold text-white">Alex Rivera</p>
              <p className="text-[10px] text-cyan-400 font-mono">Backend Track • Tier-1 Prep</p>
              <div className="mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[10px] text-zinc-400">
                <span>Streak: 14 Days</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
