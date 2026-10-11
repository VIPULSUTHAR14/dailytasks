"use client";

import React from "react";
import {
  Flame,
  Coffee,
  Send,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2
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
}

export default function TodayView({
  plan,
  currentDayNumber,
  streaks,
  backlogTasks,
  onUpdateTask,
  onConfidenceSelect,
  onTakeRestDay,
  onSyncToHabits
}: TodayViewProps) {
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

  const tasks = todayNode?.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // SVG Progress Ring calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

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
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">Today&apos;s Focus Sprint</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Day {todayNode?.dayNumber || 1}
              </span>
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
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onTakeRestDay}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#141923] hover:bg-[#181F2E] text-zinc-300 border border-[#1E293B] text-xs font-medium transition"
            title="Mark today as a rest or sick day. Shifts unfinished tasks forward without penalty."
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Rest / Sick Day</span>
          </button>

          <button
            onClick={onSyncToHabits}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-black text-xs font-bold transition shadow-md shadow-emerald-500/20"
            title="Push today's sprint tasks directly to /tasks (habit tracker)"
          >
            <Send className="w-3.5 h-3.5 fill-black" />
            <span>Sync to Tasks</span>
          </button>
        </div>
      </div>

      {/* Overdue Backlog Alert Banner */}
      {backlogTasks.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You have <strong className="font-mono">{backlogTasks.length}</strong> overdue task(s) from earlier days.
            </span>
          </div>
          <span className="text-[11px] font-mono bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded">
            Check Backlog Tab
          </span>
        </div>
      )}

      {/* Today's Tasks Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Checklist for Today</span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {todayNode?.calendarDate || new Date().toISOString().split("T")[0]}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-8 text-center text-zinc-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-200">All tasks completed for today!</p>
            <p className="text-xs mt-1">Great job maintaining velocity. Take time to rest or explore advanced notes.</p>
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
    </div>
  );
}
