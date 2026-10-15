"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CheckSquare,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  loadSyncedSprintTasks,
  saveSyncedSprintTasks,
  SyncedSprintTask,
} from "@/lib/planly/storage";

export interface UnifiedTodayTask {
  id: string;
  title: string;
  completed: boolean;
  source: "planly" | "custom";
  timeMins?: number;
  difficulty?: "Easy" | "Medium" | "Hard";
  problemUrl?: string;
  trackSubtitle?: string;
}

const DEFAULT_SCREENSHOT_TASKS: UnifiedTodayTask[] = [
  {
    id: "task-1",
    title: "Largest Element in an Array",
    completed: false,
    source: "planly",
    timeMins: 30,
    difficulty: "Easy",
    trackSubtitle: "Warmup · Arrays & Strings (Java)",
  },
  {
    id: "task-2",
    title: "Longest Subarray with Sum K (Pos & Neg)",
    completed: false,
    source: "planly",
    timeMins: 45,
    difficulty: "Medium",
    trackSubtitle: "Core Pattern · Arrays & Strings (Java)",
  },
  {
    id: "task-3",
    title: "Rearrange Array Elements by Sign",
    completed: false,
    source: "planly",
    timeMins: 45,
    difficulty: "Medium",
    trackSubtitle: "Deep Application · Arrays & Strings (Java)",
  },
  {
    id: "task-4",
    title: "String to Integer (atoi)",
    completed: false,
    source: "planly",
    timeMins: 45,
    difficulty: "Medium",
    trackSubtitle: "Deep Application · Strings (Java)",
  },
  {
    id: "task-5",
    title: "Rotate Array by D Places (Left)",
    completed: false,
    source: "planly",
    timeMins: 45,
    difficulty: "Medium",
    trackSubtitle: "Deep Application · Arrays & Strings (Java)",
  },
  {
    id: "task-6",
    title: "Middle of the Linked List",
    completed: false,
    source: "planly",
    timeMins: 30,
    difficulty: "Easy",
    trackSubtitle: "Core Pattern · Linked List (Java)",
  },
];

export default function PlanlyTodayTasksCard() {
  const [tasks, setTasks] = useState<UnifiedTodayTask[]>(DEFAULT_SCREENSHOT_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const loadAllTodayTasks = useCallback(async () => {
    try {
      const sprintTasks: SyncedSprintTask[] = loadSyncedSprintTasks();

      if (sprintTasks && sprintTasks.length > 0) {
        const mappedSprint: UnifiedTodayTask[] = sprintTasks.map((st) => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
          source: "planly",
          timeMins: st.timeMins || 45,
          difficulty: (st.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
          problemUrl: st.problemUrl,
          trackSubtitle: `${st.subject || "DSA"} · ${st.track || "Sprint"} (Java)`,
        }));
        setTasks(mappedSprint);
      }
    } catch (err) {
      console.error("Error loading today tasks:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (active) {
        await loadAllTodayTasks();
      }
    };
    run();

    const handleSync = () => loadAllTodayTasks();
    window.addEventListener("algocraft-planly-sync-updated", handleSync);
    return () => {
      active = false;
      window.removeEventListener("algocraft-planly-sync-updated", handleSync);
    };
  }, [loadAllTodayTasks]);

  const toggleTask = (task: UnifiedTodayTask) => {
    const updatedStatus = !task.completed;
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: updatedStatus } : t
    );
    setTasks(updated);

    if (task.source === "planly") {
      const sprintTasks = loadSyncedSprintTasks();
      const updatedSprint = sprintTasks.map((st) =>
        st.id === task.id || st.title.toLowerCase() === task.title.toLowerCase()
          ? { ...st, completed: updatedStatus }
          : st
      );
      saveSyncedSprintTasks(updatedSprint);
    }
  };

  const removeTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);

    if (target?.source === "planly") {
      const sprintTasks = loadSyncedSprintTasks().filter((st) => st.id !== taskId);
      saveSyncedSprintTasks(sprintTasks);
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const newTask: UnifiedTodayTask = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      source: "custom",
      timeMins: 30,
      difficulty: "Medium",
      trackSubtitle: "Custom Practice · General",
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="group rounded-2xl bg-[#10141E]/90 border border-white/[0.08] p-5 backdrop-blur-xl shadow-xl hover:border-white/15 transition-all flex flex-col justify-between h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CheckSquare className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-none">
                Planly Today Tasks
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Algorithmic execution board</p>
            </div>
          </div>

          <Link
            href="/planly"
            className="text-xs px-2.5 py-1 rounded-lg bg-[#141923] hover:bg-[#1E2430] border border-white/10 text-cyan-300 font-semibold transition-all flex items-center gap-1"
          >
            <span>AI Sprint</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Progress Tracker */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Daily Target Progress</span>
            <span className="font-mono font-bold text-cyan-300">
              {completedCount}/{totalCount} completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-cyan-400"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-[#181C24] text-white border border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === "pending"
                ? "bg-[#181C24] text-white border border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === "completed"
                ? "bg-[#181C24] text-white border border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Task Checklist Items */}
        <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`group/task flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  task.completed
                    ? "bg-[#0B0F17]/40 border-white/5 opacity-50"
                    : "bg-[#0B0F17]/80 hover:bg-[#0E131F] border-white/5 hover:border-white/10"
                }`}
              >
                {/* Checkbox + Title + Meta */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTask(task)}
                    className="mt-0.5 shrink-0 text-zinc-500 hover:text-cyan-400 transition-colors"
                    title={task.completed ? "Mark pending" : "Mark completed"}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
                    ) : (
                      <div className="w-4 h-4 rounded-md border border-zinc-600 hover:border-cyan-400 transition-colors mt-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      onClick={() => toggleTask(task)}
                      className={`text-xs font-bold cursor-pointer transition-all ${
                        task.completed
                          ? "line-through text-zinc-500"
                          : "text-white group-hover/task:text-cyan-200"
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                      <span className="text-zinc-500 font-mono">
                        {task.trackSubtitle || "Arrays & Strings (Java)"}
                      </span>
                      {task.timeMins && (
                        <span className="text-zinc-500 font-mono flex items-center gap-0.5">
                          • ⏱ {task.timeMins}m
                        </span>
                      )}
                      {task.difficulty && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                            task.difficulty === "Easy"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : task.difficulty === "Medium"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {task.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove task */}
                <button
                  onClick={() => removeTask(task.id)}
                  className="opacity-0 group-hover/task:opacity-100 p-1 text-zinc-600 hover:text-rose-400 transition-opacity"
                  title="Remove task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Inline Quick Add Input */}
      <form onSubmit={handleAddNewTask} className="mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="+ Add a new task (e.g. Invert Binary Tree)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#0B0F17] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="px-3.5 py-2 rounded-xl bg-[#181C24] text-white text-xs font-semibold hover:bg-white/10 border border-white/10 disabled:opacity-30 transition-all flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </form>
    </motion.div>
  );
}
