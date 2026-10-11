"use client";

import React, { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { common, createLowlight } from "lowlight";
import "./rich-editor.css";

declare module "@tiptap/core" {
    interface Storage {
        markdown?: MarkdownStorage;
    }
}

export interface EditorSection {
    id: string;
    label: string;
    count?: number | string;
    icon?: React.ReactNode;
    type?: string;
}

export interface RichTextEditorProps {
    label?: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    lineCountBadge?: number;
    // Fullscreen additions & section tabs
    onSave?: () => void;
    isSaved?: boolean;
    onOpenSettings?: () => void;
    sections?: EditorSection[];
    activeSectionId?: string;
    onSelectSection?: (id: string) => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: (fullscreen: boolean) => void;
    className?: string;
}

const lowlight = createLowlight(common);

export default function RichTextEditor({
    label = "Notes",
    value,
    onChange,
    placeholder = "Start writing...",
    lineCountBadge,
    onSave,
    isSaved,
    onOpenSettings,
    sections,
    activeSectionId,
    onSelectSection,
    isFullscreen = false,
    onToggleFullscreen,
    className = ""
}: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            Highlight.configure({
                multicolor: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Markdown.configure({
                html: true,
                tightLists: true,
                bulletListMarker: "-",
            }),
        ],
        content: value || "",
        onUpdate: ({ editor }) => {
            const markdown = editor.storage.markdown?.getMarkdown() ?? "";
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: "tiptap ProseMirror focus:outline-none min-h-[300px] w-full text-slate-200 text-sm leading-relaxed p-4",
            },
        },
    });

    // Synchronize external value changes without infinite loop or losing cursor
    useEffect(() => {
        if (!editor) return;
        const currentMarkdown = editor.storage.markdown?.getMarkdown() ?? "";
        if (value !== undefined && value !== currentMarkdown) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [value, editor]);

    return (
        <div className={`relative flex flex-col bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden shadow-xl ${isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : ""} ${className}`}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#21262d] select-none">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                        {label}
                    </span>
                    {lineCountBadge !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {lineCountBadge} lines
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                    {onSave && (
                        <button
                            type="button"
                            onClick={onSave}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                isSaved
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : "bg-blue-600 hover:bg-blue-500 text-white"
                            }`}
                        >
                            {isSaved ? "Saved" : "Save"}
                        </button>
                    )}

                    {onToggleFullscreen && (
                        <button
                            type="button"
                            onClick={() => onToggleFullscreen(!isFullscreen)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        </button>
                    )}
                </div>
            </div>

            {/* Sections tab bar if sections are provided */}
            {sections && sections.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-[#0e131a] border-b border-[#21262d] overflow-x-auto text-xs">
                    {sections.map((section) => {
                        const isActive = section.id === activeSectionId;
                        return (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => onSelectSection?.(section.id)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                                    isActive
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                }`}
                            >
                                {section.icon}
                                <span>{section.label}</span>
                                {section.count !== undefined && (
                                    <span className="text-[10px] opacity-60">({section.count})</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto bg-[#0d1117] relative">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
