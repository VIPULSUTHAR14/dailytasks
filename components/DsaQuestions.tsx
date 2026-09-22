"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    CheckCircle2, Circle, Menu, X, LogOut, Loader2, Search,
    Code2, ExternalLink, ChevronDown, ChevronRight,
    Zap, Flame, Trophy, Filter, Copy, Check, Terminal,
    Eye, EyeOff, AlertTriangle, HelpCircle, Clock,
    Database, GitBranch, MessageCircle, Lightbulb, BookOpen,
    Pencil, Trash2, Save, FileText, StickyNote, RotateCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/components/WorkspaceHeader";

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

const DIFFICULTY_CONFIG: Record<Difficulty, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    icon: typeof Zap;
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
    },
};

function questionKey(topicId: string, questionName: string): string {
    return `${topicId}::${questionName}`;
}

export default function DsaQuestions() {
    const [topics, setTopics] = useState<TopicGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
    const [difficultyFilter, setDifficultyFilter] = useState<"all" | Difficulty>("all");
    const [topicFilter, setTopicFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(["arrays-and-strings"]));
    const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<(QuestionItem & { topicName?: string }) | null>(null);
    const [showHint, setShowHint] = useState(false);
    const router = useRouter();

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dsaquestions`);
            if (res.ok) {
                const data = await res.json();
                if (data.topics && data.topics.length > 0) {
                    setTopics(data.topics);
                    // Select first question by default on large screens
                    if (data.topics[0]?.questions[0]) {
                        setSelectedQuestion({
                            ...data.topics[0].questions[0],
                            topicName: data.topics[0].name,
                        });
                    }
                    setExpandedTopics(new Set([data.topics[0].id]));
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

    const handleSync = () => {
        setSyncing(true);
        setTimeout(() => {
            setSyncing(false);
        }, 800);
    };

    const toggleQuestion = async (topicId: string, questionName: string) => {
        const key = questionKey(topicId, questionName);
        const topic = topics.find((t) => t.id === topicId);
        if (!topic) return;
        const question = topic.questions.find((q) => q.name === questionName);
        if (!question) return;
        const newStatus = !question.completed;

        setTopics((prev) =>
            prev.map((t) =>
                t.id === topicId
                    ? {
                          ...t,
                          questions: t.questions.map((q) =>
                              q.name === questionName ? { ...q, completed: newStatus } : q
                          ),
                      }
                    : t
            )
        );

        if (selectedQuestion?.name === questionName) {
            setSelectedQuestion((prev) => (prev ? { ...prev, completed: newStatus } : null));
        }

        try {
            await fetch(`/api/dsaquestions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statuses: { [key]: newStatus } }),
            });
        } catch (e) {
            console.error("Failed to update question status:", e);
        }
    };

    const toggleTopicExpanded = (topicId: string) => {
        setExpandedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topicId)) next.delete(topicId);
            else next.add(topicId);
            return next;
        });
    };

    // Calculate metrics
    const totalQuestions = useMemo(() => {
        return topics.reduce((acc, t) => acc + t.questions.length, 0);
    }, [topics]);

    const completedCount = useMemo(() => {
        return topics.reduce(
            (acc, t) => acc + t.questions.filter((q) => q.completed).length,
            0
        );
    }, [topics]);

    const overallPercentage = totalQuestions === 0 ? 0 : Math.round((completedCount / totalQuestions) * 100);

    const difficultyStats = useMemo(() => {
        const stats: Record<Difficulty, { total: number; completed: number }> = {
            Easy: { total: 0, completed: 0 },
            Medium: { total: 0, completed: 0 },
            Hard: { total: 0, completed: 0 },
        };
        topics.forEach((t) => {
            t.questions.forEach((q) => {
                const diff = q.difficulty as Difficulty;
                if (stats[diff]) {
                    stats[diff].total++;
                    if (q.completed) stats[diff].completed++;
                }
            });
        });
        return stats;
    }, [topics]);

    // Filter topics and questions
    const filteredTopics = useMemo(() => {
        return topics
            .filter((t) => topicFilter === "all" || t.id === topicFilter)
            .map((t) => {
                const questions = t.questions.filter((q) => {
                    if (statusFilter === "pending" && q.completed) return false;
                    if (statusFilter === "completed" && !q.completed) return false;
                    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
                    if (searchTerm.trim()) {
                        const qSearch = searchTerm.toLowerCase();
                        const matchName = q.name.toLowerCase().includes(qSearch);
                        const matchPattern = q.pattern?.toLowerCase().includes(qSearch);
                        if (!matchName && !matchPattern) return false;
                    }
                    return true;
                });
                return { ...t, questions };
            })
            .filter((t) => t.questions.length > 0);
    }, [topics, topicFilter, statusFilter, difficultyFilter, searchTerm]);

    const currentTopicObj = topics.find((t) => t.id === topicFilter);

    return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] font-sans flex flex-col md:flex-row">
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
                <WorkspaceHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

                <main className="p-4 sm:p-6 md:p-8 pb-16 md:pb-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Code2 size={18} className="text-cyan-400" />
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                    DSA Questions
                                </h1>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Track your technical roadmap and algorithmic rigor across {totalQuestions} curated challenges.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10141E] border border-[#1E293B] text-[11px] font-mono text-zinc-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>SYSTEM ACTIVE / REVISION SPRINT 4</span>
                            </div>

                            <button
                                onClick={handleSync}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                            >
                                <RotateCw size={13} className={syncing ? "animate-spin text-cyan-400" : ""} />
                                <span>Sync Progress</span>
                            </button>
                        </div>
                    </div>

                    {/* 4 Metric Decks matching Screenshot 5 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Overall Progress Deck */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/40">
                            <div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                                    OVERALL PROGRESS
                                </span>
                                <div className="text-xl font-bold font-mono text-white mt-1">
                                    {completedCount} <span className="text-xs text-zinc-500 font-normal">/ {totalQuestions} SOLVED</span>
                                </div>
                                <span className="text-[11px] text-cyan-400 font-mono mt-0.5 block">
                                    ~ 0.7% Target Velocity
                                </span>
                            </div>

                            {/* Radial 1% Gauge */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-zinc-800"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-cyan-400"
                                        strokeDasharray={`${overallPercentage}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-[11px] font-bold font-mono text-white">
                                    {overallPercentage}%
                                </span>
                            </div>
                        </div>

                        {/* Easy Deck */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 shadow-lg shadow-black/40 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    EASY
                                </span>
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                    {difficultyStats.Easy.total === 0 ? 0 : ((difficultyStats.Easy.completed / difficultyStats.Easy.total) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-lg font-bold font-mono text-white mt-1">
                                {difficultyStats.Easy.completed} <span className="text-xs text-zinc-500 font-normal">/ {difficultyStats.Easy.total}</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-400 rounded-full"
                                    style={{
                                        width: `${difficultyStats.Easy.total === 0 ? 0 : (difficultyStats.Easy.completed / difficultyStats.Easy.total) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Medium Deck */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 shadow-lg shadow-black/40 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    MEDIUM
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-400">
                                    {difficultyStats.Medium.total === 0 ? 0 : ((difficultyStats.Medium.completed / difficultyStats.Medium.total) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-lg font-bold font-mono text-white mt-1">
                                {difficultyStats.Medium.completed} <span className="text-xs text-zinc-500 font-normal">/ {difficultyStats.Medium.total}</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{
                                        width: `${difficultyStats.Medium.total === 0 ? 0 : (difficultyStats.Medium.completed / difficultyStats.Medium.total) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Hard Deck */}
                        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 shadow-lg shadow-black/40 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    HARD
                                </span>
                                <span className="text-xs font-mono font-bold text-rose-400">
                                    {difficultyStats.Hard.total === 0 ? 0 : ((difficultyStats.Hard.completed / difficultyStats.Hard.total) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-lg font-bold font-mono text-white mt-1">
                                {difficultyStats.Hard.completed} <span className="text-xs text-zinc-500 font-normal">/ {difficultyStats.Hard.total}</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-rose-400 rounded-full"
                                    style={{
                                        width: `${difficultyStats.Hard.total === 0 ? 0 : (difficultyStats.Hard.completed / difficultyStats.Hard.total) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Row matching Screenshot 5 */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-lg">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search questions, patterns (e.g. greedy, sliding window)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-[#10141E] border border-[#1E293B] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-1 bg-[#10141E] border border-[#1E293B] rounded-lg p-1">
                                {(["all", "pending", "completed"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1 text-xs font-semibold rounded uppercase tracking-wider transition-colors cursor-pointer ${
                                            statusFilter === s
                                                ? "bg-[#1E293B] text-white shadow-sm"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Level selector */}
                            <div className="flex items-center gap-1 bg-[#10141E] border border-[#1E293B] rounded-lg p-1 text-xs">
                                <span className="text-zinc-500 font-semibold px-2 uppercase text-[10px]">Level:</span>
                                <button
                                    onClick={() => setDifficultyFilter("all")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded uppercase transition-colors cursor-pointer ${
                                        difficultyFilter === "all" ? "bg-[#1E293B] text-white" : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    All
                                </button>
                                {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficultyFilter(d)}
                                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded uppercase transition-colors cursor-pointer ${
                                            difficultyFilter === d
                                                ? "bg-[#1E293B] text-white font-bold"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                d === "Easy" ? "bg-emerald-400" : d === "Medium" ? "bg-amber-400" : "bg-rose-400"
                                            }`}
                                        />
                                        {d}
                                    </button>
                                ))}
                            </div>

                            {/* Topic Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 bg-[#10141E] border border-[#1E293B] rounded-lg text-xs text-white font-medium hover:border-cyan-500/50 transition-colors whitespace-nowrap cursor-pointer"
                                >
                                    <BookOpen size={13} className="text-cyan-400" />
                                    <span>
                                        {currentTopicObj ? `${currentTopicObj.name} ${currentTopicObj.questions.length} Qs` : "All Topics"}
                                    </span>
                                    <ChevronDown size={13} className="text-zinc-400" />
                                </button>

                                {isTopicDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#10141E] border border-[#1E293B] rounded-xl shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                setTopicFilter("all");
                                                setIsTopicDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs rounded hover:bg-[#181C24] text-white transition-colors"
                                        >
                                            All Topics ({totalQuestions} Qs)
                                        </button>
                                        {topics.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setTopicFilter(t.id);
                                                    setIsTopicDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-[#181C24] text-zinc-300 hover:text-white transition-colors flex items-center justify-between"
                                            >
                                                <span className="truncate">{t.name}</span>
                                                <span className="font-mono text-[10px] text-zinc-500">{t.questions.length}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Split View: Left Questions List, Right Drawer */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-16 items-start">
                        {/* Left Questions List (7 Cols on desktop) */}
                        <div className="lg:col-span-7 space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center p-16 text-zinc-500">
                                    <Loader2 className="animate-spin text-cyan-400" size={24} />
                                </div>
                            ) : filteredTopics.length === 0 ? (
                                <div className="text-center p-16 rounded-xl border border-dashed border-[#1E293B] bg-[#10141E]/40 text-xs text-zinc-500">
                                    No questions match your filter criteria.
                                </div>
                            ) : (
                                filteredTopics.map((topic) => {
                                    const isExpanded = expandedTopics.has(topic.id);
                                    const completedInTopic = topic.questions.filter((q) => q.completed).length;
                                    const topicPct =
                                        topic.questions.length === 0
                                            ? 0
                                            : ((completedInTopic / topic.questions.length) * 100).toFixed(1);

                                    return (
                                        <div
                                            key={topic.id}
                                            className="bg-[#10141E] border border-[#1E293B] rounded-xl overflow-hidden shadow-md shadow-black/40"
                                        >
                                            {/* Accordion Header */}
                                            <button
                                                onClick={() => toggleTopicExpanded(topic.id)}
                                                className="w-full flex items-center justify-between p-3.5 hover:bg-[#141923] transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="text-zinc-400">
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white tracking-tight">
                                                        {topic.name}
                                                    </h3>
                                                    <span className="text-xs font-mono text-zinc-500">
                                                        {completedInTopic}/{topic.questions.length}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                                                        <div
                                                            className="h-full bg-cyan-400 rounded-full"
                                                            style={{ width: `${topicPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-zinc-400">
                                                        {topicPct}%
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Questions in Topic */}
                                            {isExpanded && (
                                                <div className="border-t border-[#1E293B] divide-y divide-[#1E293B]/60">
                                                    {topic.questions.map((q) => {
                                                        const isSelected = selectedQuestion?.name === q.name;
                                                        const diffCfg = DIFFICULTY_CONFIG[q.difficulty as Difficulty] || DIFFICULTY_CONFIG.Easy;

                                                        return (
                                                            <div
                                                                key={q.name}
                                                                onClick={() =>
                                                                    setSelectedQuestion({ ...q, topicName: topic.name })
                                                                }
                                                                className={`flex items-center justify-between px-4 py-3 text-xs transition-all cursor-pointer group ${
                                                                    isSelected
                                                                        ? "bg-[#181C24] border-l-2 border-l-cyan-400"
                                                                        : "hover:bg-[#141923]"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleQuestion(topic.id, q.name);
                                                                        }}
                                                                        className="focus:outline-none shrink-0"
                                                                    >
                                                                        {q.completed ? (
                                                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                                                        ) : (
                                                                            <Circle size={16} className="text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                                                                        )}
                                                                    </button>

                                                                    <span
                                                                        className={`font-medium truncate ${
                                                                            q.completed
                                                                                ? "text-zinc-500 line-through"
                                                                                : isSelected
                                                                                ? "text-cyan-300 font-semibold"
                                                                                : "text-zinc-200 group-hover:text-white"
                                                                        }`}
                                                                    >
                                                                        {q.name}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                                                    <span title="View notes">
                                                                        <BookOpen
                                                                            size={13}
                                                                            className="text-zinc-500 group-hover:text-zinc-300"
                                                                        />
                                                                    </span>

                                                                    <span
                                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${diffCfg.bgColor} ${diffCfg.color} border ${diffCfg.borderColor}`}
                                                                    >
                                                                        {diffCfg.label}
                                                                    </span>

                                                                    <a
                                                                        href={q.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-zinc-500 hover:text-cyan-400 transition-colors"
                                                                        title="Open LeetCode"
                                                                    >
                                                                        <ExternalLink size={13} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Right Context Pane / Drawer (5 Cols on desktop) matching Screenshot 5 */}
                        <div className="lg:col-span-5 bg-[#10141E] border border-[#1E293B] rounded-xl p-5 shadow-xl shadow-black/60 sticky top-20 space-y-5">
                            {selectedQuestion ? (
                                <>
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between pb-3 border-b border-[#1E293B]">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={16} className="text-cyan-400 shrink-0" />
                                                <h2 className="text-lg font-bold text-white tracking-tight truncate">
                                                    {selectedQuestion.name}
                                                </h2>
                                            </div>
                                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                                {selectedQuestion.topicName || "ARRAYS & STRINGS"} • PROBLEM #121
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setSelectedQuestion(null)}
                                            className="p-1 rounded text-zinc-500 hover:text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Badges Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                                    DIFFICULTY_CONFIG[selectedQuestion.difficulty as Difficulty]?.bgColor || "bg-emerald-400/10"
                                                } ${DIFFICULTY_CONFIG[selectedQuestion.difficulty as Difficulty]?.color || "text-emerald-400"}`}
                                            >
                                                {selectedQuestion.difficulty}
                                            </span>

                                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                                {selectedQuestion.pattern || "Sliding Window / Greedy Tracker"}
                                            </span>
                                        </div>

                                        <a
                                            href={selectedQuestion.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                                        >
                                            <span>LeetCode</span>
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>

                                    {/* Problem Statement */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                                            PROBLEM STATEMENT
                                        </span>
                                        <p className="text-xs text-zinc-300 leading-relaxed">
                                            {selectedQuestion.description ||
                                                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input would have exactly one solution."}
                                        </p>
                                    </div>

                                    {/* Interview Prompt Focus (Cyan callout box matching Screenshot 5) */}
                                    <div className="bg-[#141923] border-l-2 border-cyan-400 p-3.5 rounded-r-lg space-y-1">
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                                            INTERVIEW PROMPT FOCUS
                                        </span>
                                        <p className="text-xs text-zinc-200 italic leading-relaxed">
                                            &ldquo;{selectedQuestion.interviewQuestion ||
                                                "How do you calculate the maximum single-transaction profit in a line of daily stock prices using only one pass without looking ahead?"}&rdquo;
                                        </p>
                                    </div>

                                    {/* Hint with Reveal toggle */}
                                    <div className="border border-[#1E293B] rounded-lg p-3 bg-[#0B0F17]/60 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                                                <Lightbulb size={13} />
                                                <span>HINT</span>
                                            </div>
                                            <button
                                                onClick={() => setShowHint(!showHint)}
                                                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                                            >
                                                {showHint ? <EyeOff size={12} /> : <Eye size={12} />}
                                                <span>{showHint ? "Hide" : "Reveal"}</span>
                                            </button>
                                        </div>
                                        {showHint && (
                                            <p className="text-xs text-zinc-300 leading-relaxed pt-1 border-t border-[#1E293B]">
                                                {selectedQuestion.hint ||
                                                    "Maintain a running minimum price and compute profit at every subsequent step in linear time."}
                                            </p>
                                        )}
                                    </div>

                                    {/* Time & Space Complexity */}
                                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                        <div className="flex items-center gap-2 bg-[#141923] border border-[#1E293B] p-2.5 rounded-lg">
                                            <Clock size={13} className="text-cyan-400" />
                                            <span className="text-zinc-500 text-[10px]">TIME</span>
                                            <span className="text-white font-bold">{selectedQuestion.timeComplexity || "O(n)"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-[#141923] border border-[#1E293B] p-2.5 rounded-lg">
                                            <Database size={13} className="text-cyan-400" />
                                            <span className="text-zinc-500 text-[10px]">SPACE</span>
                                            <span className="text-white font-bold">{selectedQuestion.spaceComplexity || "O(n)"}</span>
                                        </div>
                                    </div>

                                    {/* Prerequisites */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                                            PREREQUISITES
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(selectedQuestion.prerequisites && selectedQuestion.prerequisites.length > 0
                                                ? selectedQuestion.prerequisites
                                                : ["Arrays", "Basic Logic", "One-pass Traversal"]
                                            ).map((prereq, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded bg-[#141923] border border-[#1E293B] text-[11px] text-zinc-300 font-mono"
                                                >
                                                    {prereq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Common Mistakes */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                                            <AlertTriangle size={11} />
                                            COMMON MISTAKES
                                        </span>
                                        <ul className="text-xs text-zinc-400 space-y-1 pl-4 list-disc marker:text-rose-400">
                                            {(selectedQuestion.commonMistakes && selectedQuestion.commonMistakes.length > 0
                                                ? selectedQuestion.commonMistakes
                                                : [
                                                      "O(n^2) nested loop checking every pair.",
                                                      "Selling before buying chronological index violation.",
                                                      "Failing to handle strictly descending array edge cases."
                                                  ]
                                            ).map((mistake, idx) => (
                                                <li key={idx}>{mistake}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Primary Action Button */}
                                    <button
                                        onClick={() => {
                                            const topic = topics.find((t) =>
                                                t.questions.some((q) => q.name === selectedQuestion.name)
                                            );
                                            if (topic) toggleQuestion(topic.id, selectedQuestion.name);
                                        }}
                                        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg cursor-pointer ${
                                            selectedQuestion.completed
                                                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
                                        }`}
                                    >
                                        {selectedQuestion.completed ? "Mark as Incomplete" : "Mark as Solved"}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-16 text-zinc-500 text-xs">
                                    Click any problem on the left to inspect detailed interview context, hints, and complexity.
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
