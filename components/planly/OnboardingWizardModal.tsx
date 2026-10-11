"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Building2,
  Calendar,
  Clock,
  Sliders,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Flame,
  Zap
} from "lucide-react";
import { CoreScheduleMode, SprintSettings, TargetCompanyKey, UserDiagnostic } from "@/lib/planly/types";
import { COMPANY_PRESETS, DEFAULT_DIAGNOSTIC } from "@/lib/planly/pools";

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (settings: SprintSettings) => void;
  initialSettings: SprintSettings;
}

export default function OnboardingWizardModal({
  isOpen,
  onClose,
  onComplete,
  initialSettings
}: OnboardingWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [targetCompany, setTargetCompany] = useState<TargetCompanyKey>(initialSettings.targetCompany);
  const [weeks, setWeeks] = useState<number>(initialSettings.weeks);
  const [dailyHours, setDailyHours] = useState<number>(initialSettings.dailyHours);
  const [coreScheduleMode, setCoreScheduleMode] = useState<CoreScheduleMode>(initialSettings.coreScheduleMode);
  const [language, setLanguage] = useState<string>(initialSettings.language);
  const [diagnostic, setDiagnostic] = useState<UserDiagnostic>(
    initialSettings.diagnostic || DEFAULT_DIAGNOSTIC
  );

  if (!isOpen) return null;

  const handleFinish = () => {
    onComplete({
      ...initialSettings,
      targetCompany,
      weeks,
      dailyHours,
      coreScheduleMode,
      language,
      diagnostic
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#10141E] border border-[#1E293B] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Planly AI Sprint Architect</h2>
              <span className="text-[11px] text-zinc-400">Step {step} of 3</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: TARGET COMPANY */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Select Target Company Profile</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Planly will bias graph algorithms, dynamic programming, and system design drills accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(COMPANY_PRESETS).map(([key, data]) => {
                const isSelected = targetCompany === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTargetCompany(key as TargetCompanyKey)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-1 ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-200 shadow-sm"
                        : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{data.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] text-zinc-400 leading-tight line-clamp-2">
                      {data.notes}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: TIMELINE & COMMITMENT */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Sprint Duration &amp; Daily Hours</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Set how many weeks you have until target interviews and daily deep-work capacity.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1.5">Sprint Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 8, 12].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={`py-2 text-center rounded-xl font-mono text-xs border transition ${
                        weeks === w
                          ? "bg-emerald-500 border-emerald-400 text-black font-bold"
                          : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {w} Weeks
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1.5">Daily Hours</label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 4, 6].map((hrs) => (
                    <button
                      key={hrs}
                      onClick={() => setDailyHours(hrs)}
                      className={`py-2 text-center rounded-xl font-mono text-xs border transition ${
                        dailyHours === hrs
                          ? "bg-emerald-500 border-emerald-400 text-black font-bold"
                          : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {hrs} Hours / Day
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1.5">DSA Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#141923] border border-[#1E293B] rounded-xl p-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Java">Java (A2Z)</option>
                  <option value="C++">C++ (STL)</option>
                  <option value="Python">Python</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SELF-ASSESSMENT DIAGNOSTIC */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Self-Assessment Diagnostic</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rate your confidence (1 = struggling / unstarted, 5 = mastered). Lower ratings receive
                doubled problem repetitions.
              </p>
            </div>

            <div className="space-y-3 bg-[#141923] p-3.5 rounded-xl border border-[#1E293B]">
              {[
                { key: "dp" as keyof UserDiagnostic, label: "Dynamic Programming (1D & 2D)" },
                { key: "graphs" as keyof UserDiagnostic, label: "Graphs & Disjoint Set" },
                { key: "trees" as keyof UserDiagnostic, label: "Binary Trees & BST" },
                { key: "arrays" as keyof UserDiagnostic, label: "Two Pointers & Sliding Window" },
                { key: "systemDesign" as keyof UserDiagnostic, label: "Low-Level System Design (LLD)" }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 truncate max-w-[240px]">{label}</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDiagnostic((prev) => ({ ...prev, [key]: lvl }))}
                        className={`w-6 h-6 rounded text-[11px] font-mono transition ${
                          diagnostic[key] === lvl
                            ? "bg-cyan-500 text-black font-bold"
                            : "bg-[#181F2E] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
          {step > 1 ? (
            <button
              onClick={() => setStep((prev) => prev - 1)}
              className="px-3.5 py-1.5 rounded-xl bg-[#141923] text-zinc-300 text-xs flex items-center space-x-1.5 hover:bg-[#181F2E] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-black font-extrabold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Synthesize My Sprint Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
