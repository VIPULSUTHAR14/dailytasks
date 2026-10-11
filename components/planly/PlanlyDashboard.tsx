"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Sparkles,
  BarChart3,
  RotateCcw,
  FileJson,
  Sliders,
  Building2,
  Zap,
  Undo2,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Coffee,
  Check,
  Layers,
  Clock,
  ArrowRight
} from "lucide-react";
import {
  ConfidenceLevel,
  PlanTask,
  SprintPlan,
  SprintSettings,
  TargetCompanyKey
} from "@/lib/planly/types";
import { COMPANY_PRESETS } from "@/lib/planly/pools";
import { generateSchedule } from "@/lib/planly/engine";
import {
  applyRestDay,
  executeIntelligentRebalance,
  injectSpacedRepetitionTask
} from "@/lib/planly/spacedRepetition";
import { computePlanMetrics } from "@/lib/planly/analytics";
import {
  loadPlanlyState,
  savePlanlyState,
  pushUndoSnapshot,
  popUndoSnapshot,
  syncDayToHabitTasks,
  reconcileWithCompletedHabits
} from "@/lib/planly/storage";
import TodayView from "./TodayView";
import TimelineView from "./TimelineView";
import AnalyticsView from "./AnalyticsView";
import BacklogView from "./BacklogView";
import JsonView from "./JsonView";
import OnboardingWizardModal from "./OnboardingWizardModal";
import SprintSettingsModal from "./SprintSettingsModal";

export default function PlanlyDashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<SprintSettings>({
    weeks: 8,
    dailyHours: 4,
    coreScheduleMode: "weekends",
    selectedCores: ["os", "dbms", "cn"],
    targetCompany: "general",
    language: "Java",
    includeMockContests: true
  });

  const [plan, setPlan] = useState<SprintPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "timeline" | "analytics" | "backlog" | "json">("today");
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [streaks, setStreaks] = useState({ currentStreak: 1, longestStreak: 1, lastActiveDate: null as string | null });
  const [notification, setNotification] = useState<string>("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load from localStorage on mount & reconcile with /tasks
  useEffect(() => {
    const savedState = loadPlanlyState();
    setSettings(savedState.settings);
    setStreaks(savedState.streaks);
    setCurrentDayNumber(savedState.currentDayNumber || 1);

    if (savedState.plan) {
      const { updatedPlan, syncedCount } = reconcileWithCompletedHabits(savedState.plan);
      setPlan(updatedPlan);
      if (syncedCount > 0) {
        triggerNotification(`Synced ${syncedCount} completed task(s) from AlgoCraft Tasks!`);
      }
    } else {
      const generated = generateSchedule(savedState.settings);
      setPlan(generated);
    }

    setIsLoaded(true);
  }, []);

  // Auto-save whenever plan, settings or streaks update
  useEffect(() => {
    if (!isLoaded || !plan) return;
    savePlanlyState({
      version: 3,
      settings,
      plan,
      streaks,
      currentDayNumber,
      updatedAt: new Date().toISOString()
    });
  }, [plan, settings, streaks, currentDayNumber, isLoaded]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4500);
  };

  const metrics = useMemo(() => {
    return computePlanMetrics(plan, currentDayNumber);
  }, [plan, currentDayNumber]);

  // Handle plan updates with snapshot history
  const updatePlanWithHistory = (updater: (prev: SprintPlan) => SprintPlan, msg?: string) => {
    if (!plan) return;
    pushUndoSnapshot(plan);
    const next = updater(plan);
    setPlan(next);
    if (msg) triggerNotification(msg);
  };

  const handleUndo = () => {
    const previous = popUndoSnapshot();
    if (previous) {
      setPlan(previous);
      triggerNotification("Undid last schedule change!");
    } else {
      triggerNotification("No earlier snapshots in undo history.");
    }
  };

  const handleRegenerateFromModal = (newSettings: SprintSettings) => {
    setSettings(newSettings);
    updatePlanWithHistory(() => {
      const fresh = generateSchedule(newSettings);
      setActiveWeek(1);
      return fresh;
    }, `Generated fresh sprint for ${COMPANY_PRESETS[newSettings.targetCompany]?.name || newSettings.targetCompany.toUpperCase()}!`);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<PlanTask>) => {
    if (!plan) return;
    updatePlanWithHistory((prev) => {
      const newWeeks = prev.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => ({
          ...d,
          tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        }))
      }));
      return { ...prev, weeks: newWeeks };
    });
  };

  const handleConfidenceSelect = (task: PlanTask, confidence: ConfidenceLevel) => {
    if (!plan) return;
    const { updatedPlan, scheduledDay } = injectSpacedRepetitionTask(plan, { ...task, confidence }, currentDayNumber);
    updatePlanWithHistory(() => updatedPlan);

    if (scheduledDay) {
      triggerNotification(`Confidence rated '${confidence}'. Re-attempt scheduled for Day ${scheduledDay}!`);
    }
  };

  const handleTakeRestDay = () => {
    if (!plan) return;
    const { updatedPlan, affectedTasksCount } = applyRestDay(plan, currentDayNumber);
    updatePlanWithHistory(() => updatedPlan);
    triggerNotification(`Rest Day activated! ${affectedTasksCount} task(s) postponed forward without debt.`);
  };

  const handleExecuteRebalance = () => {
    if (!plan || metrics.backlogList.length === 0) {
      triggerNotification("No overdue tasks in backlog queue. Schedule is optimal!");
      return;
    }
    const { updatedPlan, rebalancedCount } = executeIntelligentRebalance(plan, metrics.backlogList);
    updatePlanWithHistory(() => updatedPlan);
    triggerNotification(`Intelligent Rebalance complete: ${rebalancedCount} task(s) redistributed!`);
  };

  const handleSyncToHabits = () => {
    if (!plan) return;
    let todayTasks: PlanTask[] = [];
    for (const w of plan.weeks) {
      const found = w.days.find((d) => d.dayNumber === currentDayNumber);
      if (found) {
        todayTasks = found.tasks;
        break;
      }
    }
    const result = syncDayToHabitTasks(todayTasks);
    triggerNotification(result.message);
  };

  const handleWizardComplete = (newSettings: SprintSettings) => {
    setSettings(newSettings);
    updatePlanWithHistory(() => {
      const fresh = generateSchedule(newSettings);
      return fresh;
    }, `Personalized sprint synthesized for ${newSettings.targetCompany.toUpperCase()}!`);
  };

  if (!isLoaded || !plan) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-zinc-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
          <span>Initializing Planly AI Engine...</span>
        </div>
      </div>
    );
  }

  const currentCompanyPreset = COMPANY_PRESETS[settings.targetCompany] || COMPANY_PRESETS.general;

  // Compute today's remaining tasks
  let todayTasksCount = 0;
  let todayCompletedCount = 0;
  for (const w of plan.weeks) {
    const found = w.days.find((d) => d.dayNumber === currentDayNumber);
    if (found) {
      todayTasksCount = found.tasks.length;
      todayCompletedCount = found.tasks.filter((t) => t.completed).length;
      break;
    }
  }

  return (
    <div className="min-h-full bg-[#0B0F17] text-zinc-100 font-sans flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Banner & Notification Toast */}
      {notification && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-xs text-center flex items-center justify-center space-x-2 sticky top-0 z-40 backdrop-blur-md animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Main Container - FULL WIDTH, decluttered */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-6 space-y-5">
        {/* TOP COCKPIT BAR: Sprint Status & Quick Actions */}
        <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Sprint Identity & Config Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">Planly AI Sprint</h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                    v3.0 Dynamic Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Adaptive spaced repetition &amp; multi-problem daily scheduling</p>
              </div>
            </div>

            {/* Clickable Sprint Configuration Chip */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="group flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#141923] hover:bg-[#181F2E] border border-[#1E293B] hover:border-cyan-500/40 text-xs transition cursor-pointer"
              title="Click to tune target company, duration or daily hours"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
              <span className="font-semibold text-zinc-200">{currentCompanyPreset.name}</span>
              <span className="text-zinc-500">•</span>
              <span className="font-mono text-zinc-300">{settings.weeks}w • {settings.dailyHours}h/day</span>
              <span className="text-[10px] text-cyan-400 underline decoration-cyan-400/40 ml-1">Edit</span>
            </button>

            {/* Streak Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
              <span className="text-sm">🔥</span>
              <span>{streaks.currentStreak} Day Streak</span>
            </div>
          </div>

          {/* Right: Core Daily Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sync to AlgoCraft Tasks */}
            <button
              onClick={handleSyncToHabits}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition active:scale-[0.98]"
              title="Sync today's scheduled tasks to your /tasks widget"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync to Tasks</span>
            </button>

            {/* Take Rest Day */}
            <button
              onClick={handleTakeRestDay}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#141923] hover:bg-amber-950/30 border border-[#1E293B] hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-xs font-medium transition"
              title="Postpone today's tasks smoothly without penalty"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Rest Day</span>
            </button>

            {/* Revert / Undo */}
            <button
              onClick={handleUndo}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#141923] hover:bg-[#181F2E] border border-[#1E293B] text-zinc-300 text-xs font-medium transition"
              title="Undo last schedule update"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            {/* Sprint Settings & Generator Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Sliders className="w-3.5 h-3.5 fill-black" />
              <span>Sprint Settings</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATOR - Full Width Modern Pills */}
        <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#141923] border border-[#1E293B] shrink-0">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "today"
                  ? "bg-[#1E293B] text-white shadow-sm font-bold border border-[#334155]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Today&apos;s Battle Plan</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  activeTab === "today"
                    ? "bg-[#10141E] text-white border border-[#1E293B] font-bold"
                    : "bg-[#10141E] text-zinc-300 border border-[#1E293B] font-medium"
                }`}
              >
                {todayCompletedCount}/{todayTasksCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "timeline"
                  ? "bg-[#1E293B] text-white shadow-sm font-bold border border-[#334155]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sprint Timeline</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  activeTab === "timeline"
                    ? "bg-[#10141E] text-white border border-[#1E293B] font-bold"
                    : "bg-[#10141E] text-zinc-300 border border-[#1E293B] font-medium"
                }`}
              >
                W{activeWeek}/{plan.metadata.totalWeeks}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "analytics"
                  ? "bg-[#1E293B] text-white shadow-sm font-bold border border-[#334155]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-pink-400" />
              <span>Readiness &amp; Heatmap</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  activeTab === "analytics"
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold"
                    : "bg-[#10141E] text-zinc-300 border border-[#1E293B] font-medium"
                }`}
              >
                {metrics.readinessScore}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab("backlog")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "backlog"
                  ? "bg-[#1E293B] text-white shadow-sm font-bold border border-[#334155]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Debt &amp; Backlog</span>
              {metrics.backlogList.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                  {metrics.backlogList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "json"
                  ? "bg-[#1E293B] text-white shadow-sm font-bold border border-[#334155]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>Plan JSON</span>
            </button>
          </div>

          {/* Quick Velocity Stat */}
          <div className="hidden sm:flex items-center space-x-3 text-xs text-zinc-400 pr-2">
            <span>Overall Completion:</span>
            <div className="w-24 bg-[#141923] rounded-full h-2 overflow-hidden border border-[#1E293B]">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.completionPct}%` }}
              />
            </div>
            <span className="font-mono font-bold text-white">{metrics.completionPct}%</span>
          </div>
        </div>

        {/* ACTIVE VIEW CONTENT AREA - FULL WIDTH */}
        <main className="space-y-6">
          {/* TAB 1: TODAY VIEW */}
          {activeTab === "today" && (
            <TodayView
              plan={plan}
              currentDayNumber={currentDayNumber}
              streaks={streaks}
              backlogTasks={metrics.backlogList}
              onUpdateTask={handleUpdateTask}
              onConfidenceSelect={handleConfidenceSelect}
              onTakeRestDay={handleTakeRestDay}
              onSyncToHabits={handleSyncToHabits}
            />
          )}

          {/* TAB 2: TIMELINE VIEW */}
          {activeTab === "timeline" && (
            <TimelineView
              plan={plan}
              activeWeek={activeWeek}
              onSelectWeek={setActiveWeek}
              onUpdateTask={handleUpdateTask}
              onConfidenceSelect={handleConfidenceSelect}
            />
          )}

          {/* TAB 3: ANALYTICS & MASTERY HEATMAP */}
          {activeTab === "analytics" && (
            <AnalyticsView
              metrics={metrics}
              targetCompany={settings.targetCompany}
              coreScheduleMode={settings.coreScheduleMode}
            />
          )}

          {/* TAB 4: BACKLOG & REBALANCER */}
          {activeTab === "backlog" && (
            <BacklogView
              backlogList={metrics.backlogList}
              debtHours={metrics.debtHours}
              onExecuteRebalance={handleExecuteRebalance}
              onCompleteTask={(id) => handleUpdateTask(id, { completed: true })}
              onTogglePin={(task) => handleUpdateTask(task.id, { isPinned: !task.isPinned })}
            />
          )}

          {/* TAB 5: JSON EXPORT */}
          {activeTab === "json" && (
            <JsonView plan={plan} onImportPlan={(imported) => setPlan(imported)} />
          )}
        </main>

        {/* BOTTOM UTILITY & SPRINT CONTROLS BAR */}
        <footer className="mt-8 pt-5 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sprint Day {currentDayNumber} of {plan.metadata.totalWeeks * 7}</span>
            </span>
            <span>•</span>
            <span>{metrics.completedTasks} / {metrics.totalTasks} Tasks Solved ({metrics.completionPct}%)</span>
            {parseFloat(metrics.debtHours) > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-400 font-mono font-medium">{metrics.debtHours}h Backlog Debt</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleUndo}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#10141E] hover:bg-[#141923] border border-[#1E293B] text-zinc-300 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Revert Last Action</span>
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 font-semibold transition"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Re-Simulate / Tune Sprint</span>
            </button>
          </div>
        </footer>
      </div>

      {/* SPRINT PREFERENCES & ENGINE GENERATOR MODAL */}
      <SprintSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveAndRegenerate={handleRegenerateFromModal}
        onLaunchWizard={() => setIsWizardOpen(true)}
      />

      {/* Guided Diagnostic Wizard Modal */}
      <OnboardingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
        initialSettings={settings}
      />
    </div>
  );
}
