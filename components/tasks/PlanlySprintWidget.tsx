"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  Clock,
  Zap,
  ArrowRight,
  Trash2,
  Layers
} from "lucide-react";
import {
  loadSyncedSprintTasks,
  saveSyncedSprintTasks,
  SyncedSprintTask
} from "@/lib/planly/storage";

export default function PlanlySprintWidget() {
  const router = useRouter();
  const [tasks, setTasks] = useState<SyncedSprintTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshTasks = () => {
    const list = loadSyncedSprintTasks();
    setTasks(list);
    setIsLoaded(true);
  };

  useEffect(() => {
    refreshTasks();
    const handleSyncEvent = () => refreshTasks();
    window.addEventListener("algocraft-planly-sync-updated", handleSyncEvent);
    return () => window.removeEventListener("algocraft-planly-sync-updated", handleSyncEvent);
  }, []);

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    saveSyncedSprintTasks(updated);
  };

  const removeTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveSyncedSprintTasks(updated);
  };

  const clearAll = () => {
    setTasks([]);
    saveSyncedSprintTasks([]);
  };

  const openDsaQuestion = (task: SyncedSprintTask) => {
    // Extract clean question name from title (e.g. "Arrays & Strings: Two Sum" -> "Two Sum")
    const titleParts = task.title.split(":");
    const questionName = (titleParts[titleParts.length - 1] || task.title).trim();
    const topicParam = task.topicId ? `&topic=${encodeURIComponent(task.topicId)}` : "";
    router.push(`/dsaquestions?q=${encodeURIComponent(questionName)}${topicParam}`);
  };

  if (!isLoaded) return null;

  if (tasks.length === 0) {
    return (
      <div className="bg-[#10141E]/60 border border-[#1E293B]/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold text-zinc-200">Planly AI Sprint Workspace</span>
            <p className="text-[11px] text-zinc-500">
              No sprint tasks synced for today. Generate and sync your daily sprint roadmap from Planly.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/planly")}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#283548] text-xs text-emerald-300 font-medium transition shrink-0"
        >
          <span>Open Planly AI</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-black font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Planly AI Synced Sprint Tasks
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {completedCount}/{tasks.length} Completed
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Isolated sprint roadmap for today • Syncs seamlessly with Planly AI without altering your habits
            </p>
          </div>
        </div>

        <button
          onClick={clearAll}
          className="text-xs text-zinc-500 hover:text-rose-400 transition flex items-center space-x-1 font-mono"
          title="Clear synced sprint tasks"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tasks.map((task) => {
          const titleParts = task.title.split(":");
          const questionName = (titleParts[titleParts.length - 1] || task.title).trim();

          return (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                task.completed
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-[#0B0F17]/90 border-[#1E293B] hover:border-slate-700"
              }`}
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {task.track}
                    </span>
                    {task.difficulty && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {task.difficulty}
                      </span>
                    )}
                    {task.pattern && (
                      <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono truncate max-w-[150px]">
                        {task.pattern}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400">{task.timeMins}m</span>
                </div>

                {/* Title & Details */}
                <div className="flex items-start space-x-2.5">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-xs font-semibold ${
                        task.completed ? "line-through text-zinc-500" : "text-white"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{task.subject}</p>
                    {task.intuitionHint && (
                      <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1 italic">
                        💡 {task.intuitionHint}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]/60 text-xs">
                <button
                  onClick={() => openDsaQuestion(task)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition"
                  title="Open this question directly in AlgoCraft DSA Questions Catalog"
                >
                  <BookOpen className="w-3 h-3 text-cyan-400" />
                  <span>Study in DSA Sheet</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  {task.problemUrl && (
                    <a
                      href={task.problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-zinc-400 hover:text-white transition"
                      title="Open LeetCode problem"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400 hover:text-cyan-400" />
                    </a>
                  )}

                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition"
                    title="Remove from today"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
