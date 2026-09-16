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
    ExternalLink, Link as LinkIcon, Video as VideoIcon, PlayCircle,
    FolderPlus, Sparkles, MoveUp, MoveDown, MoreVertical, Bookmark,
    ListPlus, ArrowRight, CornerDownRight, Hash, FolderKanban
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";

// ── Types ───────────────────────────────────────────────────────────────────

export type CustomSection = {
    id: string;
    name: string;
    type: "notes" | "list";
    content: string;
    items?: string[];
};

export type CustomTopic = {
    id: string;
    title: string;
    category?: string;
    tags?: string[];
    description?: string;
    color?: string;
    sections: CustomSection[];
    isFavorite?: boolean;
    isPinned?: boolean;
    created_at?: string | Date;
    updated_at?: string | Date;
};

// Predefined Quick Templates for Section Creation
const TEMPLATES = [
    {
        name: "Blank",
        category: "General",
        sections: [{ name: "Main Notes", type: "notes" as const }],
    },
    {
        name: "Project Architecture",
        category: "System Design",
        sections: [
            { name: "Executive Summary", type: "notes" as const },
            { name: "Architecture & Data Flow", type: "notes" as const },
            { name: "Code Implementation", type: "notes" as const },
            { name: "Key Challenges & Trade-offs", type: "notes" as const },
            { name: "References & Docs", type: "notes" as const },
        ],
    },
    {
        name: "Interview Preparation",
        category: "Interview",
        sections: [
            { name: "Concept Overview", type: "notes" as const },
            { name: "Common Questions", type: "list" as const },
            { name: "Optimal Approach & Code", type: "notes" as const },
            { name: "Edge Cases & Pitfalls", type: "list" as const },
            { name: "Memory Tricks", type: "notes" as const },
        ],
    },
    {
        name: "Meeting Notes",
        category: "Work & Study",
        sections: [
            { name: "Agenda & Objectives", type: "notes" as const },
            { name: "Discussion Notes", type: "notes" as const },
            { name: "Action Items", type: "list" as const },
            { name: "Resources & Links", type: "notes" as const },
        ],
    },
    {
        name: "Debugging Log",
        category: "DevOps & Bugs",
        sections: [
            { name: "Issue Summary", type: "notes" as const },
            { name: "Root Cause Analysis", type: "notes" as const },
            { name: "Solution & Fix Steps", type: "notes" as const },
            { name: "Preventative Measures", type: "list" as const },
        ],
    },
];

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

    // Parse Highlights, Links, URLs, Bold, Italic, Underline, Strikethrough, Code, Super/Subscript
    const parts: (string | ReactNode)[] = [];
    let currentText = content;

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

// ── Paginated Notes Block (Exact style as DSA Notes) ─────────────────────────

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
        const readTime = Math.max(1, Math.ceil(words / 200));
        return { words, readTime };
    }, [value]);

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
            if (next.has(lineNum)) next.delete(lineNum);
            else next.add(lineNum);
            return next;
        });
    };

    const insertMarkdown = (syntax: string) => {
        const textarea = document.getElementById(`custom-textarea-${label}`) as HTMLTextAreaElement;
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

            {/* Body */}
            <div className="relative bg-black/[0.15] rounded-b-2xl overflow-visible">
                {isEditing ? (
                    <div className="p-4 flex flex-row items-start gap-3 relative overflow-visible">
                        {/* Sticky Left-Side 2-Column Note-Taking Toolbar */}
                        <div className="sticky top-6 z-30 shrink-0 flex flex-col items-center gap-2 p-2.5 bg-zinc-950/95 backdrop-blur-md border border-white/[0.1] rounded-2xl shadow-2xl">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center w-full">Tools</span>
                            
                            {/* 2-Column Grid */}
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
                                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            {btn.title}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Color Highlight Section */}
                            <div className="w-full h-[1px] bg-white/10 my-0.5" />
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center w-full">Highlight</span>

                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { id: "hl-red", color: "bg-rose-500", border: "border-rose-500/30", title: "Red Highlight (==r:text==)" },
                                    { id: "hl-green", color: "bg-emerald-500", border: "border-emerald-500/30", title: "Green Highlight (==g:text==)" },
                                    { id: "hl-blue", color: "bg-sky-500", border: "border-sky-500/30", title: "Blue Highlight (==b:text==)" },
                                    { id: "hl-yellow", color: "bg-amber-500", border: "border-amber-500/30", title: "Yellow Highlight (==y:text==)" },
                                    { id: "hl-purple", color: "bg-purple-500", border: "border-purple-500/30", title: "Purple Highlight (==p:text==)" },
                                ].map((hl) => (
                                    <div key={hl.id} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown(hl.id)}
                                            className={`w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.03] border ${hl.border} hover:bg-white/[0.08] transition-all`}
                                            title={hl.title}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${hl.color}`} />
                                        </button>
                                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-zinc-200 text-[11px] font-medium rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            {hl.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Textarea */}
                        <textarea
                            id={`custom-textarea-${label}`}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            rows={35}
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
                            minHeight: "480px",
                            fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        }}
                    >
                        {pageLines.length === 0 ? (
                            <div className="text-zinc-600 italic py-20 text-center font-sans text-xs my-auto">
                                {placeholder || "No notes written yet. Click 'Edit' to start writing."}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04]">
                                {/* Left Column */}
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

                                {/* Right Column */}
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

            {/* Pagination / Footer */}
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

// ── Editable List Field ─────────────────────────────────────────────────────

function EditableListField({
    label,
    items,
    onChange,
    placeholder,
}: {
    label: string;
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
        <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-zinc-900/30 font-sans mb-6">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-300 tracking-wide">{label}</span>
                    {items.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
                            {items.length} {items.length === 1 ? "item" : "items"}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                        <span className="w-6 text-center text-xs text-zinc-600 font-mono shrink-0">
                            {idx + 1}.
                        </span>
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(idx, e.target.value)}
                            className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-white/[0.04]"
                            title="Remove item"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                    <span className="w-6 text-center text-xs text-zinc-600 font-mono shrink-0">+</span>
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
                        placeholder={placeholder || "Type new item and press Enter..."}
                        className="flex-1 min-w-0 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-white/25 transition-all"
                    />
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!newItem.trim()}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-all flex items-center gap-1 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Custom Notes Component ─────────────────────────────────────────────

export default function CustomNotes() {
    const router = useRouter();
    const [topics, setTopics] = useState<CustomTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterStatus, setFilterStatus] = useState<"All" | "Favorites">("All");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Active detail view
    const [activeTopic, setActiveTopic] = useState<CustomTopic | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string>("");
    const [isSectionSidebarCollapsed, setIsSectionSidebarCollapsed] = useState(false);

    // Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<CustomTopic | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formCategory, setFormCategory] = useState("General");
    const [formDescription, setFormDescription] = useState("");
    const [formSections, setFormSections] = useState<Array<{ id?: string; name: string; type: "notes" | "list"; content?: string; items?: string[] }>>([
        { name: "Overview", type: "notes" },
        { name: "Key Concepts", type: "notes" },
    ]);
    const [saving, setSaving] = useState(false);

    // Load topics
    const fetchTopics = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/custom-notes");
            if (res.status === 401) {
                router.push("/Login");
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setTopics(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load custom notes:", err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    // Categories calculation
    const categories = useMemo(() => {
        const set = new Set<string>();
        topics.forEach(t => {
            if (t.category) set.add(t.category);
        });
        return ["All", ...Array.from(set)];
    }, [topics]);

    // Filtered topics
    const filteredTopics = useMemo(() => {
        return topics.filter(topic => {
            const matchesCategory = filterCategory === "All" || topic.category === filterCategory;
            const matchesStatus = filterStatus === "All" || (filterStatus === "Favorites" && topic.isFavorite);
            const matchesSearch = !searchQuery.trim() ||
                topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                topic.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                topic.sections.some(sec =>
                    sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    sec.content?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [topics, filterCategory, filterStatus, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const total = topics.length;
        const favorites = topics.filter(t => t.isFavorite).length;
        const totalSections = topics.reduce((sum, t) => sum + t.sections.length, 0);
        const totalWords = topics.reduce((sum, t) => {
            return sum + t.sections.reduce((secSum, s) => {
                const words = (s.content || "").trim().split(/\s+/).filter(Boolean).length;
                return secSum + words;
            }, 0);
        }, 0);
        return { total, favorites, totalSections, totalWords };
    }, [topics]);

    // Reset Form
    const openCreateModal = () => {
        setEditingTopic(null);
        setFormTitle("");
        setFormCategory("General");
        setFormDescription("");
        setFormSections([
            { name: "Overview", type: "notes" },
            { name: "Key Concepts", type: "notes" },
        ]);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (topic: CustomTopic, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingTopic(topic);
        setFormTitle(topic.title);
        setFormCategory(topic.category || "General");
        setFormDescription(topic.description || "");
        setFormSections(topic.sections.map(s => ({ ...s })));
        setIsCreateModalOpen(true);
    };

    const applyTemplate = (template: typeof TEMPLATES[0]) => {
        setFormCategory(template.category);
        setFormSections(template.sections.map(s => ({ name: s.name, type: s.type })));
    };

    const addFormSection = () => {
        setFormSections(prev => [...prev, { name: `Section ${prev.length + 1}`, type: "notes" }]);
    };

    const removeFormSection = (index: number) => {
        if (formSections.length <= 1) return;
        setFormSections(prev => prev.filter((_, i) => i !== index));
    };

    const updateFormSection = (index: number, updates: Partial<{ name: string; type: "notes" | "list" }>) => {
        setFormSections(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...updates };
            return copy;
        });
    };

    const moveFormSection = (index: number, direction: "up" | "down") => {
        if ((direction === "up" && index === 0) || (direction === "down" && index === formSections.length - 1)) return;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        setFormSections(prev => {
            const copy = [...prev];
            const temp = copy[index];
            copy[index] = copy[targetIndex];
            copy[targetIndex] = temp;
            return copy;
        });
    };

    // Save Topic
    const handleSaveTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) return;

        try {
            setSaving(true);
            const sectionsToSave: CustomSection[] = formSections.map((s, idx) => ({
                id: s.id || `sec-${Date.now()}-${idx}`,
                name: s.name.trim() || `Section ${idx + 1}`,
                type: s.type,
                content: s.content || (s.type === "notes" ? `# ${s.name.trim()}\n\nWrite your thoughts and concepts here...` : ""),
                items: s.items || [],
            }));

            if (editingTopic) {
                const updated: CustomTopic = {
                    ...editingTopic,
                    title: formTitle.trim(),
                    category: formCategory.trim(),
                    description: formDescription.trim(),
                    sections: sectionsToSave,
                    updated_at: new Date(),
                };

                const res = await fetch("/api/custom-notes", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updated),
                });

                if (res.ok) {
                    setTopics(prev => prev.map(t => t.id === updated.id ? updated : t));
                    if (activeTopic?.id === updated.id) {
                        setActiveTopic(updated);
                    }
                    setIsCreateModalOpen(false);
                }
            } else {
                const newTopic: CustomTopic = {
                    id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    title: formTitle.trim(),
                    category: formCategory.trim(),
                    description: formDescription.trim(),
                    sections: sectionsToSave,
                    isFavorite: false,
                    isPinned: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                const res = await fetch("/api/custom-notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newTopic),
                });

                if (res.ok) {
                    setTopics(prev => [newTopic, ...prev]);
                    setIsCreateModalOpen(false);
                    openTopicDetail(newTopic);
                }
            }
        } catch (err) {
            console.error("Failed to save topic:", err);
        } finally {
            setSaving(false);
        }
    };

    // Delete Topic
    const handleDeleteTopic = async (topicId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm("Are you sure you want to delete this topic?")) return;

        try {
            const res = await fetch(`/api/custom-notes?id=${topicId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setTopics(prev => prev.filter(t => t.id !== topicId));
                if (activeTopic?.id === topicId) {
                    setActiveTopic(null);
                }
            }
        } catch (err) {
            console.error("Failed to delete topic:", err);
        }
    };

    // Toggle Favorite
    const toggleFavorite = async (topic: CustomTopic, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = { ...topic, isFavorite: !topic.isFavorite };
        setTopics(prev => prev.map(t => t.id === topic.id ? updated : t));
        if (activeTopic?.id === topic.id) setActiveTopic(updated);

        try {
            await fetch("/api/custom-notes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
        } catch (err) {
            console.error("Failed to update favorite status", err);
        }
    };

    // Open Topic Detail
    const openTopicDetail = (topic: CustomTopic) => {
        setActiveTopic(topic);
        if (topic.sections.length > 0) {
            setActiveSectionId(topic.sections[0].id);
        }
    };

    // Update section content
    const updateActiveSectionContent = async (sectionId: string, content: string) => {
        if (!activeTopic) return;
        const updatedSections = activeTopic.sections.map(sec =>
            sec.id === sectionId ? { ...sec, content } : sec
        );
        const updatedTopic = { ...activeTopic, sections: updatedSections, updated_at: new Date() };
        setActiveTopic(updatedTopic);
        setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));

        try {
            await fetch("/api/custom-notes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedTopic),
            });
        } catch (err) {
            console.error("Failed to save section content", err);
        }
    };

    // Update section items
    const updateActiveSectionItems = async (sectionId: string, items: string[]) => {
        if (!activeTopic) return;
        const updatedSections = activeTopic.sections.map(sec =>
            sec.id === sectionId ? { ...sec, items } : sec
        );
        const updatedTopic = { ...activeTopic, sections: updatedSections, updated_at: new Date() };
        setActiveTopic(updatedTopic);
        setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));

        try {
            await fetch("/api/custom-notes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedTopic),
            });
        } catch (err) {
            console.error("Failed to save list items", err);
        }
    };

    // Add Section inside modal
    const addSectionInsideTopic = async () => {
        if (!activeTopic) return;
        const newSecId = `sec-${Date.now()}-${activeTopic.sections.length}`;
        const newSectionName = prompt("Enter the name of the new section:", `Section ${activeTopic.sections.length + 1}`);
        if (!newSectionName?.trim()) return;

        const newSec: CustomSection = {
            id: newSecId,
            name: newSectionName.trim(),
            type: "notes",
            content: `# ${newSectionName.trim()}\n\nWrite your notes here...`,
            items: [],
        };

        const updatedTopic = {
            ...activeTopic,
            sections: [...activeTopic.sections, newSec],
            updated_at: new Date(),
        };

        setActiveTopic(updatedTopic);
        setActiveSectionId(newSecId);
        setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));

        try {
            await fetch("/api/custom-notes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedTopic),
            });
        } catch (err) {
            console.error("Failed to add section", err);
        }
    };

    // Active Section object
    const currentSection = useMemo(() => {
        if (!activeTopic) return null;
        return activeTopic.sections.find(s => s.id === activeSectionId) || activeTopic.sections[0] || null;
    }, [activeTopic, activeSectionId]);

    // Sidebar custom filters matching DsaNotes style
    const categoryFilters = (
        <>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2 font-sans">Categories</div>
            {categories.map(cat => {
                const count = cat === "All" ? topics.length : topics.filter(t => t.category === cat).length;
                return (
                    <button
                        key={cat}
                        onClick={() => { setFilterCategory(cat); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-2 text-sm font-semibold tracking-wide transition-colors rounded ${filterCategory === cat
                            ? "bg-white text-zinc-950 font-bold"
                            : "text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <span>{cat}</span>
                        <span className="text-xs opacity-60 font-mono">{count}</span>
                    </button>
                );
            })}

            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 mt-4 mb-2 font-sans">Filter</div>
            {(["All", "Favorites"] as const).map(st => (
                <button
                    key={st}
                    onClick={() => { setFilterStatus(st); setSidebarOpen(false); }}
                    className={`flex items-center justify-between px-4 py-2 text-sm font-semibold tracking-wide transition-colors rounded ${filterStatus === st
                        ? "bg-white text-zinc-950 font-bold"
                        : "text-zinc-400 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    <span>{st}</span>
                    <span className="text-xs opacity-60 font-mono">
                        {st === "All" ? topics.length : topics.filter(t => t.isFavorite).length}
                    </span>
                </button>
            ))}
        </>
    );

    const collapsedCategoryFilters = (
        <div className="flex flex-col gap-1 w-full items-center">
            {categories.map(cat => {
                const count = cat === "All" ? topics.length : topics.filter(t => t.category === cat).length;
                const shortLabel = cat === "All" ? "ALL" : cat.slice(0, 3).toUpperCase();
                return (
                    <div key={cat} className="relative group">
                        <button
                            onClick={() => setFilterCategory(cat)}
                            className={`w-10 h-7 flex items-center justify-center rounded text-xs font-mono transition-colors ${filterCategory === cat ? "bg-white text-zinc-950 font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {shortLabel}
                        </button>
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                            {cat} ({count})
                        </div>
                    </div>
                );
            })}
        </div>
    );

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
                customFilters={categoryFilters}
                collapsedFilters={collapsedCategoryFilters}
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
                            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Custom Notes</h1>
                            <p className="text-zinc-400 mt-1 text-sm font-semibold tracking-wide">
                                Your personal knowledge base — {stats.total} topics, {stats.totalSections} sections
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 font-sans">
                    {[
                        { label: "Total Topics", value: stats.total, icon: BookOpen, color: "text-white" },
                        { label: "Sections", value: stats.totalSections, icon: Layers, color: "text-violet-400" },
                        { label: "Favorites", value: stats.favorites, icon: Star, color: "text-amber-400" },
                        { label: "Total Words", value: stats.totalWords, icon: FileText, color: "text-emerald-400" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="p-4 rounded-xl border border-white/[0.06] bg-zinc-900/40 flex items-center justify-between"
                        >
                            <div>
                                <div className="text-xs text-zinc-500 font-semibold tracking-wider uppercase mb-0.5">{stat.label}</div>
                                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white/5 border border-white/[0.06]">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Action Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics, sections, contents..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/40 border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:bg-zinc-900/70 transition-all font-sans"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Topic</span>
                    </button>
                </div>

                {/* Topics Grid */}
                {filteredTopics.length === 0 ? (
                    <div className="border border-dashed border-white/[0.08] rounded-2xl p-16 flex flex-col items-center justify-center text-center my-8 bg-zinc-900/20">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-zinc-400">
                            <StickyNote className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-200">No topics found</h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mb-6 font-medium">
                            {searchQuery ? "No topics match your search query." : "Create your first custom note topic with tailored sections!"}
                        </p>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl shadow-lg hover:bg-zinc-200 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New Topic</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredTopics.map((topic, index) => {
                            const totalWords = topic.sections.reduce((acc, sec) => {
                                const words = (sec.content || "").trim().split(/\s+/).filter(Boolean).length;
                                return acc + words;
                            }, 0);

                            return (
                                <motion.div
                                    key={topic.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02, duration: 0.25 }}
                                    onClick={() => openTopicDetail(topic)}
                                    className="group relative text-left p-5 rounded-2xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/[0.12] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between font-sans"
                                >
                                    <div>
                                        {/* Card Top Row */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <StickyNote className="w-3.5 h-3.5 text-zinc-300" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                                                    {topic.category || "General"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleFavorite(topic, e)}
                                                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-amber-400 transition-all"
                                                    title="Favorite"
                                                >
                                                    {topic.isFavorite ? (
                                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                                    ) : (
                                                        <Star className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => openEditModal(topic, e)}
                                                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
                                                    title="Edit Topic Settings"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteTopic(topic.id, e)}
                                                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-rose-400 transition-all"
                                                    title="Delete Topic"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-semibold text-white mb-2 leading-snug group-hover:text-white/95 transition-colors font-sans tracking-wide">
                                            {topic.title}
                                        </h3>

                                        {/* Description */}
                                        {topic.description && (
                                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                                {topic.description}
                                            </p>
                                        )}

                                        {/* Section Badges */}
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {topic.sections.slice(0, 4).map((sec, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-400 border border-white/[0.04] flex items-center gap-1 font-mono"
                                                >
                                                    <Hash className="w-2.5 h-2.5 opacity-40" />
                                                    {sec.name}
                                                </span>
                                            ))}
                                            {topic.sections.length > 4 && (
                                                <span className="text-[10px] font-semibold text-zinc-500 px-1 py-0.5">
                                                    +{topic.sections.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-5 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-500 font-sans">
                                        <span>{topic.sections.length} sections • {totalWords} words</span>
                                        <span className="flex items-center gap-1 text-zinc-300 group-hover:text-white font-semibold transition-colors">
                                            Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Topic Creation / Settings Modal ─────────────────────────────── */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                                        <StickyNote className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white tracking-wide">
                                            {editingTopic ? "Edit Topic Settings" : "Create New Note Topic"}
                                        </h2>
                                        <p className="text-xs text-zinc-400">
                                            Add sections and customize your notebook topic.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Form Content */}
                            <form onSubmit={handleSaveTopic} className="p-6 overflow-y-auto flex-1 space-y-5">
                                {/* Quick Templates */}
                                {!editingTopic && (
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                            Quick Templates
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {TEMPLATES.map((tmpl, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => applyTemplate(tmpl)}
                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/20 text-zinc-300 transition-all"
                                                >
                                                    {tmpl.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Title & Category */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                                            Topic Title <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="e.g. Next.js 15 Server Actions, Microservices..."
                                            className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/[0.1] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                                            Category
                                        </label>
                                        <input
                                            type="text"
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value)}
                                            placeholder="e.g. Web Dev, System Design"
                                            className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/[0.1] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Brief summary or objective of this note..."
                                        className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/[0.1] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-all resize-none"
                                    />
                                </div>

                                {/* Dynamic Sections Builder */}
                                <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.01]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-200">
                                                Topic Sections ({formSections.length})
                                            </label>
                                            <p className="text-[11px] text-zinc-500">
                                                Write the name for each section. You can add or rename anytime.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addFormSection}
                                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center gap-1.5 transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Section</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {formSections.map((sec, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                                            >
                                                <span className="w-6 text-center text-xs font-mono text-zinc-500">
                                                    {idx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={sec.name}
                                                    onChange={(e) => updateFormSection(idx, { name: e.target.value })}
                                                    placeholder={`Section ${idx + 1} Name`}
                                                    className="flex-1 px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-zinc-100 focus:outline-none focus:border-white/25 transition-all font-semibold"
                                                />
                                                <select
                                                    value={sec.type}
                                                    onChange={(e) => updateFormSection(idx, { type: e.target.value as "notes" | "list" })}
                                                    className="px-2.5 py-1.5 text-xs bg-zinc-900 border border-white/[0.08] rounded-lg text-zinc-300 focus:outline-none font-medium"
                                                >
                                                    <option value="notes">Rich Notes</option>
                                                    <option value="list">Bullet List</option>
                                                </select>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={idx === 0}
                                                        onClick={() => moveFormSection(idx, "up")}
                                                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                                                        title="Move Up"
                                                    >
                                                        <MoveUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={idx === formSections.length - 1}
                                                        onClick={() => moveFormSection(idx, "down")}
                                                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                                                        title="Move Down"
                                                    >
                                                        <MoveDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={formSections.length <= 1}
                                                        onClick={() => removeFormSection(idx)}
                                                        className="p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-20 rounded"
                                                        title="Remove Section"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || !formTitle.trim()}
                                        className="px-5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-40 transition-all flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3.5 h-3.5" />
                                                <span>{editingTopic ? "Update Topic" : "Create Topic"}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Topic Detail & Section Notes Reader / Editor Modal ──────────── */}
            <AnimatePresence>
                {activeTopic && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex bg-zinc-950 overflow-hidden font-sans select-text"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="w-full h-full flex flex-col overflow-hidden"
                        >
                            {/* Topic Detail Header */}
                            <div className="border-b border-white/10 bg-zinc-950/80 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTopic(null)}
                                        className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Back</span>
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-white tracking-tight truncate">
                                                {activeTopic.title}
                                            </h2>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-400 uppercase tracking-wider">
                                                {activeTopic.category || "General"}
                                            </span>
                                        </div>
                                        {activeTopic.description && (
                                            <p className="text-xs text-zinc-500 truncate max-w-xl">
                                                {activeTopic.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(activeTopic)}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTopic(null)}
                                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body with Foldable Section Sidebar */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Inner Section Sidebar */}
                                <aside
                                    className={`border-r border-white/10 bg-zinc-950/90 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isSectionSidebarCollapsed ? "w-16 md:w-20" : "w-64 md:w-72"
                                        }`}
                                >
                                    {/* Section Header with Fold Button */}
                                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                        {!isSectionSidebarCollapsed && (
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                Sections ({activeTopic.sections.length})
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsSectionSidebarCollapsed(prev => !prev)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all ml-auto"
                                            title={isSectionSidebarCollapsed ? "Expand Section Sidebar" : "Fold Section Sidebar"}
                                        >
                                            {isSectionSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Section List Items */}
                                    <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                                        {activeTopic.sections.map((sec, idx) => {
                                            const isActive = (currentSection?.id === sec.id);
                                            return (
                                                <button
                                                    key={sec.id}
                                                    type="button"
                                                    onClick={() => setActiveSectionId(sec.id)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all relative group ${isActive
                                                        ? "bg-white text-zinc-950 font-bold shadow-lg"
                                                        : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                                                        }`}
                                                >
                                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono shrink-0 ${isActive ? "bg-zinc-950 text-white font-bold" : "bg-white/10 text-zinc-400"}`}>
                                                        {idx + 1}
                                                    </span>
                                                    {!isSectionSidebarCollapsed && (
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs truncate block">
                                                                {sec.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Tooltip in collapsed mode */}
                                                    {isSectionSidebarCollapsed && (
                                                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                                            {sec.name}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Add Section Button */}
                                    <div className="p-3 border-t border-white/10">
                                        <button
                                            type="button"
                                            onClick={addSectionInsideTopic}
                                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border border-dashed border-white/20 text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            {!isSectionSidebarCollapsed && <span>Add Section</span>}
                                        </button>
                                    </div>
                                </aside>

                                {/* Section Content Area */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950">
                                    {currentSection ? (
                                        <div className="max-w-5xl mx-auto">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                                        Section
                                                    </span>
                                                    <span className="text-xs text-zinc-600">•</span>
                                                    <h3 className="text-lg font-bold text-white tracking-tight">
                                                        {currentSection.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            {currentSection.type === "list" ? (
                                                <EditableListField
                                                    label={currentSection.name}
                                                    items={currentSection.items || []}
                                                    onChange={(newItems) => updateActiveSectionItems(currentSection.id, newItems)}
                                                    placeholder="Add list entry..."
                                                />
                                            ) : (
                                                <PaginatedNotesBlock
                                                    label={currentSection.name}
                                                    value={currentSection.content || ""}
                                                    onChange={(newContent) => updateActiveSectionContent(currentSection.id, newContent)}
                                                    placeholder={`Write notes for ${currentSection.name}... Click 'Edit' to start.`}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                            <p className="text-xs">Select a section from the sidebar or click 'Add Section'</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
