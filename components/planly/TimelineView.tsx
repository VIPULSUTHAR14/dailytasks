"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Filter } from "lucide-react";
import { ConfidenceLevel, PlanTask, SprintPlan } from "@/lib/planly/types";
import ProblemCard from "./ProblemCard";

interface TimelineViewProps {
  plan: SprintPlan;
  activeWeek: number;
  onSelectWeek: (w: number) => void;
  onUpdateTask: (taskId: string, updates: Partial<PlanTask>) => void;
  onConfidenceSelect: (task: PlanTask, confidence: ConfidenceLevel) => void;
}

export default function TimelineView({
  plan,
  activeWeek,
  onSelectWeek,
  onUpdateTask,
  onConfidenceSelect
}: TimelineViewProps) {
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const currentWeek = plan.weeks.find((w) => w.weekNumber === activeWeek) || plan.weeks[0];

  return (
    <div className="space-y-4">
      {/* Week Navigator & Track Filter */}
      <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => onSelectWeek(Math.max(1, activeWeek - 1))}
            disabled={activeWeek === 1}
            className="p-1.5 rounded-lg bg-[#141923] hover:bg-[#181F2E] disabled:opacity-30 text-zinc-300 border border-[#1E293B] transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Week {activeWeek} of {plan.metadata.totalWeeks}</span>
              <span className="text-xs font-normal text-emerald-400 font-mono truncate max-w-xs">
                ({currentWeek?.weekFocus})
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Core Strategy:{" "}
              <span className="text-cyan-300 uppercase font-semibold font-mono">
                {plan.metadata.coreScheduleMode}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          {/* Week Pills */}
          <div className="flex space-x-1 overflow-x-auto py-1">
            {plan.weeks.map((w) => (
              <button
                key={w.weekNumber}
                onClick={() => onSelectWeek(w.weekNumber)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition shrink-0 ${
                  activeWeek === w.weekNumber
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                    : "bg-[#141923] text-zinc-400 hover:text-zinc-200 border border-[#1E293B]"
                }`}
              >
                W{w.weekNumber}
              </button>
            ))}
          </div>

          <button
            onClick={() => onSelectWeek(Math.min(plan.metadata.totalWeeks, activeWeek + 1))}
            disabled={activeWeek === plan.metadata.totalWeeks}
            className="p-1.5 rounded-lg bg-[#141923] hover:bg-[#181F2E] disabled:opacity-30 text-zinc-300 border border-[#1E293B] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Track Filter */}
          <div className="flex items-center space-x-1.5 bg-[#141923] border border-[#1E293B] rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none"
            >
              <option value="all" className="bg-[#141923]">All Tracks</option>
              <option value="DSA" className="bg-[#141923]">DSA Only</option>
              <option value="Core CS" className="bg-[#141923]">Core CS Only</option>
              <option value="Mock Contest" className="bg-[#141923]">Mock Contests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Day Cards for Active Week */}
      <div className="space-y-4">
        {currentWeek?.days.map((day) => {
          const filteredTasks = day.tasks.filter((t) => {
            if (trackFilter === "all") return true;
            return t.track === trackFilter;
          });

          return (
            <div
              key={day.dayNumber}
              className={`border rounded-2xl p-4 transition ${
                day.isRestDay
                  ? "bg-amber-950/10 border-amber-500/30"
                  : day.isBufferDay
                  ? "bg-[#181F2E]/90 border-purple-500/30"
                  : day.isSaturday
                  ? "bg-[#181F2E]/90 border-cyan-500/30"
                  : "bg-[#10141E] border-[#1E293B] hover:border-[#334155]"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E293B]">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                      day.isRestDay
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/35"
                        : day.isBufferDay
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/35"
                        : day.isSaturday
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/35"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                    }`}
                  >
                    Day {day.dayNumber}
                  </span>
                  <span className="text-xs text-white font-semibold">
                    {day.isRestDay
                      ? "Rest / Sick Day"
                      : day.isBufferDay
                      ? "Sunday: Buffer Clearance & Retention Review"
                      : day.isSaturday
                      ? "Saturday: Timed Sprint & Weekend Core CS"
                      : `Weekday ${day.dayOfWeek} (Focus: DSA Problem Set)`}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{day.allocatedMins} mins</span>
                </div>
              </div>

              {/* Day's Tasks Checklist */}
              {filteredTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500 italic">
                  No tasks matching the selected filter for Day {day.dayNumber}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTasks.map((task) => (
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
          );
        })}
      </div>
    </div>
  );
}
