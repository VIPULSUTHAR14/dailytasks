"use client";

import React, { useState } from "react";
import {
  Sliders,
  Building2,
  Calendar,
  Clock,
  Cpu,
  Database,
  Globe,
  Layers,
  Zap,
  X,
  Sparkles,
  Compass,
  Check
} from "lucide-react";
import {
  CoreScheduleMode,
  SprintSettings,
  TargetCompanyKey
} from "@/lib/planly/types";
import { COMPANY_PRESETS } from "@/lib/planly/pools";

interface SprintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SprintSettings;
  onSaveAndRegenerate: (newSettings: SprintSettings) => void;
  onLaunchWizard: () => void;
}

export default function SprintSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveAndRegenerate,
  onLaunchWizard
}: SprintSettingsModalProps) {
  const [draft, setDraft] = useState<SprintSettings>({ ...settings });

  if (!isOpen) return null;

  const handleApplyAndRegenerate = () => {
    onSaveAndRegenerate(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sprint Preferences & Engine Generator</h2>
              <p className="text-xs text-zinc-400">
                Configure your target company, daily hours, and topics to re-simulate your battle plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#141923] border border-transparent hover:border-[#1E293B] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Shortcut */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-emerald-950/30 to-purple-950/30 border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Want a personalized recommendation?</p>
              <p className="text-[11px] text-zinc-400">Take the 4-step diagnostic wizard to gauge strengths and company style.</p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onLaunchWizard();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition shrink-0"
          >
            Launch Wizard
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* Target Company */}
          <div>
            <label className="text-zinc-200 font-semibold block mb-2">Target Company Profile</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(COMPANY_PRESETS).map(([key, data]) => {
                const isSelected = draft.targetCompany === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft({ ...draft, targetCompany: key as TargetCompanyKey })}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2.5 ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-200 font-semibold"
                        : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <Building2
                      className={`w-4 h-4 shrink-0 ${isSelected ? "text-cyan-400" : "text-zinc-500"}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs truncate font-medium">{data.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Daily Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-200 font-semibold block mb-2 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sprint Duration</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#141923] p-1 rounded-xl border border-[#1E293B]">
                {[4, 8, 12].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setDraft({ ...draft, weeks: w })}
                    className={`py-2 text-center rounded-lg font-mono text-xs font-semibold transition ${
                      draft.weeks === w
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {w} Weeks
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-200 font-semibold block mb-2 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Daily Study Budget</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#141923] p-1 rounded-xl border border-[#1E293B]">
                {[2, 4, 6].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDraft({ ...draft, dailyHours: hrs })}
                    className={`py-2 text-center rounded-lg font-mono text-xs font-semibold transition ${
                      draft.dailyHours === hrs
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {hrs} Hours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core CS Mode */}
          <div>
            <label className="text-zinc-200 font-semibold block mb-2">Core Subject Scheduling Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "weekends", label: "Weekends Only", desc: "Mon-Fri pure DSA" },
                { id: "daily", label: "Daily Balanced", desc: "DSA + Core every day" },
                { id: "alternate", label: "Alternate Days", desc: "Rotate DSA & Core" }
              ].map((mode) => {
                const isSelected = draft.coreScheduleMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, coreScheduleMode: mode.id as CoreScheduleMode })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold"
                        : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <p className="text-xs font-semibold">{mode.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{mode.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core CS Tracks */}
          <div>
            <label className="text-zinc-200 font-semibold block mb-2">Selected Core CS Tracks</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "os", label: "Operating Systems", icon: Cpu },
                { id: "dbms", label: "DBMS & SQL", icon: Database },
                { id: "cn", label: "Computer Networks", icon: Globe },
                { id: "lld", label: "Low-Level Design", icon: Layers }
              ].map((sub) => {
                const isSelected = draft.selectedCores.includes(sub.id);
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setDraft({
                          ...draft,
                          selectedCores: draft.selectedCores.filter((x) => x !== sub.id)
                        });
                      } else {
                        setDraft({
                          ...draft,
                          selectedCores: [...draft.selectedCores, sub.id]
                        });
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-[#181F2E] border-emerald-500/50 text-zinc-200"
                        : "bg-[#141923]/60 border-[#1E293B] text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <SubIcon
                        className={`w-4 h-4 shrink-0 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`}
                      />
                      <span className="text-xs font-medium truncate">{sub.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#1E293B] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-[#141923] hover:bg-[#181F2E] border border-[#1E293B] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyAndRegenerate}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black hover:opacity-95 shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>Synthesize & Regenerate Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
