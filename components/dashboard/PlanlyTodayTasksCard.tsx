"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Code2,
  Zap,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loadPlanlyState,
  savePlanlyState,
  loadSyncedSprintTasks,
  saveSyncedSprintTasks,
} from "@/lib/planly/storage";
import { syncCurrentDayWithCalendar } from "@/lib/planly/progression";
import { PlanDay, PlanTask, PlanlyState, SprintPlan } from "@/lib/planly/types";

export interface TodayTaskItem {
  id: string;
  planTaskId: string;
  title: string;
  track: string;
  subject: string;
  details: string[];
  timeMins: number;
  completed: boolean;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
  problemUrl?: string;
  videoUrl?: string;
  intuitionHint?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  topicId?: string;
}

// Canonical algorithmic fallback tasks if user hasn't initialized custom sprint plan yet
const FALLBACK_TODAY_TASKS: TodayTaskItem[] = [
  {
    id: "task-1",
    planTaskId: "task-1",
    title: "Largest Element in an Array",
    track: "Warmup",
    subject: "Arrays & Strings (Java)",
    details: ["Iterative scan", "O(N) single pass"],
    timeMins: 30,
    completed: false,
    difficulty: "Easy",
    pattern: "Single Pass Traversal",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    problemUrl: "https://leetcode.com/problems/largest-element-in-an-array/",
    topicId: "arrays-strings",
  },
  {
    id: "task-2",
    planTaskId: "task-2",
    title: "Longest Subarray with Sum K (Pos & Neg)",
    track: "Core Pattern",
    subject: "Arrays & Strings (Java)",
    details: ["Prefix Sum + Hash Map", "Zero-index handling"],
    timeMins: 45,
    completed: false,
    difficulty: "Medium",
    pattern: "Prefix Sum & Hash Map",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    problemUrl: "https://leetcode.com/problems/subarray-sum-equals-k/",
    topicId: "arrays-strings",
  },
  {
    id: "task-3",
    planTaskId: "task-3",
    title: "Rearrange Array Elements by Sign",
    track: "Deep Application",
    subject: "Arrays & Strings (Java)",
    details: ["Two-pointer placement", "Positive & negative interleaving"],
    timeMins: 45,
    completed: false,
    difficulty: "Medium",
    pattern: "Two Pointers",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    problemUrl: "https://leetcode.com/problems/rearrange-array-elements-by-sign/",
    topicId: "arrays-strings",
  },
  {
    id: "task-4",
    planTaskId: "task-4",
    title: "String to Integer (atoi)",
    track: "Deep Application",
    subject: "Strings (Java)",
    details: ["Sign handling", "Overflow clamping", "Whitespace trimming"],
    timeMins: 45,
    completed: false,
    difficulty: "Medium",
    pattern: "State Machine / Parsing",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    problemUrl: "https://leetcode.com/problems/string-to-integer-atoi/",
    topicId: "arrays-strings",
  },
  {
    id: "task-5",
    planTaskId: "task-5",
    title: "Rotate Array by D Places (Left)",
    track: "Deep Application",
    subject: "Arrays & Strings (Java)",
    details: ["Triple reverse algorithm", "Modular shift"],
    timeMins: 45,
    completed: false,
    difficulty: "Medium",
    pattern: "Reversal Algorithm",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    problemUrl: "https://leetcode.com/problems/rotate-array/",
    topicId: "arrays-strings",
  },
  {
    id: "task-6",
    planTaskId: "task-6",
    title: "Middle of the Linked List",
    track: "Core Pattern",
    subject: "Linked List (Java)",
    details: ["Fast & slow pointers (Tortoise & Hare)"],
    timeMins: 30,
    completed: false,
    difficulty: "Easy",
    pattern: "Fast & Slow Pointers",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    problemUrl: "https://leetcode.com/problems/middle-of-the-linked-list/",
    topicId: "linked-list",
  },
];

export default function PlanlyTodayTasksCard() {
  const router = useRouter();
  const [planlyState, setPlanlyState] = useState<PlanlyState | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamic calendar resolution for today's tasks
  const refreshTodayTasks = useCallback(() => {
    try {
      const state = loadPlanlyState();
      if (!state || !state.plan) {
        setIsLoaded(true);
        return;
      }

      setPlanlyState(state);

      // Auto-sync calendar day with real-world date
      const syncResult = syncCurrentDayWithCalendar(state.plan, state.currentDayNumber || 1);

      // If the day advanced to the next day, persist the state immediately
      if (syncResult.changed) {
        const updatedState: PlanlyState = {
          ...state,
          currentDayNumber: syncResult.resolvedDay,
          updatedAt: new Date().toISOString(),
        };
        savePlanlyState(updatedState);
        setPlanlyState(updatedState);
      }
    } catch (err) {
      console.error("Failed to load today's sprint tasks:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Initialize and attach automatic daily sync listeners
  useEffect(() => {
    refreshTodayTasks();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshTodayTasks();
      }
    };

    const interval = setInterval(refreshTodayTasks, 60000);

    window.addEventListener("algocraft-planly-sync-updated", refreshTodayTasks);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("algocraft-planly-sync-updated", refreshTodayTasks);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshTodayTasks]);

  // Extract ONLY today's tasks from the active Sprint day
  const todayTasks: TodayTaskItem[] = useMemo(() => {
    if (!planlyState?.plan?.weeks) {
      return FALLBACK_TODAY_TASKS;
    }

    const currentDay = planlyState.currentDayNumber || 1;
    let foundDay: PlanDay | null = null;

    for (const w of planlyState.plan.weeks) {
      const d = w.days.find((day) => day.dayNumber === currentDay);
      if (d) {
        foundDay = d;
        break;
      }
    }

    if (!foundDay || !foundDay.tasks || foundDay.tasks.length === 0) {
      return FALLBACK_TODAY_TASKS;
    }

    return foundDay.tasks.map((t) => ({
      id: t.id,
      planTaskId: t.id,
      title: t.title,
      track: t.track || "Practice",
      subject: t.subject || "Algorithms",
      details: t.details || [],
      timeMins: t.timeMins || 45,
      completed: !!t.completed,
      difficulty: t.difficulty || "Medium",
      problemUrl: t.problemUrl,
      videoUrl: t.videoUrl,
      intuitionHint: t.intuitionHint,
      pattern: t.pattern,
      timeComplexity: t.timeComplexity,
      spaceComplexity: t.spaceComplexity,
      topicId: t.topicId,
    }));
  }, [planlyState]);

  // Toggle completion in real-time
  const handleToggleTask = (task: TodayTaskItem) => {
    const nextCompleted = !task.completed;

    if (planlyState?.plan) {
      const currentDay = planlyState.currentDayNumber || 1;
      const updatedWeeks = planlyState.plan.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => {
          if (d.dayNumber !== currentDay) return d;
          return {
            ...d,
            tasks: d.tasks.map((t) =>
              t.id === task.planTaskId || t.title.toLowerCase() === task.title.toLowerCase()
                ? { ...t, completed: nextCompleted }
                : t
            ),
          };
        }),
      }));

      const updatedPlan: SprintPlan = {
        ...planlyState.plan,
        weeks: updatedWeeks,
      };

      const updatedState: PlanlyState = {
        ...planlyState,
        plan: updatedPlan,
        updatedAt: new Date().toISOString(),
      };

      savePlanlyState(updatedState);
      setPlanlyState(updatedState);
    }

    // Two-way sync to synced store & dispatch global event
    try {
      const existing = loadSyncedSprintTasks();
      const updatedExisting = existing.map((st) =>
        st.planTaskId === task.planTaskId || st.title.toLowerCase() === task.title.toLowerCase()
          ? { ...st, completed: nextCompleted }
          : st
      );
      saveSyncedSprintTasks(updatedExisting);
    } catch {}
  };

  // Open problem directly in DSA Sheet with auto-selection
  const handleOpenInDsaSheet = (task: TodayTaskItem) => {
    const titleParts = task.title.split(":");
    const questionName = (titleParts[titleParts.length - 1] || task.title).trim();
    const topicParam = task.topicId ? `&topic=${encodeURIComponent(task.topicId)}` : "";
    router.push(`/dsaquestions?q=${encodeURIComponent(questionName)}${topicParam}`);
  };

  // Metrics
  const totalCount = todayTasks.length;
  const completedCount = todayTasks.filter((t) => t.completed).length;

  // Filter tasks
  const filteredTasks = todayTasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)]/95 border border-[var(--border-subtle)] p-4 sm:p-4.5 shadow-xl backdrop-blur-xl transition-all flex flex-col justify-between h-full select-none">
      {/* Ambient soft glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-[rgb(var(--accent-rgb)/0.06)] blur-2xl pointer-events-none rounded-full -mr-12 -mt-12" />

      <div className="relative z-10">
        {/* ================= COMPACT HEADER WITH INLINE FILTER PILLS ================= */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
          {/* Title & Count Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[rgb(var(--accent-rgb)/0.12)] text-[rgb(var(--accent-rgb))] border border-[rgb(var(--accent-rgb)/0.25)] shadow-sm shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight truncate">
              Planly Today Tasks
            </h3>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--card)] text-[rgb(var(--accent-rgb))] border border-[var(--border-subtle)] shrink-0">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Compact Filter Tabs */}
          <div className="flex items-center bg-[var(--card)] border border-[var(--border-subtle)] rounded-lg p-0.5 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[var(--surface)] text-[var(--foreground)] font-bold shadow-xs border border-[var(--border-subtle)]"
                  : "text-zinc-400 hover:text-[var(--foreground)]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                filter === "pending"
                  ? "bg-[var(--surface)] text-[var(--foreground)] font-bold shadow-xs border border-[var(--border-subtle)]"
                  : "text-zinc-400 hover:text-[var(--foreground)]"
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                filter === "completed"
                  ? "bg-[var(--surface)] text-[var(--foreground)] font-bold shadow-xs border border-[var(--border-subtle)]"
                  : "text-zinc-400 hover:text-[var(--foreground)]"
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        {/* ================= COMPACT TASK ITEMS ================= */}
        <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`group/task relative overflow-hidden rounded-xl border transition-all duration-150 ${
                  task.completed
                    ? "bg-[var(--card)]/40 border-[var(--border-subtle)]/60 opacity-60"
                    : "bg-[var(--card)]/75 hover:bg-[var(--card)] border-[var(--border-subtle)] hover:border-[rgb(var(--accent-rgb)/0.4)] shadow-xs"
                }`}
              >
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className="shrink-0 text-zinc-500 hover:text-[rgb(var(--accent-rgb))] transition-colors cursor-pointer focus:outline-none"
                    title={task.completed ? "Mark pending" : "Mark completed"}
                    aria-label={`Toggle ${task.title}`}
                  >
                    {task.completed ? (
                      <div className="w-4.5 h-4.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[rgb(var(--accent-rgb))] transition-all" />
                    )}
                  </button>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <p
                      onClick={() => handleToggleTask(task)}
                      className={`text-xs font-bold cursor-pointer transition-colors leading-tight truncate ${
                        task.completed
                          ? "line-through text-zinc-500"
                          : "text-[var(--foreground)] group-hover/task:text-[rgb(var(--accent-rgb))]"
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                      <span className="text-zinc-400 font-mono">
                        {task.track} · {task.subject}
                      </span>

                      {task.timeMins && (
                        <span className="text-zinc-500 font-mono flex items-center gap-0.5">
                          • {task.timeMins}m
                        </span>
                      )}

                      {task.difficulty && (
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded font-mono ${
                            task.difficulty === "Easy"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : task.difficulty === "Medium"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {task.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: DSA Sheet Button + LeetCode */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenInDsaSheet(task)}
                      title="Open in DSA Sheet"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[rgb(var(--accent-rgb)/0.12)] hover:bg-[rgb(var(--accent-rgb)/0.22)] text-[rgb(var(--accent-rgb))] border border-[rgb(var(--accent-rgb)/0.25)] transition-all cursor-pointer shadow-xs group/btn"
                    >
                      <Code2 className="w-3 h-3 transition-transform group-hover/btn:scale-110" />
                      <span>DSA Sheet</span>
                    </button>

                    {task.problemUrl && (
                      <a
                        href={task.problemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open on LeetCode"
                        className="p-1 rounded-lg text-zinc-400 hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ================= COMPACT FOOTER ================= */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-zinc-400">
        <span>
          {completedCount === totalCount
            ? "All tasks completed!"
            : `${totalCount - completedCount} problem(s) remaining`}
        </span>

        <Link
          href="/dsaquestions"
          className="font-semibold text-[rgb(var(--accent-rgb))] hover:underline flex items-center gap-0.5 transition-all"
        >
          <span>Question Matrix</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
