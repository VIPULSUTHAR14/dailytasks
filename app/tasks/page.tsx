"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    CheckCircle2, Circle, Plus, Trash2, Menu, X, Loader2,
    Search, Pin, Edit3, Eye, Clock, Calendar, AlertTriangle,
    SlidersHorizontal, ArrowRight, Check, Sparkles, LayoutList,
    Kanban, Hash, Tag, ArrowUpRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/components/WorkspaceHeader";

type TaskPriority = "High Priority" | "Medium Priority" | "Low Priority";

type TaskMeta = {
    priority?: TaskPriority;
    tag?: string;
    estDuration?: string;
    subFocus?: string;
    complexity?: string;
    completedAt?: string;
};

type Task = {
    _id?: string;
    user_id?: string;
    created_at?: string;
    task: {
        title: string;
        status: "pending" | "completed";
        updated_at?: string;
        meta?: TaskMeta;
    };
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"today" | "all" | "pending" | "completed">("today");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "board">("list");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);

    // Form states for new task
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("High Priority");
    const [newTaskTag, setNewTaskTag] = useState("#DSA-Arrays");
    const [newTaskEst, setNewTaskEst] = useState("45m");
    const [newTaskSubFocus, setNewTaskSubFocus] = useState("Sliding Window Optimization");

    const router = useRouter();

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/task`);
            if (res.ok) {
                const data = await res.json();
                if (data.tasks && data.tasks.length > 0) {
                    setTasks(data.tasks);
                } else {
                    // Seed initial realistic AlgoCraft data if user's account has empty tasks
                    const initialAlgoTasks: Task[] = [
                        {
                            created_at: new Date().toISOString(),
                            task: {
                                title: "new task",
                                status: "pending",
                                meta: {
                                    priority: "High Priority",
                                    tag: "#DSA-Arrays",
                                    estDuration: "Est. 45m",
                                    subFocus: "Sliding Window Optimization"
                                }
                            }
                        },
                        {
                            created_at: new Date(Date.now() - 3600000).toISOString(),
                            task: {
                                title: "Solve LC #206 Reverse Linked List (Iterative & Recursive)",
                                status: "completed",
                                meta: {
                                    priority: "Medium Priority",
                                    tag: "#LinkedList",
                                    estDuration: "18 mins recorded",
                                    complexity: "O(1) Memory",
                                    completedAt: "Finished 08:30 AM"
                                }
                            }
                        }
                    ];
                    setTasks(initialAlgoTasks);
                }
            } else {
                setTasks([]);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Keyboard Shortcuts: 'N' to open modal, 'Tab' to cycle filter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

            if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setModalOpen(true);
            }
            if (e.key === "Tab" && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setFilter((prev) => {
                    if (prev === "today") return "all";
                    if (prev === "all") return "pending";
                    if (prev === "pending") return "completed";
                    return "today";
                });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const toggleStatus = async (targetTask: Task) => {
        const newStatus = targetTask.task.status === "pending" ? "completed" : "pending";

        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) =>
                t.task.title === targetTask.task.title
                    ? {
                          ...t,
                          task: {
                              ...t.task,
                              status: newStatus,
                              meta: {
                                  ...t.task.meta,
                                  completedAt: newStatus === "completed" ? "Finished Just Now" : undefined,
                              },
                          },
                      }
                    : t
            )
        );

        try {
            await fetch(`/api/task`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task: {
                        title: targetTask.task.title,
                        status: newStatus,
                    },
                }),
            });
        } catch (e) {
            console.error("Failed to toggle task status:", e);
            fetchTasks();
        }
    };

    const deleteTask = async (title: string) => {
        setTasks((prev) => prev.filter((t) => t.task.title !== title));
        try {
            await fetch(`/api/task?title=${encodeURIComponent(title)}`, {
                method: "DELETE",
            });
        } catch (e) {
            console.error("Failed to delete task:", e);
            fetchTasks();
        }
    };

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTaskItem: Task = {
            created_at: new Date().toISOString(),
            task: {
                title: newTaskTitle.trim(),
                status: "pending",
                meta: {
                    priority: newTaskPriority,
                    tag: newTaskTag.startsWith("#") ? newTaskTag : `#${newTaskTag}`,
                    estDuration: `Est. ${newTaskEst}`,
                    subFocus: newTaskSubFocus,
                },
            },
        };

        setTasks((prev) => [newTaskItem, ...prev]);
        setModalOpen(false);
        setNewTaskTitle("");

        try {
            await fetch("/api/task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task: {
                        title: newTaskItem.task.title,
                        status: "pending",
                    },
                }),
            });
        } catch (e) {
            console.error(e);
        }
    };

    // Filter logic
    const todayTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (!t.created_at) return true;
            return new Date(t.created_at).toDateString() === new Date().toDateString();
        });
    }, [tasks]);

    const completedTodayCount = useMemo(() => {
        return todayTasks.filter((t) => t.task.status === "completed").length;
    }, [todayTasks]);

    const activeQueueCount = useMemo(() => {
        return tasks.filter((t) => t.task.status === "pending").length;
    }, [tasks]);

    const archivedCount = useMemo(() => {
        return tasks.filter((t) => t.task.status === "completed").length;
    }, [tasks]);

    const dailyGoalTarget = 4;
    const dailyGoalPercent = Math.min(100, Math.round((completedTodayCount / dailyGoalTarget) * 100));

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            // Tab filter
            if (filter === "today") {
                if (t.created_at && new Date(t.created_at).toDateString() !== new Date().toDateString()) {
                    return false;
                }
            } else if (filter === "pending" && t.task.status !== "pending") {
                return false;
            } else if (filter === "completed" && t.task.status !== "completed") {
                return false;
            }

            // Priority filter
            if (priorityFilter !== "all") {
                if (t.task.meta?.priority !== priorityFilter) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = t.task.title.toLowerCase().includes(q);
                const matchTag = t.task.meta?.tag?.toLowerCase().includes(q);
                const matchSub = t.task.meta?.subFocus?.toLowerCase().includes(q);
                if (!matchTitle && !matchTag && !matchSub) return false;
            }

            return true;
        });
    }, [tasks, filter, priorityFilter, searchQuery]);

    return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] font-sans flex flex-col md:flex-row">
            {/* Sidebar */}
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
                {/* Top Persistent Contextual Header */}
                <WorkspaceHeader
                    newActionLabel="New Task"
                    onNewAction={() => setModalOpen(true)}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                >
                    {/* View Switcher: List vs Board */}
                    <div className="flex items-center bg-[#10141E] border border-[#1E293B] rounded-lg p-0.5 mr-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                                viewMode === "list"
                                    ? "bg-[#1E293B] text-white shadow-sm"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <LayoutList size={13} />
                            <span>List</span>
                        </button>
                        <button
                            onClick={() => setViewMode("board")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                                viewMode === "board"
                                    ? "bg-[#1E293B] text-white shadow-sm"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <Kanban size={13} />
                            <span>Board</span>
                        </button>
                    </div>
                </WorkspaceHeader>

                <main className="p-4 sm:p-6 md:p-8 pb-16 md:pb-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
                    {/* Page Header Title Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                                    SPRINT PROTOCOL
                                </span>
                                <span className="text-xs font-mono text-zinc-500">SYS.ID: #TASK-8821</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                Task Manager View
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Keep track of your latest algorithmic milestones, practice sprints, and pending items.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                            >
                                <Plus size={15} strokeWidth={2.5} />
                                <span>+ New Task</span>
                            </button>
                        </div>
                    </div>

                    {/* Operational Health Deck & Focus Area Cards Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Operational Health Deck (Left Card) */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-black/40">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-3">
                                    <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                                        OPERATIONAL HEALTH
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                                        <AlertTriangle size={12} />
                                        Incomplete Backlog
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-white tracking-tight">Dashboard Progress</h3>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                    {completedTodayCount} / {todayTasks.length} COMPLETED TODAY
                                </p>

                                <div className="grid grid-cols-3 gap-3 my-4 items-center">
                                    {/* Radial Progress Gauge */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    className="text-zinc-800"
                                                    strokeWidth="3.5"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className="text-cyan-400 transition-all duration-700"
                                                    strokeDasharray={`${dailyGoalPercent}, 100`}
                                                    strokeWidth="3.5"
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                            <span className="absolute text-xs font-bold font-mono text-white">
                                                {dailyGoalPercent}%
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Daily Goal</p>
                                            <p className="text-[10px] text-zinc-400">Target: {dailyGoalTarget} Solves</p>
                                        </div>
                                    </div>

                                    {/* Active Queue */}
                                    <div className="border-l border-[#1E293B] pl-3">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            ACTIVE QUEUE
                                        </p>
                                        <p className="text-xl font-bold font-mono text-white mt-1">{activeQueueCount}</p>
                                        <p className="text-[10px] text-zinc-400">Awaiting triage</p>
                                    </div>

                                    {/* Completed */}
                                    <div className="border-l border-[#1E293B] pl-3">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            COMPLETED
                                        </p>
                                        <p className="text-xl font-bold font-mono text-white mt-1">{archivedCount}</p>
                                        <p className="text-[10px] text-zinc-400">Archived sprints</p>
                                    </div>
                                </div>
                            </div>

                            {/* Velocity Monitor */}
                            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
                                <div className="flex-1 mr-4">
                                    <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-zinc-400">Sprint #14 Velocity (Arrays & DP)</span>
                                        <span className="font-mono text-cyan-400">1 item queued</span>
                                    </div>
                                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-400 w-1/4 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Algorithmic Focus Area Card (Right Card) */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between relative shadow-lg shadow-black/40">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-3">
                                    <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                                        ALGORITHMIC FOCUS AREA
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                        Week 4 Active
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-white tracking-tight">
                                    Dynamic Programming & Two Pointers
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                                    High correlation with Tier-1 engineering interview loops. Prioritize interval scheduling and matrix manipulation.
                                </p>

                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex items-center gap-2 bg-[#141923] border border-[#1E293B] px-3 py-1.5 rounded-lg text-xs">
                                        <Clock size={13} className="text-cyan-400" />
                                        <div>
                                            <span className="text-zinc-500 text-[10px] block">Time Allocated</span>
                                            <span className="font-semibold text-white">1h 45m planned</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-[#141923] border border-[#1E293B] px-3 py-1.5 rounded-lg text-xs font-mono">
                                        <span className="text-cyan-400 font-bold">O(N)</span>
                                        <span className="text-zinc-300">TIME TARGET</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-mono text-[11px]">Next Review: 18:00 UTC</span>
                                <button
                                    onClick={() => router.push("/notes")}
                                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                                >
                                    <span>View Study Plan</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        {/* Status Tabs */}
                        <div className="flex items-center gap-1 bg-[#10141E] border border-[#1E293B] rounded-lg p-1 overflow-x-auto no-scrollbar">
                            {(
                                [
                                    { id: "today", label: "Today", count: todayTasks.length },
                                    { id: "all", label: "All Tasks", count: tasks.length },
                                    { id: "pending", label: "Pending", count: activeQueueCount },
                                    { id: "completed", label: "Completed", count: archivedCount },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                        filter === tab.id
                                            ? "bg-[#1E293B] text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                            filter === tab.id ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800 text-zinc-500"
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search & Priority Dropdown */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Filter by keyword or #tag..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-[#10141E] border border-[#1E293B] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-2.5 py-1.5 bg-[#10141E] border border-[#1E293B] rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                            >
                                <option value="all">Priority: All</option>
                                <option value="High Priority">High</option>
                                <option value="Medium Priority">Medium</option>
                                <option value="Low Priority">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Task Feed */}
                    <div className="space-y-2 pb-16">
                        {loading ? (
                            <div className="flex items-center justify-center p-16 text-zinc-500">
                                <Loader2 className="animate-spin text-cyan-400" size={24} />
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="text-center p-16 rounded-xl border border-dashed border-[#1E293B] bg-[#10141E]/40 text-xs text-zinc-500 space-y-2">
                                <p className="font-medium text-zinc-400">No tasks found matching your filter criteria.</p>
                                <p>Press &quot;N&quot; or click &quot;+ New Task&quot; to queue a milestone.</p>
                            </div>
                        ) : (
                            filteredTasks.map((t) => {
                                const isCompleted = t.task.status === "completed";
                                const meta = t.task.meta;

                                return (
                                    <div
                                        key={t.task.title}
                                        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-150 group cursor-pointer ${
                                            isCompleted
                                                ? "bg-[#10141E]/60 border-[#1E293B]/70 hover:border-[#1E293B]"
                                                : "bg-[#10141E] border-[#1E293B] hover:border-cyan-500/40 hover:bg-[#141923]"
                                        }`}
                                        onClick={() => toggleStatus(t)}
                                    >
                                        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                                            {/* Status Circle */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStatus(t);
                                                }}
                                                className="mt-0.5 sm:mt-0 shrink-0 focus:outline-none"
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 size={18} className="text-emerald-400" />
                                                ) : (
                                                    <Circle size={18} className="text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                                                )}
                                            </button>

                                            {/* Title & Metadata */}
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`text-sm font-semibold truncate ${
                                                            isCompleted ? "text-zinc-500 line-through" : "text-white"
                                                        }`}
                                                    >
                                                        {t.task.title}
                                                    </span>

                                                    {/* Priority Badge */}
                                                    {meta?.priority && (
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                                meta.priority === "High Priority"
                                                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                                    : meta.priority === "Medium Priority"
                                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                    : "bg-zinc-800 text-zinc-400"
                                                            }`}
                                                        >
                                                            {meta.priority}
                                                        </span>
                                                    )}

                                                    {/* Tag Badge */}
                                                    {meta?.tag && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                                            {meta.tag}
                                                        </span>
                                                    )}

                                                    {/* Completed Status Badge */}
                                                    {isCompleted && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Sub-details line */}
                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 font-mono">
                                                    {isCompleted ? (
                                                        <>
                                                            <span>{meta?.completedAt || "Finished 08:30 AM"}</span>
                                                            <span>•</span>
                                                            <span>{meta?.estDuration || "18 mins recorded"}</span>
                                                            {meta?.complexity && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-cyan-400">{meta.complexity}</span>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={11} className="text-zinc-400" />
                                                                Today 10:14 AM
                                                            </span>
                                                            <span>•</span>
                                                            <span>{meta?.estDuration || "Est. 45m"}</span>
                                                            {meta?.subFocus && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-zinc-300">{meta.subFocus}</span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row Actions */}
                                        <div
                                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                title="Pin Task"
                                                className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-[#1E293B] transition-colors"
                                            >
                                                <Pin size={13} />
                                            </button>
                                            <button
                                                title="Edit Task"
                                                className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-[#1E293B] transition-colors"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                            <button
                                                onClick={() => deleteTask(t.task.title)}
                                                title="Delete Task"
                                                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded hover:bg-[#1E293B] transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>

                {/* Fixed Footer Bar */}
                <footer className="sticky bottom-0 bg-[#0B0F17]/95 backdrop-blur-sm border-t border-[#1E293B] px-4 md:px-6 py-2.5 flex items-center justify-between text-xs text-zinc-500 select-none">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400">⌘</span>
                        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#181C24] border border-[#1E293B] font-mono text-zinc-300 text-[10px]">N</kbd> anywhere to create a task, or <kbd className="px-1.5 py-0.5 rounded bg-[#181C24] border border-[#1E293B] font-mono text-zinc-300 text-[10px]">Tab</kbd> to cycle view.</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-zinc-400">System Sync: Real-time</span>
                    </div>
                </footer>
            </div>

            {/* Quick Creation Modal (Matches PRD Module 1) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl relative shadow-black/80">
                        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                <h3 className="text-base font-bold text-white tracking-tight">Create SDE Practice Task</h3>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1 rounded text-zinc-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={addTask} className="space-y-4 pt-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                                    What needs to be done?
                                </label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g. Solve LC #15 3Sum with Two Pointers"
                                    autoFocus
                                    className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-3 py-2.5 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                                        className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/60"
                                    >
                                        <option value="High Priority">High Priority</option>
                                        <option value="Medium Priority">Medium Priority</option>
                                        <option value="Low Priority">Low Priority</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                        Domain / Tag
                                    </label>
                                    <input
                                        type="text"
                                        value={newTaskTag}
                                        onChange={(e) => setNewTaskTag(e.target.value)}
                                        placeholder="#DSA-Arrays"
                                        className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-2.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/60"
                                    >
                                    </input>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                        Estimated Time
                                    </label>
                                    <input
                                        type="text"
                                        value={newTaskEst}
                                        onChange={(e) => setNewTaskEst(e.target.value)}
                                        placeholder="45m"
                                        className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/60"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                        Focus Subtopic
                                    </label>
                                    <input
                                        type="text"
                                        value={newTaskSubFocus}
                                        onChange={(e) => setNewTaskSubFocus(e.target.value)}
                                        placeholder="Sliding Window"
                                        className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/60"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white bg-[#141923] border border-[#1E293B] rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="flex-1 py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-lg shadow-lg shadow-cyan-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
