"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search,
    CheckCircle2,
    Circle,
    Clock,
    Briefcase,
    TrendingUp,
    AlertTriangle,
    Zap,
    Flame,
    Trophy,
    Lightbulb,
    ExternalLink
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/components/WorkspaceHeader";

type Status = "Not Started" | "In Progress" | "Mastered";

interface Topic {
    name: string;
    subtopics: string[];
}

interface Category {
    category: string;
    subtitle: string;
    weightage: "Medium" | "High" | "Very High";
    topics: Topic[];
    footerNote?: {
        type: "benchmark" | "warning";
        title: string;
        desc: string;
    };
}

const APTITUDE_DATA: Category[] = [
    {
        category: "Quantitative Aptitude",
        subtitle: "Core Math Foundations",
        weightage: "High",
        topics: [
            {
                name: "Arithmetic",
                subtopics: ["Percentages", "Profit & Loss", "Simple/Compound Interest", "Time and Work"]
            },
            {
                name: "Time & Motion",
                subtopics: ["Time, Speed, and Distance", "Pipes and Cisterns", "Relative Speed", "Boats and Streams"]
            },
            {
                name: "Modern Math",
                subtopics: ["Permutation and Combination", "Probability Distributions", "Number Properties"]
            },
            {
                name: "Data Interpretation",
                subtopics: ["Bar Graphs & Charts", "Tabular Analysis"]
            }
        ]
    },
    {
        category: "Logical Reasoning",
        subtitle: "Deductive & Spatial Logic",
        weightage: "High",
        topics: [
            {
                name: "Arrangements",
                subtopics: ["Linear Seating", "Circular Seating", "Matrix Match"]
            },
            {
                name: "Relational Logic",
                subtopics: ["Blood Relations", "Direction Sense"]
            },
            {
                name: "Critical Thinking",
                subtopics: ["Data Sufficiency", "Assumptions & Inferences"]
            },
            {
                name: "Series & Patterns",
                subtopics: ["Number Series", "Symbol Coding", "Odd One Out"]
            }
        ]
    },
    {
        category: "Verbal Ability",
        subtitle: "Communication & Grammar",
        weightage: "Medium",
        topics: [
            {
                name: "Comprehension",
                subtopics: ["Reading Passages", "Theme Detection"]
            },
            {
                name: "Grammar & Usage",
                subtopics: ["Synonyms & Antonyms", "Cloze Test", "Contextual Usage"]
            }
        ],
        footerNote: {
            type: "benchmark",
            title: "Speed Benchmark",
            desc: "Aim for 220+ WPM with 85% accuracy on Tier-1 reading passages."
        }
    },
    {
        category: "Programming Logic",
        subtitle: "Technical Screening Aptitude",
        weightage: "Very High",
        topics: [
            {
                name: "Pseudocode Analysis",
                subtopics: ["Dry Running Loops", "Conditionals & Logic Gates", "Recursion Depth & Call Stack"]
            },
            {
                name: "Algorithmic Complexity",
                subtopics: ["Big O Notation & Growth", "Auxiliary Space Complexity"]
            }
        ],
        footerNote: {
            type: "warning",
            title: "ASSESSMENT WARNING",
            desc: "Bitwise logic & loop dry runs carry highest elimination weightage in OT rounds."
        }
    }
];

export default function AptitudePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterWeight, setFilterWeight] = useState("All");
    const [statuses, setStatuses] = useState<Record<string, Status>>({
        "Percentages": "Mastered",
        "Profit & Loss": "Mastered",
    });
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        async function fetchStatuses() {
            try {
                const res = await fetch("/api/aptitude");
                if (res.ok) {
                    const data = await res.json();
                    if (data.statuses && Object.keys(data.statuses).length > 0) {
                        setStatuses(data.statuses);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
            }
        }
        fetchStatuses();
    }, []);

    const toggleStatus = async (subtopic: string) => {
        const current = statuses[subtopic] || "Not Started";
        const next: Status =
            current === "Not Started" ? "In Progress" : current === "In Progress" ? "Mastered" : "Not Started";

        const updated = { ...statuses, [subtopic]: next };
        setStatuses(updated);

        try {
            await fetch("/api/aptitude", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statuses: { [subtopic]: next } }),
            });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const totalSubtopics = useMemo(() => {
        let count = 0;
        APTITUDE_DATA.forEach((cat) => cat.topics.forEach((t) => (count += t.subtopics.length)));
        return count;
    }, []);

    const masteredCount = useMemo(() => {
        return Object.values(statuses).filter((s) => s === "Mastered").length;
    }, [statuses]);

    const progressPercentage = totalSubtopics === 0 ? 0 : Math.round((masteredCount / totalSubtopics) * 100);

    const filteredCategories = useMemo(() => {
        return APTITUDE_DATA.map((cat) => {
            if (filterWeight !== "All" && cat.weightage !== filterWeight) return null;

            const filteredTopics = cat.topics
                .map((topic) => {
                    const topicMatches = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchedSub = topic.subtopics.filter((sub) =>
                        sub.toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    if (topicMatches || matchedSub.length > 0) {
                        return {
                            ...topic,
                            subtopics: topicMatches ? topic.subtopics : matchedSub,
                        };
                    }
                    return null;
                })
                .filter(Boolean) as Topic[];

            if (filteredTopics.length > 0) {
                return {
                    ...cat,
                    topics: filteredTopics,
                };
            }
            return null;
        }).filter(Boolean) as Category[];
    }, [searchTerm, filterWeight]);

    return (
        <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] font-sans flex flex-col md:flex-row">
            <Sidebar
                isMobileOpen={isSidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
                <WorkspaceHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

                <main className="p-4 sm:p-6 md:p-8 pb-16 md:pb-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
                    {/* Header Section matching Screenshot 4 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                    TRACK OVERVIEW
                                </span>
                                <span className="text-zinc-600">/</span>
                                <span className="text-xs font-mono text-zinc-400">APTITUDE PREPARATION MATRIX</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                    Aptitude Prep
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#141923] border border-[#1E293B] text-cyan-400 uppercase tracking-wider">
                                    <Briefcase size={12} />
                                    Backend Developer
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#141923] border border-[#1E293B] text-zinc-400 uppercase tracking-wider">
                                    <Clock size={12} />
                                    2 Months Timeline
                                </span>
                            </div>
                        </div>

                        {/* Overall Mastery Circular Widget */}
                        <div className="flex items-center gap-3 bg-[#10141E] border border-[#1E293B] px-4 py-2 rounded-xl shadow-lg shadow-black/40 shrink-0 self-start md:self-auto">
                            <div className="relative w-12 h-12 flex items-center justify-center">
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
                                        strokeDasharray={`${progressPercentage}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-xs font-bold font-mono text-white">
                                    {progressPercentage}%
                                </span>
                            </div>
                            <div>
                                <span className="text-xl font-black font-mono text-white block leading-tight">
                                    {progressPercentage}%
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    OVERALL MASTERY
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Prep Progress Bar Deck */}
                    <div className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 shadow-lg shadow-black/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2.5 gap-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                <span className="font-semibold text-white">Prep Progress</span>
                                <span className="text-zinc-600">/</span>
                                <span className="text-zinc-400">Active Sprint Target</span>
                            </div>
                            <div className="font-mono text-xs">
                                <span className="text-cyan-400 font-semibold">{masteredCount}</span>
                                <span className="text-zinc-400"> of {totalSubtopics} Subtopics Mastered </span>
                                <span className="text-emerald-400 font-bold ml-1">{progressPercentage}%</span>
                            </div>
                        </div>

                        {/* Multi-segment progress visual matching Screenshot 4 */}
                        <div className="grid grid-cols-12 gap-1.5 h-2 w-full bg-[#0B0F17] p-0.5 rounded-full border border-[#1E293B]">
                            {Array.from({ length: 12 }).map((_, idx) => {
                                const activeSegments = Math.round((progressPercentage / 100) * 12);
                                const isFilled = idx < Math.max(1, activeSegments);
                                return (
                                    <div
                                        key={idx}
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            isFilled
                                                ? "bg-cyan-400 shadow-sm shadow-cyan-400/50"
                                                : "bg-zinc-800/60"
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Search & Priority Filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        <div className="relative flex-1 max-w-md">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search topics or subtopics... (e.g. Permutations, Big O, Percentages)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-[#10141E] border border-[#1E293B] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-[#10141E] border border-[#1E293B] rounded-lg p-1 overflow-x-auto no-scrollbar">
                            {["All", "Medium", "High", "Very High"].map((w) => (
                                <button
                                    key={w}
                                    onClick={() => setFilterWeight(w)}
                                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors uppercase tracking-wider cursor-pointer ${
                                        filterWeight === w
                                            ? "bg-[#1E293B] text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4-Column Neo-Brutalist Grid matching Screenshot 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
                        {filteredCategories.map((category) => {
                            const catSubtopics = category.topics.flatMap((t) => t.subtopics);
                            const catMastered = catSubtopics.filter((s) => statuses[s] === "Mastered").length;

                            return (
                                <div
                                    key={category.category}
                                    className="bg-[#10141E] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-black/40 space-y-4"
                                >
                                    <div className="space-y-4">
                                        {/* Column Header */}
                                        <div className="pb-3 border-b border-[#1E293B]">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-white tracking-tight">
                                                    {category.category}
                                                </h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                        category.weightage === "Very High"
                                                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                                            : category.weightage === "High"
                                                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                                            : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                                    }`}
                                                >
                                                    {category.weightage}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                                <span>{category.subtitle}</span>
                                                <span className="font-mono text-cyan-400 font-semibold">
                                                    • {catMastered} / {catSubtopics.length}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Groups & Subtopics */}
                                        <div className="space-y-4">
                                            {category.topics.map((topic) => {
                                                const topicMastered = topic.subtopics.filter(
                                                    (s) => statuses[s] === "Mastered"
                                                ).length;

                                                return (
                                                    <div key={topic.name} className="space-y-2">
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-zinc-300 flex items-center gap-1.5">
                                                                <span className="w-1 h-3 bg-cyan-400 rounded-full" />
                                                                {topic.name}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-zinc-500">
                                                                {topicMastered}/{topic.subtopics.length}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-1.5 pl-2.5 border-l border-[#1E293B]">
                                                            {topic.subtopics.map((subtopic) => {
                                                                const status = statuses[subtopic] || "Not Started";
                                                                const isMastered = status === "Mastered";

                                                                return (
                                                                    <div
                                                                        key={subtopic}
                                                                        onClick={() => toggleStatus(subtopic)}
                                                                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer group ${
                                                                            isMastered
                                                                                ? "bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50"
                                                                                : "hover:bg-[#141923] border border-transparent"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            {isMastered ? (
                                                                                <CheckCircle2
                                                                                    size={14}
                                                                                    className="text-emerald-400 shrink-0"
                                                                                />
                                                                            ) : (
                                                                                <Circle
                                                                                    size={14}
                                                                                    className="text-zinc-600 group-hover:text-cyan-400 shrink-0 transition-colors"
                                                                                />
                                                                            )}
                                                                            <span
                                                                                className={`truncate ${
                                                                                    isMastered
                                                                                        ? "text-white font-medium"
                                                                                        : "text-zinc-300 group-hover:text-white"
                                                                                }`}
                                                                            >
                                                                                {subtopic}
                                                                            </span>
                                                                        </div>

                                                                        <span
                                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0 uppercase tracking-wider ${
                                                                                isMastered
                                                                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                                                                                    : "bg-[#0B0F17] text-zinc-500 border border-[#1E293B]"
                                                                            }`}
                                                                        >
                                                                            {isMastered ? "MASTERED" : "NOT STARTED"}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Optional Footer Callout Note */}
                                    {category.footerNote && (
                                        <div
                                            className={`p-2.5 rounded-lg border text-[11px] ${
                                                category.footerNote.type === "warning"
                                                    ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                                                    : "bg-cyan-500/10 border-cyan-500/25 text-cyan-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 font-bold mb-1">
                                                {category.footerNote.type === "warning" ? (
                                                    <AlertTriangle size={12} />
                                                ) : (
                                                    <Lightbulb size={12} />
                                                )}
                                                <span>{category.footerNote.title}</span>
                                            </div>
                                            <p className="text-zinc-400 leading-tight">
                                                {category.footerNote.desc}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}
