"use client";

import React, { useState, useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
    Heading1, Heading2, Heading3, Table as TableIcon,
    Code, CheckSquare, Minus, Quote
} from "lucide-react";

export interface SlashItem {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    command: (editor: Editor) => void;
    aliases: string[];
}

const SLASH_COMMANDS: SlashItem[] = [
    {
        id: "h1",
        label: "Heading 1",
        description: "Large section heading",
        icon: <Heading1 className="w-4 h-4 text-cyan-500" />,
        aliases: ["h1", "heading1", "header1"],
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        id: "h2",
        label: "Heading 2",
        description: "Medium subsection heading",
        icon: <Heading2 className="w-4 h-4 text-cyan-500" />,
        aliases: ["h2", "heading2", "header2"],
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        id: "h3",
        label: "Heading 3",
        description: "Small subtopic heading",
        icon: <Heading3 className="w-4 h-4 text-cyan-500" />,
        aliases: ["h3", "heading3", "header3"],
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        id: "table",
        label: "Table",
        description: "Insert a 3x3 structured table",
        icon: <TableIcon className="w-4 h-4 text-emerald-500" />,
        aliases: ["table", "grid"],
        command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
        id: "code",
        label: "Code Block",
        description: "Syntax highlighted code snippet",
        icon: <Code className="w-4 h-4 text-amber-500" />,
        aliases: ["code", "codeblock", "pre"],
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        id: "todo",
        label: "To-do Checklist",
        description: "Track tasks with checkable boxes",
        icon: <CheckSquare className="w-4 h-4 text-cyan-500" />,
        aliases: ["todo", "task", "checklist", "check"],
        command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        id: "divider",
        label: "Divider",
        description: "Horizontal dividing line",
        icon: <Minus className="w-4 h-4 text-zinc-400" />,
        aliases: ["divider", "hr", "line", "rule"],
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        id: "quote",
        label: "Blockquote",
        description: "Highlight a quote or callout",
        icon: <Quote className="w-4 h-4 text-amber-500" />,
        aliases: ["quote", "blockquote"],
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
];

export default function RichTextSlashMenu({ editor }: { editor: Editor | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const filteredItems = SLASH_COMMANDS.filter((item) => {
        if (!query) return true;
        return (
            item.id.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query) ||
            item.aliases.some((a) => a.includes(query))
        );
    });

    // Detect `/` command query and compute smart position
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            const { from, empty } = editor.state.selection;
            if (!empty) {
                setIsOpen(false);
                return;
            }

            const textBefore = editor.state.doc.textBetween(
                Math.max(0, from - 20),
                from,
                "\n",
                "\0"
            );

            const match = textBefore.match(/(?:^|\s)\/([a-z0-9_-]*)$/i);
            if (match) {
                const q = match[1].toLowerCase();
                setQuery(q);
                setSelectedIndex(0);

                const coords = editor.view.coordsAtPos(from);
                const editorEl = editor.view.dom.closest(".tiptap-container") || editor.view.dom;
                const rect = editorEl.getBoundingClientRect();

                // Smart vertical flip: If near bottom of viewport, position above cursor
                const estimatedHeight = 280;
                const spaceBelow = window.innerHeight - coords.bottom;
                const showAbove = spaceBelow < estimatedHeight && coords.top > estimatedHeight;

                const top = showAbove
                    ? Math.max(10, coords.top - rect.top - estimatedHeight - 8)
                    : Math.max(10, coords.bottom - rect.top + 8);

                const left = Math.max(16, Math.min(coords.left - rect.left, rect.width - 270));

                setPosition({ top, left });
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        editor.on("update", handleUpdate);
        editor.on("selectionUpdate", handleUpdate);

        return () => {
            editor.off("update", handleUpdate);
            editor.off("selectionUpdate", handleUpdate);
        };
    }, [editor]);

    // Auto-scroll menu into view when selectedIndex changes
    useEffect(() => {
        if (isOpen && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [selectedIndex, isOpen]);

    const executeCommand = React.useCallback((item: SlashItem) => {
        if (!editor) return;
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, "\n", "\0");
        const match = textBefore.match(/(?:^|\s)\/([a-z0-9_-]*)$/i);

        if (match) {
            const deleteLength = match[0].length;
            const startPos = from - deleteLength + (match[0].startsWith(" ") ? 1 : 0);
            editor.commands.deleteRange({ from: startPos, to: from });
        }

        item.command(editor);
        setIsOpen(false);
    }, [editor]);

    // Keyboard navigation when slash menu is open
    useEffect(() => {
        if (!isOpen || !editor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
            } else if (e.key === "Enter" || e.key === "Tab") {
                if (filteredItems.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    executeCommand(filteredItems[selectedIndex]);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [isOpen, editor, filteredItems, selectedIndex, executeCommand]);

    if (!isOpen || filteredItems.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className="absolute z-50 w-64 bg-[var(--surface,#161b24)] border border-[var(--border-subtle,#2d3748)] rounded-xl shadow-2xl p-1.5 text-xs select-none max-h-72 overflow-y-auto overscroll-contain scrollbar-thin animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-[var(--border-subtle,#262c36)] mb-1 flex items-center justify-between">
                <span>Commands</span>
                <span className="text-[9px] font-mono opacity-70">↑↓ to move</span>
            </div>

            {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <button
                        key={item.id}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        type="button"
                        onMouseDown={(e) => {
                            // Prevent losing editor focus on click
                            e.preventDefault();
                            executeCommand(item);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition cursor-pointer my-0.5 ${
                            isSelected
                                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30 shadow-sm"
                                : "text-[var(--foreground,#f1f5f9)] hover:bg-[var(--card-hover,#1a202c)] border border-transparent"
                        }`}
                    >
                        <div className="p-1.5 rounded-md bg-[var(--card,#1a202c)] border border-[var(--border-subtle,#2d3748)] shrink-0">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate leading-snug">{item.label}</div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{item.description}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
