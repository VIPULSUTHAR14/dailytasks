"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    X,
    CheckCircle2,
    Circle,
    Lightbulb,
    Eye,
    EyeOff,
    Clock,
    Database,
    AlertTriangle,
    Youtube,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Save,
    Check,
    Loader2,
    BookOpen,
    Code2,
    Sparkles,
    PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "@/components/RichTextEditor";

export type QuestionItem = {
    name: string;
    difficulty: string;
    url: string;
    videoUrl?: string;
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

export function getYouTubeEmbedUrl(url?: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    try {
        const parsed = new URL(trimmed);
        if (parsed.hostname.includes("youtube.com")) {
            const v = parsed.searchParams.get("v");
            if (v) return `https://www.youtube.com/embed/${v}?rel=0`;
            if (parsed.pathname.startsWith("/embed/")) return `${trimmed}?rel=0`;
        } else if (parsed.hostname.includes("youtu.be")) {
            const id = parsed.pathname.replace(/^\//, "");
            if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
        }
    } catch {
        // Fallback to regex
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2] && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?rel=0`;
    }

    return null;
}

interface DsaQuestionFullscreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: (QuestionItem & { topicId?: string; topicName?: string }) | null;
    topicId: string;
    topicName: string;
    onToggleStatus: (topicId: string, questionName: string) => void;
    onSaveNote: (topicId: string, questionName: string, noteContent: string) => Promise<void>;
    onNavigatePrev?: () => void;
    onNavigateNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
}

const DIFFICULTY_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
}> = {
    Easy: {
        label: "Easy",
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "border-emerald-400/20",
    },
    Medium: {
        label: "Medium",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "border-amber-400/20",
    },
    Hard: {
        label: "Hard",
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        borderColor: "border-rose-400/20",
    },
};

export default function DsaQuestionFullscreenModal({
    isOpen,
    onClose,
    question,
    topicId,
    topicName,
    onToggleStatus,
    onSaveNote,
    onNavigatePrev,
    onNavigateNext,
    hasPrev = false,
    hasNext = false,
}: DsaQuestionFullscreenModalProps) {
    const [noteDraft, setNoteDraft] = useState<string>("");
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
    const [showHint, setShowHint] = useState<boolean>(false);
    const [isNotesMaximized, setIsNotesMaximized] = useState<boolean>(false);
    const [isVideoVisible, setIsVideoVisible] = useState<boolean>(true);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedNoteRef = useRef<string>("");

    // Initialize/sync note state when question changes
    useEffect(() => {
        if (question) {
            const initialNote = question.note || "";
            setNoteDraft(initialNote);
            lastSavedNoteRef.current = initialNote;
            setSaveStatus("saved");
            setShowHint(false);
            setIsVideoVisible(true);
        }
    }, [question?.name]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") {
                if (isNotesMaximized) {
                    setIsNotesMaximized(false);
                } else {
                    onClose();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleForceSave();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isNotesMaximized, onClose]);

    // Trigger explicit save
    const handleForceSave = useCallback(async () => {
        if (!question) return;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }

        setSaveStatus("saving");
        try {
            await onSaveNote(topicId, question.name, noteDraft);
            lastSavedNoteRef.current = noteDraft;
            setSaveStatus("saved");
        } catch (error) {
            console.error("Failed to save note:", error);
            setSaveStatus("unsaved");
        }
    }, [question, topicId, noteDraft, onSaveNote]);

    // Handle note changes with debounced auto-save
    const handleNoteChange = useCallback((newVal: string) => {
        setNoteDraft(newVal);
        if (newVal === lastSavedNoteRef.current) {
            setSaveStatus("saved");
            return;
        }

        setSaveStatus("unsaved");

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(async () => {
            if (!question) return;
            setSaveStatus("saving");
            try {
                await onSaveNote(topicId, question.name, newVal);
                lastSavedNoteRef.current = newVal;
                setSaveStatus("saved");
            } catch (err) {
                console.error("Auto-save failed:", err);
                setSaveStatus("unsaved");
            }
        }, 900);
    }, [question, topicId, onSaveNote]);

    // Cleanup save timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    if (!isOpen || !question) return null;

    const diffCfg = DIFFICULTY_CONFIG[question.difficulty] || DIFFICULTY_CONFIG.Easy;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
            >
                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 12 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
                    className="bg-[#0B0F17] border border-[#1E293B] rounded-2xl shadow-2xl shadow-black/80 flex flex-col w-full h-full max-h-[96vh] overflow-hidden"
                >
                    {/* Top Header Bar */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1E293B] bg-[#10141E]/90 shrink-0">
                        {/* Title & Topic Breadcrumb */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider truncate max-w-[140px] sm:max-w-none">
                                    {topicName || "DSA"}
                                </span>
                                <span className="text-zinc-600 font-mono">/</span>
                                <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
                                    {question.name}
                                </h1>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Auto-save status indicator */}
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141923] border border-[#1E293B] text-[11px] font-mono">
                                {saveStatus === "saving" && (
                                    <>
                                        <Loader2 size={12} className="animate-spin text-cyan-400" />
                                        <span className="text-cyan-400">Saving...</span>
                                    </>
                                )}
                                {saveStatus === "saved" && (
                                    <>
                                        <Check size={12} className="text-emerald-400" />
                                        <span className="text-emerald-400">Saved</span>
                                    </>
                                )}
                                {saveStatus === "unsaved" && (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-amber-400">Unsaved</span>
                                    </>
                                )}
                            </div>

                            {/* Question Prev / Next navigation */}
                            <div className="flex items-center rounded-lg bg-[#141923] border border-[#1E293B] p-0.5">
                                <button
                                    onClick={onNavigatePrev}
                                    disabled={!hasPrev}
                                    className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                    title="Previous Question"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="w-px h-3.5 bg-[#1E293B]" />
                                <button
                                    onClick={onNavigateNext}
                                    disabled={!hasNext}
                                    className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                    title="Next Question"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Close Modal Button */}
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer ml-1"
                                title="Close Fullscreen (Esc)"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Split Layout Body */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-5 overflow-hidden">
                        {/* Left Side: Rich Text Editor / Notes Area */}
                        <div
                            className={`${
                                isNotesMaximized ? "lg:col-span-12" : "lg:col-span-7"
                            } bg-[#10141E] border border-[#1E293B] rounded-xl flex flex-col min-h-0 overflow-hidden shadow-lg shadow-black/50 transition-all`}
                        >
                            <RichTextEditor
                                label="Personal Notes & Approaches"
                                value={noteDraft}
                                onChange={handleNoteChange}
                                onSave={handleForceSave}
                                isSaved={saveStatus === "saved"}
                                placeholder="Write your intuition, code snippets, edge cases, or complexity explanations here..."
                                isFullscreen={isNotesMaximized}
                                onToggleFullscreen={(val) => setIsNotesMaximized(val)}
                                className="h-full flex flex-col"
                            />
                        </div>

                        {/* Right Side: Question Context & Details */}
                        {!isNotesMaximized && (
                            <div className="lg:col-span-5 bg-[#10141E] border border-[#1E293B] rounded-xl p-4 sm:p-5 overflow-y-auto space-y-4 shadow-lg shadow-black/50 text-xs">
                                {/* Badges & Action Links Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E293B]/80">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${diffCfg.bgColor} ${diffCfg.color} border ${diffCfg.borderColor}`}
                                        >
                                            {diffCfg.label}
                                        </span>

                                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                            {question.pattern || "Algorithmic Logic"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {question.videoUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setIsVideoVisible((prev) => !prev)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                                                    isVideoVisible
                                                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                                                        : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                                }`}
                                                title="Toggle in-page YouTube video player"
                                            >
                                                <Youtube size={13} className="text-red-400" />
                                                <span>{isVideoVisible ? "Hide Player" : "Watch Solution"}</span>
                                            </button>
                                        )}

                                        <a
                                            href={question.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141923] hover:bg-[#1E293B] text-cyan-400 border border-[#1E293B] text-[11px] font-semibold transition-colors"
                                        >
                                            <span>LeetCode</span>
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                {/* Embedded YouTube Walkthrough Player */}
                                {(() => {
                                    const ytEmbedUrl = getYouTubeEmbedUrl(question.videoUrl);
                                    if (!ytEmbedUrl) return null;

                                    return (
                                        <div className="space-y-2 bg-[#0B0F17]/90 border border-red-500/20 rounded-xl p-3 shadow-md shadow-black/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-red-400 font-semibold font-mono text-[11px]">
                                                    <Youtube size={14} />
                                                    <span>VIDEO WALKTHROUGH</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsVideoVisible(!isVideoVisible)}
                                                        className="text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
                                                    >
                                                        {isVideoVisible ? "Collapse" : "Expand"}
                                                    </button>
                                                    {question.videoUrl && (
                                                        <a
                                                            href={question.videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-zinc-500 hover:text-red-400 transition-colors"
                                                            title="Open in new tab on YouTube"
                                                        >
                                                            <ExternalLink size={11} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {isVideoVisible && (
                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-[#1E293B] shadow-inner">
                                                    <iframe
                                                        src={ytEmbedUrl}
                                                        title={`${question.name} Video Solution`}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        className="absolute inset-0 w-full h-full border-0"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Problem Statement */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                                        PROBLEM STATEMENT
                                    </span>
                                    <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-sans">
                                        {question.description || "Solve the problem using the optimal time and space complexity."}
                                    </p>
                                </div>

                                {/* Interview Prompt Focus (Cyan callout box) */}
                                {question.interviewQuestion && (
                                    <div className="bg-[#141923] border-l-2 border-cyan-400 p-3.5 rounded-r-lg space-y-1">
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">
                                            INTERVIEW PROMPT FOCUS
                                        </span>
                                        <p className="text-xs text-zinc-200 italic leading-relaxed">
                                            &ldquo;{question.interviewQuestion}&rdquo;
                                        </p>
                                    </div>
                                )}

                                {/* Revealable Hint Card */}
                                {question.hint && (
                                    <div className="border border-[#1E293B] rounded-lg p-3 bg-[#0B0F17]/60 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono text-[11px]">
                                                <Lightbulb size={13} />
                                                <span>HINT</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowHint(!showHint)}
                                                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
                                            >
                                                {showHint ? <EyeOff size={12} /> : <Eye size={12} />}
                                                <span>{showHint ? "Hide" : "Reveal"}</span>
                                            </button>
                                        </div>
                                        {showHint && (
                                            <p className="text-xs text-zinc-300 leading-relaxed pt-2 border-t border-[#1E293B]">
                                                {question.hint}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Time & Space Complexity Deck */}
                                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                    <div className="flex items-center gap-2 bg-[#141923] border border-[#1E293B] p-2.5 rounded-lg">
                                        <Clock size={13} className="text-cyan-400" />
                                        <span className="text-zinc-500 text-[10px]">TIME</span>
                                        <span className="text-white font-bold">{question.timeComplexity || "O(n)"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#141923] border border-[#1E293B] p-2.5 rounded-lg">
                                        <Database size={13} className="text-cyan-400" />
                                        <span className="text-zinc-500 text-[10px]">SPACE</span>
                                        <span className="text-white font-bold">{question.spaceComplexity || "O(1)"}</span>
                                    </div>
                                </div>

                                {/* Prerequisites Chips */}
                                {question.prerequisites && question.prerequisites.length > 0 && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                                            PREREQUISITES
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {question.prerequisites.map((prereq, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded bg-[#141923] border border-[#1E293B] text-[11px] text-zinc-300 font-mono"
                                                >
                                                    {prereq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Common Mistakes Warning Deck */}
                                {question.commonMistakes && question.commonMistakes.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1 font-mono">
                                            <AlertTriangle size={11} />
                                            COMMON MISTAKES
                                        </span>
                                        <ul className="text-xs text-zinc-400 space-y-1 pl-4 list-disc marker:text-rose-400 leading-relaxed">
                                            {question.commonMistakes.map((mistake, idx) => (
                                                <li key={idx}>{mistake}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Primary Action: Mark as Solved / Incomplete */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => onToggleStatus(topicId, question.name)}
                                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                                            question.completed
                                                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                                                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 font-extrabold"
                                        }`}
                                    >
                                        {question.completed ? (
                                            <>
                                                <CheckCircle2 size={15} className="text-emerald-400" />
                                                <span>Completed (Click to Mark Incomplete)</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={15} />
                                                <span>Mark as Solved</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
