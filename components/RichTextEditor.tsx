"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
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
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import {
    Maximize2, Minimize2, Save, Check, FileText,
    ListTree, ChevronDown, Sparkles, Code2
} from "lucide-react";
import { legacyToRich, richToStorage } from "@/lib/markdownHighlightConverter";
import IdeMarkdownEditor from "./IdeMarkdownEditor";
import RichTextToolbar from "./RichTextToolbar";
import RichTextSlashMenu from "./RichTextSlashMenu";
import RichTextFloatingToolbar from "./RichTextFloatingToolbar";
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

export interface DocumentHeading {
    pos: number;
    level: number;
    text: string;
}

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("js", javascript);
lowlight.register("typescript", typescript);
lowlight.register("ts", typescript);
lowlight.register("python", python);
lowlight.register("py", python);
lowlight.register("java", java);
lowlight.register("cpp", cpp);
lowlight.register("c", c);
lowlight.register("sql", sql);
lowlight.register("json", json);
lowlight.register("html", xml);
lowlight.register("xml", xml);
lowlight.register("css", css);
lowlight.register("bash", bash);
lowlight.register("sh", bash);

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
    isFullscreen: externalIsFullscreen,
    onToggleFullscreen,
    className = ""
}: RichTextEditorProps) {
    // Fullscreen state with external or internal fallback
    const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);
    const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen;

    const handleToggleFullscreen = useCallback(() => {
        if (onToggleFullscreen) {
            onToggleFullscreen(!isFullscreen);
        } else {
            setInternalIsFullscreen((prev) => !prev);
        }
    }, [isFullscreen, onToggleFullscreen]);

    // Exit fullscreen on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isFullscreen) {
                handleToggleFullscreen();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen, handleToggleFullscreen]);

    // Mode state: 'rich' or 'markdown'
    const [editorMode, setEditorMode] = useState<"rich" | "markdown">(() => {
        if (typeof window !== "undefined") {
            try {
                const savedMode = localStorage.getItem("algocraft_editor_mode");
                if (savedMode === "markdown" || savedMode === "rich") {
                    return savedMode;
                }
            } catch {
                // Ignore if localStorage unavailable
            }
        }
        return "rich";
    });

    // Outline state
    const [headings, setHeadings] = useState<DocumentHeading[]>([]);
    const [isOutlineOpen, setIsOutlineOpen] = useState(false);
    const outlineRef = useRef<HTMLDivElement>(null);

    // Extract headings from editor document
    const updateHeadingsList = useCallback((editorInstance: Editor) => {
        if (!editorInstance) return;
        const list: DocumentHeading[] = [];
        editorInstance.state.doc.descendants((node, pos) => {
            if (node.type.name === "heading") {
                list.push({
                    pos,
                    level: (node.attrs.level as number) || 1,
                    text: node.textContent.trim(),
                });
            }
        });
        setHeadings(list);
    }, []);

    // Debounce refs & saving status
    const editorRef = useRef<Editor | null>(null);
    const pendingValueRef = useRef<string | null>(null);
    const isDirtyRef = useRef<boolean>(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState({ words: 0, characters: 0 });

    const flushDebouncedChange = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        const inst = editorRef.current;
        if (!inst || inst.isDestroyed || !isDirtyRef.current) {
            return;
        }
        isDirtyRef.current = false;
        const rawMarkdown = inst.storage.markdown?.getMarkdown() ?? "";
        const storableMarkdown = richToStorage(rawMarkdown);
        pendingValueRef.current = storableMarkdown;
        onChange(storableMarkdown);
        setIsSaving(false);

        // Compute words and characters off the typing hot path
        const text = inst.getText().trim();
        setStats({
            words: text ? text.split(/\s+/).length : 0,
            characters: text.length,
        });

        updateHeadingsList(inst);
    }, [onChange, updateHeadingsList]);

    // Cleanup and flush on unmount
    useEffect(() => {
        return () => {
            flushDebouncedChange();
        };
    }, [flushDebouncedChange]);

    const toggleMode = (newMode: "rich" | "markdown") => {
        flushDebouncedChange();
        setEditorMode(newMode);
        try {
            localStorage.setItem("algocraft_editor_mode", newMode);
        } catch {
            // Ignore
        }
    };

    // Close outline dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (outlineRef.current && !outlineRef.current.contains(e.target as Node)) {
                setIsOutlineOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            Placeholder.configure({
                placeholder: placeholder || "Start writing...",
                emptyEditorClass: "is-editor-empty",
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    class: "text-cyan-400 underline hover:text-cyan-300 transition-colors",
                },
            }),
            Markdown.configure({
                html: true,
                tightLists: true,
                bulletListMarker: "-",
            }),
        ],
        content: legacyToRich(value || ""),
        onCreate: ({ editor: inst }) => {
            editorRef.current = inst;
            updateHeadingsList(inst);
            const text = inst.getText().trim();
            setStats({
                words: text ? text.split(/\s+/).length : 0,
                characters: text.length,
            });
        },
        onUpdate: ({ editor: inst }) => {
            editorRef.current = inst;
            isDirtyRef.current = true;
            setIsSaving(true);

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                flushDebouncedChange();
            }, 350);
        },
        editorProps: {
            attributes: {
                class: "tiptap ProseMirror focus:outline-none min-h-[300px] w-full text-slate-200 text-sm leading-relaxed p-4",
            },
            transformPastedHTML: (html: string) => {
                return html
                    .replace(/<!--[\s\S]*?-->/gi, "")
                    .replace(/<style[\s\S]*?<\/style>/gi, "")
                    .replace(/<xml[\s\S]*?<\/xml>/gi, "")
                    .replace(/class=["']?Mso\w*["']?/gi, "")
                    .replace(/style=["'][^"']*mso-[^"']*["']/gi, "");
            },
            handleDOMEvents: {
                blur: () => {
                    flushDebouncedChange();
                    return false;
                },
            },
        },
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    // Synchronize external value changes without infinite loop or losing cursor
    useEffect(() => {
        if (!editor || editor.isDestroyed) return;
        // Skip if user is actively editing or value matches what we already sent
        if (value !== undefined && (value === pendingValueRef.current || isDirtyRef.current)) {
            return;
        }
        const rawMarkdown = editor.storage.markdown?.getMarkdown() ?? "";
        const currentStorable = richToStorage(rawMarkdown);
        if (value !== undefined && value !== currentStorable) {
            pendingValueRef.current = value;
            editor.commands.setContent(legacyToRich(value || ""), { emitUpdate: false });
            queueMicrotask(() => {
                if (!editor.isDestroyed) {
                    updateHeadingsList(editor);
                }
            });
        }
    }, [value, editor, updateHeadingsList]);

    const scrollToHeading = (pos: number) => {
        if (!editor) return;
        editor.commands.focus(pos);
        const domNode = editor.view.nodeDOM(pos);
        if (domNode instanceof HTMLElement) {
            domNode.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (domNode && domNode.parentElement) {
            domNode.parentElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setIsOutlineOpen(false);
    };

    // If fallback Markdown mode is chosen by user
    if (editorMode === "markdown") {
        return (
            <div className={`relative flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-50" : ""} ${className}`}>
                {/* Fallback Mode Indicator Banner */}
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#10141e] border-b border-[#1e293b] select-none text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-zinc-300 font-mono text-[11px]">
                            Markdown Mode Fallback
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => toggleMode("rich")}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Switch to Rich Text Editor (Word-Style)</span>
                    </button>
                </div>

                <IdeMarkdownEditor
                    label={label}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    lineCountBadge={lineCountBadge}
                    onSave={onSave}
                    isSaved={isSaved}
                    onOpenSettings={onOpenSettings}
                    sections={sections}
                    activeSectionId={activeSectionId}
                    onSelectSection={onSelectSection}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                />
            </div>
        );
    }

    return (
        <div
            className={`font-sans transition-all ${
                isFullscreen
                    ? "fixed inset-0 z-[100] w-screen h-screen w-[100vw] h-[100vh] bg-[var(--background,#0B0F17)] flex flex-col overflow-hidden m-0 p-0 rounded-none border-0 shadow-none text-[var(--foreground,#f1f5f9)]"
                    : `relative flex flex-col bg-[var(--card,#0d1117)] border border-[var(--border-subtle,#21262d)] text-[var(--foreground,#f1f5f9)] rounded-xl overflow-hidden shadow-xl ${className}`
            }`}
        >
            {/* Header bar */}
            <div className={`flex items-center justify-between border-b border-[var(--border-subtle,#21262d)] text-[var(--foreground,#f1f5f9)] select-none transition-all ${
                isFullscreen ? "px-6 py-2.5 bg-[var(--surface,#161b22)] shadow-md" : "px-4 py-2 bg-[var(--surface,#161b22)]"
            }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase truncate">
                            {label}
                        </span>
                    </div>

                    {lineCountBadge !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono hidden sm:inline">
                            {lineCountBadge} lines
                        </span>
                    )}

                    {/* Document Outline Dropdown */}
                    {headings.length > 0 && (
                        <div className="relative" ref={outlineRef}>
                            <button
                                type="button"
                                onClick={() => setIsOutlineOpen((prev) => !prev)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1f242d] hover:bg-[#282e3a] border border-[#2d3748] text-slate-300 hover:text-white text-xs transition"
                                title="Jump to document section"
                            >
                                <ListTree className="w-3 h-3 text-cyan-400" />
                                <span className="hidden sm:inline">Outline</span>
                                <span className="text-[10px] opacity-70">({headings.length})</span>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            </button>

                            {isOutlineOpen && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-[#161b24] border border-[#2d3748] rounded-lg shadow-2xl py-1 z-40 max-h-60 overflow-y-auto">
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#262c36]">
                                        Document Headings
                                    </div>
                                    {headings.map((h, i) => (
                                        <button
                                            key={`${h.pos}-${i}`}
                                            type="button"
                                            onClick={() => scrollToHeading(h.pos)}
                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition"
                                            style={{ paddingLeft: `${(h.level - 1) * 12 + 12}px` }}
                                        >
                                            <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
                                                H{h.level}
                                            </span>
                                            <span className="truncate">{h.text || "Untitled"}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                    {/* Mode Toggle Switch */}
                    <button
                        type="button"
                        onClick={() => toggleMode("markdown")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a202c] hover:bg-slate-800 border border-[#2d3748] text-slate-300 hover:text-white transition text-xs"
                        title="Switch to raw Markdown Editor mode"
                    >
                        <Code2 className="w-3 h-3 text-slate-400" />
                        <span className="hidden md:inline">Markdown Mode</span>
                    </button>

                    {onSave && (
                        <button
                            type="button"
                            onClick={() => {
                                flushDebouncedChange();
                                onSave();
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                isSaved
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : "bg-blue-600 hover:bg-blue-500 text-white"
                            }`}
                        >
                            {isSaved ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    <span>Saved</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3 h-3" />
                                    <span>Save</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isFullscreen
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700"
                        }`}
                        title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5" />
                                <span>Exit Fullscreen</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Fullscreen</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Sections tab bar if sections are provided */}
            {sections && sections.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--card,#0e131a)] border-b border-[var(--border-subtle,#21262d)] overflow-x-auto text-xs scrollbar-thin">
                    {sections.map((section) => {
                        const isActive = section.id === activeSectionId;
                        return (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => {
                                    flushDebouncedChange();
                                    onSelectSection?.(section.id);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
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

            {/* Word-Style Formatting Toolbar */}
            <RichTextToolbar editor={editor} />

            {/* Editor body with Slash Menu & Floating Selection Toolbar */}
            <div className={`relative flex-1 overflow-y-auto bg-[var(--background,#0d1117)] text-[var(--foreground,#f1f5f9)] tiptap-container ${isFullscreen ? "px-4 sm:px-12 py-8" : ""}`}>
                <div className={isFullscreen ? "max-w-4xl mx-auto w-full min-h-full" : "w-full min-h-full"}>
                    <RichTextSlashMenu editor={editor} />
                    <RichTextFloatingToolbar editor={editor} />
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Footer Status Bar: Word Count & Save Indicator */}
            <div className="flex items-center justify-between px-4 py-1 bg-[var(--surface,#161b22)] border-t border-[var(--border-subtle,#21262d)] text-[11px] text-slate-400 select-none">
                <div className="flex items-center gap-3">
                    <span>{stats.words} {stats.words === 1 ? "word" : "words"}</span>
                    <span className="opacity-40">•</span>
                    <span>{stats.characters} chars</span>
                </div>

                <div className="flex items-center gap-2">
                    {isSaving ? (
                        <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Saving...
                        </span>
                    ) : isSaved ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                            <Check className="w-3 h-3" />
                            Saved
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                            Type / for commands
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
