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
  Compass,
  Check,
  RotateCcw,
  ListOrdered,
  ShieldCheck
} from "lucide-react";
import {
  CoreScheduleMode,
  SprintSettings,
  TargetCompanyKey
} from "@/lib/planly/types";
import { COMPANY_PRESETS } from "@/lib/planly/pools";
import { getDefaultTopicPlan } from "@/lib/planly/storage";
import TopicPlanEditor from "./TopicPlanEditor";

interface SprintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SprintSettings;
  onSaveAndRegenerate: (newSettings: SprintSettings) => void;
  onLaunchWizard: () => void;
}

function SprintSettingsModalContent({
  onClose,
  settings,
  onSaveAndRegenerate,
  onLaunchWizard
}: Omit<SprintSettingsModalProps, "isOpen">) {
  const [draft, setDraft] = useState<SprintSettings>(() => {
    const topicPlan =
      settings.topicPlan && settings.topicPlan.length > 0
        ? settings.topicPlan
        : getDefaultTopicPlan(settings);
    return {
      ...settings,
      topicPlan,
      sundayRevisionMins: settings.sundayRevisionMins ?? 240
    };
  });
  const [activeTab, setActiveTab] = useState<"general" | "topics">("general");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleApplyAndRegenerate = () => {
    onSaveAndRegenerate(draft);
    setShowConfirm(false);
    onClose();
  };

  const currentTopicPlan =
    draft.topicPlan && draft.topicPlan.length > 0
      ? draft.topicPlan
      : getDefaultTopicPlan(draft);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-5 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sprint Preferences &amp; Engine Generator</h2>
              <p className="text-xs text-zinc-400">
                Configure company target, time budget, and topic sequence to re-simulate your battle plan.
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
        <div className="bg-gradient-to-r from-cyan-950/40 via-emerald-950/30 to-purple-950/30 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-200">Want an AI-guided diagnostic recommendation?</p>
              <p className="text-[11px] text-zinc-400">The 4-step wizard assesses your strengths and company requirements.</p>
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

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-[#1E293B] pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === "general"
                ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#141923]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General Preferences</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topics")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === "topics"
                ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#141923]"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Study Status &amp; Topic Order</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
          {activeTab === "general" && (
            <div className="space-y-5">
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

              {/* Sunday Revision Session Length */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-200 font-semibold flex items-center space-x-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sunday Revision Session Length</span>
                  </label>
                  <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {draft.sundayRevisionMins || 240} min ({Math.round(((draft.sundayRevisionMins || 240) / 60) * 10) / 10}h)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "180 min (3h)", val: 180, desc: "Quick consolidation" },
                    { label: "240 min (4h)", val: 240, desc: "Recommended baseline" },
                    { label: "300 min (5h)", val: 300, desc: "Deep drill sprint" }
                  ].map((preset) => {
                    const isSelected = (draft.sundayRevisionMins || 240) === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setDraft({ ...draft, sundayRevisionMins: preset.val })}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-200 font-semibold"
                            : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <p className="text-xs font-semibold">{preset.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[11px] text-zinc-400">Custom minutes (60–360):</span>
                  <input
                    type="number"
                    min={60}
                    max={360}
                    step={30}
                    value={draft.sundayRevisionMins || 240}
                    onChange={(e) => {
                      const val = Math.max(60, Math.min(360, Number(e.target.value) || 240));
                      setDraft({ ...draft, sundayRevisionMins: val });
                    }}
                    className="w-24 px-2 py-1 rounded bg-[#141923] border border-[#1E293B] text-zinc-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
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
          )}

          {activeTab === "topics" && (
            <div className="space-y-4">
              <TopicPlanEditor
                topicPlan={currentTopicPlan}
                onChange={(updated) => setDraft({ ...draft, topicPlan: updated })}
                settings={draft}
                mode="all"
                onIncreaseWeeks={() => {
                  if ((draft.weeks || 8) < 12) {
                    setDraft({ ...draft, weeks: ((draft.weeks || 8) === 4 ? 8 : 12) });
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Confirmation Banner */}
        {showConfirm && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 animate-fadeIn">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-100">Confirm Schedule Regeneration</p>
                <p className="text-[11px] text-amber-300/80">
                  Future days will be updated with your new topic order. Completed work, past days, and streaks are safely preserved.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#141923] hover:bg-[#1E293B] transition"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={handleApplyAndRegenerate}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black transition shadow-md"
              >
                Yes, Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showConfirm && (
          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between shrink-0">
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              {activeTab === "general" ? "Switch to 'Study Status & Topic Order' to customize topic queue" : "Review your topic order and warnings before applying"}
            </p>
            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-[#141923] hover:bg-[#181F2E] border border-[#1E293B] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black hover:opacity-95 shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Synthesize &amp; Regenerate Plan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SprintSettingsModal(props: SprintSettingsModalProps) {
  if (!props.isOpen) return null;
  return <SprintSettingsModalContent {...props} />;
}
