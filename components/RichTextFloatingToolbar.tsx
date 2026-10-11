"use client";

import React, { useState, useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
    Bold, Italic, Highlighter, Link as LinkIcon,
    Unlink, Check, X, ExternalLink
} from "lucide-react";

const SWATCHES = [
    { color: "#f43f5e", bgClass: "bg-rose-500", name: "Rose" },
    { color: "#10b981", bgClass: "bg-emerald-500", name: "Emerald" },
    { color: "#06b6d4", bgClass: "bg-cyan-500", name: "Sky" },
    { color: "#f59e0b", bgClass: "bg-amber-500", name: "Amber" },
    { color: "#a855f7", bgClass: "bg-purple-500", name: "Purple" },
];

export default function RichTextFloatingToolbar({ editor }: { editor: Editor | null }) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const { selection } = editor.state;
            if (selection.empty || !editor.isFocused) {
                if (!linkPopoverOpen) {
                    setIsVisible(false);
                }
                return;
            }

            const { from, to } = selection;
            const start = editor.view.coordsAtPos(from);
            const end = editor.view.coordsAtPos(to);

            const editorEl = editor.view.dom.closest(".tiptap-container") || editor.view.dom;
            const rect = editorEl.getBoundingClientRect();

            const left = Math.max(10, (start.left + end.left) / 2 - rect.left - 120);
            const top = Math.max(10, start.top - rect.top - 46);

            setPosition({ top, left });
            setIsVisible(true);
        };

        editor.on("selectionUpdate", handleSelectionUpdate);
        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate);
        };
    }, [editor, linkPopoverOpen]);

    if (!editor || !isVisible) return null;

    const isLinkActive = editor.isActive("link");

    const handleApplyLink = () => {
        if (!linkUrl.trim()) {
            editor.chain().focus().unsetLink().run();
        } else {
            const validUrl = /^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
            editor.chain().focus().setLink({ href: validUrl }).run();
        }
        setLinkPopoverOpen(false);
        setLinkUrl("");
    };

    return (
        <div
            ref={menuRef}
            className="absolute z-40 flex items-center gap-1 p-1 bg-[var(--surface,#161b24)] border border-[var(--border-subtle,#2d3748)] rounded-xl shadow-2xl text-xs select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            {/* Bold */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition ${
                    editor.isActive("bold")
                        ? "bg-cyan-500/20 text-cyan-300 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
                title="Bold"
            >
                <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition ${
                    editor.isActive("italic")
                        ? "bg-cyan-500/20 text-cyan-300 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
                title="Italic"
            >
                <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Highlight Swatches */}
            <div className="flex items-center gap-1 px-1 border-x border-[var(--border-subtle,#262c36)]">
                {SWATCHES.map((s) => (
                    <button
                        key={s.name}
                        type="button"
                        onClick={() => editor.chain().focus().toggleHighlight({ color: s.color }).run()}
                        title={`Highlight ${s.name}`}
                        className={`w-3.5 h-3.5 rounded-full ${s.bgClass} transition-transform hover:scale-125 ${
                            editor.isActive("highlight", { color: s.color }) ? "ring-2 ring-white" : ""
                        }`}
                    />
                ))}
            </div>

            {/* Link Popover Button */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => {
                        const previousUrl = editor.getAttributes("link").href || "";
                        setLinkUrl(previousUrl);
                        setLinkPopoverOpen((prev) => !prev);
                    }}
                    className={`p-1.5 rounded transition ${
                        isLinkActive
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                    title={isLinkActive ? "Edit Link" : "Add Link"}
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                </button>

                {linkPopoverOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-60 bg-[var(--card,#161b24)] border border-[var(--border-subtle,#2d3748)] rounded-xl shadow-2xl p-2 z-50 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                placeholder="Paste URL..."
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleApplyLink();
                                    if (e.key === "Escape") setLinkPopoverOpen(false);
                                }}
                                autoFocus
                                className="flex-1 bg-[var(--background,#0d1117)] border border-[var(--border-subtle,#2d3748)] rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                            <button
                                type="button"
                                onClick={handleApplyLink}
                                className="p-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white"
                                title="Apply URL"
                            >
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {isLinkActive && (
                            <button
                                type="button"
                                onClick={() => {
                                    editor.chain().focus().unsetLink().run();
                                    setLinkPopoverOpen(false);
                                    setLinkUrl("");
                                }}
                                className="w-full flex items-center justify-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded py-0.5 transition"
                            >
                                <Unlink className="w-3 h-3" />
                                <span>Remove Link</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
