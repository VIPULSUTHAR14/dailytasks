"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    CheckCircle2, Circle, Menu, X, LogOut, Loader2, Search,
    Code2, ExternalLink, ChevronDown, ChevronRight,
    Zap, Flame, Trophy, Filter, Copy, Check, Terminal,
    Eye, EyeOff, AlertTriangle, HelpCircle, Clock,
    Database, GitBranch, MessageCircle, Lightbulb, BookOpen,
    Pencil, Trash2, Save, FileText, StickyNote
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";

// ── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";

type QuestionItem = {
    name: string;
    difficulty: string;
    url: string;
    completed: boolean;
    pseudoCode?: string;
    note?: string;
    description?: string;
    interviewQuestion?: string;
    hint?: string;
    pattern?: string;
    prerequisites?: string[];
    commonMistakes?: string[];
    followUpQuestions?: string[];
    timeComplexity?: string;
    spaceComplexity?: string;
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
    const [selectedQuestion, setSelectedQuestion] = useState<(QuestionItem & { topicName?: string }) | null>(null);
    const [copied, setCopied] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showPseudoCode, setShowPseudoCode] = useState(false);
    const pseudoCodeRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // ── Notes & PseudoCode editing state ────────────────────────────────
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [isEditingPseudo, setIsEditingPseudo] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [pseudoText, setPseudoText] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [savingPseudo, setSavingPseudo] = useState(false);

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

            {/* Sidebar */}
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area - Two Column Layout */}
            <div className="flex-1 flex min-h-screen">
                <main className={`p-6 md:p-12 relative min-h-screen mt-0 overflow-y-auto transition-all duration-300 ${selectedQuestion ? 'flex-1 min-w-0' : 'flex-1 max-w-5xl'}`}>
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
                                                                    className={`flex items-center justify-between px-5 py-3.5 border-b border-white/[0.03] last:border-b-0 hover:bg-zinc-800/40 transition-all duration-150 group cursor-pointer ${selectedQuestion?.name === q.name ? 'bg-zinc-800/60 border-l-2 border-l-violet-500' : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        setSelectedQuestion({ ...q, topicName: topic.name });
                                                                        setShowHint(false); setShowPseudoCode(false);
                                                                        setIsEditingNote(false); setIsEditingPseudo(false);
                                                                        setNoteText(q.note || ''); setPseudoText(q.pseudoCode || '');
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        {/* Checkbox */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); toggleQuestion(topic.id, q.name); }}
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
                                                                        {/* Details button */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedQuestion({ ...q, topicName: topic.name });
                                                                                setShowHint(false); setShowPseudoCode(false);
                                                                                setIsEditingNote(false); setIsEditingPseudo(false);
                                                                                setNoteText(q.note || ''); setPseudoText(q.pseudoCode || '');
                                                                            }}
                                                                            className={`p-1.5 transition-colors duration-150 ${selectedQuestion?.name === q.name ? 'text-violet-400' : 'text-zinc-600 hover:text-violet-400'}`}
                                                                            title="View Details"
                                                                        >
                                                                            <BookOpen size={14} />
                                                                        </button>

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

                {/* ── Detail Panel (Right Side) ────────────────────────── */}
                <AnimatePresence>
                    {selectedQuestion && (
                        <motion.aside
                            ref={pseudoCodeRef}
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 520, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="hidden lg:flex flex-col h-screen sticky top-0 border-l border-white/10 bg-zinc-950 overflow-hidden"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                        <BookOpen className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white tracking-tight truncate">
                                            {selectedQuestion.name}
                                        </h3>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                                            {selectedQuestion.topicName} • Details
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuestion(null)}
                                    className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Difficulty + Pattern + Link Bar */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border shrink-0 ${DIFFICULTY_CONFIG[selectedQuestion.difficulty as Difficulty]?.bgColor || 'bg-zinc-800'
                                        } ${DIFFICULTY_CONFIG[selectedQuestion.difficulty as Difficulty]?.color || 'text-zinc-400'
                                        } ${DIFFICULTY_CONFIG[selectedQuestion.difficulty as Difficulty]?.borderColor || 'border-zinc-700'
                                        }`}>
                                        {(() => {
                                            const Icon = DIFFICULTY_CONFIG[selectedQuestion.difficulty as Difficulty]?.icon || Zap;
                                            return <Icon size={10} />;
                                        })()}
                                        {selectedQuestion.difficulty}
                                    </span>
                                    {selectedQuestion.pattern && (
                                        <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-1 truncate">
                                            {selectedQuestion.pattern}
                                        </span>
                                    )}
                                </div>
                                <a
                                    href={selectedQuestion.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors shrink-0"
                                >
                                    <ExternalLink size={10} />
                                    LeetCode
                                </a>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-5 flex flex-col gap-5">

                                    {/* Description */}
                                    {selectedQuestion.description && (
                                        <div>
                                            <p className="text-sm text-zinc-300 leading-relaxed">
                                                {selectedQuestion.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Interview Question */}
                                    {selectedQuestion.interviewQuestion && (
                                        <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageCircle size={13} className="text-sky-400 shrink-0" />
                                                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Interview Question</span>
                                            </div>
                                            <p className="text-sm text-zinc-300 leading-relaxed italic">
                                                &ldquo;{selectedQuestion.interviewQuestion}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Hint (Collapsible - hidden by default) ─── */}
                                    {selectedQuestion.hint && (
                                        <div className="border border-white/5 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => setShowHint(!showHint)}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb size={13} className="text-amber-400" />
                                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Hint</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-zinc-500 font-medium">
                                                        {showHint ? 'Hide' : 'Reveal'}
                                                    </span>
                                                    {showHint ? <EyeOff size={12} className="text-zinc-500" /> : <Eye size={12} className="text-zinc-500" />}
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {showHint && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 py-3 border-t border-white/5">
                                                            <p className="text-sm text-amber-200/80 leading-relaxed">
                                                                {selectedQuestion.hint}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}


                                    {/* ── Complexity ─────────────────────────────── */}
                                    {(selectedQuestion.timeComplexity || selectedQuestion.spaceComplexity) && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedQuestion.timeComplexity && (
                                                <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-lg">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Clock size={11} className="text-emerald-400" />
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-emerald-400 font-mono">{selectedQuestion.timeComplexity}</span>
                                                </div>
                                            )}
                                            {selectedQuestion.spaceComplexity && (
                                                <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-lg">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Database size={11} className="text-sky-400" />
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Space</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-sky-400 font-mono">{selectedQuestion.spaceComplexity}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Prerequisites ────────────────────────── */}
                                    {selectedQuestion.prerequisites && selectedQuestion.prerequisites.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <GitBranch size={13} className="text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prerequisites</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedQuestion.prerequisites.map((p, i) => (
                                                    <span key={i} className="text-[11px] font-medium text-zinc-400 bg-zinc-800/80 border border-white/5 px-2.5 py-1 rounded-md">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Common Mistakes ──────────────────────── */}
                                    {selectedQuestion.commonMistakes && selectedQuestion.commonMistakes.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <AlertTriangle size={13} className="text-rose-400" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Common Mistakes</span>
                                            </div>
                                            <ul className="flex flex-col gap-2">
                                                {selectedQuestion.commonMistakes.map((m, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-400 leading-relaxed">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400/60 shrink-0" />
                                                        {m}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* ── Follow-up Questions ──────────────────── */}
                                    {selectedQuestion.followUpQuestions && selectedQuestion.followUpQuestions.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <HelpCircle size={13} className="text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Follow-up Questions</span>
                                            </div>
                                            <ul className="flex flex-col gap-2">
                                                {selectedQuestion.followUpQuestions.map((fq, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-400 leading-relaxed">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-500/60 shrink-0" />
                                                        {fq}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* ── Notes (Editable) ───────────────────────── */}
                                    <div className="border border-white/5 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40">
                                            <div className="flex items-center gap-2">
                                                <StickyNote size={13} className="text-teal-400" />
                                                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Notes</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {!isEditingNote ? (
                                                    <button
                                                        onClick={() => { setIsEditingNote(true); setNoteText(selectedQuestion.note || ''); }}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-teal-400 hover:bg-teal-400/10 rounded transition-colors"
                                                    >
                                                        <Pencil size={10} />
                                                        {selectedQuestion.note ? 'Edit' : 'Add'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            disabled={savingNote}
                                                            onClick={async () => {
                                                                const topic = topics.find(t => t.questions.some(q => q.name === selectedQuestion.name));
                                                                if (!topic) return;
                                                                const qKey = questionKey(topic.id, selectedQuestion.name);
                                                                setSavingNote(true);
                                                                try {
                                                                    const res = await fetch('/api/dsaquestions', {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ questionKey: qKey, note: noteText }),
                                                                    });
                                                                    if (res.ok) {
                                                                        setTopics(prev => prev.map(t => ({
                                                                            ...t,
                                                                            questions: t.questions.map(q =>
                                                                                q.name === selectedQuestion.name ? { ...q, note: noteText } : q
                                                                            ),
                                                                        })));
                                                                        setSelectedQuestion(prev => prev ? { ...prev, note: noteText } : prev);
                                                                        setIsEditingNote(false);
                                                                    }
                                                                } catch (e) { console.error('Failed to save note', e); }
                                                                finally { setSavingNote(false); }
                                                            }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                                                        >
                                                            {savingNote ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => { setIsEditingNote(false); setNoteText(selectedQuestion.note || ''); }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                                                        >
                                                            <X size={10} />
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {selectedQuestion.note && !isEditingNote && (
                                                    <button
                                                        onClick={async () => {
                                                            const topic = topics.find(t => t.questions.some(q => q.name === selectedQuestion.name));
                                                            if (!topic) return;
                                                            const qKey = questionKey(topic.id, selectedQuestion.name);
                                                            setSavingNote(true);
                                                            try {
                                                                const res = await fetch('/api/dsaquestions', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ questionKey: qKey, note: '' }),
                                                                });
                                                                if (res.ok) {
                                                                    setTopics(prev => prev.map(t => ({
                                                                        ...t,
                                                                        questions: t.questions.map(q =>
                                                                            q.name === selectedQuestion.name ? { ...q, note: '' } : q
                                                                        ),
                                                                    })));
                                                                    setSelectedQuestion(prev => prev ? { ...prev, note: '' } : prev);
                                                                    setNoteText('');
                                                                }
                                                            } catch (e) { console.error('Failed to clear note', e); }
                                                            finally { setSavingNote(false); }
                                                        }}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                                                    >
                                                        <Trash2 size={10} />
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditingNote ? (
                                            <div className="px-4 py-3 border-t border-white/5">
                                                <textarea
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Write your notes here..."
                                                    className="w-full min-h-[120px] bg-zinc-950 border border-white/10 text-sm text-zinc-200 placeholder-zinc-600 p-3 rounded-md focus:outline-none focus:border-teal-400/50 resize-y font-mono"
                                                />
                                            </div>
                                        ) : selectedQuestion.note ? (
                                            <div className="px-4 py-3 border-t border-white/5">
                                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedQuestion.note}</p>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 border-t border-white/5">
                                                <p className="text-xs text-zinc-600 italic">No notes yet. Click Add to write notes for this question.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Pseudo Code (Editable) ─────────────────── */}
                                    <div className="border border-white/5 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40">
                                            <div className="flex items-center gap-2">
                                                <FileText size={13} className="text-violet-400" />
                                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Pseudo Code</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {!isEditingPseudo ? (
                                                    <button
                                                        onClick={() => { setIsEditingPseudo(true); setPseudoText(selectedQuestion.pseudoCode || ''); }}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-violet-400 hover:bg-violet-400/10 rounded transition-colors"
                                                    >
                                                        <Pencil size={10} />
                                                        {selectedQuestion.pseudoCode ? 'Edit' : 'Add'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            disabled={savingPseudo}
                                                            onClick={async () => {
                                                                const topic = topics.find(t => t.questions.some(q => q.name === selectedQuestion.name));
                                                                if (!topic) return;
                                                                const qKey = questionKey(topic.id, selectedQuestion.name);
                                                                setSavingPseudo(true);
                                                                try {
                                                                    const res = await fetch('/api/dsaquestions', {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ questionKey: qKey, pseudoCode: pseudoText }),
                                                                    });
                                                                    if (res.ok) {
                                                                        setTopics(prev => prev.map(t => ({
                                                                            ...t,
                                                                            questions: t.questions.map(q =>
                                                                                q.name === selectedQuestion.name ? { ...q, pseudoCode: pseudoText } : q
                                                                            ),
                                                                        })));
                                                                        setSelectedQuestion(prev => prev ? { ...prev, pseudoCode: pseudoText } : prev);
                                                                        setIsEditingPseudo(false);
                                                                    }
                                                                } catch (e) { console.error('Failed to save pseudo code', e); }
                                                                finally { setSavingPseudo(false); }
                                                            }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                                                        >
                                                            {savingPseudo ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => { setIsEditingPseudo(false); setPseudoText(selectedQuestion.pseudoCode || ''); }}
                                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                                                        >
                                                            <X size={10} />
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {selectedQuestion.pseudoCode && !isEditingPseudo && (
                                                    <button
                                                        onClick={async () => {
                                                            const topic = topics.find(t => t.questions.some(q => q.name === selectedQuestion.name));
                                                            if (!topic) return;
                                                            const qKey = questionKey(topic.id, selectedQuestion.name);
                                                            setSavingPseudo(true);
                                                            try {
                                                                const res = await fetch('/api/dsaquestions', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ questionKey: qKey, pseudoCode: '' }),
                                                                });
                                                                if (res.ok) {
                                                                    setTopics(prev => prev.map(t => ({
                                                                        ...t,
                                                                        questions: t.questions.map(q =>
                                                                            q.name === selectedQuestion.name ? { ...q, pseudoCode: '' } : q
                                                                        ),
                                                                    })));
                                                                    setSelectedQuestion(prev => prev ? { ...prev, pseudoCode: '' } : prev);
                                                                    setPseudoText('');
                                                                }
                                                            } catch (e) { console.error('Failed to clear pseudo code', e); }
                                                            finally { setSavingPseudo(false); }
                                                        }}
                                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                                                    >
                                                        <Trash2 size={10} />
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditingPseudo ? (
                                            <div className="px-4 py-3 border-t border-white/5">
                                                <textarea
                                                    value={pseudoText}
                                                    onChange={(e) => setPseudoText(e.target.value)}
                                                    placeholder="Write your pseudo code here..."
                                                    className="w-full min-h-[160px] bg-zinc-950 border border-white/10 text-[13px] text-zinc-200 placeholder-zinc-600 p-3 rounded-md focus:outline-none focus:border-violet-400/50 resize-y font-mono leading-relaxed"
                                                />
                                            </div>
                                        ) : selectedQuestion.pseudoCode ? (
                                            <div className="border-t border-white/5 relative group">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(selectedQuestion.pseudoCode || '');
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="absolute top-3 right-3 p-2 bg-zinc-800 border border-white/10 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100 z-10"
                                                    title="Copy to clipboard"
                                                >
                                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                </button>
                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-white/5">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">
                                                        pseudocode
                                                    </span>
                                                </div>
                                                <pre className="p-4 overflow-x-auto">
                                                    <code className="text-[13px] leading-relaxed font-mono">
                                                        {selectedQuestion.pseudoCode?.split('\n').map((line, i) => {
                                                            const highlightLine = (text: string) => {
                                                                const keywords = /\b(function|return|if|else|while|for|class|new|null|true|false|in|AND|OR|NOT|break|continue|from|to|of|each)\b/g;
                                                                if (text.trimStart().startsWith('//')) {
                                                                    return <span className="text-zinc-500 italic">{text}</span>;
                                                                }
                                                                const parts: React.ReactNode[] = [];
                                                                let lastIndex = 0;
                                                                let match;
                                                                while ((match = keywords.exec(text)) !== null) {
                                                                    if (match.index > lastIndex) {
                                                                        parts.push(<span key={`t-${i}-${lastIndex}`} className="text-zinc-300">{text.slice(lastIndex, match.index)}</span>);
                                                                    }
                                                                    parts.push(<span key={`k-${i}-${match.index}`} className="text-violet-400 font-semibold">{match[0]}</span>);
                                                                    lastIndex = match.index + match[0].length;
                                                                }
                                                                if (lastIndex < text.length) {
                                                                    parts.push(<span key={`e-${i}-${lastIndex}`} className="text-zinc-300">{text.slice(lastIndex)}</span>);
                                                                }
                                                                return parts.length > 0 ? parts : <span className="text-zinc-300">{text}</span>;
                                                            };
                                                            return (
                                                                <div key={i} className="flex hover:bg-white/[0.02] -mx-4 px-4">
                                                                    <span className="inline-block w-8 text-right mr-4 text-zinc-600 text-[11px] select-none shrink-0">{i + 1}</span>
                                                                    <span className="whitespace-pre">{highlightLine(line)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </code>
                                                </pre>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 border-t border-white/5">
                                                <p className="text-xs text-zinc-600 italic">No pseudo code yet. Click Add to write pseudo code for this question.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Panel Footer */}
                            <div className="px-5 py-3 border-t border-white/5 shrink-0">
                                <p className="text-[10px] text-zinc-600 font-medium text-center">
                                    Click any question to view its details
                                </p>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

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
