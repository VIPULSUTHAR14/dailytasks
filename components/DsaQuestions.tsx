"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    CheckCircle2, Circle, Menu, X, LogOut, Loader2, Search,
    Code2, ExternalLink, ChevronDown, ChevronRight,
    Zap, Flame, Trophy, Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";

type QuestionItem = {
    name: string;
    difficulty: string;
    url: string;
    completed: boolean;
};

type TopicGroup = {
    id: string;
    name: string;
    questions: QuestionItem[];
};

// ── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    icon: typeof Zap;
    glowColor: string;
    dotColor: string;
}> = {
    Easy: {
        label: "Easy",
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "border-emerald-400/20",
        activeBg: "bg-emerald-400",
        activeText: "text-zinc-950",
        activeBorder: "border-emerald-400",
        icon: Zap,
        glowColor: "shadow-emerald-400/20",
        dotColor: "bg-emerald-400",
    },
    Medium: {
        label: "Medium",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "border-amber-400/20",
        activeBg: "bg-amber-400",
        activeText: "text-zinc-950",
        activeBorder: "border-amber-400",
        icon: Flame,
        glowColor: "shadow-amber-400/20",
        dotColor: "bg-amber-400",
    },
    Hard: {
        label: "Hard",
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        borderColor: "border-rose-400/20",
        activeBg: "bg-rose-400",
        activeText: "text-zinc-950",
        activeBorder: "border-rose-400",
        icon: Trophy,
        glowColor: "shadow-rose-400/20",
        dotColor: "bg-rose-400",
    },
};

function questionKey(topicId: string, questionName: string): string {
    return `${topicId}::${questionName}`;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DsaQuestions() {
    const [topics, setTopics] = useState<TopicGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
    const [difficultyFilter, setDifficultyFilter] = useState<"all" | Difficulty>("all");
    const [topicFilter, setTopicFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
    const router = useRouter();

    const handelSignOut = async () => {
        try {
            const res = await fetch("/api/auth/Logout", { method: "POST" });
            if (res.ok) router.push("/Login");
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    };

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dsaquestions`);
            if (res.ok) {
                const data = await res.json();
                if (data.topics) {
                    setTopics(data.topics);
                    // Expand all topics by default on first load
                    setExpandedTopics(new Set(data.topics.map((t: TopicGroup) => t.id)));
                }
            }
        } catch (e) {
            console.error("Failed to fetch DSA questions", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const toggleQuestion = async (topicId: string, questionName: string) => {
        const key = questionKey(topicId, questionName);

        // Find current state
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;
        const question = topic.questions.find(q => q.name === questionName);
        if (!question) return;
        const newStatus = !question.completed;

        // Optimistic UI update
        setTopics(prev => prev.map(t =>
            t.id === topicId
                ? {
                    ...t,
                    questions: t.questions.map(q =>
                        q.name === questionName ? { ...q, completed: newStatus } : q
                    ),
                }
                : t
        ));

        try {
            const res = await fetch(`/api/dsaquestions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statuses: { [key]: newStatus } }),
            });

            if (!res.ok) {
                if (res.status === 401) { router.push("/Login"); return; }
                fetchQuestions();
            }
        } catch (e) {
            console.error("Failed to update question status:", e);
            fetchQuestions();
        }
    };

    const toggleTopicExpanded = (topicId: string) => {
        setExpandedTopics(prev => {
            const next = new Set(prev);
            if (next.has(topicId)) next.delete(topicId);
            else next.add(topicId);
            return next;
        });
    };

    // ── Computed Stats ──────────────────────────────────────────────────────

    const allQuestions = useMemo(() => {
        return topics.flatMap(t =>
            t.questions.map(q => ({ ...q, topicId: t.id, topicName: t.name }))
        );
    }, [topics]);

    const totalQuestions = allQuestions.length;
    const completedCount = allQuestions.filter(q => q.completed).length;
    const progressPercentage = totalQuestions === 0 ? 0 : Math.round((completedCount / totalQuestions) * 100);

    const difficultyStats = useMemo(() => {
        const stats: Record<Difficulty, { total: number; completed: number }> = {
            Easy: { total: 0, completed: 0 },
            Medium: { total: 0, completed: 0 },
            Hard: { total: 0, completed: 0 },
        };
        allQuestions.forEach(q => {
            const d = q.difficulty as Difficulty;
            if (stats[d]) {
                stats[d].total++;
                if (q.completed) stats[d].completed++;
            }
        });
        return stats;
    }, [allQuestions]);

    // ── Filtered Topics ─────────────────────────────────────────────────────

    const filteredTopics = useMemo(() => {
        return topics
            .filter(t => topicFilter === "all" || t.id === topicFilter)
            .map(t => ({
                ...t,
                questions: t.questions.filter(q => {
                    const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!matchesSearch) return false;

                    if (statusFilter === "completed" && !q.completed) return false;
                    if (statusFilter === "pending" && q.completed) return false;

                    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;

                    return true;
                }),
            }))
            .filter(t => t.questions.length > 0);
    }, [topics, topicFilter, statusFilter, difficultyFilter, searchTerm]);

    const filteredQuestionCount = filteredTopics.reduce((acc, t) => acc + t.questions.length, 0);

    // ── Render ──────────────────────────────────────────────────────────────

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
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                        DSA Topics
                    </button>
                    <button
                        onClick={() => { router.push("/dsaquestions"); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors bg-white text-black font-bold"
                    >
                        DSA Questions
                    </button>
                    <button
                        onClick={() => { router.push("/timetable"); setSidebarOpen(false); }}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors text-zinc-400 hover:bg-white/10 hover:text-white"
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
            <main className="flex-1 p-6 md:p-12 w-full max-w-5xl relative min-h-screen mt-0 overflow-y-auto">
                <header className="mb-10 hidden md:block">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">DSA Questions</h1>
                            <p className="text-zinc-400 mt-1 text-sm font-medium">
                                Track your progress across {totalQuestions} questions in {topics.length} topics.
                            </p>
                        </div>
                    </div>
                </header>

                {/* ── Overall Progress ─────────────────────────────────── */}
                <div className="mb-10 bg-zinc-900/40 border border-white/5 p-6 rounded-none">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Overall Progress</h2>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                                {completedCount} / {totalQuestions} Questions Solved
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

                    {/* Per-difficulty mini progress bars */}
                    <div className="grid grid-cols-3 gap-3 mt-5">
                        {(["Easy", "Medium", "Hard"] as Difficulty[]).map((diff) => {
                            const cfg = DIFFICULTY_CONFIG[diff];
                            const stat = difficultyStats[diff];
                            const pct = stat.total === 0 ? 0 : Math.round((stat.completed / stat.total) * 100);
                            const Icon = cfg.icon;
                            return (
                                <div key={diff} className={`p-3 border ${cfg.borderColor} ${cfg.bgColor} rounded-none`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon size={14} className={cfg.color} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-zinc-400 font-medium">
                                            {stat.completed}/{stat.total}
                                        </span>
                                        <span className={`text-xs font-bold ${cfg.color}`}>{pct}%</span>
                                    </div>
                                    <div className="h-[2px] w-full bg-zinc-800 rounded-none overflow-hidden">
                                        <motion.div
                                            className={`h-full ${cfg.activeBg}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Search & Filters ─────────────────────────────────── */}
                <div className="flex flex-col gap-4 mb-8 bg-zinc-900 border border-white/5 p-4">
                    {/* Search + Status Row */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-white/10 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                            {(["all", "pending", "completed"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${statusFilter === f
                                        ? "bg-white text-zinc-950 border-white"
                                        : "bg-zinc-950 text-zinc-400 border-white/10 hover:text-white hover:border-white/35"
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Filter Row */}
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">Difficulty</span>
                        <div className="flex gap-2 overflow-x-auto">
                            <button
                                onClick={() => setDifficultyFilter("all")}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${difficultyFilter === "all"
                                    ? "bg-white text-zinc-950 border-white shadow-lg shadow-white/10"
                                    : "bg-zinc-950 text-zinc-400 border-white/10 hover:text-white hover:border-white/35"
                                    }`}
                            >
                                All
                            </button>
                            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((diff) => {
                                const cfg = DIFFICULTY_CONFIG[diff];
                                const isActive = difficultyFilter === diff;
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        key={diff}
                                        onClick={() => setDifficultyFilter(diff)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${isActive
                                            ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder} shadow-lg ${cfg.glowColor}`
                                            : `bg-zinc-950 ${cfg.color} ${cfg.borderColor}`
                                            }`}
                                    >
                                        <Icon size={10} />
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Topic Filter Row */}
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">
                            <Filter size={10} className="inline mr-1" />
                            Topic
                        </span>
                        <div className="relative flex-1 max-w-xs">
                            <button
                                onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-zinc-950 border border-white/10 text-sm text-white font-medium hover:border-white/25 transition-colors"
                            >
                                <span className="truncate">
                                    {topicFilter === "all" ? "All Topics" : topics.find(t => t.id === topicFilter)?.name || "All Topics"}
                                </span>
                                <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isTopicDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {isTopicDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 max-h-64 overflow-y-auto z-30 shadow-xl shadow-black/40"
                                    >
                                        <button
                                            onClick={() => { setTopicFilter("all"); setIsTopicDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${topicFilter === "all" ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
                                        >
                                            All Topics
                                        </button>
                                        {topics.map(t => {
                                            const topicCompleted = t.questions.filter(q => q.completed).length;
                                            return (
                                                <button
                                                    key={t.id}
                                                    onClick={() => { setTopicFilter(t.id); setIsTopicDropdownOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${topicFilter === t.id ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
                                                >
                                                    <span className="truncate">{t.name}</span>
                                                    <span className={`text-[10px] font-bold ml-2 shrink-0 ${topicFilter === t.id ? "text-zinc-600" : "text-zinc-500"}`}>
                                                        {topicCompleted}/{t.questions.length}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium ml-auto hidden md:inline">
                            {filteredQuestionCount} questions
                        </span>
                    </div>
                </div>

                {/* ── Question List (Grouped by Topic) ────────────────── */}
                <div className="flex flex-col gap-4 pb-32">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-zinc-500">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="text-center p-12 text-zinc-500 border border-white/10 border-dashed text-sm font-medium">
                            No questions found matching your filter criteria.
                        </div>
                    ) : (
                        filteredTopics.map((topic) => {
                            const topicCompletedCount = topic.questions.filter(q => q.completed).length;
                            const topicTotal = topic.questions.length;
                            const topicPct = topicTotal === 0 ? 0 : Math.round((topicCompletedCount / topicTotal) * 100);
                            const isExpanded = expandedTopics.has(topic.id);

                            return (
                                <div key={topic.id} className="border border-white/5 bg-zinc-900/60 overflow-hidden">
                                    {/* Topic Header */}
                                    <button
                                        onClick={() => toggleTopicExpanded(topic.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors duration-150 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-zinc-400 group-hover:text-white transition-colors">
                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                            <h3 className="text-sm md:text-base font-bold text-white tracking-tight">{topic.name}</h3>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {topicCompletedCount}/{topicTotal}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-[2px] bg-zinc-800 overflow-hidden hidden sm:block">
                                                <motion.div
                                                    className="h-full bg-white"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${topicPct}%` }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-400">{topicPct}%</span>
                                        </div>
                                    </button>

                                    {/* Questions List */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                key="content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-white/5">
                                                    {topic.questions.map((q) => {
                                                        const diffCfg = DIFFICULTY_CONFIG[q.difficulty as Difficulty] || DIFFICULTY_CONFIG.Easy;
                                                        const DiffIcon = diffCfg.icon;

                                                        return (
                                                            <div
                                                                key={q.name}
                                                                className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.03] last:border-b-0 hover:bg-zinc-800/40 transition-colors duration-150 group"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    {/* Checkbox */}
                                                                    <button
                                                                        onClick={() => toggleQuestion(topic.id, q.name)}
                                                                        className="shrink-0 focus:outline-none"
                                                                    >
                                                                        {q.completed ? (
                                                                            <CheckCircle2 size={20} className="text-white" />
                                                                        ) : (
                                                                            <Circle size={20} className="text-zinc-600 group-hover:text-zinc-400 transition-colors duration-150" />
                                                                        )}
                                                                    </button>

                                                                    {/* Question name */}
                                                                    <span
                                                                        className={`text-sm font-medium select-none tracking-tight truncate transition-colors duration-150 ${q.completed ? "text-zinc-500 line-through opacity-60" : "text-zinc-200"
                                                                            }`}
                                                                    >
                                                                        {q.name}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                                                                    {/* Difficulty Badge */}
                                                                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${diffCfg.bgColor} ${diffCfg.color} ${diffCfg.borderColor}`}>
                                                                        <DiffIcon size={9} />
                                                                        {diffCfg.label}
                                                                    </span>

                                                                    {/* LeetCode link */}
                                                                    <a
                                                                        href={q.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="p-1.5 text-zinc-600 hover:text-white transition-colors duration-150"
                                                                        title="Open on LeetCode"
                                                                    >
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Close topic dropdown when clicking outside */}
            {isTopicDropdownOpen && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsTopicDropdownOpen(false)}
                />
            )}
        </div>
    );
}
