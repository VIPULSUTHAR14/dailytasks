"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Keyboard, X, Bold, Italic, Underline as UnderlineIcon,
    Strikethrough, Code, List, ListOrdered, CheckSquare,
    Quote, Minus, Table as TableIcon, Highlighter, Sparkles,
    Terminal, Hash, Search
} from "lucide-react";
import { motion } from "framer-motion";

export interface ShortcutItem {
    label: string;
    description: string;
    keys: string[];
    macKeys?: string[];
    category: "formatting" | "headings" | "lists" | "slash" | "markdown" | "highlights";
    markdownHint?: string;
    icon?: React.ReactNode;
}

const SHORTCUT_ITEMS: ShortcutItem[] = [
    // Inline Formatting
    {
        label: "Bold",
        description: "Make selected text bold",
        keys: ["Ctrl", "B"],
        macKeys: ["Cmd", "B"],
        category: "formatting",
        markdownHint: "**text**",
        icon: <Bold className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Italic",
        description: "Italicize selected text",
        keys: ["Ctrl", "I"],
        macKeys: ["Cmd", "I"],
        category: "formatting",
        markdownHint: "*text*",
        icon: <Italic className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Underline",
        description: "Underline selected text",
        keys: ["Ctrl", "U"],
        macKeys: ["Cmd", "U"],
        category: "formatting",
        icon: <UnderlineIcon className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Strikethrough",
        description: "Cross out selected text",
        keys: ["Ctrl", "Shift", "X"],
        macKeys: ["Cmd", "Shift", "X"],
        category: "formatting",
        markdownHint: "~~text~~",
        icon: <Strikethrough className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Inline Code",
        description: "Format as monospaced code snippet",
        keys: ["Ctrl", "E"],
        macKeys: ["Cmd", "E"],
        category: "formatting",
        markdownHint: "`code`",
        icon: <Code className="w-3.5 h-3.5 text-cyan-500" />,
    },

    // Headings & Hierarchy
    {
        label: "Heading 1",
        description: "Large major section heading",
        keys: ["Ctrl", "Alt", "1"],
        macKeys: ["Cmd", "Alt", "1"],
        category: "headings",
        markdownHint: "# + Space",
        icon: <Hash className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Heading 2",
        description: "Medium subsection heading",
        keys: ["Ctrl", "Alt", "2"],
        macKeys: ["Cmd", "Alt", "2"],
        category: "headings",
        markdownHint: "## + Space",
        icon: <Hash className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Heading 3",
        description: "Small subtopic heading",
        keys: ["Ctrl", "Alt", "3"],
        macKeys: ["Cmd", "Alt", "3"],
        category: "headings",
        markdownHint: "### + Space",
        icon: <Hash className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
        label: "Normal Text",
        description: "Reset to standard body paragraph",
        keys: ["Ctrl", "Alt", "0"],
        macKeys: ["Cmd", "Alt", "0"],
        category: "headings",
    },

    // Lists & Blocks
    {
        label: "Bullet List",
        description: "Unordered bulleted list",
        keys: ["Ctrl", "Shift", "8"],
        macKeys: ["Cmd", "Shift", "8"],
        category: "lists",
        markdownHint: "- + Space",
        icon: <List className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
        label: "Numbered List",
        description: "Ordered numerical list",
        keys: ["Ctrl", "Shift", "7"],
        macKeys: ["Cmd", "Shift", "7"],
        category: "lists",
        markdownHint: "1. + Space",
        icon: <ListOrdered className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
        label: "To-do Checklist",
        description: "Interactive checkable task boxes",
        keys: ["/todo"],
        category: "lists",
        markdownHint: "[ ] + Space",
        icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
        label: "Blockquote",
        description: "Callout block with accent line",
        keys: ["Ctrl", "Shift", "B"],
        macKeys: ["Cmd", "Shift", "B"],
        category: "lists",
        markdownHint: "> + Space",
        icon: <Quote className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
        label: "Code Block",
        description: "Syntax highlighted multi-language block",
        keys: ["Ctrl", "Alt", "C"],
        macKeys: ["Cmd", "Alt", "C"],
        category: "lists",
        markdownHint: "``` + Space",
        icon: <Terminal className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
        label: "Insert Table",
        description: "Structured 3x3 table with resize handles",
        keys: ["/table"],
        category: "lists",
        markdownHint: "Type /table",
        icon: <TableIcon className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
        label: "Divider Line",
        description: "Horizontal visual section break",
        keys: ["/divider"],
        category: "lists",
        markdownHint: "---",
        icon: <Minus className="w-3.5 h-3.5 text-zinc-400" />,
    },

    // Slash Commands
    {
        label: "Slash Menu",
        description: "Summon the quick command palette",
        keys: ["/"],
        category: "slash",
        markdownHint: "Type / on new line",
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" />,
    },
    {
        label: "Quick Undo",
        description: "Revert previous edit",
        keys: ["Ctrl", "Z"],
        macKeys: ["Cmd", "Z"],
        category: "formatting",
    },
    {
        label: "Quick Redo",
        description: "Re-apply reverted edit",
        keys: ["Ctrl", "Y"],
        macKeys: ["Cmd", "Shift", "Z"],
        category: "formatting",
    },
    {
        label: "Soft Line Break",
        description: "Break line without creating new paragraph",
        keys: ["Shift", "Enter"],
        category: "formatting",
    },
    {
        label: "Exit Fullscreen",
        description: "Return from immersive writing view",
        keys: ["Esc"],
        category: "formatting",
    },
];

const SEMANTIC_HIGHLIGHTS = [
    { color: "#f43f5e", name: "Rose", label: "Bug / Critical Edge Case", syntax: "==r:text==" },
    { color: "#10b981", name: "Emerald", label: "Optimal Insight / Pattern", syntax: "==g:text==" },
    { color: "#06b6d4", name: "Sky", label: "Std Library / Method", syntax: "==b:text==" },
    { color: "#f59e0b", name: "Amber", label: "Follow-up / Question", syntax: "==y:text==" },
    { color: "#a855f7", name: "Purple", label: "Formula / Big-O Math", syntax: "==p:text==" },
];

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "formatting", label: "Formatting" },
    { id: "headings", label: "Headings" },
    { id: "lists", label: "Lists & Blocks" },
    { id: "slash", label: "Slash (/)" },
    { id: "highlights", label: "Highlights" },
];

export default function NotesShortcutsGuide({
    buttonLabel = "Shortcuts",
    className = ""
}: {
    buttonLabel?: string;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [isMac, setIsMac] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const isApple = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || "");
            setIsMac(isApple);
        }
    }, []);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const filteredItems = SHORTCUT_ITEMS.filter((item) => {
        const matchesCategory = activeTab === "all" || item.category === activeTab;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query ||
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.keys.some(k => k.toLowerCase().includes(query)) ||
            (item.markdownHint && item.markdownHint.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
    });

    const modalContent = isOpen ? (
        <div
            className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-sans"
            onClick={() => setIsOpen(false)}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="max-w-4xl w-full max-h-[85vh] flex flex-col bg-[var(--surface,#10141E)] border border-[var(--border-subtle,#1E293B)] rounded-2xl shadow-2xl overflow-hidden relative text-[var(--foreground,#f1f5f9)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Header */}
                <div className="px-5 py-4 border-b border-[var(--border-subtle,#1E293B)] bg-[var(--surface,#10141E)] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm text-cyan-500">
                            <Keyboard className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold text-[var(--foreground,#ffffff)] tracking-wide">
                                    Editor Shortcuts & Syntax
                                </h3>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                                    {isMac ? "macOS" : "Windows/Linux"}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Hotkeys, markdown syntax, and slash (<span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">/</span>) commands for your notes
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-[var(--foreground,#ffffff)] hover:bg-[var(--card-hover,#1a202c)] transition-colors cursor-pointer"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="px-5 py-3 border-b border-[var(--border-subtle,#1E293B)] bg-[var(--surface,#10141E)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search shortcut (e.g. bold, table, heading)..."
                            className="w-full pl-9 pr-7 py-1.5 bg-[var(--card,#141923)] border border-[var(--border-subtle,#1E293B)] focus:border-cyan-500/50 rounded-xl text-xs text-[var(--foreground,#ffffff)] placeholder-zinc-400 focus:outline-none transition-all font-sans"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[var(--foreground,#ffffff)] text-xs"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Filter Category Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeTab === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setActiveTab(cat.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? "bg-cyan-500 text-zinc-950 font-bold shadow-sm border border-cyan-400"
                                            : "bg-[var(--card,#141923)] text-zinc-500 dark:text-zinc-400 hover:text-[var(--foreground,#ffffff)] border border-[var(--border-subtle,#1E293B)] hover:bg-[var(--card-hover,#1a202c)]"
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[var(--background,#0B0C10)]">
                    {/* Semantic 5-Color Highlights Banner (if in all or highlights tab) */}
                    {(activeTab === "all" || activeTab === "highlights") && !searchQuery && (
                        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                                <span>AlgoCraft 5-Color Semantic Highlights</span>
                                <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 font-mono">
                                    (Select text or type markdown syntax)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                                {SEMANTIC_HIGHLIGHTS.map((h) => (
                                    <div
                                        key={h.name}
                                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--card,#141923)] border border-[var(--border-subtle,#1E293B)] shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                                style={{ backgroundColor: h.color }}
                                            />
                                            <div className="truncate">
                                                <div className="text-[11px] font-bold text-[var(--foreground,#ffffff)] truncate">{h.name}</div>
                                                <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">{h.label}</div>
                                            </div>
                                        </div>
                                        <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface,#10141e)] border border-[var(--border-subtle,#1E293B)] font-mono text-[9px] text-amber-600 dark:text-amber-400 shrink-0 font-bold">
                                            {h.syntax}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shortcuts Grid */}
                    {activeTab !== "highlights" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {filteredItems.map((item, idx) => {
                                const displayedKeys = (isMac && item.macKeys) ? item.macKeys : item.keys;
                                return (
                                    <div
                                        key={`${item.label}-${idx}`}
                                        className="flex items-start justify-between gap-2 p-3 rounded-xl bg-[var(--card,#141923)] hover:bg-[var(--card-hover,#1a202c)] border border-[var(--border-subtle,#1E293B)] hover:border-cyan-500/40 transition-all shadow-sm group"
                                    >
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            {item.icon && (
                                                <div className="p-1.5 rounded-lg bg-[var(--surface,#10141e)] border border-[var(--border-subtle,#1E293B)] shrink-0 mt-0.5">
                                                    {item.icon}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-[var(--foreground,#ffffff)] group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                                                    {item.label}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                                                    {item.description}
                                                </div>
                                                {item.markdownHint && (
                                                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                                                        <span>Type:</span>
                                                        <code className="text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono font-semibold">
                                                            {item.markdownHint}
                                                        </code>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Key badges with guaranteed high contrast in both light and dark themes */}
                                        <div className="flex items-center gap-1 shrink-0 font-mono">
                                            {displayedKeys.map((key, kIdx) => (
                                                <kbd
                                                    key={kIdx}
                                                    className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[var(--surface,#10141e)] text-[var(--foreground,#ffffff)] border border-[var(--border-bright,#45a29e)]/40 rounded shadow-sm"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {filteredItems.length === 0 && activeTab !== "highlights" && (
                        <div className="py-12 text-center text-zinc-500 text-xs">
                            No shortcuts found matching &quot;{searchQuery}&quot;
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3 border-t border-[var(--border-subtle,#1E293B)] bg-[var(--surface,#10141E)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Select any text in editor to reveal the instant floating mini-toolbar.</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-1.5 rounded-xl bg-[var(--card,#141923)] hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#ffffff)] border border-[var(--border-subtle,#1E293B)] text-xs font-semibold transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    ) : null;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card,#141923)] hover:bg-[var(--card-hover,#1a202c)] text-[var(--foreground,#f1f5f9)] border border-[var(--border-subtle,#1e293b)] hover:border-cyan-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm group font-sans ${className}`}
                title="View Rich Text Editor Shortcuts & Markdown Guide"
            >
                <Keyboard className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span>{buttonLabel}</span>
            </button>

            {mounted && typeof document !== "undefined" && modalContent && createPortal(modalContent, document.body)}
        </>
    );
}
