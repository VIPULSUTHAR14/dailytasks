"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Check,
    Plus,
    Trash2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Flame,
    TrendingUp,
    Sparkles,
    AlertCircle,
    Search,
    CheckCircle2,
    SlidersHorizontal,
    Activity
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/components/WorkspaceHeader";

export type HabitPriority = "High" | "Medium" | "Low";

export interface Habit {
    id: string;
    title: string;
    priority: HabitPriority;
    completedDates: string[]; // ISO YYYY-MM-DD
    createdAt: string;
}

const STORAGE_KEY = "algocraft_weekly_habits_v1";

// Titles of legacy inbuilt demo habits to automatically purge if encountered
const INBUILT_TITLES = new Set([
    "Solve 2 LeetCode Mediums (Arrays / DP)",
    "Read 1 System Design / Tech Architecture Case",
    "CS Fundamentals & OS / Concurrency Review",
    "Daily 30m Physical Workout / Run",
    "Push Clean Git Commit & Code Journaling",
]);

// Helper to format date as YYYY-MM-DD
function formatISODate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Generate Monday through Sunday of a reference week
function getWeekDays(referenceDate: Date, todayDate: Date = new Date()) {
    const d = new Date(referenceDate);
    const day = d.getDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const todayStr = formatISODate(todayDate);
    const shortNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const fullNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return Array.from({ length: 7 }, (_, i) => {
        const cur = new Date(monday);
        cur.setDate(monday.getDate() + i);
        const iso = formatISODate(cur);

        return {
            name: fullNames[i],
            shortName: shortNames[i],
            dateStr: iso,
            dateNum: cur.getDate(),
            monthLabel: cur.toLocaleDateString("en-US", { month: "short" }),
            isToday: iso === todayStr,
        };
    });
}

export default function WeeklyHabitTrackerPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbSynced, setIsDbSynced] = useState<boolean | null>(null);

    // Week navigation: 0 = current week, -1 = last week, +1 = next week
    const [weekOffset, setWeekOffset] = useState<number>(0);

    // Inline form state
    const [newTitle, setNewTitle] = useState("");
    const [newPriority, setNewPriority] = useState<HabitPriority>("High");
    const [inputError, setInputError] = useState("");

    // Filtering & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<"All" | HabitPriority>("All");

    // Fetch habits from MongoDB Database on mount, with graceful localStorage fallback
    useEffect(() => {
        let isMounted = true;

        async function initHabits() {
            try {
                const res = await fetch("/api/habits");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setIsDbSynced(true);
                        let loadedHabits: Habit[] = Array.isArray(data.habits) ? data.habits : [];

                        // Automatically purge legacy inbuilt habits if they exist in DB
                        const legacyHabits = loadedHabits.filter(
                            (h) => INBUILT_TITLES.has(h.title) || h.id.startsWith("habit-")
                        );
                        if (legacyHabits.length > 0) {
                            for (const legacy of legacyHabits) {
                                fetch(`/api/habits?id=${encodeURIComponent(legacy.id)}`, {
                                    method: "DELETE",
                                }).catch(() => {});
                            }
                            loadedHabits = loadedHabits.filter(
                                (h) => !INBUILT_TITLES.has(h.title) && !h.id.startsWith("habit-")
                            );
                        }

                        setHabits(loadedHabits);
                        try {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedHabits));
                        } catch {}
                        setIsHydrated(true);
                        setIsLoading(false);
                        return;
                    }
                } else {
                    // Unauthenticated (Guest mode)
                    if (isMounted) setIsDbSynced(false);
                }
            } catch (err) {
                console.warn("Could not connect to /api/habits, using local storage fallback", err);
                if (isMounted) setIsDbSynced(false);
            }

            // LocalStorage fallback for guest / offline
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        const cleanHabits = parsed.filter(
                            (h: Habit) => !INBUILT_TITLES.has(h.title) && !h.id?.startsWith("habit-")
                        );
                        if (isMounted) {
                            setHabits(cleanHabits);
                            setIsHydrated(true);
                            setIsLoading(false);
                            return;
                        }
                    }
                }
            } catch {}

            if (isMounted) {
                setHabits([]);
                setIsHydrated(true);
                setIsLoading(false);
            }
        }

        initHabits();
        return () => {
            isMounted = false;
        };
    }, []);

    // Persist habits to localStorage as offline mirror
    useEffect(() => {
        if (!isHydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
        } catch (e) {
            console.error("Failed to save habits to local storage", e);
        }
    }, [habits, isHydrated]);

    // Live reference for current real-world time (auto-refreshes on midnight / interval / window focus)
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

    useEffect(() => {
        const updateDateIfChanged = () => {
            const now = new Date();
            setCurrentDate((prev) => {
                if (formatISODate(prev) !== formatISODate(now)) {
                    return now;
                }
                return prev;
            });
        };

        const interval = setInterval(updateDateIfChanged, 30000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                updateDateIfChanged();
            }
        };
        const handleFocus = () => updateDateIfChanged();

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    // Calculate reference week date & 7-day array
    const referenceDate = useMemo(() => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + weekOffset * 7);
        return d;
    }, [currentDate, weekOffset]);

    const weekDays = useMemo(() => getWeekDays(referenceDate, currentDate), [referenceDate, currentDate]);

    // Range label for header (e.g. "Oct 5 – Oct 11, 2026")
    const weekRangeLabel = useMemo(() => {
        const first = weekDays[0];
        const last = weekDays[6];
        return `${first.monthLabel} ${first.dateNum} – ${last.monthLabel} ${last.dateNum}, ${referenceDate.getFullYear()}`;
    }, [weekDays, referenceDate]);

    // Dynamic Progress Formula:
    // (Total Completed Checks This Week / (Active Habits * 7)) * 100
    const weekStats = useMemo(() => {
        const activeHabitsCount = habits.length;
        if (activeHabitsCount === 0) {
            return {
                totalChecks: 0,
                maxPossible: 0,
                percentage: 0,
            };
        }

        const weekDateSet = new Set(weekDays.map((d) => d.dateStr));
        let totalCompletedChecks = 0;

        for (const habit of habits) {
            for (const date of habit.completedDates) {
                if (weekDateSet.has(date)) {
                    totalCompletedChecks += 1;
                }
            }
        }

        const maxPossible = activeHabitsCount * 7;
        const percentage = Math.round((totalCompletedChecks / maxPossible) * 100);

        return {
            totalChecks: totalCompletedChecks,
            maxPossible,
            percentage: Math.min(100, percentage),
        };
    }, [habits, weekDays]);

    // Toggle day checkbox for a habit (updates state immediately and syncs with MongoDB)
    const handleToggleDay = useCallback((habitId: string, dateStr: string) => {
        setHabits((prev) =>
            prev.map((habit) => {
                if (habit.id !== habitId) return habit;
                const hasDate = habit.completedDates.includes(dateStr);
                const updatedDates = hasDate
                    ? habit.completedDates.filter((d) => d !== dateStr)
                    : [...habit.completedDates, dateStr];
                return {
                    ...habit,
                    completedDates: updatedDates,
                };
            })
        );

        // Async sync to MongoDB backend
        fetch("/api/habits", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: habitId, dateStr }),
        }).catch((err) => {
            console.error("Failed to sync habit toggle to database:", err);
        });
    }, []);

    // Add new habit (updates state immediately and writes to MongoDB)
    const handleAddHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTitle.trim();
        if (!trimmed) {
            setInputError("Please enter a habit title");
            return;
        }

        setInputError("");
        const tempId = `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newHabit: Habit = {
            id: tempId,
            title: trimmed,
            priority: newPriority,
            completedDates: [],
            createdAt: new Date().toISOString(),
        };

        // Optimistic UI update
        setHabits((prev) => [newHabit, ...prev]);
        setNewTitle("");

        // Persist to MongoDB
        try {
            const res = await fetch("/api/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newHabit.title,
                    priority: newHabit.priority,
                    completedDates: newHabit.completedDates,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.habit?.id) {
                    setHabits((prev) =>
                        prev.map((h) => (h.id === tempId ? { ...h, id: data.habit.id } : h))
                    );
                }
            }
        } catch (err) {
            console.error("Failed to save habit to database:", err);
        }
    };

    // Delete habit (updates state immediately and removes from MongoDB)
    const handleDeleteHabit = useCallback(async (id: string) => {
        setHabits((prev) => prev.filter((h) => h.id !== id));

        // Delete from MongoDB
        try {
            await fetch(`/api/habits?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
        } catch (err) {
            console.error("Failed to delete habit from database:", err);
        }
    }, []);

    // Filtered habits
    const filteredHabits = useMemo(() => {
        return habits.filter((habit) => {
            if (priorityFilter !== "All" && habit.priority !== priorityFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return habit.title.toLowerCase().includes(q);
            }
            return true;
        });
    }, [habits, priorityFilter, searchQuery]);

    // Priority color tokens
    const getPriorityBadgeClass = (priority: HabitPriority) => {
        switch (priority) {
            case "High":
                return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
            case "Medium":
                return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
            case "Low":
                return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] font-sans flex flex-col md:flex-row antialiased">
            {/* Sidebar */}
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
                {/* Workspace Header with Context & Mobile Toggle */}
                <WorkspaceHeader
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                />

                <main className="p-3 sm:p-5 md:p-7 pb-20 max-w-7xl mx-auto w-full space-y-5 flex-1">
                    {/* Top View Title & Week Navigator */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                                    WEEKLY CADENCE
                                </span>
                                <span className="text-xs font-mono text-zinc-500">
                                    MON — SUN MATRIX
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                Weekly Habit Tracker
                            </h1>
                            <p className="text-xs text-zinc-400">
                                High-density execution grid. Log your daily algorithmic reps, engineering readings, and discipline.
                            </p>
                        </div>

                        {/* Week Switcher Controls */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <div className="flex items-center bg-[#10141E] border border-[#1E293B] rounded-lg p-0.5 shadow-sm">
                                <button
                                    onClick={() => setWeekOffset((prev) => prev - 1)}
                                    title="Previous Week"
                                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
                                    aria-label="Previous week"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <button
                                    onClick={() => setWeekOffset(0)}
                                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${weekOffset === 0
                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                            : "text-zinc-400 hover:text-white"
                                        }`}
                                >
                                    {weekOffset === 0 ? "Current Week" : "Jump to Today"}
                                </button>

                                <button
                                    onClick={() => setWeekOffset((prev) => prev + 1)}
                                    title="Next Week"
                                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
                                    aria-label="Next week"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            <span className="text-xs font-mono text-zinc-400 bg-[#10141E] border border-[#1E293B] px-3 py-1.5 rounded-lg hidden lg:inline-flex items-center gap-1.5">
                                <Calendar size={13} className="text-cyan-400" />
                                {weekRangeLabel}
                            </span>
                        </div>
                    </div>

                    {/* Section 1: Global Dynamic Progress Card */}
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/40 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Left: Summary Title & Quantitative Ratio */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
                                        <Activity size={13} className="text-cyan-400" />
                                        Weekly Execution Index
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500">
                                        ({weekRangeLabel})
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
                                        {weekStats.percentage}%
                                    </span>
                                    <span className="text-xs text-zinc-400 font-mono">
                                        completed ({weekStats.totalChecks} / {weekStats.maxPossible} checks)
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-400">
                                    Formula:{" "}
                                    <code className="text-cyan-400/90 font-mono text-[11px] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">
                                        (Total Checks [{weekStats.totalChecks}] / ({habits.length} Habits × 7)) × 100
                                    </code>
                                </p>
                            </div>

                            {/* Right: Quick Micro Metrics */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#0B0F17]/80 border border-[#1E293B] rounded-lg p-3 shrink-0">
                                <div className="text-center px-2">
                                    <span className="text-[10px] text-zinc-500 uppercase font-mono block">Habits</span>
                                    <span className="text-base font-bold font-mono text-white">{habits.length}</span>
                                </div>
                                <div className="text-center px-2 border-x border-[#1E293B]">
                                    <span className="text-[10px] text-zinc-500 uppercase font-mono block">Done</span>
                                    <span className="text-base font-bold font-mono text-emerald-400">{weekStats.totalChecks}</span>
                                </div>
                                <div className="text-center px-2">
                                    <span className="text-[10px] text-zinc-500 uppercase font-mono block">Status</span>
                                    <span className={`text-[11px] font-bold font-mono uppercase ${weekStats.percentage >= 80
                                            ? "text-emerald-400"
                                            : weekStats.percentage >= 50
                                                ? "text-cyan-400"
                                                : "text-amber-400"
                                        }`}>
                                        {weekStats.percentage >= 80 ? "Superb" : weekStats.percentage >= 50 ? "Steady" : "Lagging"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Dynamic Progress Bar */}
                        <div className="mt-4 pt-3 border-t border-[#1E293B]/80">
                            <div className="w-full h-2.5 bg-[#0B0F17] rounded-full overflow-hidden border border-[#1E293B] p-0.5 relative">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                                    style={{ width: `${weekStats.percentage}%` }}
                                    role="progressbar"
                                    aria-valuenow={weekStats.percentage}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Inline Creation Form & Top Toolbar */}
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-3 sm:p-4 shadow-sm">
                        <form onSubmit={handleAddHabit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
                            {/* Title Input Field */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => {
                                        setNewTitle(e.target.value);
                                        if (inputError) setInputError("");
                                    }}
                                    placeholder="Add new weekly habit (e.g. LC Graph Traversal, 20m Mock Interview, System Architecture)..."
                                    className={`w-full bg-[#0B0F17] border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${inputError ? "border-rose-500/80 focus:border-rose-500" : "border-[#1E293B] focus:border-cyan-500/60"
                                        }`}
                                />
                                {inputError && (
                                    <span className="absolute -bottom-4 left-1 text-[10px] text-rose-400 flex items-center gap-1">
                                        <AlertCircle size={10} /> {inputError}
                                    </span>
                                )}
                            </div>

                            {/* Priority Segmented Button */}
                            <div className="flex items-center gap-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg p-1 shrink-0 self-start lg:self-auto">
                                <span className="text-[10px] uppercase font-mono text-zinc-500 px-2 select-none">
                                    Priority:
                                </span>
                                {(["High", "Medium", "Low"] as HabitPriority[]).map((p) => {
                                    const isSelected = newPriority === p;
                                    let activeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
                                    if (p === "Medium") activeColor = "bg-amber-500/20 text-amber-300 border-amber-500/40";
                                    if (p === "Low") activeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

                                    return (
                                        <button
                                            type="button"
                                            key={p}
                                            onClick={() => setNewPriority(p)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer border ${isSelected
                                                    ? `${activeColor} shadow-sm font-bold`
                                                    : "border-transparent text-zinc-400 hover:text-white"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Add Button */}
                            <button
                                type="submit"
                                disabled={!newTitle.trim()}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-zinc-950 text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                            >
                                <Plus size={15} strokeWidth={2.5} />
                                <span>Add Habit</span>
                            </button>
                        </form>
                    </div>

                    {/* Section 3: Filter Bar & Density Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        {/* Priority Filter Tabs */}
                        <div className="flex items-center gap-1 bg-[#10141E] border border-[#1E293B] rounded-lg p-1 overflow-x-auto no-scrollbar">
                            {(["All", "High", "Medium", "Low"] as const).map((tab) => {
                                const isCurrent = priorityFilter === tab;
                                const count =
                                    tab === "All"
                                        ? habits.length
                                        : habits.filter((h) => h.priority === tab).length;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setPriorityFilter(tab)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${isCurrent
                                                ? "bg-[#1E293B] text-white shadow-sm"
                                                : "text-zinc-400 hover:text-white"
                                            }`}
                                    >
                                        <span>{tab}</span>
                                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isCurrent ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800 text-zinc-500"
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search & Action */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Filter habit titles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-[#10141E] border border-[#1E293B] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Section 4: Weekly Execution Grid Matrix View */}
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg shadow-black/30">
                        {/* Table Overflow Wrapper */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[760px]">
                                <thead>
                                    <tr className="bg-[#0D121B] border-b border-[#1E293B] text-xs font-semibold text-zinc-400 select-none">
                                        {/* Habit Details Column */}
                                        <th className="py-3 px-4 w-[38%] min-w-[240px]">
                                            <div className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono text-zinc-400">
                                                <span>Active Habit</span>
                                                <span className="text-zinc-600 font-normal">({filteredHabits.length})</span>
                                            </div>
                                        </th>

                                        {/* 7 Days: Mon through Sun */}
                                        {weekDays.map((day) => (
                                            <th
                                                key={day.dateStr}
                                                className={`py-2 px-1 text-center w-[8%] transition-colors ${day.isToday ? "bg-cyan-500/[0.08]" : ""
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className={`text-[11px] font-mono ${day.isToday ? "text-cyan-400 font-bold" : "text-zinc-400"
                                                        }`}>
                                                        {day.shortName}
                                                    </span>
                                                    <span className={`text-[12px] font-mono leading-none mt-0.5 ${day.isToday
                                                            ? "bg-cyan-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded-full"
                                                            : "text-zinc-300 font-medium"
                                                        }`}>
                                                        {day.dateNum}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}

                                        {/* Row Progress Metric */}
                                        <th className="py-3 px-3 text-center w-[9%] uppercase tracking-wider text-[10px] font-mono text-zinc-400">
                                            Weekly
                                        </th>

                                        {/* Delete / Archive Column */}
                                        <th className="py-3 px-3 text-right w-[5%] uppercase tracking-wider text-[10px] font-mono text-zinc-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#1E293B]/70 text-xs">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={10} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2 text-zinc-500">
                                                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-xs font-mono text-zinc-400">Connecting & loading habits from database...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredHabits.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-14 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto text-zinc-500">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-[#1E293B] flex items-center justify-center text-zinc-400">
                                                        <Sparkles size={18} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-zinc-300">
                                                            {habits.length === 0 ? "No active habits found" : "No habits match current filter"}
                                                        </p>
                                                        <p className="text-xs text-zinc-500">
                                                            {habits.length === 0
                                                                ? "Add your first habit using the input bar above."
                                                                : "Try switching priority filters or clearing your search query."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHabits.map((habit) => {
                                            // Compute this habit's completed count for the current visible week
                                            const completedThisWeek = weekDays.filter((d) =>
                                                habit.completedDates.includes(d.dateStr)
                                            ).length;

                                            const habitWeekPercent = Math.round((completedThisWeek / 7) * 100);

                                            return (
                                                <tr
                                                    key={habit.id}
                                                    className="hover:bg-[#141923] transition-colors group"
                                                >
                                                    {/* Title & Priority Pill */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <span
                                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${getPriorityBadgeClass(
                                                                    habit.priority
                                                                )}`}
                                                            >
                                                                {habit.priority}
                                                            </span>
                                                            <span className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-cyan-200 transition-colors">
                                                                {habit.title}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* 7 Interactive Checkboxes */}
                                                    {weekDays.map((day) => {
                                                        const isChecked = habit.completedDates.includes(day.dateStr);

                                                        return (
                                                            <td
                                                                key={day.dateStr}
                                                                className={`py-2 px-1 text-center align-middle transition-colors ${day.isToday ? "bg-cyan-500/[0.04]" : ""
                                                                    }`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleDay(habit.id, day.dateStr)}
                                                                    title={`${isChecked ? "Uncheck" : "Check"} ${habit.title} for ${day.name} (${day.dateStr})`}
                                                                    aria-label={`${habit.title} on ${day.name} ${day.dateStr}`}
                                                                    className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${isChecked
                                                                            ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-100 ring-1 ring-emerald-400"
                                                                            : "bg-[#0B0F17] border border-[#1E293B] text-transparent hover:border-cyan-500/50 hover:text-zinc-600 hover:scale-105"
                                                                        }`}
                                                                >
                                                                    <Check
                                                                        size={15}
                                                                        strokeWidth={3}
                                                                        className={isChecked ? "opacity-100" : "opacity-0 hover:opacity-100"}
                                                                    />
                                                                </button>
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Row Streak / Progress Ratio */}
                                                    <td className="py-2 px-3 text-center align-middle font-mono">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-xs font-bold ${completedThisWeek === 7
                                                                    ? "text-emerald-400 flex items-center gap-0.5"
                                                                    : completedThisWeek >= 4
                                                                        ? "text-cyan-400"
                                                                        : "text-zinc-400"
                                                                }`}>
                                                                {completedThisWeek === 7 && <Flame size={12} className="text-amber-400" />}
                                                                {completedThisWeek}/7
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500">
                                                                {habitWeekPercent}%
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Direct Delete / Archive Action */}
                                                    <td className="py-2 px-3 text-right align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteHabit(habit.id)}
                                                            title={`Delete habit "${habit.title}"`}
                                                            aria-label={`Delete ${habit.title}`}
                                                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Dense Footer Bar with Quick Summary */}
                <footer className="sticky bottom-0 bg-[#0B0F17]/95 backdrop-blur-sm border-t border-[#1E293B] px-4 md:px-6 py-2.5 flex items-center justify-between text-xs text-zinc-500 select-none">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400">⚡</span>
                        <span>
                            {isDbSynced === true
                                ? "MongoDB Connected • Real-time Cloud Sync"
                                : isDbSynced === false
                                ? "Local Storage Mirror (Guest Mode)"
                                : "Connecting Database..."}{" "}
                            • {habits.length} habits monitored
                        </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isDbSynced ? "bg-emerald-400 animate-pulse" : "bg-cyan-400"
                            }`}
                        />
                        <span className="text-zinc-400">Week Velocity: {weekStats.percentage}%</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
