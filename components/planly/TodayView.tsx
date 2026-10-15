"use client";

import React, { useState } from "react";
import {
  Flame,
  Coffee,
  Send,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRightCircle,
  ArrowDownToLine,
  X,
  AlertCircle
} from "lucide-react";
import { ConfidenceLevel, PlanDay, PlanTask, SprintPlan, StreakStats } from "@/lib/planly/types";
import ProblemCard from "./ProblemCard";

interface TodayViewProps {
  plan: SprintPlan;
  currentDayNumber: number;
  streaks: StreakStats;
  backlogTasks: (PlanTask & { dayNumber: number })[];
  onUpdateTask: (taskId: string, updates: Partial<PlanTask>) => void;
  onConfidenceSelect: (task: PlanTask, confidence: ConfidenceLevel) => void;
  onTakeRestDay: () => void;
  onSyncToHabits: () => void;
  onSelectDay: (dayNumber: number) => void;
  onAdvanceDay: (carryOver: boolean) => void;
  onPullBacklogToToday?: (taskId?: string) => void;
}

export default function TodayView({
  plan,
  currentDayNumber,
  streaks,
  backlogTasks,
  onUpdateTask,
  onConfidenceSelect,
  onTakeRestDay,
  onSyncToHabits,
  onSelectDay,
  onAdvanceDay,
  onPullBacklogToToday
}: TodayViewProps) {
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  // Find current day node
  let todayNode: PlanDay | undefined;
  for (const w of plan.weeks) {
    const found = w.days.find((d) => d.dayNumber === currentDayNumber);
    if (found) {
      todayNode = found;
      break;
    }
  }

  // Fallback if not found (e.g. at end of sprint)
  if (!todayNode) {
    todayNode = plan.weeks[0]?.days[0];
  }

  const totalDays = plan.metadata.totalDays || plan.weeks.length * 7;
  const tasks = todayNode?.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const uncompletedCount = totalCount - completedCount;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Real-world today comparison
  const realTodayStr = new Date().toISOString().split("T")[0];
  const isViewingRealToday = todayNode?.calendarDate === realTodayStr;

  // SVG Progress Ring calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const handleNextDayClick = () => {
    if (currentDayNumber >= totalDays) return;

    if (uncompletedCount > 0) {
      setIsAdvanceModalOpen(true);
    } else {
      // If all tasks are completed, advance directly
      onAdvanceDay(false);
    }
  };

  const handleConfirmAdvance = (carryOver: boolean) => {
    setIsAdvanceModalOpen(false);
    onAdvanceDay(carryOver);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Daily Goal Ring + Streak Counter + Quick Actions */}
      <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center space-x-5 w-full md:w-auto">
          {/* Circular Progress Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-[#1E293B]"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-emerald-400 transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-extrabold font-mono text-white">{progressPct}%</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">Goal</span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h2 className="text-base font-bold text-white">Today&apos;s Focus Sprint</h2>

              {/* Day Stepper Navigator */}
              <div className="flex items-center bg-[#141923] border border-[#1E293B] rounded-lg p-0.5">
                <button
                  onClick={() => onSelectDay(Math.max(1, currentDayNumber - 1))}
                  disabled={currentDayNumber <= 1}
                  className="p-1 rounded hover:bg-[#1E293B] disabled:opacity-30 text-zinc-400 hover:text-white transition"
                  title="Previous sprint day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-2 text-emerald-400">
                  Day {todayNode?.dayNumber || 1} of {totalDays}
                </span>
                <button
                  onClick={() => onSelectDay(Math.min(totalDays, currentDayNumber + 1))}
                  disabled={currentDayNumber >= totalDays}
                  className="p-1 rounded hover:bg-[#1E293B] disabled:opacity-30 text-zinc-400 hover:text-white transition"
                  title="Next sprint day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {isViewingRealToday && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Today
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 mt-1">
              {todayNode?.isBufferDay
                ? "Sunday: Backlog Clearance & Spaced Concept Review"
                : todayNode?.isSaturday
                ? "Saturday: Timed Contest & Weekend Core CS"
                : `Weekday Session • ${completedCount}/${totalCount} Tasks Done`}
            </p>

            <div className="flex items-center space-x-3 mt-2 text-xs font-mono">
              <span className="flex items-center space-x-1 text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{streaks.currentStreak} Day Streak</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center space-x-1 text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{todayNode?.allocatedMins || 240} Mins Planned</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end flex-wrap gap-y-2">
          <button
            onClick={onTakeRestDay}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-[#141923] hover:bg-[#181F2E] text-zinc-300 border border-[#1E293B] text-xs font-medium transition"
            title="Mark today as a rest or sick day. Shifts unfinished tasks forward without penalty."
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Rest Day</span>
          </button>

          <button
            onClick={onSyncToHabits}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1E293B] hover:bg-[#283548] text-zinc-200 border border-[#334155] text-xs font-medium transition"
            title="Push today's sprint tasks directly to /tasks (habit tracker)"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync to Tasks</span>
          </button>

          {/* Complete & Next Day Action */}
          <button
            onClick={handleNextDayClick}
            disabled={currentDayNumber >= totalDays}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-40"
            title="Advance sprint to next day"
          >
            <ArrowRightCircle className="w-4 h-4 fill-black text-emerald-500" />
            <span>Complete &amp; Next Day</span>
          </button>
        </div>
      </div>

      {/* Overdue Backlog Alert Banner */}
      {backlogTasks.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You have <strong className="font-mono">{backlogTasks.length}</strong> overdue task(s) from earlier days.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {onPullBacklogToToday && (
              <button
                onClick={() => onPullBacklogToToday()}
                className="text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition"
                title="Pull overdue backlog tasks directly into today's active checklist"
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>Pull to Today</span>
              </button>
            )}
            <span className="text-[11px] font-mono bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg">
              Check Backlog Tab
            </span>
          </div>
        </div>
      )}

      {/* Today's Tasks Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Checklist for Day {todayNode?.dayNumber || currentDayNumber}</span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {todayNode?.calendarDate || realTodayStr}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-8 text-center text-zinc-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-200">All tasks completed for today!</p>
            <p className="text-xs mt-1">Great job maintaining velocity. Advance to the next day or review notes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tasks.map((task) => (
              <ProblemCard
                key={task.id}
                task={task}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onConfidenceSelect={(lvl) => onConfidenceSelect(task, lvl)}
              />
            ))}
          </div>
        )}
      </div>

      {/* DAY ADVANCE CONFIRMATION MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Advance to Sprint Day {currentDayNumber + 1}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    You have <span className="text-amber-400 font-bold">{uncompletedCount}</span> unfinished task(s) for Day {currentDayNumber}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-zinc-500 hover:text-white transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              How would you like Planly to handle the remaining tasks from today?
            </p>

            <div className="space-y-3">
              {/* Option 1: Backlog (Recommended) */}
              <button
                onClick={() => handleConfirmAdvance(false)}
                className="w-full text-left p-3.5 rounded-xl bg-[#141923] hover:bg-[#181F2E] border border-[#1E293B] hover:border-emerald-500/50 transition group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                    1. Send to Backlog (Recommended)
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Burnout-Free
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Keeps Day {currentDayNumber + 1} fresh. Remaining tasks become Backlog Debt to be cleared during Sunday revision or via Intelligent Rebalance.
                </p>
              </button>

              {/* Option 2: Carry Over */}
              <button
                onClick={() => handleConfirmAdvance(true)}
                className="w-full text-left p-3.5 rounded-xl bg-[#141923] hover:bg-[#181F2E] border border-[#1E293B] hover:border-teal-500/50 transition group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-teal-300">
                    2. Carry Over to Tomorrow
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    Immediate
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Transfers today&apos;s unfinished tasks directly into Day {currentDayNumber + 1}&apos;s checklist so you can tackle them first.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1E293B]">
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
