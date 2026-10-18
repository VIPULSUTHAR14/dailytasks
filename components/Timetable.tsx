"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
    CheckCircle2, Circle, Plus, Trash2, Menu, X, LogOut, Loader2,
    Edit2, RotateCcw, Save, Trash, Clock, Play, Pause, SkipForward,
    Flame, Zap, Trophy, Shield, Eye, MoreVertical, Calendar,
    SlidersHorizontal, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import WorkspaceHeader from "@/components/WorkspaceHeader";

export type EnergyLevel = "Deep Work" | "Medium Focus" | "Rapid Drills" | "Interactive";

export type TimetableRow = {
    id?: string;
    time: string;
    duration: string;
    task: string;
    description?: string;
    tag?: string;
    sprint?: string;
    energyFocus?: EnergyLevel;
    isActiveNow?: boolean;
    completed: boolean;
};

export default function Timetable() {
    const [schedule, setSchedule] = useState<TimetableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"Today" | "Table" | "Timeline" | "Analytics">("Today");

    // Live session timer state
    const [timerSeconds, setTimerSeconds] = useState(45 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Block Form State
    const [newTime, setNewTime] = useState("09:00 AM - 10:30 AM");
    const [newDuration, setNewDuration] = useState("1h 30m");
    const [newTask, setNewTask] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newTag, setNewTag] = useState("#Focus");
    const [newEnergy, setNewEnergy] = useState<EnergyLevel>("Deep Work");
    const [newIsActive, setNewIsActive] = useState(false);

    const router = useRouter();

    // Live ticking focus timer
    useEffect(() => {
        if (!isTimerRunning) return;
        const interval = setInterval(() => {
            setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s < 10 ? "0" : ""}${s}s`;
    };

    const fetchTimetable = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/timetable");
            if (res.ok) {
                const data = await res.json();
                if (data.timetable && Array.isArray(data.timetable.schedule)) {
                    setSchedule(
                        data.timetable.schedule.map((row: TimetableRow) => ({
                            ...row,
                            completed: Boolean(row.completed),
                        }))
                    );
                } else {
                    setSchedule([]);
                }
            } else {
                setSchedule([]);
            }
        } catch (e) {
            console.error("Failed to fetch timetable", e);
            setSchedule([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable();
    }, []);

    const toggleCompleted = async (index: number) => {
        const updated = [...schedule];
        updated[index] = { ...updated[index], completed: !updated[index].completed };
        setSchedule(updated);

        try {
            await fetch("/api/timetable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ index, completed: updated[index].completed }),
            });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const resetCheckmarks = async () => {
        const reset = schedule.map((row) => ({ ...row, completed: false }));
        setSchedule(reset);

        try {
            await fetch("/api/timetable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reset: true }),
            });
        } catch (error) {
            console.error("Failed to reset timetable", error);
        }
    };

    const openAddModal = () => {
        setEditingIndex(null);
        setNewTime("09:00 AM - 10:30 AM");
        setNewDuration("1h 30m");
        setNewTask("");
        setNewDesc("");
        setNewTag("#Focus");
        setNewEnergy("Deep Work");
        setNewIsActive(schedule.length === 0);
        setIsAddModalOpen(true);
    };

    const openEditModal = (index: number) => {
        const row = schedule[index];
        if (!row) return;
        setEditingIndex(index);
        setNewTime(row.time);
        setNewDuration(row.duration);
        setNewTask(row.task);
        setNewDesc(row.description || "");
        setNewTag(row.tag || "#Focus");
        setNewEnergy(row.energyFocus || "Deep Work");
        setNewIsActive(Boolean(row.isActiveNow));
        setIsAddModalOpen(true);
    };

    const handleDeleteRow = async (index: number) => {
        const updated = schedule.filter((_, i) => i !== index);
        setSchedule(updated);
        if (editingIndex === index) {
            setIsAddModalOpen(false);
            setEditingIndex(null);
        } else if (editingIndex !== null && editingIndex > index) {
            setEditingIndex(editingIndex - 1);
        }

        try {
            await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: updated }),
            });
        } catch (error) {
            console.error("Failed to delete timetable row", error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear your entire timetable?")) return;
        setSchedule([]);
        setEditingIndex(null);
        setIsAddModalOpen(false);

        try {
            await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: [] }),
            });
        } catch (error) {
            console.error("Failed to clear timetable", error);
        }
    };

    const handleSaveBlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        let updated: TimetableRow[];

        if (editingIndex !== null) {
            updated = schedule.map((row, idx) => {
                if (idx === editingIndex) {
                    return {
                        ...row,
                        time: newTime,
                        duration: newDuration,
                        task: newTask.trim(),
                        description: newDesc.trim() || undefined,
                        tag: newTag.startsWith("#") ? newTag : `#${newTag}`,
                        energyFocus: newEnergy,
                        isActiveNow: newIsActive,
                    };
                }
                if (newIsActive) {
                    return { ...row, isActiveNow: false };
                }
                return row;
            });
        } else {
            const newBlock: TimetableRow = {
                id: `slot-${Date.now()}`,
                time: newTime,
                duration: newDuration,
                task: newTask.trim(),
                description: newDesc.trim() || undefined,
                tag: newTag.startsWith("#") ? newTag : `#${newTag}`,
                sprint: "Sprint 1",
                energyFocus: newEnergy,
                isActiveNow: newIsActive,
                completed: false,
            };
            const previous = newIsActive
                ? schedule.map((row) => ({ ...row, isActiveNow: false }))
                : schedule;
            updated = [...previous, newBlock];
        }

        setSchedule(updated);
        setIsAddModalOpen(false);
        setEditingIndex(null);
        setNewTask("");
        setNewDesc("");

        fetch("/api/timetable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule: updated }),
        }).catch((err) => console.error(err));
    };

    const parseDurationToHours = (dur?: string): number => {
        if (!dur) return 0;
        let hours = 0;
        const hMatch = dur.match(/(\d+(?:\.\d+)?)\s*h/i);
        const mMatch = dur.match(/(\d+(?:\.\d+)?)\s*m/i);
        if (hMatch) hours += parseFloat(hMatch[1]);
        if (mMatch) hours += parseFloat(mMatch[1]) / 60;
        if (!hMatch && !mMatch) {
            const num = parseFloat(dur);
            if (!isNaN(num)) hours += num;
        }
        return hours;
    };

    const completedCount = schedule.filter((s) => s.completed).length;
    const totalCount = schedule.length;
    const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    const totalHours = schedule.reduce((acc, row) => acc + parseDurationToHours(row.duration), 0);
    const completedHours = schedule
        .filter((s) => s.completed)
        .reduce((acc, row) => acc + parseDurationToHours(row.duration), 0);
    const activeHours = schedule
        .filter((s) => s.isActiveNow)
        .reduce((acc, row) => acc + parseDurationToHours(row.duration), 0);
    const scheduledHours = Math.max(0, totalHours - completedHours - activeHours);

    const deepWorkHours = schedule
        .filter((s) => s.energyFocus === "Deep Work")
        .reduce((acc, row) => acc + parseDurationToHours(row.duration), 0);

    const completedWidthPct = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;
    const activeWidthPct = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;
    const scheduledWidthPct = totalHours > 0 ? Math.max(0, 100 - completedWidthPct - activeWidthPct) : 0;

    const activeSlotIndex = schedule.findIndex((s) => s.isActiveNow);
    const activeSlot = activeSlotIndex >= 0 ? schedule[activeSlotIndex] : (schedule.length > 0 ? schedule[0] : null);
    const slotDisplay = totalCount > 0
        ? `SLOT ${String((activeSlotIndex >= 0 ? activeSlotIndex : 0) + 1).padStart(2, "0")}/${String(totalCount).padStart(2, "0")}`
        : "NO SLOTS";

    const handleNextSlot = () => {
        if (schedule.length === 0) return;
        const currentIndex = schedule.findIndex((s) => s.isActiveNow);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % schedule.length : 0;
        const updated = schedule.map((row, idx) => ({
            ...row,
            isActiveNow: idx === nextIndex,
        }));
        setSchedule(updated);
        setTimerSeconds(45 * 60);
        fetch("/api/timetable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule: updated }),
        }).catch(console.error);
    };

    const getEnergyBadge = (energy?: EnergyLevel) => {
        switch (energy) {
            case "Deep Work":
                return {
                    dot: "bg-emerald-400",
                    text: "text-emerald-400",
                    label: "Deep Work",
                };
            case "Medium Focus":
                return {
                    dot: "bg-cyan-400",
                    text: "text-cyan-400",
                    label: "Medium Focus",
                };
            case "Rapid Drills":
                return {
                    dot: "bg-amber-400",
                    text: "text-amber-400",
                    label: "Rapid Drills",
                };
            case "Interactive":
                return {
                    dot: "bg-purple-400",
                    text: "text-purple-400",
                    label: "Interactive",
                };
            default:
                return {
                    dot: "bg-zinc-400",
                    text: "text-zinc-400",
                    label: "Standard Focus",
                };
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-full">
            <WorkspaceHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

            <main className="p-4 sm:p-6 md:p-8 pb-16 md:pb-8 max-w-7xl mx-auto w-full space-y-6 flex-1 bg-transparent">
                    {/* Header Row matching Screenshot 2 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                    EXECUTION ENGINE
                                </span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-xs font-mono text-zinc-400">UTC+05:30 • Live Sync</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                Daily Time Table
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Plan your cadence, eliminate drift, and monitor deterministic hourly focus blocks.
                            </p>
                        </div>

                        {/* Active Session Timer Widget */}
                        <div className="flex items-center gap-4 bg-[#10141E] border border-[#1E293B] px-4 py-2.5 rounded-xl shadow-xl shadow-black/50 shrink-0 self-start md:self-auto">
                            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                <Clock size={16} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        ACTIVE SESSION
                                    </span>
                                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                                        {slotDisplay}
                                    </span>
                                </div>
                                <div className="text-sm font-bold font-mono text-white tracking-wide">
                                    {totalCount > 0 ? (
                                        <>
                                            {formatTimer(timerSeconds)}{" "}
                                            <span className="text-xs font-normal text-zinc-400">remaining</span>
                                        </>
                                    ) : (
                                        <span className="text-xs font-normal text-zinc-500">No active block</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 pl-2 border-l border-[#1E293B]">
                                <button
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className="p-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    title={isTimerRunning ? "Pause" : "Resume"}
                                >
                                    {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
                                </button>
                                <button
                                    onClick={handleNextSlot}
                                    disabled={totalCount === 0}
                                    className="p-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    title="Next Slot"
                                >
                                    <SkipForward size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cadence Tracker & Chronometric Heatmap Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Cadence Tracker Card (Left) */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        CADENCE TRACKER
                                    </span>
                                    <span className="text-sm font-bold font-mono text-cyan-400">
                                        {progressPct}%
                                    </span>
                                </div>

                                <div className="flex items-baseline justify-between mb-2">
                                    <h3 className="text-base font-bold text-white tracking-tight">
                                        Today&apos;s Progress
                                    </h3>
                                    <span className="text-xs font-mono text-zinc-500">
                                        {completedCount} OF {totalCount} COMPLETE
                                    </span>
                                </div>

                                {/* Dynamic tri-color progress bar */}
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                                    <div
                                        className="h-full bg-emerald-400 rounded-l-full transition-all duration-300"
                                        style={{ width: `${completedWidthPct}%` }}
                                    />
                                    <div
                                        className="h-full bg-cyan-400 transition-all duration-300"
                                        style={{ width: `${activeWidthPct}%` }}
                                    />
                                    <div
                                        className="h-full bg-zinc-700 rounded-r-full transition-all duration-300"
                                        style={{ width: `${scheduledWidthPct}%` }}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono mt-2 text-zinc-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        {completedHours.toFixed(1)}h Completed
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                        {activeHours.toFixed(1)}h Live Now
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                        {scheduledHours.toFixed(1)}h Scheduled
                                    </span>
                                </div>
                            </div>

                            {/* Metrics Deck Footer */}
                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1E293B] text-xs">
                                <div>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                        TARGET VELOCITY
                                    </span>
                                    <span className="font-bold text-white font-mono mt-0.5 block">
                                        {totalHours.toFixed(1)} Hours
                                    </span>
                                </div>
                                <div className="border-l border-[#1E293B] pl-3">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                        PLANNED DEEP WORK
                                    </span>
                                    <span className="font-bold text-cyan-400 font-mono mt-0.5 block">
                                        {deepWorkHours.toFixed(1)} Hours
                                    </span>
                                </div>
                                <div className="border-l border-[#1E293B] pl-3">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                        TOTAL BLOCKS
                                    </span>
                                    <span className="font-bold text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                                        <Zap size={13} />
                                        {totalCount} Sessions
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Chronometric Heatmap Card (Right) */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        CHRONOMETRIC FOCUS MAP
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-400">
                                        {schedule.length > 0 ? `${schedule.length} Blocks Today` : "No Active Cadence"}
                                    </span>
                                </div>

                                {/* Focus Blocks Bar */}
                                <div className="pt-2">
                                    {schedule.length === 0 ? (
                                        <div className="h-12 flex items-center justify-center text-xs text-zinc-500 font-mono border border-dashed border-[#1E293B] rounded-lg">
                                            Add schedule blocks to visualize chronometric focus intervals
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="h-4 w-full bg-[#0B0F17] rounded-md flex overflow-hidden gap-1 p-0.5 border border-[#1E293B]">
                                                {schedule.map((row, idx) => {
                                                    const dur = parseDurationToHours(row.duration);
                                                    const widthPct = totalHours > 0 ? Math.max(8, (dur / totalHours) * 100) : 100 / schedule.length;
                                                    const bgClass =
                                                        row.energyFocus === "Deep Work"
                                                            ? "bg-emerald-500/80 hover:bg-emerald-400"
                                                            : row.energyFocus === "Medium Focus"
                                                            ? "bg-cyan-500/80 hover:bg-cyan-400"
                                                            : row.energyFocus === "Rapid Drills"
                                                            ? "bg-amber-500/80 hover:bg-amber-400"
                                                            : "bg-purple-500/80 hover:bg-purple-400";
                                                    return (
                                                        <div
                                                            key={row.id || idx}
                                                            style={{ width: `${widthPct}%` }}
                                                            className={`${bgClass} rounded-xs h-full transition-all cursor-pointer`}
                                                            title={`${row.task} (${row.time})`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Heatmap Legend */}
                                    <div className="flex items-center gap-4 text-[10px] font-mono mt-3 text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                                            Deep Work
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-xs bg-cyan-400" />
                                            Medium Focus
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-xs bg-amber-400" />
                                            Rapid Drills
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-xs bg-purple-400" />
                                            Interactive
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-zinc-400 font-mono">
                                <span>Total focused intervals</span>
                                <span className="text-cyan-400">{totalHours.toFixed(1)} hrs planned</span>
                            </div>
                        </div>
                    </div>

                    {/* View Controls & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-1 bg-[#10141E] border border-[#1E293B] rounded-lg p-1 overflow-x-auto no-scrollbar">
                            {(["Today", "Table", "Timeline", "Analytics"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                        activeTab === tab
                                            ? "bg-[#1E293B] text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {schedule.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                    title="Clear all blocks"
                                >
                                    <Trash2 size={12} />
                                    <span>Clear All</span>
                                </button>
                            )}

                            <button
                                onClick={resetCheckmarks}
                                disabled={schedule.length === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <RotateCcw size={12} />
                                <span>Reset Checklist</span>
                            </button>

                            <button
                                onClick={openAddModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>Add Block</span>
                            </button>

                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    isEditing
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
                                        : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/20"
                                }`}
                            >
                                {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                                <span>{isEditing ? "Done Editing" : "Edit Time Table"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Edit Mode Alert Banner */}
                    {isEditing && (
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 animate-in fade-in duration-150">
                            <div className="flex items-center gap-2.5">
                                <Edit2 size={14} className="text-cyan-400 shrink-0" />
                                <span>
                                    <strong className="font-semibold text-white">Edit Mode Active:</strong> Click on the edit icon <Edit2 size={11} className="inline mx-0.5 text-cyan-300" /> to modify details, or the delete icon <Trash2 size={11} className="inline mx-0.5 text-rose-400" /> to remove any row.
                                </span>
                            </div>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-white text-[11px] font-bold border border-cyan-500/30 transition-colors cursor-pointer shrink-0"
                            >
                                Done Editing
                            </button>
                        </div>
                    )}

                    {/* Hourly Focus Matrix Table */}
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-xl overflow-hidden shadow-xl shadow-black/50 pb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#0B0F17]/70 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest">
                                        <th className="py-3 px-4 w-12 text-center">STATUS</th>
                                        <th className="py-3 px-4 w-44">TIME SLOT</th>
                                        <th className="py-3 px-4 w-24">DURATION</th>
                                        <th className="py-3 px-4 min-w-[280px]">FOCUS AREA / TASK</th>
                                        <th className="py-3 px-4 w-48">TAGS & SPRINT</th>
                                        <th className="py-3 px-4 w-36">ENERGY FOCUS</th>
                                        <th className="py-3 px-4 w-24 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E293B]/60">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-14 text-center text-zinc-400 font-mono">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                                                    <span className="text-xs">Loading timetable...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : schedule.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-14 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-[#141923] border border-[#1E293B] flex items-center justify-center text-cyan-400">
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">No schedule blocks found</p>
                                                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                                                            Your timetable is currently empty. Add your own personalized focus blocks to start organizing your day.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={openAddModal}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer mt-1 shadow-lg shadow-cyan-500/20"
                                                    >
                                                        <Plus size={13} />
                                                        <span>Add Your First Block</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        schedule.map((row, idx) => {
                                        const energy = getEnergyBadge(row.energyFocus);

                                        return (
                                            <tr
                                                key={row.id || idx}
                                                className={`transition-colors duration-150 hover:bg-[#141923]/80 ${
                                                    row.isActiveNow
                                                        ? "bg-cyan-500/[0.04]"
                                                        : row.completed
                                                        ? "bg-[#10141E]/40"
                                                        : ""
                                                }`}
                                            >
                                                {/* Status Checkbox */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleCompleted(idx)}
                                                        className="focus:outline-none"
                                                    >
                                                        {row.completed ? (
                                                            <CheckCircle2 size={17} className="text-emerald-400" />
                                                        ) : (
                                                            <Circle size={17} className="text-zinc-600 hover:text-cyan-400 transition-colors" />
                                                        )}
                                                    </button>
                                                </td>

                                                {/* Time Slot */}
                                                <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                row.isActiveNow ? "bg-cyan-400 animate-pulse" : "bg-zinc-600"
                                                            }`}
                                                        />
                                                        <span
                                                            className={
                                                                row.isActiveNow
                                                                    ? "text-cyan-300 font-semibold"
                                                                    : "text-zinc-300"
                                                            }
                                                        >
                                                            {row.time}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Duration */}
                                                <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                                                    {row.duration}
                                                </td>

                                                {/* Focus Area / Task */}
                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`font-semibold ${
                                                                    row.completed
                                                                        ? "text-zinc-500 line-through"
                                                                        : "text-white"
                                                                }`}
                                                            >
                                                                {row.task}
                                                            </span>
                                                            {row.isActiveNow && (
                                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                                    ACTIVE NOW
                                                                </span>
                                                            )}
                                                        </div>
                                                        {row.description && (
                                                            <p className="text-[11px] text-zinc-400 leading-tight">
                                                                {row.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Tags & Sprint */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                                                        {row.tag && (
                                                            <span className="px-2 py-0.5 rounded bg-[#141923] border border-[#1E293B] text-cyan-400">
                                                                {row.tag}
                                                            </span>
                                                        )}
                                                        {row.sprint && (
                                                            <span className="text-zinc-500">{row.sprint}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Energy Focus */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5 font-medium text-[11px]">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${energy.dot}`} />
                                                        <span className={energy.text}>{energy.label}</span>
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {row.isActiveNow && (
                                                            <button className="px-2 py-1 mr-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold hover:bg-cyan-500/25 transition-colors">
                                                                Log
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEditModal(idx)}
                                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-[#141923] border border-transparent hover:border-[#1E293B] transition-colors cursor-pointer"
                                                            title="Edit slot"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRow(idx)}
                                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                                                            title="Delete row"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

            {/* Add Block Modal - Redesigned to be professional, spacious, and modern */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Decorative Top Accent Glow */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500 opacity-80" />

                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-5 border-b border-[#1E293B]">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                                        {editingIndex !== null ? "SYS.SCHEDULE-MODIFY // #EDIT" : "SYS.SCHEDULE-DISPATCH // #TIME-8821"}
                                    </span>
                                    <span className="text-zinc-500 text-xs font-mono">• Active Sprint Protocol</span>
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">
                                    {editingIndex !== null ? "Edit Focus Session" : "Schedule Focus Session"}
                                </h3>
                                <p className="text-xs text-zinc-400">
                                    {editingIndex !== null
                                        ? "Modify session details or delete this block from your schedule."
                                        : "Configure deep work blocks, cadence targets, and cognitive energy allocation."}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {editingIndex !== null && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteRow(editingIndex)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                                        title="Delete this block"
                                    >
                                        <Trash2 size={14} />
                                        <span className="hidden sm:inline">Delete Block</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingIndex(null);
                                    }}
                                    className="p-2 rounded-xl text-zinc-400 hover:text-white bg-[#141923] hover:bg-[#1E293B] border border-[#1E293B] transition-colors cursor-pointer"
                                    title="Close (Esc)"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Scrollable Form */}
                        <form onSubmit={handleSaveBlock} className="space-y-5 pt-5 overflow-y-auto pr-1 text-xs">
                            {/* Focus Area / Task Title */}
                            <div className="space-y-1.5">
                                <label className="text-zinc-200 font-semibold block text-xs">
                                    Focus Area / Session Title <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="e.g. Dynamic Programming & Two Pointers Drills"
                                    autoFocus
                                    className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                />
                            </div>

                            {/* Subtopics & Quick Suggestions */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-zinc-200 font-semibold block text-xs">
                                        Subtopics & Deliverables
                                    </label>
                                    <span className="text-[10px] text-zinc-500 font-mono">Suggested keywords</span>
                                </div>
                                <input
                                    type="text"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="e.g. Longest palindromic substring, memoization table, edge cases"
                                    className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 transition-all"
                                />
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[
                                        "Two Pointers & Sliding Window",
                                        "DP Memoization Table",
                                        "Concurrency & Channels",
                                        "Mock Interview Speed Drill",
                                        "System Architecture Notes",
                                    ].map((chip) => (
                                        <button
                                            key={chip}
                                            type="button"
                                            onClick={() => setNewDesc((prev) => (prev ? `${prev}, ${chip}` : chip))}
                                            className="px-2.5 py-1 rounded-lg bg-[#141923] hover:bg-[#1E293B] text-zinc-400 hover:text-cyan-300 border border-[#1E293B] text-[10px] font-mono transition-colors cursor-pointer"
                                        >
                                            + {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slot and Duration Matrix */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-zinc-300 font-medium block text-xs">Time Slot</label>
                                    <input
                                        type="text"
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                        placeholder="07:00 PM - 08:30 PM"
                                        className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/80"
                                    />
                                    <div className="flex gap-1 pt-0.5">
                                        {[
                                            "09:00 AM - 11:00 AM",
                                            "02:00 PM - 04:00 PM",
                                            "08:00 PM - 10:00 PM",
                                        ].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setNewTime(t)}
                                                className="px-2 py-0.5 rounded bg-[#141923] text-zinc-500 hover:text-zinc-300 text-[9px] font-mono border border-[#1E293B]/60"
                                            >
                                                {t.split(" - ")[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-zinc-300 font-medium block text-xs">Duration</label>
                                    <input
                                        type="text"
                                        value={newDuration}
                                        onChange={(e) => setNewDuration(e.target.value)}
                                        placeholder="1h 30m"
                                        className="w-full bg-[#0B0F17] border border-[#1E293B] rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/80"
                                    />
                                    <div className="flex gap-1 pt-0.5">
                                        {["45m", "1h 00m", "1h 30m", "2h 00m"].map((d) => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setNewDuration(d)}
                                                className="px-2 py-0.5 rounded bg-[#141923] text-zinc-500 hover:text-zinc-300 text-[9px] font-mono border border-[#1E293B]/60"
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Energy Focus - Rich Interactive Cards */}
                            <div className="space-y-2">
                                <label className="text-zinc-200 font-semibold block text-xs">
                                    Energy Focus & Cognitive Load Level
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {[
                                        {
                                            level: "Deep Work" as EnergyLevel,
                                            label: "⚡ Deep Work",
                                            desc: "Peak cognitive focus • Algorithmic drills, architecture",
                                            activeColor: "border-amber-500/50 bg-amber-500/10 text-amber-300",
                                            dot: "bg-amber-400",
                                        },
                                        {
                                            level: "Medium Focus" as EnergyLevel,
                                            label: "🎯 Medium Focus",
                                            desc: "Balanced output • Code reviews & structured revision",
                                            activeColor: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
                                            dot: "bg-cyan-400",
                                        },
                                        {
                                            level: "Rapid Drills" as EnergyLevel,
                                            label: "⏱ Rapid Drills",
                                            desc: "High velocity drills • Aptitude & speed problem solving",
                                            activeColor: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                                            dot: "bg-emerald-400",
                                        },
                                        {
                                            level: "Interactive" as EnergyLevel,
                                            label: "👥 Interactive",
                                            desc: "Collaborative session • Mentorship & mock interviews",
                                            activeColor: "border-purple-500/50 bg-purple-500/10 text-purple-300",
                                            dot: "bg-purple-400",
                                        },
                                    ].map((item) => {
                                        const isSelected = newEnergy === item.level;
                                        return (
                                            <button
                                                key={item.level}
                                                type="button"
                                                onClick={() => setNewEnergy(item.level)}
                                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? `${item.activeColor} shadow-md`
                                                        : "bg-[#0B0F17] border-[#1E293B] text-zinc-400 hover:bg-[#141923] hover:border-zinc-700"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-xs flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                                                        {item.label}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle2 size={14} className="text-current" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-zinc-400 leading-normal">{item.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sprint Tag */}
                            <div className="space-y-1.5">
                                <label className="text-zinc-300 font-medium block text-xs">Sprint Tag</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="#DSA"
                                        className="flex-1 bg-[#0B0F17] border border-[#1E293B] rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/80"
                                    />
                                    <div className="flex gap-1.5">
                                        {["#DSA", "#Backend", "#SystemDesign", "#Aptitude"].map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setNewTag(tag)}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono border transition-colors ${
                                                    newTag === tag
                                                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                                                        : "bg-[#141923] text-zinc-400 border-[#1E293B] hover:text-white"
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Active Session Checkbox */}
                            <div className="pt-1">
                                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none bg-[#0B0F17] border border-[#1E293B] p-3 rounded-xl hover:border-zinc-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={newIsActive}
                                        onChange={(e) => setNewIsActive(e.target.checked)}
                                        className="w-4 h-4 rounded border-[#1E293B] bg-[#141923] text-cyan-500 focus:ring-0 cursor-pointer"
                                    />
                                    <div>
                                        <span className="font-semibold text-white block">Mark as Current Active Session</span>
                                        <span className="text-[10px] text-zinc-400">Highlights this block and links it to the focus timer at the top</span>
                                    </div>
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-[#1E293B]">
                                <div className="flex items-center gap-3">
                                    {editingIndex !== null && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRow(editingIndex)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer sm:hidden"
                                        >
                                            <Trash2 size={13} />
                                            <span>Delete Block</span>
                                        </button>
                                    )}
                                    <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                        <span>
                                            Config: {newDuration || "1h 30m"} • {newEnergy}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setEditingIndex(null);
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-[#141923] border border-[#1E293B] text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newTask.trim()}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all cursor-pointer"
                                    >
                                        <span>{editingIndex !== null ? "Save Changes" : "Add Hourly Block"}</span>
                                        <span className="text-[10px] px-1 rounded bg-zinc-950/20 font-mono">↵</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
