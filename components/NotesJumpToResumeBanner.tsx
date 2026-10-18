"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, Bookmark, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NotesJumpToResumeBannerProps {
    visible: boolean;
    savedPositionDesc?: string;
    onJump: () => void;
    onDismiss: () => void;
    className?: string;
}

export default function NotesJumpToResumeBanner({
    visible,
    savedPositionDesc,
    onJump,
    onDismiss,
    className = "",
}: NotesJumpToResumeBannerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!visible || !mounted || typeof document === "undefined") return null;

    const bannerContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`fixed bottom-6 right-6 z-[1000000] max-w-sm sm:max-w-md w-[calc(100vw-3rem)] font-sans pointer-events-auto ${className}`}
            >
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-cyan-500/40 bg-zinc-950/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-slate-100 group hover:border-cyan-400/60 transition-all"
                    style={{
                        background: "var(--card, rgba(15, 23, 42, 0.95))",
                        borderColor: "var(--border-subtle, rgba(6, 182, 212, 0.4))",
                    }}
                >
                    {/* Glowing Pulse Dot + Bookmark icon */}
                    <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <Bookmark className="w-4 h-4 text-cyan-300" />
                    </div>

                    {/* Text info */}
                    <div className="flex flex-col min-w-0 pr-1 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white tracking-wide truncate">
                                Resume where you left off
                            </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono truncate">
                            {savedPositionDesc || "Previous scroll location saved"}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <button
                            type="button"
                            onClick={onJump}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 text-xs font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        >
                            <span>Jump</span>
                            <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        <button
                            type="button"
                            onClick={onDismiss}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(bannerContent, document.body);
}
