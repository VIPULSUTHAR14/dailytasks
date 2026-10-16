"use client";

import React from "react";
import { TopicMasteryStat } from "@/lib/planly/analytics";
import { Brain, CheckCircle2, Sparkles, BookOpen } from "lucide-react";

interface MasteryHeatmapProps {
  stats: TopicMasteryStat[];
}

export default function MasteryHeatmap({ stats }: MasteryHeatmapProps) {
  const getBadgeStyle = (pct: number) => {
    if (pct >= 75) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold";
    if (pct >= 40) return "bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold";
    if (pct > 0) return "bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold";
    return "bg-[#10141E] text-zinc-400 border-[#1E293B] font-semibold";
  };

  const getBarFill = (pct: number) => {
    if (pct >= 75) return "bg-gradient-to-r from-emerald-500 to-teal-400";
    if (pct >= 40) return "bg-gradient-to-r from-amber-500 to-yellow-400";
    if (pct > 0) return "bg-gradient-to-r from-rose-500 to-pink-400";
    return "bg-transparent";
  };

  return (
    <div className="surface-2 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B] gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              DSA Topic Mastery Heatmap
            </h3>
            <p className="text-[11px] text-zinc-400">
              Coverage &amp; retention index across all 17 algorithmic modules
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-zinc-400">
          Weighted by clean solves &amp; spaced repetition confidence
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {stats.map((item) => {
          const totalToShow = item.totalScheduled > 0 ? item.totalScheduled : item.totalQuestions || 0;
          const isScheduled = item.totalScheduled > 0;

          return (
            <div
              key={item.id || `${item.tag}-${item.topic}`}
              className="surface-1 hover-depth spotlight rounded-xl p-3.5 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    className="text-xs font-bold text-white truncate"
                    title={item.topic}
                  >
                    {item.topic}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${getBadgeStyle(
                      item.masteryPercentage
                    )}`}
                  >
                    {item.masteryPercentage}%
                  </span>
                </div>

                {/* Progress bar with theme-safe background track */}
                <div className="w-full bg-[#10141E] rounded-full h-2 overflow-hidden border border-[#1E293B]">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getBarFill(
                      item.masteryPercentage
                    )}`}
                    style={{ width: `${Math.max(0, Math.min(100, item.masteryPercentage))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-[#1E293B] font-mono">
                <span className="font-medium">
                  {item.completed}/{totalToShow} {isScheduled ? "Done" : "in Sheet"}
                </span>

                {!isScheduled ? (
                  <span className="text-zinc-500 text-[10px]">Sheet Pool</span>
                ) : item.struggled > 0 ? (
                  <span className="text-rose-400 font-semibold">{item.struggled} struggled</span>
                ) : item.clean > 0 ? (
                  <span className="text-emerald-400 font-semibold">{item.clean} clean</span>
                ) : (
                  <span className="text-zinc-500 text-[10px]">Unstarted</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
