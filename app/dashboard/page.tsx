"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, Menu, X, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Task = {
    _id?: string;
    user_id: string;
    created_at?: string;
    task: {
        title: string;
        status: "pending" | "completed";
        updated_at?: string;
    };
};

// The real user ID is now verified securely via HttpOnly session cookies automatically by the server endpoints.

export default function DashboardPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [todaytasks, setTodayTasks] = useState<Task[]>([]);
    const [completedTaskss, setCompletedTaskss] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"today" | "all" | "pending" | "completed">("today");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const router = useRouter();

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
    }

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/task`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
            } else if (res.status === 404) {
                setTasks([]);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setLoading(false);
        }
    };
    const fetchtodaytasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasktoday`);
            if (res.ok) {
                const data = await res.json();
                setTodayTasks(data.tasks || []);
                setCompletedTaskss(data.filterddata || []);
            } else if (res.status === 404) {
                setTodayTasks([]);
                setCompletedTaskss([]);
            }
        } catch (e) {
            console.error("Failed to fetch today tasks", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTasks();
        fetchtodaytasks();
    }, []);

    const toggleStatus = async (targetTask: Task) => {
        const newStatus = targetTask.task.status === "pending" ? "completed" : "pending";

        // Optimistic UI update for immediate feedback
        setTasks(prev => prev.map(t =>
            t.task.title === targetTask.task.title
                ? { ...t, task: { ...t.task, status: newStatus } }
                : t
        ));

        try {
            const res = await fetch(`/api/task`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task: {
                        title: targetTask.task.title,
                        status: newStatus
                    }
                })
            });

            if (!res.ok) throw new Error("Failed to update status");
            fetchtodaytasks();
        } catch (e) {
            // Revert on error
            console.log(e);
            fetchTasks();
            fetchtodaytasks();
        }
    };

    const deleteTask = async (title: string) => {
        // Optimistic UI deletion
        setTasks(prev => prev.filter(t => t.task.title !== title));

        try {
            const res = await fetch(`/api/task?title=${encodeURIComponent(title)}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete task");
            fetchtodaytasks();
        } catch (e) {
            console.log(e);
            fetchTasks(); // Revert on error
            fetchtodaytasks();
        }
    };

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task: {
                        title: newTaskTitle.trim(),
                        status: "pending"
                    }
                })
            });
            if (res.ok) {
                setNewTaskTitle("");
                setModalOpen(false);
                fetchTasks(); // refresh from DB
                fetchtodaytasks();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === "today") {
            if (!t.created_at) return false;
            return new Date(t.created_at).toDateString() === new Date().toDateString();
        }
        if (filter === "all") return true;
        return t.task.status === filter;
    });

    const totalTasks = todaytasks.length;
    const completedTasks = completedTaskss.length;
    const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    console.log(progressPercentage);

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

            {/* Sidebar (Drawer on mobile, fixed on Desktop) */}
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
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Filters</div>

                    <button
                        onClick={() => { setFilter("today"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${filter === "today" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        Today
                        <span className="text-xs">{tasks.filter(t => t.created_at && new Date(t.created_at).toDateString() === new Date().toDateString()).length}</span>
                    </button>

                    <button
                        onClick={() => { setFilter("all"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${filter === "all" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        All Tasks
                        <span className="text-xs">{tasks.length}</span>
                    </button>

                    <button
                        onClick={() => { setFilter("pending"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${filter === "pending" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        Pending
                        <span className="text-xs">{tasks.filter(t => t.task.status === "pending").length}</span>
                    </button>

                    <button
                        onClick={() => { setFilter("completed"); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${filter === "completed" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        Completed
                        <span className="text-xs">{tasks.filter(t => t.task.status === "completed").length}</span>
                    </button>
                    <button
                        onClick={() => { router.push("/aptitude") }}
                        className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${filter === "completed" ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        Aptitude
                    </button>
                </div>

                <div className="p-6 border-t border-white/10">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors" onClick={handelSignOut}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Task Engine Content */}
            <main className="flex-1 p-6 md:p-12 w-full max-w-4xl relative min-h-screen mt-0 overflow-y-auto">
                <header className="mb-10 hidden md:block">
                    <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">Task Manager View</h1>
                    <p className="text-zinc-400 mt-2 text-sm font-medium">Keep track of your latest activities and pending items.</p>
                </header>

                {/* Progress Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Dashboard Progress</h2>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                                {completedTasks} / {totalTasks} Completed
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

                <div className="flex flex-col gap-3 pb-32">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-zinc-500">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center p-12 text-zinc-500 border border-white/10 border-dashed text-sm font-medium">
                            No tasks found matching your filter. Click the + button to create your first task!
                        </div>
                    ) : (
                        filteredTasks.map((t) => (
                            <div
                                key={t.task.title}
                                className="flex items-center justify-between p-5 bg-zinc-900 border border-white/5 hover:border-white/20 hover:bg-zinc-800 transition-all group"
                            >
                                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleStatus(t)}>
                                    {t.task.status === "completed" ? (
                                        <CheckCircle2 size={24} className="text-white shrink-0" />
                                    ) : (
                                        <Circle size={24} className="text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className={`text-sm md:text-base font-medium select-none ${t.task.status === "completed" ? "text-zinc-500 line-through" : "text-white"
                                            }`}>
                                            {t.task.title}
                                        </span>
                                        {filter === "all" && t.created_at && (
                                            <span className="text-xs text-zinc-500 mt-1 font-medium">
                                                Created on {formatDate(t.created_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteTask(t.task.title)}
                                    className="p-2 ml-4 text-zinc-600 hover:text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 bg-zinc-950 hover:bg-zinc-800 shrink-0 border border-white/5 hover:border-white/20"
                                    aria-label="Delete Task"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Floating Action Button for POST */}
            <button
                onClick={() => setModalOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-white text-zinc-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40"
            >
                <Plus size={32} />
            </button>

            {/* Task Creation Modal Monochome */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-bold tracking-tight mb-8 text-white">New Task</h3>

                        <form onSubmit={addTask} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    autoFocus
                                    className="w-full bg-zinc-950 border border-white/10 px-4 py-4 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-transparent border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !newTaskTitle.trim()}
                                    className="flex-1 py-3 text-sm font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
