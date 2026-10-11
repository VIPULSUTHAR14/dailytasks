"use client";

import React, { useState, useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
    Undo, Redo, Bold, Italic, Underline as UnderlineIcon,
    Strikethrough, Code, List, ListOrdered, CheckSquare,
    Highlighter, Table as TableIcon, Minus, Quote,
    ChevronDown, Trash2, Columns, Rows, Check
} from "lucide-react";

export interface RichTextToolbarProps {
    editor: Editor | null;
    className?: string;
}

const HIGHLIGHT_COLORS = [
    { name: "Rose", color: "#f43f5e", bgClass: "bg-rose-500", label: "Bug / Critical" },
    { name: "Emerald", color: "#10b981", bgClass: "bg-emerald-500", label: "Optimal Insight" },
    { name: "Sky", color: "#06b6d4", bgClass: "bg-cyan-500", label: "Std Library" },
    { name: "Amber", color: "#f59e0b", bgClass: "bg-amber-500", label: "Follow-up" },
    { name: "Purple", color: "#a855f7", bgClass: "bg-purple-500", label: "Formula / Pattern" },
];

const CODE_LANGUAGES = [
    { label: "Plain Text", value: "plaintext" },
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" },
    { label: "Python", value: "python" },
    { label: "Java", value: "java" },
    { label: "C++", value: "cpp" },
    { label: "SQL", value: "sql" },
    { label: "Bash", value: "bash" },
];

export default function RichTextToolbar({ editor, className = "" }: RichTextToolbarProps) {
    // Re-render when editor selection or state changes
    const [, setTick] = useState(0);
    const [highlightOpen, setHighlightOpen] = useState(false);
    const [headingOpen, setHeadingOpen] = useState(false);
    const [codeLangOpen, setCodeLangOpen] = useState(false);

    const highlightRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLDivElement>(null);
    const codeLangRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editor) return;

        const updateHandler = () => {
            setTick((t) => t + 1);
        };

        editor.on("transaction", updateHandler);
        editor.on("selectionUpdate", updateHandler);

        return () => {
            editor.off("transaction", updateHandler);
            editor.off("selectionUpdate", updateHandler);
        };
    }, [editor]);

    // Close popovers on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
                setHighlightOpen(false);
            }
            if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
                setHeadingOpen(false);
            }
            if (codeLangRef.current && !codeLangRef.current.contains(e.target as Node)) {
                setCodeLangOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!editor) return null;

    const isInTable = editor.isActive("table");
    const isInCodeBlock = editor.isActive("codeBlock");

    // Current Heading label
    let currentHeadingLabel = "Paragraph";
    if (editor.isActive("heading", { level: 1 })) currentHeadingLabel = "Heading 1";
    else if (editor.isActive("heading", { level: 2 })) currentHeadingLabel = "Heading 2";
    else if (editor.isActive("heading", { level: 3 })) currentHeadingLabel = "Heading 3";

    // Current Code Language label
    const activeCodeLanguage = isInCodeBlock
        ? editor.getAttributes("codeBlock")?.language || "plaintext"
        : "plaintext";

    return (
        <div
            className={`relative z-30 flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[var(--surface,#12161f)] border-b border-[var(--border-subtle,#21262d)] text-[var(--foreground,#cbd5e1)] text-xs select-none overflow-visible shadow-sm ${className}`}
            role="toolbar"
            aria-label="Formatting options"
        >
            {/* History: Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-[var(--border-subtle,#262c36)]">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    aria-label="Undo (Ctrl+Z)"
                    title="Undo (Ctrl+Z)"
                    className="p-1.5 rounded-lg hover:bg-[var(--card-hover,#1a202c)] disabled:opacity-30 disabled:hover:bg-transparent text-[var(--foreground,#cbd5e1)] hover:text-white transition cursor-pointer"
                >
                    <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    aria-label="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                    title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                    className="p-1.5 rounded-lg hover:bg-[var(--card-hover,#1a202c)] disabled:opacity-30 disabled:hover:bg-transparent text-[var(--foreground,#cbd5e1)] hover:text-white transition cursor-pointer"
                >
                    <Redo className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Heading Dropdown */}
            <div className="relative pr-1.5 border-r border-[var(--border-subtle,#262c36)]" ref={headingRef}>
                <button
                    type="button"
                    onClick={() => setHeadingOpen((prev) => !prev)}
                    aria-label="Select text style"
                    title="Text formatting style"
                    className="flex items-center justify-between gap-2 min-w-[105px] px-2.5 py-1.5 rounded-lg bg-[var(--card,#1a202c)] hover:bg-[var(--card-hover,#222a3a)] text-[var(--foreground,#f1f5f9)] border border-[var(--border-subtle,#2d3748)] transition text-xs font-medium cursor-pointer shadow-sm"
                >
                    <span className="truncate">{currentHeadingLabel}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {headingOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-52 bg-[var(--card,#161b24)] border border-[var(--border-bright,#334155)] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button
                            type="button"
                            onClick={() => {
                                editor.chain().focus().setParagraph().run();
                                setHeadingOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[var(--card-hover,#1f2736)] flex items-center justify-between transition cursor-pointer ${
                                editor.isActive("paragraph") ? "text-cyan-400 font-semibold bg-cyan-500/15 border border-cyan-500/30" : "text-slate-200"
                            }`}
                        >
                            <span>Paragraph</span>
                            <span className="text-[10px] opacity-50 font-mono">Normal</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                editor.chain().focus().toggleHeading({ level: 1 }).run();
                                setHeadingOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--card-hover,#1f2736)] flex items-center justify-between font-bold transition cursor-pointer mt-0.5 ${
                                editor.isActive("heading", { level: 1 }) ? "text-cyan-400 bg-cyan-500/15 border border-cyan-500/30" : "text-white"
                            }`}
                        >
                            <span>Heading 1</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">H1</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                editor.chain().focus().toggleHeading({ level: 2 }).run();
                                setHeadingOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[var(--card-hover,#1f2736)] flex items-center justify-between font-semibold transition cursor-pointer mt-0.5 ${
                                editor.isActive("heading", { level: 2 }) ? "text-cyan-400 bg-cyan-500/15 border border-cyan-500/30" : "text-cyan-300"
                            }`}
                        >
                            <span>Heading 2</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">H2</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                editor.chain().focus().toggleHeading({ level: 3 }).run();
                                setHeadingOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[var(--card-hover,#1f2736)] flex items-center justify-between font-medium transition cursor-pointer mt-0.5 ${
                                editor.isActive("heading", { level: 3 }) ? "text-cyan-400 bg-cyan-500/15 border border-cyan-500/30" : "text-slate-300"
                            }`}
                        >
                            <span>Heading 3</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">H3</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Basic Inline Formatting */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-[var(--border-subtle,#262c36)]">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Bold (Ctrl+B)"
                    title="Bold (Ctrl+B)"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("bold")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Italic (Ctrl+I)"
                    title="Italic (Ctrl+I)"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("italic")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    aria-label="Underline (Ctrl+U)"
                    title="Underline (Ctrl+U)"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("underline")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    aria-label="Strikethrough"
                    title="Strikethrough"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("strike")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    aria-label="Inline Code"
                    title="Inline Code"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("code")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <Code className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Highlights Picker */}
            <div className="relative pr-1.5 border-r border-[var(--border-subtle,#262c36)]" ref={highlightRef}>
                <button
                    type="button"
                    onClick={() => setHighlightOpen((prev) => !prev)}
                    aria-label="Highlight color"
                    title="Highlight color"
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("highlight")
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <Highlighter className="w-3.5 h-3.5" />
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>

                {highlightOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-52 bg-[var(--card,#161b24)] border border-[var(--border-bright,#334155)] rounded-xl shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                            Highlight Colors
                        </div>
                        <div className="grid grid-cols-5 gap-2 px-1">
                            {HIGHLIGHT_COLORS.map((h) => {
                                const isCurrent = editor.isActive("highlight", { color: h.color });
                                return (
                                    <button
                                        key={h.name}
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().toggleHighlight({ color: h.color }).run();
                                            setHighlightOpen(false);
                                        }}
                                        title={`${h.name} (${h.label})`}
                                        aria-label={`Highlight ${h.name}`}
                                        className={`w-7 h-7 rounded-lg ${h.bgClass} flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                                            isCurrent ? "ring-2 ring-white ring-offset-1 ring-offset-[#161b24]" : ""
                                        }`}
                                    >
                                        {isCurrent && <Check className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                editor.chain().focus().unsetHighlight().run();
                                setHighlightOpen(false);
                            }}
                            className="w-full text-center px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-500/30"
                        >
                            Remove Highlight
                        </button>
                    </div>
                )}
            </div>

            {/* Lists: Bullets, Numbers, Tasks */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-[var(--border-subtle,#262c36)]">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Bullet list"
                    title="Bullet List"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("bulletList")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <List className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Numbered list"
                    title="Numbered List"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("orderedList")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    aria-label="Checklist (Task list)"
                    title="Checklist (Task list)"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("taskList")
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <CheckSquare className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Blockquote & Horizontal Divider */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-[var(--border-subtle,#262c36)]">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label="Blockquote"
                    title="Blockquote"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                        editor.isActive("blockquote")
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                    }`}
                >
                    <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    aria-label="Horizontal rule divider"
                    title="Horizontal divider"
                    className="p-1.5 rounded-lg hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white transition cursor-pointer"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Code Block with Language Picker */}
            <div className="relative pr-1.5 border-r border-[var(--border-subtle,#262c36)]" ref={codeLangRef}>
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        aria-label="Code Block"
                        title="Code Block"
                        className={`p-1.5 rounded-l-lg transition cursor-pointer ${
                            isInCodeBlock
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white"
                        }`}
                    >
                        <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCodeLangOpen((prev) => !prev)}
                        aria-label="Select Code Language"
                        title="Select Code Language"
                        className={`p-1.5 rounded-r-lg transition cursor-pointer border-l border-[var(--border-subtle,#262c36)] ${
                            isInCodeBlock ? "bg-cyan-500/10 text-cyan-300" : "hover:bg-[var(--card-hover,#1a202c)] text-slate-400"
                        }`}
                    >
                        <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                </div>

                {codeLangOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-44 bg-[var(--card,#161b24)] border border-[var(--border-bright,#334155)] rounded-xl shadow-2xl py-1.5 z-50 max-h-56 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
                            Language
                        </div>
                        {CODE_LANGUAGES.map((lang) => (
                            <button
                                key={lang.value}
                                type="button"
                                onClick={() => {
                                    if (isInCodeBlock) {
                                        editor.chain().focus().updateAttributes("codeBlock", { language: lang.value }).run();
                                    } else {
                                        editor.chain().focus().setCodeBlock({ language: lang.value }).run();
                                    }
                                    setCodeLangOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--card-hover,#1f2736)] transition cursor-pointer ${
                                    activeCodeLanguage === lang.value ? "text-cyan-400 font-semibold bg-cyan-500/10" : "text-slate-300"
                                }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table Tools */}
            <div className="relative">
                {!isInTable ? (
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        aria-label="Insert 3x3 Table"
                        title="Insert 3x3 Table"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#cbd5e1)] hover:text-white transition text-xs cursor-pointer border border-transparent hover:border-[var(--border-subtle,#2d3748)]"
                    >
                        <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Table</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/40 rounded-lg px-2 py-1">
                        <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                            <TableIcon className="w-3 h-3" />
                            Table
                        </span>

                        <div className="flex items-center gap-0.5 ml-1 border-l border-cyan-500/30 pl-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                aria-label="Add Row Below"
                                title="Add Row Below"
                                className="p-1 rounded hover:bg-cyan-500/20 text-cyan-200 transition cursor-pointer"
                            >
                                <Rows className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteRow().run()}
                                aria-label="Delete Row"
                                title="Delete Row"
                                className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                aria-label="Add Column Right"
                                title="Add Column Right"
                                className="p-1 rounded hover:bg-cyan-500/20 text-cyan-200 transition cursor-pointer"
                            >
                                <Columns className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteColumn().run()}
                                aria-label="Delete Column"
                                title="Delete Column"
                                className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                aria-label="Delete Entire Table"
                                title="Delete Entire Table"
                                className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
