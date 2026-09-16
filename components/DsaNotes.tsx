"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, ReactNode } from "react";
import {
    Search, X, Filter, Menu, LogOut,
    BookOpen, Save, Star, StarOff, CheckCircle2, Circle,
    Lightbulb, AlertTriangle, MessageCircle, Clock,
    Zap, Flame, Trophy, Award, Plus, Trash2,
    Brain, Target, FileText, Tag,
    TrendingUp, Code2, Layers, GraduationCap, StickyNote,
    ChevronLeft, ChevronRight, Edit3, Eye, Copy, Check,
    PanelLeftClose, PanelLeftOpen,
    ExternalLink, Link as LinkIcon, Video as VideoIcon, PlayCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";

// ── Types ───────────────────────────────────────────────────────────────────

type MasteryState = {
    understandTheory: boolean;
    canExplain: boolean;
    canSolveEasy: boolean;
    canSolveMedium: boolean;
    canSolveHard: boolean;
    canTeachSomeone: boolean;
};

type NoteTopic = {
    id: number;
    name: string;
    level: string;
    notes: string;
    examples: string[];
    tutorQuestions: string[];
    importantPoints: string[];
    commonMistakes: string[];
    interviewTips: string[];
    memoryTricks: string[];
    revisionNotes: string;
    formulas: string[];
    algorithms: string[];
    timeComplexities: string[];
    spaceComplexities: string[];
    patterns: string[];
    keywords: string[];
    practiceProblems: string[];
    relatedTopics: string[];
    doubts: string[];
    resources: string[];
    lastRevised: string;
    revisionCount: number;
    confidence: number;
    mastery: MasteryState;
    favorite: boolean;
    completed: boolean;
};

// ── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Zap;
    gradient: string;
}> = {
    Beginner: {
        label: "Beginner",
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "border-emerald-400/20",
        icon: Zap,
        gradient: "from-emerald-500/20 to-emerald-600/5",
    },
    Intermediate: {
        label: "Intermediate",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "border-amber-400/20",
        icon: Flame,
        gradient: "from-amber-500/20 to-amber-600/5",
    },
    Advanced: {
        label: "Advanced",
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        borderColor: "border-rose-400/20",
        icon: Trophy,
        gradient: "from-rose-500/20 to-rose-600/5",
    },
    Expert: {
        label: "Expert",
        color: "text-violet-400",
        bgColor: "bg-violet-400/10",
        borderColor: "border-violet-400/20",
        icon: Award,
        gradient: "from-violet-500/20 to-violet-600/5",
    },
};

const STORAGE_KEY = "dsa-notes-data";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getMasteryPercent(mastery: MasteryState): number {
    const vals = Object.values(mastery);
    return Math.round((vals.filter(Boolean).length / vals.length) * 100);
}

function getFilledFieldsCount(topic: NoteTopic): number {
    let count = 0;
    if (topic.notes) count++;
    if (topic.revisionNotes) count++;
    const arrayFields: (keyof NoteTopic)[] = [
        "examples", "tutorQuestions", "importantPoints", "commonMistakes",
        "interviewTips", "memoryTricks", "formulas", "algorithms",
        "timeComplexities", "spaceComplexities", "patterns", "keywords",
        "practiceProblems", "doubts", "resources"
    ];
    for (const f of arrayFields) {
        const val = topic[f];
        if (Array.isArray(val) && val.length > 0) count++;
    }
    return count;
}

// ── Markdown Parser Helper ──────────────────────────────────────────────────

function renderMarkdownLine(line: string) {
    if (!line) return " ";

    // Check for Headers
    if (line.startsWith("# ")) {
        return <span className="text-base font-bold text-white tracking-wide">{line.substring(2)}</span>;
    }
    if (line.startsWith("## ")) {
        return <span className="text-sm font-bold text-zinc-100 tracking-wide">{line.substring(3)}</span>;
    }
    if (line.startsWith("### ")) {
        return <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{line.substring(4)}</span>;
    }

    // Check for Blockquote
    if (line.startsWith("> ")) {
        return (
            <span className="border-l-2 border-amber-400/60 pl-2 text-zinc-300 italic inline-block">
                {line.substring(2)}
            </span>
        );
    }

    // Check for Divider
    if (line.trim() === "---" || line.trim() === "***") {
        return <span className="block border-b border-white/10 my-1 w-full" />;
    }

    // Check for Bullet or Numbered list items
    let prefix = "";
    let content = line;
    if (line.startsWith("- ")) {
        prefix = "• ";
        content = line.substring(2);
    } else if (line.startsWith("* ")) {
        prefix = "• ";
        content = line.substring(2);
    } else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.\s)/);
        if (match) {
            prefix = match[1];
            content = line.substring(prefix.length);
        }
    }

    // Parse Highlights (==red:text==, etc.), Links ([text](url)), Raw URLs (https://...), Bold (**bold**), Italic (*italic*), Underline (<u>text</u>), Strikethrough (~~text~~), Code (`code`), Superscript (^text^), Subscript (~text~)
    const parts: (string | ReactNode)[] = [];
    let currentText = content;

    // Regex matching inline formatting including markdown links and URLs
    const regex = /(==red:.*?==|==r:.*?==|==green:.*?==|==g:.*?==|==blue:.*?==|==b:.*?==|==yellow:.*?==|==y:.*?==|==purple:.*?==|==p:.*?==|==.*?==|\[.*?\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+|\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|~~.*?~~|`.*?`|\^[^\s^]+\^|~[^\s~]+~)/gi;
    const splitParts = currentText.split(regex);

    splitParts.forEach((part, index) => {
        if (!part) return;

        const lower = part.toLowerCase();
        if (lower.startsWith("==red:") || lower.startsWith("==r:")) {
            const inner = part.replace(/^==(red|r):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-rose-500/25 text-rose-200 border border-rose-500/40 px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm inline-block mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==green:") || lower.startsWith("==g:")) {
            const inner = part.replace(/^==(green|g):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm inline-block mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==blue:") || lower.startsWith("==b:")) {
            const inner = part.replace(/^==(blue|b):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-sky-500/25 text-sky-200 border border-sky-500/40 px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm inline-block mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==yellow:") || lower.startsWith("==y:")) {
            const inner = part.replace(/^==(yellow|y):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-amber-500/25 text-amber-200 border border-amber-500/40 px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm inline-block mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==purple:") || lower.startsWith("==p:")) {
            const inner = part.replace(/^==(purple|p):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-purple-500/25 text-purple-200 border border-purple-500/40 px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm inline-block mx-0.5">
                    {inner}
                </mark>
            );
        } else if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
            const inner = part.slice(2, -2);
            parts.push(
                <mark key={index} className="bg-amber-500/25 text-amber-200 border border-amber-500/40 px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm inline-block mx-0.5">
                    {inner}
                </mark>
            );
        } else if (part.startsWith("[") && part.endsWith(")") && part.includes("](")) {
            const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
            if (linkMatch) {
                const linkText = linkMatch[1];
                const linkUrl = linkMatch[2];
                const isVideo = /youtube\.com|youtu\.be|vimeo\.com|loom\.com/i.test(linkUrl) || linkText.includes("🎥") || linkText.toLowerCase().includes("video");
                parts.push(
                    <a
                        key={index}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium transition-all mx-0.5 no-underline align-baseline cursor-pointer ${
                            isVideo
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 hover:text-rose-100 hover:border-rose-500/60 shadow-sm"
                                : "bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 hover:text-sky-100 hover:border-sky-500/60 shadow-sm"
                        }`}
                        title={`Open link: ${linkUrl}`}
                    >
                        {isVideo ? <PlayCircle className="w-3 h-3 text-rose-400 shrink-0" /> : <LinkIcon className="w-3 h-3 text-sky-400 shrink-0" />}
                        <span className="font-semibold">{linkText || linkUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0 ml-0.5" />
                    </a>
                );
            } else {
                parts.push(part);
            }
        } else if (/^https?:\/\/[^\s]+$/i.test(part)) {
            const isVideo = /youtube\.com|youtu\.be|vimeo\.com|loom\.com/i.test(part);
            parts.push(
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-all mx-0.5 no-underline align-baseline cursor-pointer ${
                        isVideo
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 hover:text-rose-100"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 hover:text-sky-100"
                    }`}
                    title={`Open link: ${part}`}
                >
                    {isVideo ? <PlayCircle className="w-3 h-3 text-rose-400 shrink-0" /> : <LinkIcon className="w-3 h-3 text-sky-400 shrink-0" />}
                    <span className="font-mono text-[11px] underline underline-offset-2">
                        {part.length > 32 ? part.substring(0, 29) + "..." : part}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                </a>
            );
        } else if (part.startsWith("<u>") && part.endsWith("</u>") && part.length >= 7) {
            parts.push(
                <u key={index} className="underline decoration-white/50 underline-offset-4 decoration-1">
                    {part.slice(3, -4)}
                </u>
            );
        } else if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
            parts.push(
                <del key={index} className="line-through text-zinc-400 opacity-80">
                    {part.slice(2, -2)}
                </del>
            );
        } else if (part.startsWith("**") && part.endsWith("**")) {
            parts.push(<strong key={index} className="font-bold text-zinc-100">{part.slice(2, -2)}</strong>);
        } else if (part.startsWith("*") && part.endsWith("*")) {
            parts.push(<em key={index} className="italic text-zinc-400">{part.slice(1, -1)}</em>);
        } else if (part.startsWith("`") && part.endsWith("`")) {
            parts.push(
                <code key={index} className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-rose-300 font-mono border border-white/5">
                    {part.slice(1, -1)}
                </code>
            );
        } else if (part.startsWith("^") && part.endsWith("^") && part.length > 2) {
            parts.push(
                <sup key={index} className="text-[10px] text-amber-300 font-semibold align-super ml-0.5">
                    {part.slice(1, -1)}
                </sup>
            );
        } else if (part.startsWith("~") && part.endsWith("~") && !part.startsWith("~~") && part.length > 2) {
            parts.push(
                <sub key={index} className="text-[10px] text-sky-300 font-semibold align-sub ml-0.5">
                    {part.slice(1, -1)}
                </sub>
            );
        } else {
            parts.push(part);
        }
    });

    return (
        <span>
            {prefix && <span className="text-zinc-500 font-bold mr-1">{prefix}</span>}
            {parts}
        </span>
    );
}

// ── Paginated Notes Block (Explained & beautiful rendering, 40 lines capacity) ─

function PaginatedNotesBlock({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [copied, setCopied] = useState(false);
    const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());
    const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("sm");
    const linesPerPage = 40;

    // Split value into lines, preserving empty lines
    const lines = useMemo(() => {
        if (!value) return [];
        return value.split("\n");
    }, [value]);

    const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage));

    const stats = useMemo(() => {
        if (!value) return { words: 0, readTime: 0 };
        const cleanText = value.trim();
        if (!cleanText) return { words: 0, readTime: 0 };
        const words = cleanText.split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.ceil(words / 200)); // ~200 WPM
        return { words, readTime };
    }, [value]);

    // Ensure page range is correct
    useEffect(() => {
        if (currentPage >= totalPages) {
            setCurrentPage(Math.max(0, totalPages - 1));
        }
    }, [totalPages, currentPage]);

    const pageLines = useMemo(() => {
        if (lines.length === 0) return [];
        const start = currentPage * linesPerPage;
        return lines.slice(start, start + linesPerPage);
    }, [lines, currentPage]);

    const leftLines = useMemo(() => pageLines.slice(0, 20), [pageLines]);
    const rightLines = useMemo(() => pageLines.slice(20, 40), [pageLines]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text", err);
        }
    };

    const toggleLineHighlight = (lineNum: number) => {
        setHighlightedLines(prev => {
            const next = new Set(prev);
            if (next.has(lineNum)) {
                next.delete(lineNum);
            } else {
                next.add(lineNum);
            }
            return next;
        });
    };

    const insertMarkdown = (syntax: string) => {
        const textarea = document.getElementById(`textarea-${label}`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        let replacement = "";
        if (syntax === "bold") replacement = `**${selected || "bold text"}**`;
        else if (syntax === "italic") replacement = `*${selected || "italic text"}*`;
        else if (syntax === "underline") replacement = `<u>${selected || "underlined text"}</u>`;
        else if (syntax === "strike") replacement = `~~${selected || "strikethrough text"}~~`;
        else if (syntax === "code") replacement = `\`${selected || "code"}\``;
        else if (syntax === "superscript") replacement = `^${selected || "super"}^`;
        else if (syntax === "subscript") replacement = `~${selected || "sub"}~`;
        else if (syntax === "link") {
            if (selected.startsWith("http://") || selected.startsWith("https://")) {
                replacement = `[Resource Link](${selected})`;
            } else if (selected) {
                replacement = `[${selected}](https://...)`;
            } else {
                replacement = `[Resource Title](https://...)`;
            }
        }
        else if (syntax === "video") {
            if (selected.startsWith("http://") || selected.startsWith("https://")) {
                replacement = `[🎥 Video](${selected})`;
            } else if (selected) {
                replacement = `[🎥 ${selected}](https://youtube.com/...)`;
            } else {
                replacement = `[🎥 Video Title](https://youtube.com/...)`;
            }
        }
        else if (syntax === "hl-red") replacement = `==r:${selected || "highlight"}==`;
        else if (syntax === "hl-green") replacement = `==g:${selected || "highlight"}==`;
        else if (syntax === "hl-blue") replacement = `==b:${selected || "highlight"}==`;
        else if (syntax === "hl-yellow") replacement = `==y:${selected || "highlight"}==`;
        else if (syntax === "hl-purple") replacement = `==p:${selected || "highlight"}==`;
        else if (syntax === "list") replacement = `\n- ${selected || "list item"}`;
        else if (syntax === "numlist") replacement = `\n1. ${selected || "numbered item"}`;
        else if (syntax === "h1") replacement = `\n# ${selected || "Heading 1"}`;
        else if (syntax === "h2") replacement = `\n## ${selected || "Heading 2"}`;
        else if (syntax === "h3") replacement = `\n### ${selected || "Heading 3"}`;
        else if (syntax === "codeblock") replacement = `\n\`\`\`\n${selected || "// code block"}\n\`\`\`\n`;

        const newValue = text.substring(0, start) + replacement + text.substring(end);
        onChange(newValue);

        // Refocus and select placeholder URL if present
        setTimeout(() => {
            textarea.focus();
            const urlMatch = replacement.match(/\((https?:\/\/[^\s)]+)\)/);
            if (urlMatch && urlMatch.index !== undefined) {
                const urlStart = start + urlMatch.index + 1;
                const urlEnd = urlStart + urlMatch[1].length;
                textarea.setSelectionRange(urlStart, urlEnd);
            } else {
                textarea.setSelectionRange(start + replacement.length, start + replacement.length);
            }
        }, 50);
    };

    const textSizeClass = fontSize === "sm" ? "text-xs" : fontSize === "base" ? "text-sm" : "text-base";

    return (
        <div className="border border-white/[0.08] rounded-2xl overflow-visible bg-zinc-900/40 shadow-inner flex flex-col font-sans mb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06] rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-200 tracking-wide">{label}</span>
                    {lines.length > 0 && (
                        <span className="text-xs text-zinc-500 font-mono">
                            {lines.length} {lines.length === 1 ? "line" : "lines"}
                            {stats.words > 0 && ` • ${stats.words} words • ${stats.readTime} min read`}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Font Size controls */}
                    {!isEditing && (
                        <div className="flex items-center border border-white/[0.06] rounded-lg p-0.5 bg-white/[0.02] mr-2">
                            {(["sm", "base", "lg"] as const).map((sz) => (
                                <button
                                    key={sz}
                                    type="button"
                                    onClick={() => setFontSize(sz)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-all uppercase ${fontSize === sz
                                        ? "bg-white text-zinc-950 shadow-sm"
                                        : "text-zinc-400 hover:text-white"
                                        }`}
                                >
                                    {sz}
                                </button>
                            ))}
                        </div>
                    )}
                    {value && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white transition-all hover:bg-white/[0.04]"
                            title="Copy full text"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                    >
                        {isEditing ? (
                            <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Body - holds 40 lines of content */}
            <div className="relative bg-black/[0.15] rounded-b-2xl overflow-visible">
                {isEditing ? (
                    <div className="p-4 flex flex-row items-start gap-3 relative overflow-visible">
                        {/* Sticky Left-Side 2-Column Note-Taking Toolbar */}
                        <div className="sticky top-6 z-30 shrink-0 flex flex-col items-center gap-2 p-2.5 bg-zinc-950/95 backdrop-blur-md border border-white/[0.1] rounded-2xl shadow-2xl">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center w-full">Tools</span>
                            
                            {/* 2-Column Grid of Tools */}
                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { id: "h1", label: "H1", title: "Heading 1 (#)" },
                                    { id: "h2", label: "H2", title: "Heading 2 (##)" },
                                    { id: "h3", label: "H3", title: "Heading 3 (###)" },
                                    { id: "bold", label: "B", title: "Bold (**text**)", className: "font-bold" },
                                    { id: "italic", label: "I", title: "Italic (*text*)", className: "italic" },
                                    { id: "underline", label: "U", title: "Underline (<u>text</u>)", className: "underline underline-offset-2" },
                                    { id: "strike", label: "S", title: "Strikethrough (~~text~~)", className: "line-through opacity-80" },
                                    { id: "code", label: "</>", title: "Inline Code (`code`)" },
                                    { id: "codeblock", label: "{ }", title: "Code Block (```)" },
                                    { id: "list", label: "•", title: "Bullet List (- item)" },
                                    { id: "numlist", label: "1.", title: "Numbered List (1. item)" },
                                    { id: "superscript", label: "X²", title: "Superscript (^text^)" },
                                    { id: "subscript", label: "X₂", title: "Subscript (~text~)" },
                                    { id: "link", label: <LinkIcon className="w-3.5 h-3.5 text-sky-400" />, title: "Resource Link ([Title](url))" },
                                    { id: "video", label: <VideoIcon className="w-3.5 h-3.5 text-rose-400" />, title: "Video Link ([🎥 Video](url))" },
                                ].map((btn) => (
                                    <div key={btn.id} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown(btn.id)}
                                            className={`w-7 h-7 flex items-center justify-center text-[11px] font-semibold rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.12] hover:border-white/20 transition-all ${btn.className || ""}`}
                                            title={btn.title}
                                        >
                                            {btn.label}
                                        </button>
                                        {/* Tooltip to the right */}
                                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            {btn.title}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Color Highlight Section */}
                            <div className="w-full h-[1px] bg-white/10 my-0.5" />
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center w-full">Highlight</span>

                            {/* Color Highlight 2-Column Grid */}
                            <div className="grid grid-cols-2 gap-1.5">
                                {/* Red Highlight */}
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => insertMarkdown("hl-red")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-500/60 transition-all"
                                        title="Red Highlight (==r:text==)"
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                    </button>
                                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-rose-300 text-[11px] font-medium rounded-md shadow-xl border border-rose-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                        Red Highlight (==r:text==)
                                    </div>
                                </div>

                                {/* Green Highlight */}
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => insertMarkdown("hl-green")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/60 transition-all"
                                        title="Green Highlight (==g:text==)"
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                    </button>
                                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-emerald-300 text-[11px] font-medium rounded-md shadow-xl border border-emerald-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                        Green Highlight (==g:text==)
                                    </div>
                                </div>

                                {/* Blue Highlight */}
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => insertMarkdown("hl-blue")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/25 hover:border-sky-500/60 transition-all"
                                        title="Blue Highlight (==b:text==)"
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                                    </button>
                                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-sky-300 text-[11px] font-medium rounded-md shadow-xl border border-sky-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                        Blue Highlight (==b:text==)
                                    </div>
                                </div>

                                {/* Yellow Highlight */}
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => insertMarkdown("hl-yellow")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/60 transition-all"
                                        title="Yellow Highlight (==y:text==)"
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                    </button>
                                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-amber-300 text-[11px] font-medium rounded-md shadow-xl border border-amber-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                        Yellow Highlight (==y:text==)
                                    </div>
                                </div>

                                {/* Purple Highlight */}
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => insertMarkdown("hl-purple")}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/60 transition-all"
                                        title="Purple Highlight (==p:text==)"
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                                    </button>
                                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-purple-300 text-[11px] font-medium rounded-md shadow-xl border border-purple-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                        Purple Highlight (==p:text==)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Textarea Area */}
                        <textarea
                            id={`textarea-${label}`}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            rows={40}
                            className="flex-1 min-w-0 bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all font-mono leading-relaxed resize-y"
                            style={{
                                fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                lineHeight: "1.6"
                            }}
                        />
                    </div>
                ) : (
                    <div
                        className="p-5 font-mono text-sm leading-relaxed overflow-x-auto select-text selection:bg-white selection:text-zinc-950 flex flex-col justify-start"
                        style={{
                            minHeight: "520px",
                            fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        }}
                    >
                        {pageLines.length === 0 ? (
                            <div className="text-zinc-600 italic py-20 text-center font-sans text-xs my-auto">
                                {placeholder}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04]">
                                {/* Left Column (Lines 1-20) */}
                                <div className="space-y-1 group/notes-left">
                                    {leftLines.map((line, idx) => {
                                        const lineNumber = currentPage * linesPerPage + idx + 1;
                                        const isHighlighted = highlightedLines.has(lineNumber);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-start px-1 py-0.5 rounded transition-all duration-150 group/line hover:!opacity-100 group-hover/notes-left:opacity-40 ${isHighlighted
                                                    ? "bg-amber-400/[0.06] border-l-2 border-amber-400/50"
                                                    : "hover:bg-white/[0.02]"
                                                    }`}
                                            >
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); toggleLineHighlight(lineNumber); }}
                                                    className={`w-9 select-none text-right pr-3 font-mono text-xs mt-0.5 border-r border-white/[0.04] mr-3 shrink-0 cursor-pointer ${isHighlighted ? "text-amber-400 font-bold" : "text-zinc-600 group-hover/line:text-zinc-400 hover:text-white"
                                                        }`}
                                                    title="Toggle line highlight"
                                                >
                                                    {lineNumber}
                                                </span>
                                                <span className={`flex-1 whitespace-pre-wrap break-all tracking-normal leading-relaxed font-mono ${textSizeClass} ${isHighlighted ? "text-amber-100/90 font-medium" : "text-zinc-300"
                                                    }`}>
                                                    {renderMarkdownLine(line)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Column (Lines 21-40) */}
                                <div className="space-y-1 pt-6 lg:pt-0 lg:pl-8 group/notes-right border-t lg:border-t-0 border-white/[0.04]">
                                    {rightLines.map((line, idx) => {
                                        const lineNumber = currentPage * linesPerPage + 20 + idx + 1;
                                        const isHighlighted = highlightedLines.has(lineNumber);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-start px-1 py-0.5 rounded transition-all duration-150 group/line hover:!opacity-100 group-hover/notes-right:opacity-40 ${isHighlighted
                                                    ? "bg-amber-400/[0.06] border-l-2 border-amber-400/50"
                                                    : "hover:bg-white/[0.02]"
                                                    }`}
                                            >
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); toggleLineHighlight(lineNumber); }}
                                                    className={`w-9 select-none text-right pr-3 font-mono text-xs mt-0.5 border-r border-white/[0.04] mr-3 shrink-0 cursor-pointer ${isHighlighted ? "text-amber-400 font-bold" : "text-zinc-600 group-hover/line:text-zinc-400 hover:text-white"
                                                        }`}
                                                    title="Toggle line highlight"
                                                >
                                                    {lineNumber}
                                                </span>
                                                <span className={`flex-1 whitespace-pre-wrap break-all tracking-normal leading-relaxed font-mono ${textSizeClass} ${isHighlighted ? "text-amber-100/90 font-medium" : "text-zinc-300"
                                                    }`}>
                                                    {renderMarkdownLine(line)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination / Footer (Only shows when not editing and there are multiple pages) */}
            {!isEditing && totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-t border-white/[0.06]">
                    <span className="text-xs text-zinc-500 font-medium font-sans">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            className="p-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent transition-all font-sans"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            className="p-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent transition-all font-sans"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Editable List Field (always open, no collapsible) ───────────────────────

function EditableListField({
    label,
    icon: Icon,
    items,
    onChange,
    placeholder,
}: {
    label: string;
    icon: typeof Lightbulb;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder: string;
}) {
    const [newItem, setNewItem] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addItem = () => {
        const trimmed = newItem.trim();
        if (trimmed) {
            onChange([...items, trimmed]);
            setNewItem("");
            inputRef.current?.focus();
        }
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, value: string) => {
        const updated = [...items];
        updated[index] = value;
        onChange(updated);
    };

    return (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-zinc-900/30 font-sans">
            {/* Label header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-300 tracking-wide">{label}</span>
                {items.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
                        {items.length}
                    </span>
                )}
            </div>

            {/* Items always visible */}
            <div className="px-4 py-3 space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 group">
                        <span className="text-zinc-600 text-xs mt-2.5 font-mono w-5 text-right shrink-0">
                            {index + 1}.
                        </span>
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all font-mono"
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="mt-1.5 p-1 rounded-md text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                {/* Add new item row */}
                <div className="flex items-center gap-2">
                    <span className="w-5 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addItem();
                            }
                        }}
                        placeholder={placeholder}
                        className="flex-1 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all font-mono"
                    />
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!newItem.trim()}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-30 disabled:hover:text-zinc-500 disabled:hover:bg-transparent transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Resource Links Block (interactive add/edit form, index selection) ───────

function ResourceLinksBlock({
    resources,
    onChange,
}: {
    resources: string[];
    onChange: (updated: string[]) => void;
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [targetIndex, setTargetIndex] = useState<number>(resources.length); // 0-indexed position, defaults to end

    // Reset form state
    const closeForm = () => {
        setIsFormOpen(false);
        setEditIndex(null);
        setName("");
        setLink("");
        setTargetIndex(resources.length);
    };

    // Open form for adding
    const openAddForm = () => {
        setName("");
        setLink("");
        setTargetIndex(resources.length);
        setEditIndex(null);
        setIsFormOpen(true);
    };

    // Open form for editing
    const openEditForm = (idx: number) => {
        const item = resources[idx] || "";
        const parts = item.split(" | ");
        const itemName = parts[0] || "";
        const itemLink = parts[1] || itemName;

        setName(parts.length > 1 ? itemName : "");
        setLink(itemLink);
        setTargetIndex(idx);
        setEditIndex(idx);
        setIsFormOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedLink = link.trim();
        if (!trimmedLink) return;

        const trimmedName = name.trim();
        const resourceValue = trimmedName ? `${trimmedName} | ${trimmedLink}` : trimmedLink;

        let updated = [...resources];
        if (editIndex !== null) {
            // Editing existing resource
            // Remove it first
            updated.splice(editIndex, 1);
            // Insert at the chosen targetIndex (capping at length)
            const insertPos = Math.min(Math.max(0, targetIndex), updated.length);
            updated.splice(insertPos, 0, resourceValue);
        } else {
            // Adding new resource
            const insertPos = Math.min(Math.max(0, targetIndex), updated.length);
            updated.splice(insertPos, 0, resourceValue);
        }

        onChange(updated);
        closeForm();
    };

    const handleDelete = (idx: number) => {
        onChange(resources.filter((_, i) => i !== idx));
    };

    return (
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-zinc-900/40 shadow-inner flex flex-col font-sans mb-6 font-semibold">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-200 tracking-wide">🔗 Useful Resources</span>
                    {resources.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
                            {resources.length}
                        </span>
                    )}
                </div>
                {!isFormOpen && (
                    <button
                        type="button"
                        onClick={openAddForm}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Resource</span>
                    </button>
                )}
            </div>

            {/* List & Form */}
            <div className="p-5 space-y-4">
                {/* Form (shows when open) */}
                {isFormOpen && (
                    <form onSubmit={handleSave} className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            {editIndex !== null ? "Edit Resource Link" : "Add Resource Link"}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1 flex flex-col">
                                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Resource Name (Label)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. GeeksforGeeks Sorting Guide"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/20 transition-all font-sans"
                                />
                            </div>
                            <div className="space-y-1 flex flex-col">
                                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Resource URL (Link) *</label>
                                <input
                                    type="text"
                                    required
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="e.g. https://geeksforgeeks.org/sorting-algorithms"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/20 transition-all font-sans"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="space-y-1 flex flex-col">
                                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Position (Index)</label>
                                <select
                                    value={targetIndex}
                                    onChange={(e) => setTargetIndex(parseInt(e.target.value))}
                                    className="bg-zinc-950 border border-white/[0.08] text-zinc-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-white/20"
                                >
                                    {Array.from({ length: editIndex !== null ? resources.length : resources.length + 1 }).map((_, i) => (
                                        <option key={i} value={i}>
                                            {i + 1} {i === (editIndex !== null ? resources.length - 1 : resources.length) ? "(At the end)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-white/[0.04] rounded-lg hover:bg-white/[0.02]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 text-xs font-semibold bg-white text-zinc-950 rounded-lg hover:bg-zinc-200"
                            >
                                Save Link
                            </button>
                        </div>
                    </form>
                )}

                {/* Display items */}
                {resources.length === 0 ? (
                    <div className="text-zinc-600 italic py-8 text-center font-sans text-xs">
                        No resources added yet. Click "Add Resource" to include links.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {resources.map((item, idx) => {
                            const parts = item.split(" | ");
                            const displayName = parts[0] || "";
                            const url = parts[1] || displayName;
                            const isClickable = url.startsWith("http://") || url.startsWith("https://") || url.includes(".");
                            const formattedUrl = isClickable && !url.startsWith("http") ? `https://${url}` : url;

                            return (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] group transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-zinc-600 text-xs font-mono w-5 text-right shrink-0">
                                            {idx + 1}.
                                        </span>
                                        <div className="flex flex-col min-w-0">
                                            {parts.length > 1 ? (
                                                <>
                                                    {isClickable ? (
                                                        <a
                                                            href={formattedUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 hover:underline truncate"
                                                        >
                                                            {displayName}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-zinc-300 truncate">{displayName}</span>
                                                    )}
                                                    <span className="text-[10px] text-zinc-500 truncate font-mono">{url}</span>
                                                </>
                                            ) : (
                                                <a
                                                    href={formattedUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline truncate font-mono"
                                                >
                                                    {url}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-4">
                                        <button
                                            type="button"
                                            onClick={() => openEditForm(idx)}
                                            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
                                            title="Edit resource"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(idx)}
                                            className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                                            title="Delete resource"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Topic Detail Panel (80vw overlay, all fields visible) ───────────────────

// ── Topic Detail Panel (Full-screen overlay, sidebar layout) ────────────────

type PanelCategory = "notes" | "revision" | "theory" | "algorithms" | "code" | "complexities" | "interview" | "support" | "mastery";

function TopicDetailPanel({
    topic,
    onSave,
    onClose,
}: {
    topic: NoteTopic;
    onSave: (updated: NoteTopic) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState<NoteTopic>({ ...topic });
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<PanelCategory>("notes");

    // Reset draft when topic changes
    useEffect(() => {
        setDraft({ ...topic });
    }, [topic]);

    const levelConfig = LEVEL_CONFIG[draft.level] || LEVEL_CONFIG.Beginner;
    const masteryPercent = getMasteryPercent(draft.mastery);

    const handleSave = () => {
        const now = new Date().toISOString();
        const updated = {
            ...draft,
            lastRevised: now,
            revisionCount: draft.revisionCount + 1,
        };
        onSave(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const updateMastery = (key: keyof MasteryState) => {
        setDraft(prev => ({
            ...prev,
            mastery: { ...prev.mastery, [key]: !prev.mastery[key] }
        }));
    };

    const masteryItems: { key: keyof MasteryState; label: string; icon: typeof Brain }[] = [
        { key: "understandTheory", label: "Understand Theory", icon: BookOpen },
        { key: "canExplain", label: "Can Explain to Others", icon: MessageCircle },
        { key: "canSolveEasy", label: "Can Solve Easy Problems", icon: Zap },
        { key: "canSolveMedium", label: "Can Solve Medium Problems", icon: Flame },
        { key: "canSolveHard", label: "Can Solve Hard Problems", icon: Trophy },
        { key: "canTeachSomeone", label: "Can Teach Someone", icon: GraduationCap },
    ];

    // Sidebar navigation configuration
    const sidebarTabs = [
        { id: "notes" as const, label: "Core Notes", icon: FileText, desc: "Key summaries" },
        { id: "revision" as const, label: "Revision Notes", icon: BookOpen, desc: "Quick revision points" },
        { id: "theory" as const, label: "Theory & Keywords", icon: Lightbulb, desc: "Key facts & tags" },
        { id: "algorithms" as const, label: "Math & Algorithms", icon: Brain, desc: "Formulas & pseudocode" },
        { id: "code" as const, label: "Code & Patterns", icon: Code2, desc: "Examples & problems" },
        { id: "complexities" as const, label: "Complexity Analysis", icon: Clock, desc: "Time & Space complexity" },
        { id: "interview" as const, label: "Interview Prep", icon: AlertTriangle, desc: "Mistakes & memory tricks" },
        { id: "support" as const, label: "Doubts & Links", icon: MessageCircle, desc: "Resources & questions" },
        { id: "mastery" as const, label: "Mastery & Progress", icon: Target, desc: "Checklists & revision stats" },
    ];

    const [isSidebarFolded, setIsSidebarFolded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex bg-zinc-950 overflow-hidden"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="w-full h-full flex overflow-hidden font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Sidebar */}
                <aside
                    className={`bg-zinc-950 border-r border-white/10 flex flex-col shrink-0 h-full overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarFolded ? "w-16 md:w-20" : "w-64 md:w-[22vw] min-w-[240px]"
                        }`}
                >
                    <div className={`p-4 md:p-5 border-b border-white/10 shrink-0 flex items-center ${isSidebarFolded ? "justify-center" : "justify-between"
                        }`}>
                        {!isSidebarFolded ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                                <BookOpen size={18} className="text-zinc-400 shrink-0" />
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold tracking-tight text-white font-sans truncate">
                                        Topic Notes
                                    </h2>
                                    <p className="text-[10px] text-zinc-500 font-sans font-medium uppercase tracking-widest truncate">
                                        Navigation & Sections
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-8 h-8 flex items-center justify-center">
                                <BookOpen size={18} className="text-zinc-400" />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsSidebarFolded(!isSidebarFolded)}
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title={isSidebarFolded ? "Expand sections" : "Collapse sections"}
                        >
                            {isSidebarFolded ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                    </div>

                    <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-x-hidden">
                        {sidebarTabs.map(tab => {
                            const TabIcon = tab.icon;
                            const isSelected = activeTab === tab.id;

                            if (isSidebarFolded) {
                                return (
                                    <div key={tab.id} className="relative group flex justify-center py-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isSelected
                                                ? "bg-white text-zinc-950 font-bold shadow"
                                                : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                                                }`}
                                            aria-label={tab.label}
                                        >
                                            <TabIcon className="w-4 h-4" />
                                        </button>
                                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 text-white text-xs rounded-lg shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            <div className="font-bold">{tab.label}</div>
                                            <div className="text-[10px] text-zinc-400">{tab.desc}</div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl transition-all ${isSelected
                                        ? "bg-white/[0.08] border border-white/[0.12] text-white font-medium"
                                        : "border border-transparent text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200"
                                        }`}
                                >
                                    <TabIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold">{tab.label}</div>
                                        <div className="text-[9px] text-zinc-500 truncate mt-0.5">{tab.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Right Content Area - dynamically expands to remaining width */}
                <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-zinc-900/10">
                    {/* Sticky Header */}
                    <div className={`shrink-0 px-8 pt-6 pb-5 border-b border-white/[0.06] bg-gradient-to-br ${levelConfig.gradient}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${levelConfig.bgColor} ${levelConfig.color} ${levelConfig.borderColor} border`}>
                                        {draft.level}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono">#{draft.id}</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-sans">
                                    {draft.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-zinc-500 font-sans">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Mastery: {masteryPercent}%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {draft.lastRevised
                                                ? `Revised ${new Date(draft.lastRevised).toLocaleDateString()}`
                                                : "Not revised yet"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>{draft.revisionCount} revisions</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 shrink-0 ml-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDraft(prev => ({ ...prev, favorite: !prev.favorite }))}
                                        className={`p-2 rounded-lg transition-all ${draft.favorite
                                            ? "text-amber-400 bg-amber-400/10"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                                            }`}
                                    >
                                        {draft.favorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="button"
                                        onClick={handleSave}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${saved
                                            ? "bg-emerald-400 text-zinc-950"
                                            : "bg-white text-zinc-950 hover:bg-zinc-200"
                                            }`}
                                    >
                                        {saved ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>
                                        ) : (
                                            <><Save className="w-3.5 h-3.5" /> Save Changes</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                        {/* Mastery bar */}
                        <div className="mt-4">
                            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${masteryPercent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${masteryPercent === 100 ? "bg-emerald-400" :
                                        masteryPercent >= 50 ? "bg-amber-400" : "bg-white/40"
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6 w-full max-w-none"
                            >
                                {activeTab === "notes" && (
                                    <PaginatedNotesBlock
                                        label="📝 Core Notes"
                                        value={draft.notes}
                                        onChange={(val) => setDraft(prev => ({ ...prev, notes: val }))}
                                        placeholder="Paste or type notes here... Lines are formatted nicely and paginated in pages of 40 lines."
                                    />
                                )}

                                {activeTab === "revision" && (
                                    <PaginatedNotesBlock
                                        label="🔄 Revision Notes"
                                        value={draft.revisionNotes}
                                        onChange={(val) => setDraft(prev => ({ ...prev, revisionNotes: val }))}
                                        placeholder="Paste or type revision summaries here... Paginated in pages of 40 lines."
                                    />
                                )}

                                {activeTab === "theory" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="💡 Important Points"
                                            value={draft.importantPoints.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                importantPoints: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter important concepts/points (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🏷️ Keywords"
                                            value={draft.keywords.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                keywords: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter keywords (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "algorithms" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="🧠 Algorithms & Pseudocode"
                                            value={draft.algorithms.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                algorithms: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter algorithm steps or pseudocode block (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="📏 Mathematical Formulas"
                                            value={draft.formulas.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                formulas: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter formulas (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "code" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="💻 Code Examples"
                                            value={draft.examples.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                examples: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Paste code examples (one block/line per item)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🧱 Structural Patterns"
                                            value={draft.patterns.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                patterns: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter patterns/approaches (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🎯 Practice Problems"
                                            value={draft.practiceProblems.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                practiceProblems: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter practice problem links or titles (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "complexities" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="⏱️ Time Complexities"
                                            value={draft.timeComplexities.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                timeComplexities: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter time complexity details (e.g. O(N log N) - Worst Case)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="💾 Space Complexities"
                                            value={draft.spaceComplexities.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                spaceComplexities: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter auxiliary/space complexity details (e.g. O(1) - In place)..."
                                        />
                                    </>
                                )}

                                {activeTab === "interview" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="⚠️ Common Mistakes"
                                            value={draft.commonMistakes.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                commonMistakes: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter common coding errors/pitfalls (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🎯 Interview Tips"
                                            value={draft.interviewTips.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                interviewTips: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter interview specific notes/tips (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🧠 Memory Tricks"
                                            value={draft.memoryTricks.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                memoryTricks: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter mnemonics or associations (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "support" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="❓ Tutor Questions"
                                            value={draft.tutorQuestions.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                tutorQuestions: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter items to clarify with a tutor/mentor (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="💬 Unresolved Doubts"
                                            value={draft.doubts.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                doubts: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter pending doubts/questions (one per line)..."
                                        />
                                        <ResourceLinksBlock
                                            resources={draft.resources}
                                            onChange={(updated) => setDraft(prev => ({
                                                ...prev,
                                                resources: updated
                                            }))}
                                        />
                                    </>
                                )}

                                {activeTab === "mastery" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            {/* Mastery Checklist */}
                                            <div>
                                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Mastery Checklist</h3>
                                                <div className="space-y-2">
                                                    {masteryItems.map(({ key, label, icon: ItemIcon }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => updateMastery(key)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${draft.mastery[key]
                                                                ? "bg-emerald-400/[0.08] border-emerald-400/20 text-emerald-300"
                                                                : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04] hover:border-white/[0.1]"
                                                                }`}
                                                        >
                                                            {draft.mastery[key] ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                                                            )}
                                                            <ItemIcon className="w-4 h-4 shrink-0 text-zinc-500" />
                                                            <span className="text-sm font-semibold tracking-wide font-sans">{label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Confidence Slider */}
                                            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] font-sans">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-semibold text-zinc-400">Confidence Level</h4>
                                                    <span className={`text-lg font-bold ${draft.confidence >= 80 ? "text-emerald-400" :
                                                        draft.confidence >= 50 ? "text-amber-400" :
                                                            draft.confidence >= 20 ? "text-orange-400" : "text-zinc-500"
                                                        }`}>
                                                        {draft.confidence}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={draft.confidence}
                                                    onChange={(e) => setDraft(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-white/20 [&::-webkit-slider-thumb]:cursor-pointer"
                                                />
                                                <div className="flex justify-between mt-1 text-[10px] text-zinc-600 font-mono">
                                                    <span>No Idea</span>
                                                    <span>Getting There</span>
                                                    <span>Expert</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Completed toggle */}
                                            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] font-sans">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className={`w-5 h-5 ${draft.completed ? "text-emerald-400" : "text-zinc-600"}`} />
                                                    <span className="text-sm font-semibold text-zinc-300">Completed</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setDraft(prev => ({ ...prev, completed: !prev.completed }))}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${draft.completed ? "bg-emerald-400" : "bg-white/[0.1]"}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: draft.completed ? 24 : 2 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                                                    />
                                                </button>
                                            </div>

                                            {/* Related Topics */}
                                            <div className="font-sans">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Related Topics</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {draft.relatedTopics.map((rt, i) => (
                                                        <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] text-zinc-300 border border-white/[0.06] font-sans font-medium">
                                                            {rt}
                                                        </span>
                                                    ))}
                                                    {draft.relatedTopics.length === 0 && (
                                                        <span className="text-xs text-zinc-600 italic">No related topics</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3 font-sans">
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Revisions</div>
                                                    <div className="text-xl font-bold text-white mt-1 font-mono">{draft.revisionCount}</div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Fields</div>
                                                    <div className="text-xl font-bold text-white mt-1 font-mono">{getFilledFieldsCount(draft)}</div>
                                                </div>
                                                <div className="col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Last Revised</div>
                                                    <div className="text-sm font-semibold text-white mt-1 font-mono">
                                                        {draft.lastRevised
                                                            ? new Date(draft.lastRevised).toLocaleDateString("en-US", {
                                                                month: "short", day: "numeric", year: "numeric",
                                                                hour: "2-digit", minute: "2-digit",
                                                            })
                                                            : "Never"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

            </motion.div>
        </motion.div>
    );
}

// ── Topic Card ──────────────────────────────────────────────────────────────

function TopicCard({
    topic,
    onClick,
    index,
}: {
    topic: NoteTopic;
    onClick: () => void;
    index: number;
}) {
    const levelConfig = LEVEL_CONFIG[topic.level] || LEVEL_CONFIG.Beginner;
    const LevelIcon = levelConfig.icon;
    const masteryPercent = getMasteryPercent(topic.mastery);
    const filledFields = getFilledFieldsCount(topic);

    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative w-full text-left p-5 rounded-2xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/[0.12] transition-all duration-300 cursor-pointer overflow-hidden col-span-2 font-sans"
        >
            {/* Gradient accent on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${levelConfig.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

            <div className="relative z-10">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${levelConfig.bgColor} flex items-center justify-center`}>
                            <LevelIcon className={`w-3.5 h-3.5 ${levelConfig.color}`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${levelConfig.color}`}>
                            {topic.level}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {topic.favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                        {topic.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-white mb-3 leading-snug group-hover:text-white/95 transition-colors font-sans tracking-wide">
                    {topic.name}
                </h3>

                {/* Mastery bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Mastery</span>
                        <span className={`text-[10px] font-bold ${masteryPercent >= 80 ? "text-emerald-400" :
                            masteryPercent >= 40 ? "text-amber-400" : "text-zinc-500"
                            }`}>
                            {masteryPercent}%
                        </span>
                    </div>
                    <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${masteryPercent >= 80 ? "bg-emerald-400" :
                                masteryPercent >= 40 ? "bg-amber-400" : "bg-white/20"
                                }`}
                            style={{ width: `${masteryPercent}%` }}
                        />
                    </div>
                </div>

                {/* Bottom stats */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-sans font-medium text-zinc-400">
                            <FileText className="w-3 h-3 text-zinc-500" /> {filledFields} fields
                        </span>
                        <span className="flex items-center gap-1 font-sans font-medium text-zinc-400">
                            <Layers className="w-3 h-3 text-zinc-500" /> {topic.revisionCount} rev
                        </span>
                    </div>
                    <span className={`flex items-center gap-1 font-sans font-semibold ${topic.confidence >= 80 ? "text-emerald-400" :
                        topic.confidence >= 50 ? "text-amber-400" : "text-zinc-400"
                        }`}>
                        <TrendingUp className="w-3 h-3 opacity-60" /> {topic.confidence}%
                    </span>
                </div>
            </div>
        </motion.button>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function DsaNotes() {
    const router = useRouter();
    const [topics, setTopics] = useState<NoteTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<NoteTopic | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterLevel, setFilterLevel] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<"All" | "Completed" | "Pending" | "Favorites">("All");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Load data
    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch("/api/notes");
                if (res.ok) {
                    const data = await res.json();
                    setTopics(data);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } else if (res.status === 401) {
                    router.push("/Login");
                } else {
                    // Fetch failed (non-401 error) -> fallback to localStorage
                    const stored = localStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        setTopics(JSON.parse(stored));
                    } else {
                        const notesData = await import("@/lib/data/notes.json");
                        const data = Array.isArray(notesData.default) ? notesData.default : notesData;
                        setTopics(data as NoteTopic[]);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch notes, falling back to local cache:", error);
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setTopics(JSON.parse(stored));
                } else {
                    try {
                        const notesData = await import("@/lib/data/notes.json");
                        const data = Array.isArray(notesData.default) ? notesData.default : notesData;
                        setTopics(data as NoteTopic[]);
                    } catch {
                        console.error("Failed to load fallback notes data");
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router]);

    const saveTopicUpdate = useCallback(async (updated: NoteTopic) => {
        // Optimistic UI updates
        setTopics(prev => {
            const newTopics = prev.map(t => t.id === updated.id ? updated : t);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTopics));
            return newTopics;
        });
        setSelectedTopic(updated);

        // Sync to cloud in background
        try {
            const res = await fetch("/api/notes", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updated),
            });
            if (!res.ok) {
                console.error("Failed to sync updated note to cloud. Status:", res.status);
            }
        } catch (error) {
            console.error("Failed to sync updated note to cloud due to network error:", error);
        }
    }, []);

    const filteredTopics = useMemo(() => {
        return topics.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.relatedTopics.some(rt => rt.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesLevel = filterLevel === "All" || t.level === filterLevel;
            let matchesStatus = true;
            if (filterStatus === "Completed") matchesStatus = t.completed;
            else if (filterStatus === "Pending") matchesStatus = !t.completed;
            else if (filterStatus === "Favorites") matchesStatus = t.favorite;
            return matchesSearch && matchesLevel && matchesStatus;
        });
    }, [topics, searchQuery, filterLevel, filterStatus]);

    const stats = useMemo(() => {
        const total = topics.length;
        const completed = topics.filter(t => t.completed).length;
        const favorites = topics.filter(t => t.favorite).length;
        const avgMastery = total > 0
            ? Math.round(topics.reduce((sum, t) => sum + getMasteryPercent(t.mastery), 0) / total)
            : 0;
        const avgConfidence = total > 0
            ? Math.round(topics.reduce((sum, t) => sum + t.confidence, 0) / total)
            : 0;
        return { total, completed, favorites, avgMastery, avgConfidence };
    }, [topics]);

    const levels = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];
    const statuses: ("All" | "Completed" | "Pending" | "Favorites")[] = ["All", "Completed", "Pending", "Favorites"];

    async function handelSignOut() {
        try {
            await fetch("/api/auth/signout", { method: "POST" });
            router.push("/Login");
        } catch { /* ignore */ }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-sm text-zinc-500 font-semibold tracking-wide">Loading notes...</span>
                </motion.div>
            </div>
        );
    }

    const notesFilters = (
        <>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2 font-sans">Filter by Level</div>
            {levels.map(level => {
                const config = level !== "All" ? LEVEL_CONFIG[level] : null;
                const count = level === "All" ? topics.length : topics.filter(t => t.level === level).length;
                return (
                    <button
                        key={level}
                        onClick={() => { setFilterLevel(level); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-2 text-sm font-semibold tracking-wide transition-colors rounded ${filterLevel === level
                            ? config
                                ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                                : "bg-white text-zinc-950 font-bold"
                            : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <span>{level}</span>
                        <span className="text-xs opacity-60 font-mono">{count}</span>
                    </button>
                );
            })}

            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 mt-4 mb-2 font-sans">Status</div>
            {statuses.map(status => (
                <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setSidebarOpen(false); }}
                    className={`flex items-center justify-between px-4 py-2 text-sm font-semibold tracking-wide transition-colors rounded ${filterStatus === status
                        ? "bg-white text-zinc-950 font-bold"
                        : "text-zinc-400 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    <span>{status}</span>
                    <span className="text-xs opacity-60 font-mono">
                        {status === "All" ? topics.length :
                            status === "Completed" ? topics.filter(t => t.completed).length :
                                status === "Pending" ? topics.filter(t => !t.completed).length :
                                    topics.filter(t => t.favorite).length}
                    </span>
                </button>
            ))}
        </>
    );

    const collapsedNotesFilters = (
        <div className="flex flex-col gap-1 w-full items-center">
            {levels.map(level => {
                const count = level === "All" ? topics.length : topics.filter(t => t.level === level).length;
                const shortLabel = level === "All" ? "ALL" : level[0];
                return (
                    <div key={level} className="relative group">
                        <button
                            onClick={() => setFilterLevel(level)}
                            className={`w-10 h-7 flex items-center justify-center rounded text-xs font-mono transition-colors ${filterLevel === level ? "bg-white text-zinc-950 font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {shortLabel}
                        </button>
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                            {level} ({count})
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex font-sans antialiased tracking-wide">
            {/* Mobile menu button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <Sidebar
                isMobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
                customFilters={notesFilters}
                collapsedFilters={collapsedNotesFilters}
            />

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-screen">
                {/* Header */}
                <header className="mb-8 hidden md:block font-sans">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                            <StickyNote className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">DSA Notes</h1>
                            <p className="text-zinc-400 mt-1 text-sm font-semibold tracking-wide">
                                Your personal knowledge base — {stats.total} topics, {stats.completed} completed
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 font-sans">
                    {[
                        { label: "Total", value: stats.total, icon: BookOpen, color: "text-white" },
                        { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400" },
                        { label: "Favorites", value: stats.favorites, icon: Star, color: "text-amber-400" },
                        { label: "Mastery", value: `${stats.avgMastery}%`, icon: Target, color: "text-violet-400" },
                        { label: "Confidence", value: `${stats.avgConfidence}%`, icon: TrendingUp, color: "text-cyan-400" },
                    ].map((stat, i) => {
                        const StatIcon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                            >
                                <StatIcon className={`w-4 h-4 ${stat.color} shrink-0`} />
                                <div>
                                    <div className={`text-lg font-bold ${stat.color} font-mono`}>{stat.value}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{stat.label}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="mb-6 font-sans">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all font-sans"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Topics Grid — each card is col-span-2 in a 6-col grid = 3 cards per row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredTopics.map((topic, i) => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            onClick={() => setSelectedTopic(topic)}
                            index={i}
                        />
                    ))}
                </div>

                {filteredTopics.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center font-sans">
                        <Search className="w-12 h-12 text-zinc-700 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-400 mb-1">No topics found</h3>
                        <p className="text-sm text-zinc-600">Try adjusting your search or filters</p>
                    </motion.div>
                )}
            </main>

            {/* Topic Detail Panel */}
            <AnimatePresence>
                {selectedTopic && (
                    <TopicDetailPanel
                        topic={selectedTopic}
                        onSave={saveTopicUpdate}
                        onClose={() => setSelectedTopic(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
