"use client";

import React from "react";
import { ArrowRight, Clock, Bookmark, X, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export interface NotesResumeCardProps {
    title: string;
    categoryOrLevel: string;
    categoryColor?: string;
    categoryBg?: string;
    categoryBorder?: string;
    lastSectionName?: string;
    timestamp?: number;
    metaBadge?: string;
    onResume: () => void;
    onDismiss?: () => void;
    className?: string;
}

function formatTimeAgo(timestamp?: number): string {
    if (!timestamp) return "Recently";
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotesResumeCard({
    title,
    categoryOrLevel,
    categoryColor = "text-cyan-400",
    categoryBg = "bg-cyan-500/10",
    categoryBorder = "border-cyan-500/20",
    lastSectionName,
    timestamp,
    metaBadge,
    onResume,
    onDismiss,
    className = "",
}: NotesResumeCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`w-full rounded-2xl border border-cyan-500/30 hover:border-cyan-500/50 bg-gradient-to-r from-cyan-950/30 via-[#10141E] to-emerald-950/20 p-4 sm:p-5 shadow-xl shadow-cyan-500/5 backdrop-blur-md transition-all font-sans relative group ${className}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left content */}
                <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 shadow-md shadow-cyan-500/10 mt-0.5">
                        <Bookmark className="w-5 h-5 animate-pulse" />
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* Eyebrow badge row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block mr-0.5" />
                                Resume where you left off
                            </span>

                            <span className="text-zinc-600 font-mono text-[10px]">•</span>

                            <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${categoryBg} ${categoryColor} ${categoryBorder}`}
                            >
                                {categoryOrLevel}
                            </span>

                            {timestamp && (
                                <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                                    <Clock className="w-3 h-3 text-zinc-500" />
                                    <span>{formatTimeAgo(timestamp)}</span>
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h2
                            onClick={onResume}
                            className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight truncate cursor-pointer flex items-center gap-2"
                        >
                            <span className="truncate">{title}</span>
                            <Sparkles className="w-4 h-4 text-cyan-400/70 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h2>

                        {/* Meta row: section name, words / progress */}
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                            {lastSectionName && (
                                <div className="flex items-center gap-1 text-cyan-300 font-medium bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[11px]">
                                    <FileText className="w-3 h-3 text-cyan-400" />
                                    <span className="text-zinc-400">Section:</span>
                                    <span className="font-semibold truncate max-w-[200px]">{lastSectionName}</span>
                                </div>
                            )}

                            {metaBadge && (
                                <span className="text-[11px] text-zinc-400 font-mono">
                                    {metaBadge}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                        type="button"
                        onClick={onResume}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                        <span>Resume Note</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    {onDismiss && (
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Dismiss resume card"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
