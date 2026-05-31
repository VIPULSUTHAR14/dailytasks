"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Circle, Menu, X, LogOut, Loader2, Search, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type DsaTopicItem = {
    id: string;
    name: string;
    completed: boolean;
};

const DEFAULT_TOPICS: DsaTopicItem[] = [
    { "id": "arrays-strings", "name": "Arrays & Strings", "completed": false },
    { "id": "linked-lists", "name": "Linked Lists", "completed": false },
    { "id": "stacks-queues", "name": "Stacks & Queues", "completed": false },
    { "id": "hash-maps-sets", "name": "Hash Maps & Hash Sets", "completed": false },
    { "id": "trees", "name": "Trees", "completed": false },
    { "id": "heaps", "name": "Heaps", "completed": false },
    { "id": "graphs", "name": "Graphs", "completed": false },
    { "id": "two-pointers", "name": "Two Pointers", "completed": false },
    { "id": "sliding-window", "name": "Sliding Window", "completed": false },
    { "id": "fast-slow-pointers", "name": "Fast & Slow Pointers", "completed": false },
    { "id": "merge-intervals", "name": "Merge Intervals", "completed": false },
    { "id": "cyclic-sort", "name": "Cyclic Sort", "completed": false },
    { "id": "inplace-reversal-linked-list", "name": "In-place Reversal of a Linked List", "completed": false },
    { "id": "tree-bfs", "name": "Tree Breadth-First Search", "completed": false },
    { "id": "tree-dfs", "name": "Tree Depth-First Search", "completed": false },
    { "id": "two-heaps", "name": "Two Heaps", "completed": false },
    { "id": "top-k-elements", "name": "Top K Elements", "completed": false },
    { "id": "k-way-merge", "name": "K-way Merge", "completed": false },
    { "id": "monotonic-stack", "name": "Monotonic Stack", "completed": false },
    { "id": "binary-search", "name": "Binary Search", "completed": false },
    { "id": "bitwise-xor", "name": "Bitwise XOR", "completed": false },
    { "id": "backtracking", "name": "Backtracking", "completed": false },
    { "id": "topological-sort", "name": "Topological Sort", "completed": false },
    { "id": "dijkstras-algorithm", "name": "Dijkstra's Algorithm", "completed": false },
    { "id": "union-find", "name": "Union-Find", "completed": false },
    { "id": "tries", "name": "Tries", "completed": false },
    { "id": "1d-dp", "name": "1D Dynamic Programming", "completed": false },
    { "id": "2d-dp", "name": "2D Dynamic Programming", "completed": false },
    { "id": "segment-fenwick-trees", "name": "Segment Trees / Fenwick Trees", "completed": false }
];

export default function DsaTopics() {
    const [topics, setTopics] = useState<DsaTopicItem[]>(DEFAULT_TOPICS);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
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
    };

    const fetchDsaStatuses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dsatopics`);
            if (res.ok) {
                const data = await res.json();
                if (data.topics) {
                    setTopics(data.topics);
                } else {
                    const dbStatuses = data.statuses || {};
                    setTopics(DEFAULT_TOPICS.map(t => ({
                        ...t,
                        completed: dbStatuses[t.id] !== undefined ? dbStatuses[t.id] : t.completed
                    })));
                }
            }
        } catch (e) {
            console.error("Failed to fetch DSA topic statuses", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDsaStatuses();
    }, []);

    const toggleStatus = async (id: string) => {
        // Capture the new value before the state update
        const targetTopic = topics.find(t => t.id === id);
        if (!targetTopic) return;
        const newStatus = !targetTopic.completed;

        // Optimistic UI update — this is the ONLY state change per click
        setTopics(prev => prev.map(t =>
            t.id === id ? { ...t, completed: newStatus } : t
        ));

        // Fire-and-forget to the server. Do NOT update state from response.
        // The optimistic update above is already correct.
        try {
            const res = await fetch(`/api/dsatopics`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    statuses: { [id]: newStatus }
                })
            });

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/Login");
                    return;
                }
                // Server rejected — revert by re-fetching truth from DB
                fetchDsaStatuses();
            }
        } catch (e) {
            console.error("Failed to update DSA topic status:", e);
            // Network error — revert by re-fetching truth from DB
            fetchDsaStatuses();
        }
    };

    const totalTopics = topics.length;
    const completedCount = topics.filter(t => t.completed).length;
    const progressPercentage = totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);

    const filteredTopics = useMemo(() => {
        return topics.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filter === "completed") return t.completed;
            if (filter === "pending") return !t.completed;
            return true;
        });
    }, [topics, filter, searchTerm]);

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
                        onClick={() => { router.push("/dashboard"); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => { router.push("/aptitude"); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                        Aptitude
                    </button>
                    <button
                        onClick={() => { router.push("/dsapattern"); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                        DSA Patterns
                    </button>
                    <button
                        onClick={() => { router.push("/dsatopics"); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors bg-white text-black font-bold"
                    >
                        DSA Topics
                    </button>
                </div>

                <div className="p-6 border-t border-white/10">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors" onClick={handelSignOut}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 w-full max-w-4xl relative min-h-screen mt-0 overflow-y-auto">
                <header className="mb-10 hidden md:block">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">DSA Topics</h1>
                            <p className="text-zinc-400 mt-1 text-sm font-medium">Master the 29 essential data structures & algorithmic patterns for coding interviews.</p>
                        </div>
                    </div>
                </header>

                {/* Progress Section */}
                <div className="mb-10 bg-zinc-900/40 border border-white/5 p-6 rounded-none">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Mastery Progress</h2>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                                {completedCount} / {totalTopics} Topics Mastered
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

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-zinc-900 border border-white/5 p-4">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-white/10 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        {(["all", "pending", "completed"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${filter === f
                                    ? "bg-white text-zinc-950 border-white"
                                    : "bg-zinc-950 text-zinc-400 border-white/10 hover:text-white hover:border-white/35"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topics List */}
                <div className="flex flex-col gap-3 pb-32">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-zinc-500">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="text-center p-12 text-zinc-500 border border-white/10 border-dashed text-sm font-medium">
                            No topics found matching your filter criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredTopics.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => toggleStatus(t.id)}
                                    className="flex items-center justify-between p-5 bg-zinc-900 border border-white/5 hover:border-white/20 hover:bg-zinc-800 transition-colors duration-150 group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {t.completed ? (
                                            <CheckCircle2 size={24} className="text-white shrink-0" />
                                        ) : (
                                            <Circle size={24} className="text-zinc-600 group-hover:text-white transition-colors duration-150 shrink-0" />
                                        )}
                                        <span className={`text-sm md:text-base font-bold select-none tracking-tight truncate transition-colors duration-150 ${t.completed ? "text-zinc-500 line-through opacity-60" : "text-white"
                                            }`}>
                                            {t.name}
                                        </span>
                                    </div>
                                    <div className="shrink-0 ml-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 transition-colors duration-150 ${t.completed
                                            ? "bg-white/10 text-white/60 border border-white/5"
                                            : "bg-zinc-950 text-zinc-500 border border-white/10"
                                            }`}>
                                            {t.completed ? "Mastered" : "To Do"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
