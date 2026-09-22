"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback, ReactNode } from "react";
import {
    Copy, Check, Edit3, Eye, Split, FileText, Link as LinkIcon,
    Image as ImageIcon, PlayCircle, ExternalLink
} from "lucide-react";

interface IdeMarkdownEditorProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    lineCountBadge?: number;
}

// Inline Markdown Parser for Preview
function renderMarkdownLine(line: string) {
    if (!line) return "\u00A0";

    if (line.startsWith("# ")) {
        return <span className="text-base font-bold text-white tracking-wide">{line.substring(2)}</span>;
    }
    if (line.startsWith("## ")) {
        return <span className="text-sm font-bold text-cyan-300 tracking-wide">{line.substring(3)}</span>;
    }
    if (line.startsWith("### ")) {
        return <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{line.substring(4)}</span>;
    }

    if (line.startsWith("> ")) {
        return (
            <span className="border-l-2 border-amber-400/80 pl-2 text-zinc-300 italic inline-block">
                {line.substring(2)}
            </span>
        );
    }

    if (line.trim() === "---" || line.trim() === "***") {
        return <span className="block border-b border-[#1E293B] my-1 w-full" />;
    }

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

    const parts: (string | ReactNode)[] = [];
    const regex = /(==red:.*?==|==r:.*?==|==green:.*?==|==g:.*?==|==blue:.*?==|==b:.*?==|==yellow:.*?==|==y:.*?==|==purple:.*?==|==p:.*?==|==.*?==|\[.*?\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+|\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|~~.*?~~|`.*?`|\^[^\s^]+\^|~[^\s~]+~)/gi;
    const splitParts = content.split(regex);

    splitParts.forEach((part, index) => {
        if (!part) return;
        const lower = part.toLowerCase();

        if (lower.startsWith("==red:") || lower.startsWith("==r:")) {
            const inner = part.replace(/^==(red|r):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 py-0.2 rounded font-mono text-xs mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==green:") || lower.startsWith("==g:")) {
            const inner = part.replace(/^==(green|g):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded font-mono text-xs mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==blue:") || lower.startsWith("==b:")) {
            const inner = part.replace(/^==(blue|b):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 rounded font-mono text-xs mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==yellow:") || lower.startsWith("==y:")) {
            const inner = part.replace(/^==(yellow|y):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono text-xs mx-0.5">
                    {inner}
                </mark>
            );
        } else if (lower.startsWith("==purple:") || lower.startsWith("==p:")) {
            const inner = part.replace(/^==(purple|p):/i, "").replace(/==$/, "");
            parts.push(
                <mark key={index} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 py-0.2 rounded font-mono text-xs mx-0.5">
                    {inner}
                </mark>
            );
        } else if (part.startsWith("[") && part.endsWith(")") && part.includes("](")) {
            const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
            if (linkMatch) {
                const linkText = linkMatch[1];
                const linkUrl = linkMatch[2];
                const isVideo = /youtube\.com|youtu\.be/i.test(linkUrl);
                parts.push(
                    <a
                        key={index}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-mono text-xs mx-0.5"
                    >
                        {isVideo ? <PlayCircle size={12} className="text-rose-400" /> : <LinkIcon size={12} />}
                        <span>{linkText}</span>
                    </a>
                );
            } else {
                parts.push(part);
            }
        } else if (part.startsWith("`") && part.endsWith("`")) {
            parts.push(
                <code key={index} className="bg-[#181C24] text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs border border-[#1E293B]">
                    {part.slice(1, -1)}
                </code>
            );
        } else if (part.startsWith("**") && part.endsWith("**")) {
            parts.push(<strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>);
        } else if (part.startsWith("*") && part.endsWith("*")) {
            parts.push(<em key={index} className="italic text-zinc-300">{part.slice(1, -1)}</em>);
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

export default function IdeMarkdownEditor({
    label,
    value,
    onChange,
    placeholder = "Type algorithmic markdown or code here...",
    lineCountBadge,
}: IdeMarkdownEditorProps) {
    const [mode, setMode] = useState<"edit" | "split" | "preview">("edit");
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(48);
    const isScrollingRef = useRef<"editor" | "preview" | null>(null);

    // Track dynamic height of the top toolbar for accurate sticky stacking
    useEffect(() => {
        const updateHeight = () => {
            if (toolbarRef.current) {
                setToolbarHeight(toolbarRef.current.offsetHeight);
            }
        };
        updateHeight();
        if (typeof ResizeObserver !== "undefined" && toolbarRef.current) {
            const observer = new ResizeObserver(updateHeight);
            observer.observe(toolbarRef.current);
            return () => observer.disconnect();
        }
    }, []);

    const lines = useMemo(() => {
        if (!value) return [""];
        return value.split("\n");
    }, [value]);

    const stats = useMemo(() => {
        const lineCount = lines.length;
        const cleanText = value.trim();
        const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
        const readTime = Math.max(1, Math.ceil(words / 200));
        return { lineCount, words, readTime };
    }, [lines, value]);

    // Auto-adjust textarea height to content so outer container scrolls and toolbar sticks smoothly
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        const minHeight = typeof window !== "undefined" && window.innerWidth < 640 ? 360 : 540;
        const newHeight = Math.max(textarea.scrollHeight, minHeight);
        textarea.style.height = `${newHeight}px`;
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [value, mode, adjustTextareaHeight]);

    // Synchronized scrolling in split mode
    const handleEditorScroll = () => {
        if (mode !== "split" || isScrollingRef.current === "preview") return;
        isScrollingRef.current = "editor";
        if (textareaRef.current && previewRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
            const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
            previewRef.current.scrollTop = scrollRatio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
        }
        setTimeout(() => {
            isScrollingRef.current = null;
        }, 40);
    };

    const handlePreviewScroll = () => {
        if (mode !== "split" || isScrollingRef.current === "editor") return;
        isScrollingRef.current = "preview";
        if (textareaRef.current && previewRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
            const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
            textareaRef.current.scrollTop = scrollRatio * (textareaRef.current.scrollHeight - textareaRef.current.clientHeight);
        }
        setTimeout(() => {
            isScrollingRef.current = null;
        }, 40);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error(e);
        }
    };

    const insertSyntax = (syntax: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        let replacement = "";
        if (syntax === "h1") replacement = `\n# ${selected || "Heading 1"}`;
        else if (syntax === "h2") replacement = `\n## ${selected || "Heading 2"}`;
        else if (syntax === "h3") replacement = `\n### ${selected || "Heading 3"}`;
        else if (syntax === "bold") replacement = `**${selected || "bold text"}**`;
        else if (syntax === "italic") replacement = `*${selected || "italic text"}*`;
        else if (syntax === "underline") replacement = `<u>${selected || "underlined text"}</u>`;
        else if (syntax === "strike") replacement = `~~${selected || "strikethrough text"}~~`;
        else if (syntax === "code") replacement = `\`${selected || "code"}\``;
        else if (syntax === "codeblock") replacement = `\n\`\`\`\n${selected || "// Code block"}\n\`\`\`\n`;
        else if (syntax === "bullet") replacement = `\n- ${selected || "item"}`;
        else if (syntax === "number") replacement = `\n1. ${selected || "item"}`;
        else if (syntax === "sup") replacement = `^${selected || "2"}^`;
        else if (syntax === "link") replacement = `[${selected || "Resource Title"}](https://...)`;
        else if (syntax === "img") replacement = `![${selected || "Diagram"}](https://...)`;
        else if (syntax === "t-mint") replacement = `==g:${selected || "optimal"}==`;
        else if (syntax === "t-rose") replacement = `==r:${selected || "warning"}==`;
        else if (syntax === "t-cyan") replacement = `==b:${selected || "complexity"}==`;
        else if (syntax === "t-amber") replacement = `==y:${selected || "key term"}==`;
        else if (syntax === "t-purple") replacement = `==p:${selected || "note"}==`;

        const updated = text.substring(0, start) + replacement + text.substring(end);
        onChange(updated);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + replacement.length, start + replacement.length);
            adjustTextareaHeight();
        }, 50);
    };

    return (
        <div className="bg-[#10141E] border border-[#1E293B] rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs relative max-w-full">
            {/* Top Toolbar - Sticky with scroll and responsive design */}
            <div
                ref={toolbarRef}
                className="sticky top-0 z-30 flex flex-col gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#0B0F17]/95 backdrop-blur-md border-b border-[#1E293B] select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-t-xl transition-all"
            >
                {/* Upper row: Label, Stats, Copy, and Mode Switchers */}
                <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <FileText size={14} className="text-cyan-400 shrink-0" />
                        <span className="text-white font-semibold truncate text-xs">{label}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider shrink-0">
                            MD
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-zinc-500 text-[11px] font-mono hidden lg:inline">
                            {stats.lineCount} lines • {stats.words} words • {stats.readTime} min read
                        </span>

                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-[#141923] border border-[#1E293B] text-zinc-400 hover:text-white transition-colors"
                            title="Copy Markdown"
                        >
                            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>

                        {/* Mode Toggle Pills: Edit / Split / Preview */}
                        <div className="flex items-center bg-[#141923] border border-[#1E293B] rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={() => setMode("edit")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-colors ${
                                    mode === "edit" ? "bg-[#1E293B] text-cyan-300" : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <Edit3 size={11} />
                                <span>Edit</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("split")}
                                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                    mode === "split" ? "bg-[#1E293B] text-cyan-300" : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <Split size={12} />
                                <span>Split</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("preview")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-colors ${
                                    mode === "preview" ? "bg-[#1E293B] text-cyan-300" : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                <Eye size={11} />
                                <span>Preview</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lower row: Horizontally scrollable Action Toolbox & Tints (Never overflows!) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full touch-pan-x">
                    {/* Quick Formatting Buttons */}
                    <div className="flex items-center gap-1 bg-[#141923] border border-[#1E293B] rounded-lg p-0.5 shrink-0">
                        {[
                            { id: "h1", label: "H1", title: "Heading 1" },
                            { id: "h2", label: "H2", title: "Heading 2" },
                            { id: "h3", label: "H3", title: "Heading 3" },
                            { id: "bold", label: "B", title: "Bold", className: "font-bold" },
                            { id: "italic", label: "/", title: "Italic", className: "italic" },
                            { id: "underline", label: "U", title: "Underline", className: "underline" },
                            { id: "strike", label: "S", title: "Strikethrough", className: "line-through" },
                            { id: "code", label: "</>", title: "Inline Code" },
                            { id: "codeblock", label: "{}", title: "Code Block" },
                            { id: "bullet", label: "•", title: "Bullet List" },
                            { id: "number", label: "1.", title: "Numbered List" },
                            { id: "sup", label: "x²", title: "Superscript" },
                            { id: "link", label: "🔗", title: "Link" },
                            { id: "img", label: "🖼", title: "Image" },
                        ].map((b) => (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => insertSyntax(b.id)}
                                className={`w-6 h-6 shrink-0 rounded flex items-center justify-center text-[11px] text-zinc-400 hover:text-white hover:bg-[#1E293B] transition-colors ${
                                    b.className || ""
                                }`}
                                title={b.title}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-[1px] bg-[#1E293B] shrink-0 mx-0.5" />

                    {/* Color Tints Picker */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#141923] border border-[#1E293B] rounded-lg text-[10px] shrink-0">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">TINTS:</span>
                        <button
                            type="button"
                            onClick={() => insertSyntax("t-mint")}
                            className="w-3 h-3 rounded-full bg-emerald-400 hover:scale-125 transition-transform shrink-0"
                            title="Mint / Optimal"
                        />
                        <button
                            type="button"
                            onClick={() => insertSyntax("t-rose")}
                            className="w-3 h-3 rounded-full bg-rose-400 hover:scale-125 transition-transform shrink-0"
                            title="Rose / Pitfall"
                        />
                        <button
                            type="button"
                            onClick={() => insertSyntax("t-cyan")}
                            className="w-3 h-3 rounded-full bg-cyan-400 hover:scale-125 transition-transform shrink-0"
                            title="Cyan / Complexity"
                        />
                        <button
                            type="button"
                            onClick={() => insertSyntax("t-amber")}
                            className="w-3 h-3 rounded-full bg-amber-400 hover:scale-125 transition-transform shrink-0"
                            title="Amber / Key Term"
                        />
                        <button
                            type="button"
                            onClick={() => insertSyntax("t-purple")}
                            className="w-3 h-3 rounded-full bg-purple-400 hover:scale-125 transition-transform shrink-0"
                            title="Purple / Tip"
                        />
                    </div>
                </div>
            </div>

            {/* IDE Canvas Body */}
            <div className="flex-1 min-h-[360px] sm:min-h-[540px] flex overflow-x-auto bg-[#0B0F17] rounded-b-xl">
                {/* Mode: EDIT */}
                {mode === "edit" && (
                    <div className="flex-1 flex min-h-[360px] sm:min-h-[540px]">
                        {/* 2-Digit Line Numbers Gutter */}
                        <div className="w-9 sm:w-12 bg-[#0B0F17] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono text-[10px] sm:text-xs leading-6">
                            {lines.map((_, i) => (
                                <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                            ))}
                        </div>

                        {/* Raw Textarea with matching line-height */}
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                adjustTextareaHeight();
                            }}
                            placeholder={placeholder}
                            className="flex-1 bg-[#0B0F17] text-zinc-200 p-2.5 sm:p-4 leading-6 font-mono text-xs focus:outline-none resize-none overflow-hidden"
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Mode: PREVIEW */}
                {mode === "preview" && (
                    <div className="flex-1 flex min-h-[360px] sm:min-h-[540px]">
                        {/* Gutter */}
                        <div className="w-9 sm:w-12 bg-[#0B0F17] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono text-[10px] sm:text-xs leading-6">
                            {lines.map((_, i) => (
                                <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                            ))}
                        </div>

                        {/* Formatted Lines */}
                        <div className="flex-1 p-2.5 sm:p-4 leading-6 font-mono text-xs text-zinc-200 select-text">
                            {lines.map((line, i) => (
                                <div key={i} className="hover:bg-[#141923] rounded px-1 -mx-1">
                                    {renderMarkdownLine(line)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mode: SPLIT */}
                {mode === "split" && (
                    <div className="flex-1 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B] min-h-[560px]">
                        {/* Left: Editor */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div
                                style={{ top: `${toolbarHeight}px` }}
                                className="sticky z-20 px-3 sm:px-4 py-1.5 bg-[#0F131C]/95 backdrop-blur-sm border-b border-[#1E293B] text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between shadow-sm"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span>CODE EDITOR // MARKDOWN</span>
                                </span>
                                <span className="text-zinc-500 text-[9px]">Ln 1 - {lines.length}</span>
                            </div>
                            <div className="flex-1 flex min-h-[360px] sm:min-h-[540px]">
                                <div className="w-9 sm:w-12 bg-[#0B0F17] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono text-[10px] sm:text-xs leading-6">
                                    {lines.map((_, i) => (
                                        <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                                    ))}
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onScroll={handleEditorScroll}
                                    onChange={(e) => {
                                        onChange(e.target.value);
                                        adjustTextareaHeight();
                                    }}
                                    placeholder={placeholder}
                                    className="flex-1 bg-[#0B0F17] text-zinc-200 p-2.5 sm:p-4 leading-6 font-mono text-xs focus:outline-none resize-none overflow-hidden"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="flex-1 flex flex-col min-w-0 bg-[#0F131C]">
                            <div
                                style={{ top: `${toolbarHeight}px` }}
                                className="sticky z-20 px-3 sm:px-4 py-1.5 bg-[#0F131C]/95 backdrop-blur-sm border-b border-[#1E293B] text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between shadow-sm"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>COMPILED PREVIEW // LIVE</span>
                                </span>
                                <span className="text-emerald-400 font-bold text-[9px]">SYNCHRONIZED</span>
                            </div>
                            <div className="flex-1 flex min-h-[360px] sm:min-h-[540px]">
                                <div className="w-9 sm:w-12 bg-[#0F131C] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono text-[10px] sm:text-xs leading-6">
                                    {lines.map((_, i) => (
                                        <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                                    ))}
                                </div>
                                <div
                                    ref={previewRef}
                                    onScroll={handlePreviewScroll}
                                    className="flex-1 p-2.5 sm:p-4 leading-6 font-mono text-xs text-zinc-200 select-text"
                                >
                                    {lines.map((line, i) => (
                                        <div key={i} className="hover:bg-[#141923] rounded px-1 -mx-1">
                                            {renderMarkdownLine(line)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
