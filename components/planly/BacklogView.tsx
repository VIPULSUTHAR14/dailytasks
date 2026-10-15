"use client";

import React from "react";
import { AlertTriangle, Sparkles, CheckCircle2, Pin, ArrowDownToLine } from "lucide-react";
import { PlanTask } from "@/lib/planly/types";

interface BacklogViewProps {
  backlogList: (PlanTask & { dayNumber: number; weekNumber: number })[];
  debtHours: string;
  currentDayNumber?: number;
  onExecuteRebalance: () => void;
  onCompleteTask: (taskId: string) => void;
  onTogglePin: (task: PlanTask) => void;
  onPullBacklogTask?: (taskId: string) => void;
  onPullAllBacklog?: () => void;
}

export default function BacklogView({
  backlogList,
  debtHours,
  currentDayNumber,
  onExecuteRebalance,
  onCompleteTask,
  onTogglePin,
  onPullBacklogTask,
  onPullAllBacklog
}: BacklogViewProps) {
  const isDebtHeavy = Number(debtHours) > 3;

  return (
    <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Backlog Queue &amp; Rebalancing</h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDebtHeavy
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {isDebtHeavy ? "Behind Pace (>3h)" : "Sprint Healthy"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Tasks you missed from earlier days accumulate here. Execute an Intelligent Rebalance
            to automatically redistribute them into upcoming weekend/buffer slots without bloating weekday schedules,
            or carry them directly into today&apos;s session.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 shrink-0">
          {onPullAllBacklog && currentDayNumber && (
            <button
              onClick={onPullAllBacklog}
              disabled={backlogList.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-[#141923] hover:bg-[#1E293B] disabled:opacity-40 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center space-x-1.5 transition"
              title={`Pull all overdue debt directly into Day ${currentDayNumber}'s active checklist`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pull All to Today (Day {currentDayNumber})</span>
            </button>
          )}

          <button
            onClick={onExecuteRebalance}
            disabled={backlogList.length === 0}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Execute Intelligent Rebalance</span>
          </button>
        </div>
      </div>

      {/* Debt Velocity Metric Row */}
      <div className="bg-[#141923] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between">
        <div className="text-xs text-zinc-300">
          <span>Total Overdue Debt: </span>
          <strong className="font-mono text-amber-400 text-sm ml-1">{debtHours} Hours</strong>
        </div>
        <div className="text-xs text-zinc-400">
          <span>{backlogList.length} Task(s) Pending Resolution</span>
        </div>
      </div>

      {/* Backlog Items List */}
      {backlogList.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-200">Zero Backlog Debt</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            You are fully on track with your sprint milestones! No overdue tasks require redistribution.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {backlogList.map((t) => (
            <div
              key={`${t.id}-day-${t.dayNumber}`}
              className="bg-[#141923] border border-[#1E293B] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#334155] transition"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    Day {t.dayNumber} • Week {t.weekNumber}
                  </span>
                  <span className="text-xs font-semibold text-white truncate">{t.title}</span>
                  {t.isPinned && (
                    <span className="text-[10px] text-cyan-400 flex items-center space-x-0.5">
                      <Pin className="w-2.5 h-2.5 fill-cyan-400" />
                      <span>Pinned</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate">{t.details.join(", ")}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {onPullBacklogTask && currentDayNumber && (
                  <button
                    onClick={() => onPullBacklogTask(t.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs border border-teal-500/30 font-medium flex items-center space-x-1 transition"
                    title={`Carry over directly into Day ${currentDayNumber}'s active checklist`}
                  >
                    <ArrowDownToLine className="w-3 h-3 text-teal-400" />
                    <span>Move to Today</span>
                  </button>
                )}

                <button
                  onClick={() => onTogglePin(t)}
                  className={`p-1.5 rounded-lg border text-xs transition ${
                    t.isPinned
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                      : "bg-[#141923] text-zinc-400 border-[#1E293B] hover:text-white hover:bg-[#181F2E]"
                  }`}
                  title={t.isPinned ? "Unpin task" : "Pin task from rebalancer"}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onCompleteTask(t.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs border border-emerald-500/30 font-medium transition"
                >
                  Mark Done
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
