"use client";

import React from "react";
import { BarChart3, Trophy, Target, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import { PlanMetrics } from "@/lib/planly/analytics";
import MasteryHeatmap from "./MasteryHeatmap";

interface AnalyticsViewProps {
  metrics: PlanMetrics;
  targetCompany: string;
  coreScheduleMode: string;
}

export default function AnalyticsView({
  metrics,
  targetCompany,
  coreScheduleMode
}: AnalyticsViewProps) {
  const readinessColor =
    metrics.readinessScore >= 75
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : metrics.readinessScore >= 50
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";

  return (
    <div className="space-y-6">
      {/* Top Hero: Target Company Readiness Score */}
      <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Interview Readiness Index</h2>
            <span className="text-[10px] font-mono uppercase bg-[#141923] text-zinc-300 px-2 py-0.5 rounded border border-[#1E293B]">
              {targetCompany}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Calculated by cross-referencing your solved problem count and clean confidence scores
            against {targetCompany}&apos;s specific interview topic distribution (Trees, Graphs, DP &amp; Core CS).
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-[#141923] border border-[#1E293B] px-6 py-4 rounded-2xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Readiness</span>
            <span className="text-xs text-zinc-400">Target Match</span>
          </div>
          <div
            className={`text-3xl font-extrabold font-mono px-4 py-2 rounded-xl border ${readinessColor}`}
          >
            {metrics.readinessScore}%
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#10141E] border border-[#1E293B] p-4 rounded-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
            DSA Problem Track
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{metrics.dsaCount} Problems</div>
          <span className="text-[10px] text-zinc-500">Striver A2Z progression</span>
        </div>

        <div className="bg-[#10141E] border border-[#1E293B] p-4 rounded-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
            Core CS Modules
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-400">{metrics.coreCount} Drills</div>
          <span className="text-[10px] text-zinc-500">Scheduled via {coreScheduleMode}</span>
        </div>

        <div className="bg-[#10141E] border border-[#1E293B] p-4 rounded-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
            Spaced Queue Re-attempts
          </span>
          <div className="text-2xl font-bold font-mono text-pink-400">{metrics.struggledCount} Tasks</div>
          <span className="text-[10px] text-zinc-500">Targeted 2-day revisit</span>
        </div>

        <div className="bg-[#10141E] border border-[#1E293B] p-4 rounded-xl space-y-1">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
            Accumulated Backlog Debt
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">{metrics.debtHours} Hours</div>
          <span className="text-[10px] text-zinc-500">Pending overdue tasks</span>
        </div>
      </div>

      {/* Topic Mastery Heatmap */}
      <MasteryHeatmap stats={metrics.topicMastery} />

      {/* Weekly Study Split */}
      <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
          Target Curriculum Allocation (Weekly Average)
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>DSA Coding &amp; Algorithmic Patterns</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {coreScheduleMode === "weekends" ? "70%" : "60%"}
              </span>
            </div>
            <div className="w-full bg-[#141923] rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{ width: coreScheduleMode === "weekends" ? "70%" : "60%" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Core CS (OS, DBMS, Networks, LLD)</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {coreScheduleMode === "weekends" ? "20%" : "25%"}
              </span>
            </div>
            <div className="w-full bg-[#141923] border border-[#1E293B] rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full"
                style={{ width: coreScheduleMode === "weekends" ? "20%" : "25%" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Mock Contests &amp; Buffer Consolidation</span>
              <span className="font-mono text-purple-400 font-semibold">10% - 15%</span>
            </div>
            <div className="w-full bg-[#141923] border border-[#1E293B] rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: "15%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
