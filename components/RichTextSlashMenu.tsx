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
        icon: <Heading1 className="w-4 h-4 text-cyan-400" />,
        aliases: ["h1", "heading1", "header1"],
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        id: "h2",
        label: "Heading 2",
        description: "Medium subsection heading",
        icon: <Heading2 className="w-4 h-4 text-cyan-400" />,
        aliases: ["h2", "heading2", "header2"],
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        id: "h3",
        label: "Heading 3",
        description: "Small subtopic heading",
        icon: <Heading3 className="w-4 h-4 text-cyan-400" />,
        aliases: ["h3", "heading3", "header3"],
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        id: "table",
        label: "Table",
        description: "Insert a 3x3 structured table",
        icon: <TableIcon className="w-4 h-4 text-emerald-400" />,
        aliases: ["table", "grid"],
        command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
        id: "code",
        label: "Code Block",
        description: "Syntax highlighted code snippet",
        icon: <Code className="w-4 h-4 text-amber-400" />,
        aliases: ["code", "codeblock", "pre"],
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        id: "todo",
        label: "To-do Checklist",
        description: "Track tasks with checkable boxes",
        icon: <CheckSquare className="w-4 h-4 text-cyan-400" />,
        aliases: ["todo", "task", "checklist", "check"],
        command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        id: "divider",
        label: "Divider",
        description: "Horizontal dividing line",
        icon: <Minus className="w-4 h-4 text-slate-400" />,
        aliases: ["divider", "hr", "line", "rule"],
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        id: "quote",
        label: "Blockquote",
        description: "Highlight a quote or note",
        icon: <Quote className="w-4 h-4 text-amber-400" />,
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

    const filteredItems = SLASH_COMMANDS.filter((item) => {
        if (!query) return true;
        return (
            item.id.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query) ||
            item.aliases.some((a) => a.includes(query))
        );
    });

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

                setPosition({
                    top: coords.bottom - rect.top + 8,
                    left: Math.max(16, Math.min(coords.left - rect.left, rect.width - 240)),
                });
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
                setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
            } else if (e.key === "Enter" || e.key === "Tab") {
                if (filteredItems.length > 0) {
                    e.preventDefault();
                    executeCommand(filteredItems[selectedIndex]);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
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
            className="absolute z-50 w-56 bg-[var(--surface,#161b24)] border border-[var(--border-subtle,#2d3748)] rounded-xl shadow-2xl p-1 text-xs select-none max-h-64 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[var(--border-subtle,#262c36)] mb-1">
                Commands
            </div>
            {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => executeCommand(item)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer ${
                            isSelected
                                ? "bg-cyan-500/20 text-cyan-300 font-medium"
                                : "text-[var(--foreground,#cbd5e1)] hover:bg-[var(--card-hover,#1a202c)] hover:text-white"
                        }`}
                    >
                        <div className="p-1 rounded bg-[var(--card,#1a202c)] border border-[var(--border-subtle,#2d3748)] shrink-0">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate">{item.label}</div>
                            <div className="text-[10px] opacity-60 truncate">{item.description}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
