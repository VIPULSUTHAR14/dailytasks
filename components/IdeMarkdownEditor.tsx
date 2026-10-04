"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback, ReactNode } from "react";
import {
    Copy, Check, Edit3, Eye, Split, FileText, Link as LinkIcon,
    Image as ImageIcon, PlayCircle, ExternalLink, Maximize2, Minimize2,
    ArrowUp, ArrowDown, Save, Settings, Sliders, ChevronDown, CheckCircle2,
    Layers, X, Sparkles
} from "lucide-react";

export interface EditorSection {
    id: string;
    label: string;
    count?: number | string;
    icon?: ReactNode;
    type?: string;
}

export interface IdeMarkdownEditorProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    lineCountBadge?: number;
    // Fullscreen additions
    onSave?: () => void;
    isSaved?: boolean;
    onOpenSettings?: () => void;
    sections?: EditorSection[];
    activeSectionId?: string;
    onSelectSection?: (id: string) => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: (fullscreen: boolean) => void;
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
    onSave,
    isSaved,
    onOpenSettings,
    sections,
    activeSectionId,
    onSelectSection,
    isFullscreen: externalIsFullscreen,
    onToggleFullscreen,
}: IdeMarkdownEditorProps) {
    const [mode, setMode] = useState<"edit" | "split" | "preview">("edit");
    const [copied, setCopied] = useState(false);
    const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);
    const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen;

    const [isSectionsOpen, setIsSectionsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [localSaved, setLocalSaved] = useState(false);

    // Editor settings with local persistence
    const [fontSize, setFontSize] = useState<"xs" | "sm" | "base">(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("ide_editor_fontsize");
            if (saved === "xs" || saved === "sm" || saved === "base") return saved;
        }
        return "xs";
    });
    const [wordWrap, setWordWrap] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("ide_editor_wordwrap") !== "false";
        }
        return true;
    });
    const [showLineNumbers, setShowLineNumbers] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("ide_editor_linenumbers") !== "false";
        }
        return true;
    });
    const [syncScroll, setSyncScroll] = useState<boolean>(true);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const editorGutterRef = useRef<HTMLDivElement>(null);
    const previewGutterRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasBodyRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const sectionsDropdownRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(48);
    const isScrollingRef = useRef<"editor" | "preview" | null>(null);

    // Set fullscreen with callback support
    const setFullscreen = useCallback((val: boolean) => {
        if (onToggleFullscreen) {
            onToggleFullscreen(val);
        } else {
            setInternalIsFullscreen(val);
        }
    }, [onToggleFullscreen]);

    // Save handler with feedback
    const handleSaveClick = useCallback(() => {
        if (onSave) {
            onSave();
        }
        setLocalSaved(true);
        setTimeout(() => setLocalSaved(false), 2000);
    }, [onSave]);

    const isSaveActive = isSaved !== undefined ? isSaved : localSaved;

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

    // Parse document headings for jump outline
    const documentHeadings = useMemo(() => {
        if (!value) return [];
        const results: { lineIndex: number; level: number; text: string }[] = [];
        const valLines = value.split("\n");
        valLines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("### ")) {
                results.push({ lineIndex: index, level: 3, text: trimmed.substring(4).trim() });
            } else if (trimmed.startsWith("## ")) {
                results.push({ lineIndex: index, level: 2, text: trimmed.substring(3).trim() });
            } else if (trimmed.startsWith("# ")) {
                results.push({ lineIndex: index, level: 1, text: trimmed.substring(2).trim() });
            }
        });
        return results;
    }, [value]);

    const activeSectionObj = useMemo(() => {
        if (!sections || sections.length === 0) return null;
        if (activeSectionId) {
            return sections.find(s => s.id === activeSectionId) || null;
        }
        return sections.find(s => s.label === label) || null;
    }, [sections, activeSectionId, label]);

    // Close sections dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sectionsDropdownRef.current && !sectionsDropdownRef.current.contains(e.target as Node)) {
                setIsSectionsOpen(false);
            }
        };
        if (isSectionsOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isSectionsOpen]);

    // Ctrl+S / Cmd+S save keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                handleSaveClick();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSaveClick]);

    // Auto-adjust textarea height to content so outer container scrolls and toolbar sticks smoothly (when not fullscreen)
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        if (isFullscreen) {
            textarea.style.height = "100%";
            return;
        }

        // Preserve scroll position of any scrolling ancestor and window
        let scrollParent: HTMLElement | null = null;
        let prevScrollTop = 0;
        let prevWindowScrollY = 0;

        if (typeof window !== "undefined") {
            let curr = textarea.parentElement;
            while (curr) {
                const overflowY = window.getComputedStyle(curr).overflowY;
                if (overflowY === "auto" || overflowY === "scroll") {
                    scrollParent = curr;
                    break;
                }
                curr = curr.parentElement;
            }
            prevScrollTop = scrollParent ? scrollParent.scrollTop : 0;
            prevWindowScrollY = window.scrollY;
        }

        textarea.style.height = "auto";
        const minHeight = typeof window !== "undefined" && window.innerWidth < 640 ? 360 : 540;
        const newHeight = Math.max(textarea.scrollHeight, minHeight);
        textarea.style.height = `${newHeight}px`;

        if (scrollParent) {
            scrollParent.scrollTop = prevScrollTop;
        } else if (typeof window !== "undefined") {
            window.scrollTo({ top: prevWindowScrollY });
        }
    }, [isFullscreen]);

    useEffect(() => {
        adjustTextareaHeight();
        window.addEventListener("resize", adjustTextareaHeight);
        return () => window.removeEventListener("resize", adjustTextareaHeight);
    }, [value, mode, isFullscreen, adjustTextareaHeight]);

    // Fullscreen escape key & body scroll lock
    useEffect(() => {
        if (!isFullscreen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isSettingsOpen) {
                    setIsSettingsOpen(false);
                    e.stopPropagation();
                    return;
                }
                if (isSectionsOpen) {
                    setIsSectionsOpen(false);
                    e.stopPropagation();
                    return;
                }
                setFullscreen(false);
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isFullscreen) {
                setFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [isFullscreen, isSettingsOpen, isSectionsOpen, setFullscreen]);

    const toggleFullscreen = () => {
        const next = !isFullscreen;
        setFullscreen(next);
        if (next) {
            if (typeof document !== "undefined" && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => { });
            }
        } else {
            if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            }
        }
    };

    // Synchronized scrolling in split mode & gutter sync
    const handleEditorScroll = () => {
        if (editorGutterRef.current && textareaRef.current) {
            editorGutterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
        if (mode !== "split" || !syncScroll || isScrollingRef.current === "preview") return;
        isScrollingRef.current = "editor";
        if (textareaRef.current && previewRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
            const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
            previewRef.current.scrollTop = scrollRatio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
            if (previewGutterRef.current) {
                previewGutterRef.current.scrollTop = previewRef.current.scrollTop;
            }
        }
        setTimeout(() => {
            isScrollingRef.current = null;
        }, 40);
    };

    const handlePreviewScroll = () => {
        if (previewGutterRef.current && previewRef.current) {
            previewGutterRef.current.scrollTop = previewRef.current.scrollTop;
        }
        if (mode !== "split" || !syncScroll || isScrollingRef.current === "editor") return;
        isScrollingRef.current = "preview";
        if (textareaRef.current && previewRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
            const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
            textareaRef.current.scrollTop = scrollRatio * (textareaRef.current.scrollHeight - textareaRef.current.clientHeight);
            if (editorGutterRef.current) {
                editorGutterRef.current.scrollTop = textareaRef.current.scrollTop;
            }
        }
        setTimeout(() => {
            isScrollingRef.current = null;
        }, 40);
    };

    // Universal smooth scroll helper that works on textarea, div, and window
    const smoothScrollElement = (element: HTMLElement | null, targetTop: number) => {
        if (!element) return;
        const el = element;
        const startTop = el.scrollTop;
        const distance = targetTop - startTop;
        if (Math.abs(distance) < 2) {
            el.scrollTop = targetTop;
            return;
        }

        try {
            el.scrollTo({ top: targetTop, behavior: "smooth" });
        } catch (e) { }

        const duration = 220;
        const startTime = performance.now();

        function step(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            el.scrollTop = startTop + distance * ease;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.scrollTop = targetTop;
            }
        }
        requestAnimationFrame(step);
    };

    const scrollToTop = () => {
        // 1. Textarea
        if (textareaRef.current) {
            smoothScrollElement(textareaRef.current, 0);
            try {
                textareaRef.current.setSelectionRange(0, 0);
            } catch (e) { }
        }
        // 2. Preview
        if (previewRef.current) {
            smoothScrollElement(previewRef.current, 0);
        }
        // 3. Gutters
        if (editorGutterRef.current) {
            smoothScrollElement(editorGutterRef.current, 0);
        }
        if (previewGutterRef.current) {
            smoothScrollElement(previewGutterRef.current, 0);
        }
        // 4. Editor container & canvas
        if (containerRef.current) {
            smoothScrollElement(containerRef.current, 0);
        }
        if (canvasBodyRef.current) {
            smoothScrollElement(canvasBodyRef.current, 0);
        }
        // 5. Outer scrolling ancestor
        const refEl = textareaRef.current || previewRef.current || containerRef.current;
        if (refEl) {
            let parent = refEl.parentElement;
            while (parent) {
                const style = window.getComputedStyle(parent);
                if (style.overflowY === "auto" || style.overflowY === "scroll") {
                    smoothScrollElement(parent, 0);
                    break;
                }
                parent = parent.parentElement;
            }
        }
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const scrollToBottom = () => {
        // 1. Textarea
        if (textareaRef.current) {
            const maxScroll = textareaRef.current.scrollHeight - textareaRef.current.clientHeight;
            smoothScrollElement(textareaRef.current, Math.max(0, maxScroll));
            try {
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
            } catch (e) { }
        }
        // 2. Preview
        if (previewRef.current) {
            const maxScroll = previewRef.current.scrollHeight - previewRef.current.clientHeight;
            smoothScrollElement(previewRef.current, Math.max(0, maxScroll));
        }
        // 3. Gutters
        if (editorGutterRef.current) {
            const maxScroll = editorGutterRef.current.scrollHeight - editorGutterRef.current.clientHeight;
            smoothScrollElement(editorGutterRef.current, Math.max(0, maxScroll));
        }
        if (previewGutterRef.current) {
            const maxScroll = previewGutterRef.current.scrollHeight - previewGutterRef.current.clientHeight;
            smoothScrollElement(previewGutterRef.current, Math.max(0, maxScroll));
        }
        // 4. Editor container & canvas
        if (containerRef.current) {
            const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
            if (maxScroll > 0) smoothScrollElement(containerRef.current, maxScroll);
        }
        if (canvasBodyRef.current) {
            const maxScroll = canvasBodyRef.current.scrollHeight - canvasBodyRef.current.clientHeight;
            if (maxScroll > 0) smoothScrollElement(canvasBodyRef.current, maxScroll);
        }
        // 5. Outer scrolling ancestor
        const refEl = textareaRef.current || previewRef.current || containerRef.current;
        if (refEl) {
            let parent = refEl.parentElement;
            while (parent) {
                const style = window.getComputedStyle(parent);
                if (style.overflowY === "auto" || style.overflowY === "scroll") {
                    const maxScroll = parent.scrollHeight - parent.clientHeight;
                    smoothScrollElement(parent, Math.max(0, maxScroll));
                    break;
                }
                parent = parent.parentElement;
            }
        }
        if (typeof window !== "undefined") {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }
    };

    const scrollToLine = (lineIndex: number) => {
        const lineHeight = fontSize === "xs" ? 24 : fontSize === "sm" ? 24 : 28;
        const targetScrollTop = Math.max(0, lineIndex * lineHeight - 24);
        if (textareaRef.current) {
            smoothScrollElement(textareaRef.current, targetScrollTop);
        }
        if (previewRef.current) {
            smoothScrollElement(previewRef.current, targetScrollTop);
        }
        if (editorGutterRef.current) {
            smoothScrollElement(editorGutterRef.current, targetScrollTop);
        }
        if (previewGutterRef.current) {
            smoothScrollElement(previewGutterRef.current, targetScrollTop);
        }
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

        // Capture scroll positions before any DOM modifications
        let scrollParent: HTMLElement | null = null;
        let prevScrollTop = 0;
        let prevWindowScrollY = 0;
        const prevTextareaScrollTop = textarea.scrollTop;

        if (typeof window !== "undefined") {
            let curr = textarea.parentElement;
            while (curr) {
                const overflowY = window.getComputedStyle(curr).overflowY;
                if (overflowY === "auto" || overflowY === "scroll") {
                    scrollParent = curr;
                    break;
                }
                curr = curr.parentElement;
            }
            prevScrollTop = scrollParent ? scrollParent.scrollTop : 0;
            prevWindowScrollY = window.scrollY;
        }

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

        const newCursor = start + replacement.length;

        const restoreFocusAndScroll = () => {
            const ta = textareaRef.current;
            if (!ta) return;
            ta.focus({ preventScroll: true });
            try {
                ta.setSelectionRange(newCursor, newCursor);
            } catch (e) { }
            adjustTextareaHeight();

            if (scrollParent) {
                scrollParent.scrollTop = prevScrollTop;
            } else if (typeof window !== "undefined") {
                window.scrollTo({ top: prevWindowScrollY });
            }
            ta.scrollTop = prevTextareaScrollTop;
        };

        requestAnimationFrame(restoreFocusAndScroll);
        setTimeout(restoreFocusAndScroll, 20);
    };

    const fontSizeClass = fontSize === "xs" ? "text-xs leading-6" : fontSize === "sm" ? "text-sm leading-6" : "text-base leading-7";
    const wrapClass = wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto";

    return (
        <div
            ref={containerRef}
            className={`font-mono text-xs transition-all ${isFullscreen
                ? "fixed inset-0 z-[100] w-screen h-screen w-[100vw] h-[100vh] bg-[#0B0F17] flex flex-col overflow-hidden m-0 p-0 rounded-none border-0 shadow-none"
                : "bg-[#10141E] border border-[#1E293B] rounded-xl overflow-visible shadow-2xl flex flex-col relative max-w-full"
                }`}
        >
            {/* Top Toolbar - Sticky with scroll and responsive design */}
            <div
                ref={toolbarRef}
                className={`sticky top-0 z-30 flex flex-col gap-2 bg-[#0B0F17]/98 backdrop-blur-md border-b border-[#1E293B] select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all ${isFullscreen
                    ? "px-4 py-2.5 sm:px-8 sm:py-3 rounded-none"
                    : "px-3 py-2 sm:px-4 sm:py-2.5 rounded-t-xl"
                    }`}
            >
                {/* Upper row: Sections Dropdown, Stats, Save, Settings, Copy, and Mode Switchers */}
                <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Sections Dropdown List (always prominent in fullscreen or when sections are provided) */}
                        {(isFullscreen || (sections && sections.length > 0)) ? (
                            <div className="relative" ref={sectionsDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsSectionsOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] border border-[#1E293B] hover:border-cyan-500/40 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
                                    title="Click to view and switch sections or document headings"
                                >
                                    <Layers size={13} className="text-cyan-400 shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-[200px] text-zinc-100">
                                        {activeSectionObj?.label || label}
                                    </span>
                                    <ChevronDown size={12} className={`text-zinc-400 transition-transform duration-150 ${isSectionsOpen ? "rotate-180 text-cyan-300" : ""}`} />
                                </button>

                                {isSectionsOpen && (
                                    <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-84 max-h-[420px] overflow-y-auto bg-[#0E131E]/98 backdrop-blur-xl border border-[#1E293B] rounded-xl shadow-2xl z-50 p-2 font-mono text-xs divide-y divide-[#1E293B]/70">
                                        {/* Topic Sections */}
                                        {sections && sections.length > 0 && (
                                            <div className="pb-2 space-y-1">
                                                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                                    <span>Sections ({sections.length})</span>
                                                    <span className="text-cyan-400 font-semibold text-[9px] bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                                        Switch
                                                    </span>
                                                </div>
                                                {sections.map((sec, i) => {
                                                    const isActive = activeSectionId ? sec.id === activeSectionId : sec.label === label;
                                                    return (
                                                        <button
                                                            key={sec.id}
                                                            type="button"
                                                            onClick={() => {
                                                                if (onSelectSection) onSelectSection(sec.id);
                                                                setIsSectionsOpen(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                                                isActive
                                                                    ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30"
                                                                    : "text-zinc-300 hover:bg-[#181F2E] hover:text-white"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] shrink-0 ${
                                                                    isActive ? "bg-cyan-400 text-zinc-950 font-bold" : "bg-[#1E293B] text-zinc-400"
                                                                }`}>
                                                                    {String(i + 1).padStart(2, "0")}
                                                                </span>
                                                                <span className="truncate">{sec.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {sec.count && (
                                                                    <span className="text-[10px] font-mono text-zinc-500 bg-[#141923] px-1.5 py-0.5 rounded border border-[#1E293B]">
                                                                        {sec.count}
                                                                    </span>
                                                                )}
                                                                {isActive && <Check size={13} className="text-cyan-400" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Document Headings / Outline */}
                                        {documentHeadings.length > 0 && (
                                            <div className={`space-y-1 ${sections && sections.length > 0 ? "pt-2" : ""}`}>
                                                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                                    <span>Document Headings ({documentHeadings.length})</span>
                                                    <span className="text-zinc-500 text-[9px]">Jump</span>
                                                </div>
                                                {documentHeadings.map((h, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            scrollToLine(h.lineIndex);
                                                            setIsSectionsOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-zinc-400 hover:text-cyan-300 hover:bg-[#181F2E] transition-colors cursor-pointer"
                                                        style={{ paddingLeft: `${(h.level - 1) * 12 + 10}px` }}
                                                    >
                                                        <span className="font-mono text-[9px] text-zinc-500 uppercase px-1 py-0.2 rounded bg-[#141923] border border-[#1E293B] shrink-0">
                                                            H{h.level}
                                                        </span>
                                                        <span className="truncate">{h.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <FileText size={14} className="text-cyan-400 shrink-0" />
                                <span className="text-white font-semibold truncate text-xs">{label}</span>
                            </div>
                        )}

                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider shrink-0 hidden sm:inline">
                            MD
                        </span>

                        {isFullscreen && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline shrink-0">
                                Fullscreen • Press ESC to exit
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className="text-zinc-500 text-[11px] font-mono hidden lg:inline">
                            {stats.lineCount} lines • {stats.words} words • {stats.readTime} min read
                        </span>

                        {/* Save Changes Button (Prominent in Fullscreen or when onSave provided) */}
                        {(isFullscreen || onSave) && (
                            <button
                                type="button"
                                onClick={handleSaveClick}
                                className={`flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                                    isSaveActive
                                        ? "bg-emerald-400 text-zinc-950 shadow-emerald-500/25 ring-2 ring-emerald-300"
                                        : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 active:scale-95"
                                }`}
                                title="Save Changes (Ctrl+S)"
                            >
                                {isSaveActive ? <CheckCircle2 size={13} className="shrink-0" /> : <Save size={13} className="shrink-0" />}
                                <span>{isSaveActive ? "Saved!" : "Save Changes"}</span>
                            </button>
                        )}

                        {/* Settings Button (In Fullscreen or always available) */}
                        {(isFullscreen || onOpenSettings) && (
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg bg-[#141923] hover:bg-[#1E293B] border border-[#1E293B] hover:border-cyan-500/30 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                                title="Editor & Note Settings"
                            >
                                <Settings size={13} className="text-zinc-400 hover:text-cyan-300 shrink-0" />
                                <span className="hidden sm:inline">Settings</span>
                            </button>
                        )}

                        {/* Jump to Top / Bottom Buttons in Toolbar */}
                        <div className="flex items-center bg-[#141923] border border-[#1E293B] rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={scrollToTop}
                                className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-[#1E293B] transition-colors cursor-pointer"
                                title="Scroll to Top"
                            >
                                <ArrowUp size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={scrollToBottom}
                                className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-[#1E293B] transition-colors cursor-pointer"
                                title="Scroll to Bottom"
                            >
                                <ArrowDown size={13} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-[#141923] border border-[#1E293B] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy Markdown"
                        >
                            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>

                        {/* Mode Toggle Pills: Edit / Split / Preview */}
                        <div className="flex items-center bg-[#141923] border border-[#1E293B] rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={() => setMode("edit")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer ${mode === "edit" ? "bg-[#1E293B] text-cyan-300" : "text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Edit3 size={11} />
                                <span>Edit</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("split")}
                                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${mode === "split" ? "bg-[#1E293B] text-cyan-300" : "text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Split size={12} />
                                <span>Split</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("preview")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer ${mode === "preview" ? "bg-[#1E293B] text-cyan-300" : "text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Eye size={11} />
                                <span>Preview</span>
                            </button>
                        </div>

                        {/* Full Screen 100vw x 100vh Toggle */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className={`flex items-center gap-1.5 px-2 py-1 sm:py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${isFullscreen
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                                : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white hover:bg-[#1E293B]"
                                }`}
                            title={isFullscreen ? "Exit Full Screen (Esc)" : "Open in Full Screen (100vw × 100vh)"}
                        >
                            {isFullscreen ? (
                                <>
                                    <Minimize2 size={13} className="text-cyan-300 shrink-0" />
                                    <span className="hidden sm:inline">Exit Full</span>
                                </>
                            ) : (
                                <>
                                    <Maximize2 size={13} className="shrink-0" />
                                    <span className="hidden sm:inline">Full Screen</span>
                                </>
                            )}
                        </button>
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
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => insertSyntax(b.id)}
                                className={`w-6 h-6 shrink-0 rounded flex items-center justify-center text-[11px] text-zinc-400 hover:text-white hover:bg-[#1E293B] transition-colors ${b.className || ""
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
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertSyntax("t-mint")}
                            className="w-3 h-3 rounded-full bg-emerald-400 hover:scale-125 transition-transform shrink-0 cursor-pointer"
                            title="Mint / Optimal"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertSyntax("t-rose")}
                            className="w-3 h-3 rounded-full bg-rose-400 hover:scale-125 transition-transform shrink-0 cursor-pointer"
                            title="Rose / Pitfall"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertSyntax("t-cyan")}
                            className="w-3 h-3 rounded-full bg-cyan-400 hover:scale-125 transition-transform shrink-0 cursor-pointer"
                            title="Cyan / Complexity"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertSyntax("t-amber")}
                            className="w-3 h-3 rounded-full bg-amber-400 hover:scale-125 transition-transform shrink-0 cursor-pointer"
                            title="Amber / Key Term"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertSyntax("t-purple")}
                            className="w-3 h-3 rounded-full bg-purple-400 hover:scale-125 transition-transform shrink-0 cursor-pointer"
                            title="Purple / Tip"
                        />
                    </div>
                </div>
            </div>

            {/* IDE Canvas Body */}
            <div
                ref={canvasBodyRef}
                className={`flex-1 flex overflow-visible bg-[#0B0F17] ${isFullscreen
                    ? "min-h-0 h-full w-full rounded-none p-0 m-0 overflow-hidden"
                    : "min-h-[360px] sm:min-h-[540px] rounded-b-xl"
                    }`}
            >
                {/* Mode: EDIT */}
                {mode === "edit" && (
                    <div className={`flex-1 min-h-0 flex w-full ${isFullscreen ? "h-full overflow-hidden" : "min-h-[360px] sm:min-h-[540px]"}`}>
                        {/* Line Numbers Gutter */}
                        {showLineNumbers && (
                            <div
                                ref={editorGutterRef}
                                className={`w-9 sm:w-12 bg-[#0B0F17] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono ${fontSizeClass} ${isFullscreen ? "overflow-hidden" : ""
                                    }`}
                            >
                                {lines.map((_, i) => (
                                    <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                                ))}
                            </div>
                        )}

                        {/* Raw Textarea with matching line-height */}
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onScroll={handleEditorScroll}
                            onChange={(e) => {
                                onChange(e.target.value);
                                if (!isFullscreen) adjustTextareaHeight();
                            }}
                            placeholder={placeholder}
                            className={`flex-1 bg-[#0B0F17] text-zinc-200 p-2.5 sm:p-4 font-mono ${fontSizeClass} ${wrapClass} focus:outline-none resize-none ${isFullscreen ? "h-full overflow-y-auto" : "overflow-hidden"
                                }`}
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Mode: PREVIEW */}
                {mode === "preview" && (
                    <div className={`flex-1 min-h-0 flex w-full ${isFullscreen ? "h-full overflow-hidden" : "min-h-[360px] sm:min-h-[540px]"}`}>
                        {/* Gutter */}
                        {showLineNumbers && (
                            <div
                                ref={previewGutterRef}
                                className={`w-9 sm:w-12 bg-[#0B0F17] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono ${fontSizeClass} ${isFullscreen ? "overflow-hidden" : ""
                                    }`}
                            >
                                {lines.map((_, i) => (
                                    <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                                ))}
                            </div>
                        )}

                        {/* Formatted Lines */}
                        <div
                            ref={previewRef}
                            onScroll={handlePreviewScroll}
                            className={`flex-1 p-2.5 sm:p-4 font-mono ${fontSizeClass} ${wrapClass} text-zinc-200 select-text overflow-x-auto ${isFullscreen ? "h-full overflow-y-auto" : ""
                                }`}
                        >
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
                    <div className={`flex-1 min-h-0 w-full flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B] ${isFullscreen ? "h-full" : "min-h-[560px]"
                        }`}>
                        {/* Left: Editor */}
                        <div className="flex-1 min-h-0 flex flex-col min-w-0 bg-[#0B0F17] h-full">
                            <div
                                style={!isFullscreen ? { top: `${toolbarHeight}px` } : undefined}
                                className={`${!isFullscreen ? "sticky" : ""
                                    } z-20 px-3 sm:px-4 py-1.5 bg-[#0F131C]/95 backdrop-blur-sm border-b border-[#1E293B] text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between shadow-sm shrink-0`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span>CODE EDITOR // MARKDOWN</span>
                                </span>
                                <span className="text-zinc-500 text-[9px]">Ln 1 - {lines.length}</span>
                            </div>
                            <div className={`flex-1 min-h-0 flex ${isFullscreen ? "h-full overflow-hidden" : "min-h-[360px] sm:min-h-[540px]"}`}>
                                {showLineNumbers && (
                                    <div
                                        ref={editorGutterRef}
                                        className={`w-9 sm:w-12 bg-[#0B0F17] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono ${fontSizeClass} ${isFullscreen ? "overflow-hidden" : ""
                                            }`}
                                    >
                                        {lines.map((_, i) => (
                                            <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onScroll={handleEditorScroll}
                                    onChange={(e) => {
                                        onChange(e.target.value);
                                        if (!isFullscreen) adjustTextareaHeight();
                                    }}
                                    placeholder={placeholder}
                                    className={`flex-1 bg-[#0B0F17] text-zinc-200 p-2.5 sm:p-4 font-mono ${fontSizeClass} ${wrapClass} focus:outline-none resize-none ${isFullscreen ? "h-full overflow-y-auto" : "overflow-hidden"
                                        }`}
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="flex-1 min-h-0 flex flex-col min-w-0 bg-[#0F131C] h-full">
                            <div
                                style={!isFullscreen ? { top: `${toolbarHeight}px` } : undefined}
                                className={`${!isFullscreen ? "sticky" : ""
                                    } z-20 px-3 sm:px-4 py-1.5 bg-[#0F131C]/95 backdrop-blur-sm border-b border-[#1E293B] text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between shadow-sm shrink-0`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>COMPILED PREVIEW // LIVE</span>
                                </span>
                                <span className="text-emerald-400 font-bold text-[9px]">SYNCHRONIZED</span>
                            </div>
                            <div className={`flex-1 min-h-0 flex ${isFullscreen ? "h-full overflow-hidden" : "min-h-[360px] sm:min-h-[540px]"}`}>
                                {showLineNumbers && (
                                    <div
                                        ref={previewGutterRef}
                                        className={`w-9 sm:w-12 bg-[#0F131C] border-r border-[#1E293B] text-zinc-600 select-none py-3 sm:py-4 text-right pr-1.5 sm:pr-3 shrink-0 font-mono ${fontSizeClass} ${isFullscreen ? "overflow-hidden" : ""
                                            }`}
                                    >
                                        {lines.map((_, i) => (
                                            <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    ref={previewRef}
                                    onScroll={handlePreviewScroll}
                                    className={`flex-1 p-2.5 sm:p-4 font-mono ${fontSizeClass} ${wrapClass} text-zinc-200 select-text overflow-x-auto ${isFullscreen ? "h-full overflow-y-auto" : ""
                                        }`}
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

            {/* Quick Floating Jump Pill (Bottom-Right) */}
            <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-0.5 bg-[#0F131C]/95 backdrop-blur-md border border-[#1E293B] shadow-2xl rounded-xl p-1 select-none pointer-events-auto`}>
                <button
                    type="button"
                    onClick={scrollToTop}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-medium"
                    title="Scroll to Top"
                >
                    <ArrowUp size={12} />
                    <span className="hidden sm:inline">Top</span>
                </button>
                <div className="w-[1px] h-3 bg-[#1E293B]" />
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-medium"
                    title="Scroll to Bottom"
                >
                    <ArrowDown size={12} />
                    <span className="hidden sm:inline">Bottom</span>
                </button>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div
                    className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none"
                    onClick={() => setIsSettingsOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-[#0E131E] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden font-sans text-xs text-zinc-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-[#141923] border-b border-[#1E293B]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <Sliders size={15} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">Editor & Note Settings</h3>
                                    <p className="text-[11px] text-zinc-400 font-mono">Customise visual canvas, layout & editing preferences</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Topic Metadata settings trigger if provided */}
                            {onOpenSettings && (
                                <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-white flex items-center gap-1.5">
                                            <Sparkles size={13} className="text-cyan-400" />
                                            <span>Topic Metadata & Details</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 mt-0.5">
                                            Edit topic title, category, tags, and theme styling.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            onOpenSettings();
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shrink-0 transition-all cursor-pointer"
                                    >
                                        Open Details
                                    </button>
                                </div>
                            )}

                            {/* Font Size */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white flex items-center justify-between">
                                    <span>Canvas Font Size</span>
                                    <span className="font-mono text-[10px] text-zinc-400">
                                        {fontSize === "xs" ? "12px" : fontSize === "sm" ? "14px" : "16px"}
                                    </span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "xs" as const, label: "Compact", sub: "12px" },
                                        { id: "sm" as const, label: "Comfortable", sub: "14px" },
                                        { id: "base" as const, label: "Large", sub: "16px" },
                                    ].map((sz) => (
                                        <button
                                            key={sz.id}
                                            type="button"
                                            onClick={() => {
                                                setFontSize(sz.id);
                                                if (typeof window !== "undefined") localStorage.setItem("ide_editor_fontsize", sz.id);
                                            }}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                                fontSize === sz.id
                                                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold shadow-sm"
                                                    : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white hover:border-[#2E3C51]"
                                            }`}
                                        >
                                            <span>{sz.label}</span>
                                            <span className="text-[10px] font-mono opacity-60">{sz.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Word Wrap */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white">Line Wrapping</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWordWrap(true);
                                            if (typeof window !== "undefined") localStorage.setItem("ide_editor_wordwrap", "true");
                                        }}
                                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                            wordWrap
                                                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold"
                                                : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Soft Wrap (Wrap Lines)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWordWrap(false);
                                            if (typeof window !== "undefined") localStorage.setItem("ide_editor_wordwrap", "false");
                                        }}
                                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                            !wordWrap
                                                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold"
                                                : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        No Wrap (Horizontal Scroll)
                                    </button>
                                </div>
                            </div>

                            {/* Line Numbers */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white">Line Numbers Gutter</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowLineNumbers(true);
                                            if (typeof window !== "undefined") localStorage.setItem("ide_editor_linenumbers", "true");
                                        }}
                                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                            showLineNumbers
                                                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold"
                                                : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Show Numbers (Gutter)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowLineNumbers(false);
                                            if (typeof window !== "undefined") localStorage.setItem("ide_editor_linenumbers", "false");
                                        }}
                                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                            !showLineNumbers
                                                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold"
                                                : "bg-[#141923] border-[#1E293B] text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Hide Numbers (Zen)
                                    </button>
                                </div>
                            </div>

                            {/* Synchronized Scrolling */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141923] border border-[#1E293B]">
                                <div>
                                    <div className="font-semibold text-white">Split Scroll Sync</div>
                                    <p className="text-[11px] text-zinc-400">Scroll editor and compiled preview together in Split mode</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSyncScroll(prev => !prev)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        syncScroll
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                    }`}
                                >
                                    {syncScroll ? "Enabled" : "Disabled"}
                                </button>
                            </div>

                            {/* Keyboard Shortcuts Reference */}
                            <div className="p-3 rounded-xl bg-[#090D14] border border-[#1E293B]/80 font-mono text-[11px] space-y-1.5">
                                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
                                    Shortcuts
                                </span>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Save Changes</span>
                                    <kbd className="px-1.5 py-0.5 rounded bg-[#141923] border border-[#1E293B] text-white">Ctrl + S</kbd>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Exit Full Screen</span>
                                    <kbd className="px-1.5 py-0.5 rounded bg-[#141923] border border-[#1E293B] text-white">Esc</kbd>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3 bg-[#141923] border-t border-[#1E293B] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
