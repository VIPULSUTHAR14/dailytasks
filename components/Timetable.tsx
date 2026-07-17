"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, Menu, X, LogOut, Loader2, Edit2, RotateCcw, Save, Trash } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type TimetableRow = {
    time: string;
    duration: string;
    task: string;
    completed: boolean;
};

export default function Timetable() {
    const [schedule, setSchedule] = useState<TimetableRow[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedSchedule, setEditedSchedule] = useState<TimetableRow[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    const handelSignOut = async () => {
        try {
            const res = await fetch("/api/auth/Logout", {
                method: "POST",
            });
            if (res.ok) {
                router.push("/Login");
            }
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    };

    const fetchTimetable = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/timetable");
            if (res.ok) {
                const data = await res.json();
                if (data.timetable && data.timetable.schedule) {
                    setSchedule(data.timetable.schedule);
                    setEditedSchedule(data.timetable.schedule);
                } else {
                    setSchedule(null);
                }
            } else if (res.status === 404) {
                setSchedule(null);
            }
        } catch (e) {
            console.error("Failed to fetch timetable", e);
            setSchedule(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable();
    }, []);

    // Toggle completion of a single row
    const toggleCompleted = async (index: number) => {
        if (!schedule) return;
        const currentCompleted = schedule[index].completed;
        const newCompleted = !currentCompleted;

        // Optimistic UI update
        const updated = [...schedule];
        updated[index] = { ...updated[index], completed: newCompleted };
        setSchedule(updated);

        try {
            const res = await fetch("/api/timetable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ index, completed: newCompleted }),
            });
            if (!res.ok) {
                // Rollback on error
                const rolledBack = [...schedule];
                rolledBack[index] = { ...rolledBack[index], completed: currentCompleted };
                setSchedule(rolledBack);
            }
        } catch (error) {
            console.error("Failed to update status", error);
            // Rollback on error
            const rolledBack = [...schedule];
            rolledBack[index] = { ...rolledBack[index], completed: currentCompleted };
            setSchedule(rolledBack);
        }
    };

    // Reset checkmarks on all rows
    const resetCheckmarks = async () => {
        if (!schedule || schedule.length === 0) return;
        setActionLoading(true);
        try {
            const res = await fetch("/api/timetable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reset" }),
            });
            if (res.ok) {
                const data = await res.json();
                setSchedule(data.schedule);
                setEditedSchedule(data.schedule);
            }
        } catch (error) {
            console.error("Failed to reset checkmarks", error);
        } finally {
            setActionLoading(false);
        }
    };

    // Enter edit mode
    const startEditing = () => {
        setEditedSchedule(schedule ? [...schedule] : []);
        setIsEditing(true);
    };

    // Save full timetable edits or first-time creation
    const saveTimetable = async (scheduleToSave: TimetableRow[]) => {
        setSaving(true);
        try {
            const res = await fetch("/api/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: scheduleToSave }),
            });
            if (res.ok) {
                const data = await res.json();
                setSchedule(data.schedule);
                setEditedSchedule(data.schedule);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to save timetable", error);
        } finally {
            setSaving(false);
        }
    };

    // Builders helper: Add row
    const addRow = () => {
        setEditedSchedule(prev => [
            ...prev,
            { time: "", duration: "", task: "", completed: false }
        ]);
    };

    // Builders helper: Delete row
    const deleteRow = (index: number) => {
        setEditedSchedule(prev => prev.filter((_, i) => i !== index));
    };

    // Builders helper: Update cell value
    const updateCell = (index: number, field: keyof TimetableRow, value: string) => {
        setEditedSchedule(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Progress percentage
    const progressPercentage = schedule && schedule.length > 0
        ? Math.round((schedule.filter(s => s.completed).length / schedule.length) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-5 border-b border-white/10 relative z-20 bg-zinc-950">
                <h1 className="text-xl font-bold tracking-tight">Task Manager</h1>
                <button onClick={() => setSidebarOpen(true)} className="p-2 text-white hover:bg-zinc-900">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky top-0 h-screen w-64 bg-zinc-950 border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    } flex flex-col`}
            >
                <div className="p-6 flex items-center justify-between md:justify-start gap-4 border-b border-white/10">
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                        <span className="text-zinc-950 font-bold text-lg">E</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Dashboard.</h2>
                    <button className="md:hidden p-2 text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Navigation</div>
                    <button
                        onClick={() => { router.push("/tasks"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/tasks" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => { router.push("/aptitude"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/aptitude" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        Aptitude
                    </button>
                    <button
                        onClick={() => { router.push("/dsapattern"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/dsapattern" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        DSA Patterns
                    </button>
                    <button
                        onClick={() => { router.push("/dsatopics"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/dsatopics" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        DSA Topics
                    </button>
                    <button
                        onClick={() => { router.push("/dsaquestions"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/dsaquestions" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        DSA Questions
                    </button>
                    <button
                        onClick={() => { router.push("/timetable"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors bg-white text-black`}
                    >
                        Time Table
                    </button>
                </div>

                <div className="p-6 border-t border-white/10">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors" onClick={handelSignOut}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 w-full max-w-6xl relative min-h-screen mt-0 overflow-y-auto">
                <header className="mb-10 hidden md:block">
                    <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Daily Time Table</h1>
                    <p className="text-zinc-400 mt-2 text-sm font-medium">Plan your day, stay consistent, and monitor your hourly focus.</p>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center p-20 text-zinc-500">
                        <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                ) : schedule === null && !isEditing ? (
                    /* Initial Empty State / Creation View */
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-white/5 p-8 text-center max-w-2xl mx-auto"
                    >
                        <h2 className="text-2xl font-bold tracking-tight mb-3">No Time Table Found</h2>
                        <p className="text-zinc-400 mb-8 text-sm">
                            Create a personalized daily study time table to allocate time blocks, tasks, and specific focus areas.
                        </p>
                        <button
                            onClick={() => {
                                setEditedSchedule([{ time: "", duration: "", task: "", completed: false }]);
                                setIsEditing(true);
                            }}
                            className="px-6 py-3 bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-all rounded-none"
                        >
                            Create Time Table
                        </button>
                    </motion.div>
                ) : (
                    /* Timetable Exists OR in Edit/Create Mode */
                    <div className="space-y-8">
                        {/* Progress Section (Viewer Mode only) */}
                        {!isEditing && schedule && schedule.length > 0 && (
                            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-none">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight">Today's Progress</h2>
                                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                                            {schedule.filter(s => s.completed).length} / {schedule.length} Blocks Completed
                                        </p>
                                    </div>
                                    <span className="text-2xl font-bold text-white tracking-tight">{progressPercentage}%</span>
                                </div>
                                <div className="h-[2px] w-full bg-zinc-800 rounded-none overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            // Reset edits
                                            if (schedule) setEditedSchedule(schedule);
                                        }}
                                        className="px-4 py-2 border border-white/10 hover:bg-white/5 text-sm font-semibold rounded-none transition-colors"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => saveTimetable(editedSchedule)}
                                        className="flex items-center gap-2 px-5 py-2 bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-bold rounded-none transition-colors"
                                        disabled={saving}
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Save Schedule
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={resetCheckmarks}
                                        className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-sm font-semibold rounded-none transition-colors"
                                        disabled={actionLoading || !schedule || schedule.length === 0}
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
                                        Reset Checklist
                                    </button>
                                    <button
                                        onClick={startEditing}
                                        className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-sm font-semibold rounded-none transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Edit Time Table
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Interactive Table Container */}
                        <div className="bg-zinc-900/40 border border-white/5 overflow-x-auto rounded-none">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/10 bg-zinc-900/80">
                                        {!isEditing && <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400 w-16 text-center">Status</th>}
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400 w-44">Time</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400 w-28">Duration</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Task</th>
                                        {isEditing && <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400 w-16 text-center">Delete</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence initial={false}>
                                        {(isEditing ? editedSchedule : (schedule || [])).map((row, index) => (
                                            <motion.tr
                                                key={index}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${!isEditing && row.completed ? "bg-white/[0.01] text-zinc-500" : ""
                                                    }`}
                                            >
                                                {/* Checkbox Status (View Mode Only) */}
                                                {!isEditing && (
                                                    <td className="p-4 text-center align-middle">
                                                        <button
                                                            onClick={() => toggleCompleted(index)}
                                                            className="text-zinc-500 hover:text-white transition-colors inline-block align-middle"
                                                        >
                                                            {row.completed ? (
                                                                <CheckCircle2 className="text-white w-5 h-5" />
                                                            ) : (
                                                                <Circle className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    </td>
                                                )}

                                                {/* Time Cell */}
                                                <td className="p-4 align-middle font-medium">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={row.time}
                                                            onChange={(e) => updateCell(index, "time", e.target.value)}
                                                            placeholder="e.g. 8:00 – 10:00 AM"
                                                            className="bg-zinc-950 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white w-full font-medium"
                                                            required
                                                        />
                                                    ) : (
                                                        <span className={row.completed ? "line-through" : ""}>
                                                            {row.time || "—"}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Duration Cell */}
                                                <td className="p-4 align-middle">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={row.duration}
                                                            onChange={(e) => updateCell(index, "duration", e.target.value)}
                                                            placeholder="e.g. 2 hrs"
                                                            className="bg-zinc-950 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white w-full"
                                                            required
                                                        />
                                                    ) : (
                                                        <span className={row.completed ? "line-through text-zinc-600" : "text-zinc-400"}>
                                                            {row.duration || "—"}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Task Cell */}
                                                <td className="p-4 align-middle">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={row.task}
                                                            onChange={(e) => updateCell(index, "task", e.target.value)}
                                                            placeholder="e.g. DSA Concepts"
                                                            className="bg-zinc-950 border border-white/10 rounded-none px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white w-full"
                                                            required
                                                        />
                                                    ) : (
                                                        <span className={`font-semibold ${row.completed ? "line-through text-zinc-500" : "text-white"}`}>
                                                            {row.task || "—"}
                                                        </span>
                                                    )}
                                                </td>



                                                {/* Delete Row Action (Edit Mode Only) */}
                                                {isEditing && (
                                                    <td className="p-4 text-center align-middle">
                                                        <button
                                                            onClick={() => deleteRow(index)}
                                                            className="text-zinc-500 hover:text-red-400 transition-colors"
                                                            title="Remove Row"
                                                        >
                                                            <Trash size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>

                            {/* Add Row Button (Edit Mode Only) */}
                            {isEditing && (
                                <div className="p-4 bg-zinc-900/20 border-t border-white/5 flex justify-center">
                                    <button
                                        onClick={addRow}
                                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/15 hover:border-white/35 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors"
                                    >
                                        <Plus size={14} />
                                        Add Row
                                    </button>
                                </div>
                            )}

                            {/* Empty View within Table (No Rows in Edit Mode) */}
                            {isEditing && editedSchedule.length === 0 && (
                                <div className="p-12 text-center text-zinc-500 text-sm font-medium">
                                    No rows added to your schedule. Click "Add Row" above to start building.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
