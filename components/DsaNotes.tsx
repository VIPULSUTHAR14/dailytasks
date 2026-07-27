"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    Search, X, Filter, Menu, LogOut,
    BookOpen, Save, Star, StarOff, CheckCircle2, Circle,
    Lightbulb, AlertTriangle, MessageCircle, Clock,
    Zap, Flame, Trophy, Award, Plus, Trash2,
    Brain, Target, FileText, Tag,
    TrendingUp, Code2, Layers, GraduationCap, StickyNote,
    ChevronLeft, ChevronRight, Edit3, Eye, Copy, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ───────────────────────────────────────────────────────────────────

type MasteryState = {
    understandTheory: boolean;
    canExplain: boolean;
    canSolveEasy: boolean;
    canSolveMedium: boolean;
    canSolveHard: boolean;
    canTeachSomeone: boolean;
};

type NoteTopic = {
    id: number;
    name: string;
    level: string;
    notes: string;
    examples: string[];
    tutorQuestions: string[];
    importantPoints: string[];
    commonMistakes: string[];
    interviewTips: string[];
    memoryTricks: string[];
    revisionNotes: string;
    formulas: string[];
    algorithms: string[];
    timeComplexities: string[];
    spaceComplexities: string[];
    patterns: string[];
    keywords: string[];
    practiceProblems: string[];
    relatedTopics: string[];
    doubts: string[];
    resources: string[];
    lastRevised: string;
    revisionCount: number;
    confidence: number;
    mastery: MasteryState;
    favorite: boolean;
    completed: boolean;
};

// ── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Zap;
    gradient: string;
}> = {
    Beginner: {
        label: "Beginner",
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "border-emerald-400/20",
        icon: Zap,
        gradient: "from-emerald-500/20 to-emerald-600/5",
    },
    Intermediate: {
        label: "Intermediate",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "border-amber-400/20",
        icon: Flame,
        gradient: "from-amber-500/20 to-amber-600/5",
    },
    Advanced: {
        label: "Advanced",
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        borderColor: "border-rose-400/20",
        icon: Trophy,
        gradient: "from-rose-500/20 to-rose-600/5",
    },
    Expert: {
        label: "Expert",
        color: "text-violet-400",
        bgColor: "bg-violet-400/10",
        borderColor: "border-violet-400/20",
        icon: Award,
        gradient: "from-violet-500/20 to-violet-600/5",
    },
};

const STORAGE_KEY = "dsa-notes-data";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getMasteryPercent(mastery: MasteryState): number {
    const vals = Object.values(mastery);
    return Math.round((vals.filter(Boolean).length / vals.length) * 100);
}

function getFilledFieldsCount(topic: NoteTopic): number {
    let count = 0;
    if (topic.notes) count++;
    if (topic.revisionNotes) count++;
    const arrayFields: (keyof NoteTopic)[] = [
        "examples", "tutorQuestions", "importantPoints", "commonMistakes",
        "interviewTips", "memoryTricks", "formulas", "algorithms",
        "timeComplexities", "spaceComplexities", "patterns", "keywords",
        "practiceProblems", "doubts", "resources"
    ];
    for (const f of arrayFields) {
        const val = topic[f];
        if (Array.isArray(val) && val.length > 0) count++;
    }
    return count;
}

// ── Paginated Notes Block (Explained & beautiful rendering, 15 lines capacity) ─

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
    const linesPerPage = 15;

    // Split value into lines, preserving empty lines
    const lines = useMemo(() => {
        if (!value) return [];
        return value.split("\n");
    }, [value]);

    const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage));

    // Ensure page range is correct
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text", err);
        }
    };

    return (
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-zinc-900/40 shadow-inner flex flex-col font-sans mb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-200 tracking-wide">{label}</span>
                    {lines.length > 0 && (
                        <span className="text-xs text-zinc-500 font-mono">
                            {lines.length} {lines.length === 1 ? "line" : "lines"}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
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

            {/* Body - holds 15 lines of content */}
            <div className="relative bg-black/[0.15]">
                {isEditing ? (
                    <div className="p-4">
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            rows={15}
                            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all font-mono leading-relaxed resize-y"
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
                            minHeight: "360px",
                            fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        }}
                    >
                        {pageLines.length === 0 ? (
                            <div className="text-zinc-600 italic py-20 text-center font-sans text-xs my-auto">
                                {placeholder}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {pageLines.map((line, idx) => {
                                    const lineNumber = currentPage * linesPerPage + idx + 1;
                                    return (
                                        <div key={idx} className="flex items-start hover:bg-white/[0.02] px-1 py-0.5 rounded transition-colors group">
                                            <span className="w-9 select-none text-right pr-3 text-zinc-600 group-hover:text-zinc-500 font-mono text-xs mt-0.5 border-r border-white/[0.04] mr-3 shrink-0">
                                                {lineNumber}
                                            </span>
                                            <span className="flex-1 whitespace-pre-wrap break-all text-zinc-300 tracking-normal leading-relaxed text-sm font-mono">
                                                {line || " "}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination / Footer (Only shows when not editing and there are multiple pages) */}
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

// ── Editable List Field (always open, no collapsible) ───────────────────────

function EditableListField({
    label,
    icon: Icon,
    items,
    onChange,
    placeholder,
}: {
    label: string;
    icon: typeof Lightbulb;
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
        <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-zinc-900/30 font-sans">
            {/* Label header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-300 tracking-wide">{label}</span>
                {items.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
                        {items.length}
                    </span>
                )}
            </div>

            {/* Items always visible */}
            <div className="px-4 py-3 space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 group">
                        <span className="text-zinc-600 text-xs mt-2.5 font-mono w-5 text-right shrink-0">
                            {index + 1}.
                        </span>
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all font-mono"
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="mt-1.5 p-1 rounded-md text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                {/* Add new item row */}
                <div className="flex items-center gap-2">
                    <span className="w-5 shrink-0" />
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
                        placeholder={placeholder}
                        className="flex-1 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all font-mono"
                    />
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!newItem.trim()}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-30 disabled:hover:text-zinc-500 disabled:hover:bg-transparent transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Topic Detail Panel (80vw overlay, all fields visible) ───────────────────

// ── Topic Detail Panel (80vw overlay, sidebar layout) ───────────────────────

type PanelCategory = "notes" | "theory" | "algorithms" | "code" | "complexities" | "interview" | "support" | "mastery";

function TopicDetailPanel({
    topic,
    onSave,
    onClose,
}: {
    topic: NoteTopic;
    onSave: (updated: NoteTopic) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState<NoteTopic>({ ...topic });
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<PanelCategory>("notes");

    // Reset draft when topic changes
    useEffect(() => {
        setDraft({ ...topic });
    }, [topic]);

    const levelConfig = LEVEL_CONFIG[draft.level] || LEVEL_CONFIG.Beginner;
    const masteryPercent = getMasteryPercent(draft.mastery);

    const handleSave = () => {
        const now = new Date().toISOString();
        const updated = {
            ...draft,
            lastRevised: now,
            revisionCount: draft.revisionCount + 1,
        };
        onSave(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const updateMastery = (key: keyof MasteryState) => {
        setDraft(prev => ({
            ...prev,
            mastery: { ...prev.mastery, [key]: !prev.mastery[key] }
        }));
    };

    const masteryItems: { key: keyof MasteryState; label: string; icon: typeof Brain }[] = [
        { key: "understandTheory", label: "Understand Theory", icon: BookOpen },
        { key: "canExplain", label: "Can Explain to Others", icon: MessageCircle },
        { key: "canSolveEasy", label: "Can Solve Easy Problems", icon: Zap },
        { key: "canSolveMedium", label: "Can Solve Medium Problems", icon: Flame },
        { key: "canSolveHard", label: "Can Solve Hard Problems", icon: Trophy },
        { key: "canTeachSomeone", label: "Can Teach Someone", icon: GraduationCap },
    ];

    // Sidebar navigation configuration
    const sidebarTabs = [
        { id: "notes" as const, label: "Core Notes", icon: FileText, desc: "Key summaries" },
        { id: "theory" as const, label: "Theory & Keywords", icon: Lightbulb, desc: "Key facts & tags" },
        { id: "algorithms" as const, label: "Math & Algorithms", icon: Brain, desc: "Formulas & pseudocode" },
        { id: "code" as const, label: "Code & Patterns", icon: Code2, desc: "Examples & problems" },
        { id: "complexities" as const, label: "Complexity Analysis", icon: Clock, desc: "Time & Space complexity" },
        { id: "interview" as const, label: "Interview Prep", icon: AlertTriangle, desc: "Mistakes & memory tricks" },
        { id: "support" as const, label: "Doubts & Links", icon: MessageCircle, desc: "Resources & questions" },
        { id: "mastery" as const, label: "Mastery & Progress", icon: Target, desc: "Checklists & revision stats" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="relative bg-zinc-950 border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col font-sans"
                style={{ width: "80vw", margin: "24px auto" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sticky Header */}
                <div className={`shrink-0 px-8 pt-6 pb-5 border-b border-white/[0.06] bg-gradient-to-br ${levelConfig.gradient}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${levelConfig.bgColor} ${levelConfig.color} ${levelConfig.borderColor} border`}>
                                    {draft.level}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono">#{draft.id}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-sans">
                                {draft.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-zinc-500 font-sans">
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>Mastery: {masteryPercent}%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                        {draft.lastRevised
                                            ? `Revised ${new Date(draft.lastRevised).toLocaleDateString()}`
                                            : "Not revised yet"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{draft.revisionCount} revisions</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button
                                type="button"
                                onClick={() => setDraft(prev => ({ ...prev, favorite: !prev.favorite }))}
                                className={`p-2 rounded-lg transition-all ${draft.favorite
                                    ? "text-amber-400 bg-amber-400/10"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                                    }`}
                            >
                                {draft.favorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {/* Mastery bar */}
                    <div className="mt-4">
                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${masteryPercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${masteryPercent === 100 ? "bg-emerald-400" :
                                    masteryPercent >= 50 ? "bg-amber-400" : "bg-white/40"
                                    }`}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Body Area: Sidebar Navigation + Right Content Column */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Inner Left Sidebar Menu */}
                    <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto">
                        <div className="p-4 border-b border-white/5">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Topic Sections</div>
                        </div>
                        <nav className="p-2 space-y-1">
                            {sidebarTabs.map(tab => {
                                const TabIcon = tab.icon;
                                const isSelected = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${isSelected
                                            ? "bg-white/[0.05] border border-white/[0.08] text-white"
                                            : "border border-transparent text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200"
                                            }`}
                                    >
                                        <TabIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold">{tab.label}</div>
                                            <div className="text-[9px] text-zinc-500 truncate mt-0.5">{tab.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 bg-zinc-900/10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-6 max-w-4xl"
                            >
                                {activeTab === "notes" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="📝 Notes"
                                            value={draft.notes}
                                            onChange={(val) => setDraft(prev => ({ ...prev, notes: val }))}
                                            placeholder="Paste or type notes here... Lines are formatted nicely and paginated in pages of 15 lines."
                                        />
                                        <PaginatedNotesBlock
                                            label="🔄 Revision Notes"
                                            value={draft.revisionNotes}
                                            onChange={(val) => setDraft(prev => ({ ...prev, revisionNotes: val }))}
                                            placeholder="Paste or type revision summaries here... Paginated in pages of 15 lines."
                                        />
                                    </>
                                )}

                                {activeTab === "theory" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="💡 Important Points"
                                            value={draft.importantPoints.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                importantPoints: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter important concepts/points (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🏷️ Keywords"
                                            value={draft.keywords.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                keywords: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter keywords (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "algorithms" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="🧠 Algorithms & Pseudocode"
                                            value={draft.algorithms.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                algorithms: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter algorithm steps or pseudocode block (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="📏 Mathematical Formulas"
                                            value={draft.formulas.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                formulas: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter formulas (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "code" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="💻 Code Examples"
                                            value={draft.examples.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                examples: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Paste code examples (one block/line per item)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🧱 Structural Patterns"
                                            value={draft.patterns.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                patterns: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter patterns/approaches (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🎯 Practice Problems"
                                            value={draft.practiceProblems.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                practiceProblems: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter practice problem links or titles (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "complexities" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="⏱️ Time Complexities"
                                            value={draft.timeComplexities.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                timeComplexities: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter time complexity details (e.g. O(N log N) - Worst Case)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="💾 Space Complexities"
                                            value={draft.spaceComplexities.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                spaceComplexities: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter auxiliary/space complexity details (e.g. O(1) - In place)..."
                                        />
                                    </>
                                )}

                                {activeTab === "interview" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="⚠️ Common Mistakes"
                                            value={draft.commonMistakes.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                commonMistakes: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter common coding errors/pitfalls (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🎯 Interview Tips"
                                            value={draft.interviewTips.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                interviewTips: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter interview specific notes/tips (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🧠 Memory Tricks"
                                            value={draft.memoryTricks.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                memoryTricks: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter mnemonics or associations (one per line)..."
                                        />
                                    </>
                                )}

                                {activeTab === "support" && (
                                    <>
                                        <PaginatedNotesBlock
                                            label="❓ Tutor Questions"
                                            value={draft.tutorQuestions.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                tutorQuestions: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter items to clarify with a tutor/mentor (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="💬 Unresolved Doubts"
                                            value={draft.doubts.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                doubts: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Enter pending doubts/questions (one per line)..."
                                        />
                                        <PaginatedNotesBlock
                                            label="🔗 Useful Resources"
                                            value={draft.resources.join("\n")}
                                            onChange={(val) => setDraft(prev => ({
                                                ...prev,
                                                resources: val.split("\n").map(s => s.trim()).filter(Boolean)
                                            }))}
                                            placeholder="Paste links to articles, video tutorials, or doc pages..."
                                        />
                                    </>
                                )}

                                {activeTab === "mastery" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            {/* Mastery Checklist */}
                                            <div>
                                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Mastery Checklist</h3>
                                                <div className="space-y-2">
                                                    {masteryItems.map(({ key, label, icon: ItemIcon }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => updateMastery(key)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${draft.mastery[key]
                                                                ? "bg-emerald-400/[0.08] border-emerald-400/20 text-emerald-300"
                                                                : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04] hover:border-white/[0.1]"
                                                                }`}
                                                        >
                                                            {draft.mastery[key] ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                                                            )}
                                                            <ItemIcon className="w-4 h-4 shrink-0 text-zinc-500" />
                                                            <span className="text-sm font-semibold tracking-wide font-sans">{label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Confidence Slider */}
                                            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] font-sans">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-semibold text-zinc-400">Confidence Level</h4>
                                                    <span className={`text-lg font-bold ${draft.confidence >= 80 ? "text-emerald-400" :
                                                        draft.confidence >= 50 ? "text-amber-400" :
                                                            draft.confidence >= 20 ? "text-orange-400" : "text-zinc-500"
                                                        }`}>
                                                        {draft.confidence}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={draft.confidence}
                                                    onChange={(e) => setDraft(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-white/20 [&::-webkit-slider-thumb]:cursor-pointer"
                                                />
                                                <div className="flex justify-between mt-1 text-[10px] text-zinc-600 font-mono">
                                                    <span>No Idea</span>
                                                    <span>Getting There</span>
                                                    <span>Expert</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Completed toggle */}
                                            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] font-sans">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className={`w-5 h-5 ${draft.completed ? "text-emerald-400" : "text-zinc-600"}`} />
                                                    <span className="text-sm font-semibold text-zinc-300">Completed</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setDraft(prev => ({ ...prev, completed: !prev.completed }))}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${draft.completed ? "bg-emerald-400" : "bg-white/[0.1]"}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: draft.completed ? 24 : 2 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                                                    />
                                                </button>
                                            </div>

                                            {/* Related Topics */}
                                            <div className="font-sans">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Related Topics</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {draft.relatedTopics.map((rt, i) => (
                                                        <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] text-zinc-300 border border-white/[0.06] font-sans font-medium">
                                                            {rt}
                                                        </span>
                                                    ))}
                                                    {draft.relatedTopics.length === 0 && (
                                                        <span className="text-xs text-zinc-600 italic">No related topics</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3 font-sans">
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Revisions</div>
                                                    <div className="text-xl font-bold text-white mt-1 font-mono">{draft.revisionCount}</div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Fields</div>
                                                    <div className="text-xl font-bold text-white mt-1 font-mono">{getFilledFieldsCount(draft)}</div>
                                                </div>
                                                <div className="col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Last Revised</div>
                                                    <div className="text-sm font-semibold text-white mt-1 font-mono">
                                                        {draft.lastRevised
                                                            ? new Date(draft.lastRevised).toLocaleDateString("en-US", {
                                                                month: "short", day: "numeric", year: "numeric",
                                                                hour: "2-digit", minute: "2-digit",
                                                            })
                                                            : "Never"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="shrink-0 px-8 py-4 border-t border-white/[0.06] flex items-center justify-between bg-zinc-950/90 font-sans">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-all"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="button"
                        onClick={handleSave}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${saved
                            ? "bg-emerald-400 text-zinc-950"
                            : "bg-white text-zinc-950 hover:bg-zinc-200"
                            }`}
                    >
                        {saved ? (
                            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                        ) : (
                            <><Save className="w-4 h-4" /> Save Changes</>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Topic Card ──────────────────────────────────────────────────────────────

function TopicCard({
    topic,
    onClick,
    index,
}: {
    topic: NoteTopic;
    onClick: () => void;
    index: number;
}) {
    const levelConfig = LEVEL_CONFIG[topic.level] || LEVEL_CONFIG.Beginner;
    const LevelIcon = levelConfig.icon;
    const masteryPercent = getMasteryPercent(topic.mastery);
    const filledFields = getFilledFieldsCount(topic);

    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative w-full text-left p-5 rounded-2xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/[0.12] transition-all duration-300 cursor-pointer overflow-hidden col-span-2 font-sans"
        >
            {/* Gradient accent on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${levelConfig.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

            <div className="relative z-10">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${levelConfig.bgColor} flex items-center justify-center`}>
                            <LevelIcon className={`w-3.5 h-3.5 ${levelConfig.color}`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${levelConfig.color}`}>
                            {topic.level}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {topic.favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                        {topic.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-white mb-3 leading-snug group-hover:text-white/95 transition-colors font-sans tracking-wide">
                    {topic.name}
                </h3>

                {/* Mastery bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Mastery</span>
                        <span className={`text-[10px] font-bold ${masteryPercent >= 80 ? "text-emerald-400" :
                            masteryPercent >= 40 ? "text-amber-400" : "text-zinc-500"
                            }`}>
                            {masteryPercent}%
                        </span>
                    </div>
                    <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${masteryPercent >= 80 ? "bg-emerald-400" :
                                masteryPercent >= 40 ? "bg-amber-400" : "bg-white/20"
                                }`}
                            style={{ width: `${masteryPercent}%` }}
                        />
                    </div>
                </div>

                {/* Bottom stats */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-sans font-medium text-zinc-400">
                            <FileText className="w-3 h-3 text-zinc-500" /> {filledFields} fields
                        </span>
                        <span className="flex items-center gap-1 font-sans font-medium text-zinc-400">
                            <Layers className="w-3 h-3 text-zinc-500" /> {topic.revisionCount} rev
                        </span>
                    </div>
                    <span className={`flex items-center gap-1 font-sans font-semibold ${topic.confidence >= 80 ? "text-emerald-400" :
                        topic.confidence >= 50 ? "text-amber-400" : "text-zinc-400"
                        }`}>
                        <TrendingUp className="w-3 h-3 opacity-60" /> {topic.confidence}%
                    </span>
                </div>
            </div>
        </motion.button>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function DsaNotes() {
    const router = useRouter();
    const [topics, setTopics] = useState<NoteTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<NoteTopic | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterLevel, setFilterLevel] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<"All" | "Completed" | "Pending" | "Favorites">("All");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Load data
    useEffect(() => {
        async function loadData() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setTopics(JSON.parse(stored));
                } else {
                    const res = await fetch("/api/notes");
                    if (res.ok) {
                        const data = await res.json();
                        setTopics(data);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    } else {
                        const notesData = await import("@/lib/data/notes.json");
                        const data = Array.isArray(notesData.default) ? notesData.default : notesData;
                        setTopics(data as NoteTopic[]);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    }
                }
            } catch {
                try {
                    const notesData = await import("@/lib/data/notes.json");
                    const data = Array.isArray(notesData.default) ? notesData.default : notesData;
                    setTopics(data as NoteTopic[]);
                } catch {
                    console.error("Failed to load notes data");
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const saveTopicUpdate = useCallback((updated: NoteTopic) => {
        setTopics(prev => {
            const newTopics = prev.map(t => t.id === updated.id ? updated : t);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTopics));
            return newTopics;
        });
        // Update selectedTopic so the panel reflects saved data
        setSelectedTopic(updated);
    }, []);

    const filteredTopics = useMemo(() => {
        return topics.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.relatedTopics.some(rt => rt.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesLevel = filterLevel === "All" || t.level === filterLevel;
            let matchesStatus = true;
            if (filterStatus === "Completed") matchesStatus = t.completed;
            else if (filterStatus === "Pending") matchesStatus = !t.completed;
            else if (filterStatus === "Favorites") matchesStatus = t.favorite;
            return matchesSearch && matchesLevel && matchesStatus;
        });
    }, [topics, searchQuery, filterLevel, filterStatus]);

    const stats = useMemo(() => {
        const total = topics.length;
        const completed = topics.filter(t => t.completed).length;
        const favorites = topics.filter(t => t.favorite).length;
        const avgMastery = total > 0
            ? Math.round(topics.reduce((sum, t) => sum + getMasteryPercent(t.mastery), 0) / total)
            : 0;
        const avgConfidence = total > 0
            ? Math.round(topics.reduce((sum, t) => sum + t.confidence, 0) / total)
            : 0;
        return { total, completed, favorites, avgMastery, avgConfidence };
    }, [topics]);

    const levels = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];
    const statuses: ("All" | "Completed" | "Pending" | "Favorites")[] = ["All", "Completed", "Pending", "Favorites"];

    async function handelSignOut() {
        try {
            await fetch("/api/auth/signout", { method: "POST" });
            router.push("/Login");
        } catch { /* ignore */ }
    }

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
            <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-white/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-sans">
                        <StickyNote size={18} /> DSA Notes
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1 font-sans font-medium">Knowledge Base</p>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto font-sans">
                    {/* Filters in sidebar */}
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 font-sans">Filter by Level</div>
                    {levels.map(level => {
                        const config = level !== "All" ? LEVEL_CONFIG[level] : null;
                        const count = level === "All" ? topics.length : topics.filter(t => t.level === level).length;
                        return (
                            <button
                                key={level}
                                onClick={() => { setFilterLevel(level); setSidebarOpen(false); }}
                                className={`flex items-center justify-between px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors rounded-lg ${filterLevel === level
                                    ? config
                                        ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                                        : "bg-white text-zinc-950 font-bold"
                                    : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <span>{level}</span>
                                <span className="text-xs opacity-60 font-mono">{count}</span>
                            </button>
                        );
                    })}

                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-4 mb-2 font-sans">Status</div>
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => { setFilterStatus(status); setSidebarOpen(false); }}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors rounded-lg ${filterStatus === status
                                ? "bg-white text-zinc-950 font-bold"
                                : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <span>{status}</span>
                            <span className="text-xs opacity-60 font-mono">
                                {status === "All" ? topics.length :
                                    status === "Completed" ? topics.filter(t => t.completed).length :
                                        status === "Pending" ? topics.filter(t => !t.completed).length :
                                            topics.filter(t => t.favorite).length}
                            </span>
                        </button>
                    ))}

                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-6 mb-2 font-sans">Navigation</div>
                    <button onClick={() => { router.push("/tasks"); setSidebarOpen(false); }} className="flex items-center justify-between px-4 py-3 text-sm font-semibold tracking-wide transition-colors text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg">
                        Tasks
                    </button>
                    <button onClick={() => { router.push("/aptitude"); setSidebarOpen(false); }} className="flex items-center justify-between px-4 py-3 text-sm font-semibold tracking-wide transition-colors text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg">
                        Aptitude
                    </button>
                    <button onClick={() => { router.push("/dsaquestions"); setSidebarOpen(false); }} className="flex items-center justify-between px-4 py-3 text-sm font-semibold tracking-wide transition-colors text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg">
                        DSA Questions
                    </button>
                    <button onClick={() => { router.push("/notes"); setSidebarOpen(false); }} className="flex items-center justify-between px-4 py-3 text-sm font-bold tracking-wide transition-colors bg-white text-zinc-950 rounded-lg">
                        Notes
                    </button>
                    <button onClick={() => { router.push("/timetable"); setSidebarOpen(false); }} className="flex items-center justify-between px-4 py-3 text-sm font-semibold tracking-wide transition-colors text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg">
                        Time Table
                    </button>
                </div>

                <div className="p-6 border-t border-white/10 font-sans">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-semibold tracking-wide transition-colors rounded-lg" onClick={handelSignOut}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-screen">
                {/* Header */}
                <header className="mb-8 hidden md:block font-sans">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                            <StickyNote className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">DSA Notes</h1>
                            <p className="text-zinc-400 mt-1 text-sm font-semibold tracking-wide">
                                Your personal knowledge base — {stats.total} topics, {stats.completed} completed
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 font-sans">
                    {[
                        { label: "Total", value: stats.total, icon: BookOpen, color: "text-white" },
                        { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400" },
                        { label: "Favorites", value: stats.favorites, icon: Star, color: "text-amber-400" },
                        { label: "Mastery", value: `${stats.avgMastery}%`, icon: Target, color: "text-violet-400" },
                        { label: "Confidence", value: `${stats.avgConfidence}%`, icon: TrendingUp, color: "text-cyan-400" },
                    ].map((stat, i) => {
                        const StatIcon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                            >
                                <StatIcon className={`w-4 h-4 ${stat.color} shrink-0`} />
                                <div>
                                    <div className={`text-lg font-bold ${stat.color} font-mono`}>{stat.value}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{stat.label}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="mb-6 font-sans">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all font-sans"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Topics Grid — each card is col-span-2 in a 6-col grid = 3 cards per row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredTopics.map((topic, i) => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            onClick={() => setSelectedTopic(topic)}
                            index={i}
                        />
                    ))}
                </div>

                {filteredTopics.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center font-sans">
                        <Search className="w-12 h-12 text-zinc-700 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-400 mb-1">No topics found</h3>
                        <p className="text-sm text-zinc-600">Try adjusting your search or filters</p>
                    </motion.div>
                )}
            </main>

            {/* Topic Detail Panel */}
            <AnimatePresence>
                {selectedTopic && (
                    <TopicDetailPanel
                        topic={selectedTopic}
                        onSave={saveTopicUpdate}
                        onClose={() => setSelectedTopic(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
