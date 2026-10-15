"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StickyNote, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CustomSection {
  id: string;
  name: string;
  content: string;
}

interface CustomTopic {
  id: string;
  title: string;
  category?: string;
  tags?: string[];
  description?: string;
  sections?: CustomSection[];
  updated_at?: string;
}

const DEFAULT_SAMPLE_CODE = `// Event loop & Execution context
const engine = {
  model: 'single-threaded',
  async: true,
  microtasks: ['Promises', 'queueMicrotask']
};`;

export default function RecentCustomNoteCard() {
  const [topic, setTopic] = useState<CustomTopic | null>(null);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch("/api/custom-notes");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            let matchedTopic: CustomTopic | null = null;
            if (typeof window !== "undefined") {
              const lastId = localStorage.getItem("algocraft_last_custom_note_id");
              if (lastId) {
                matchedTopic = data.find((t: CustomTopic) => t.id === lastId) || null;
              }
            }

            if (matchedTopic) {
              setTopic(matchedTopic);
            } else {
              const sorted = [...data].sort((a, b) => {
                const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return timeB - timeA;
              });
              setTopic(sorted[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load recent custom note:", err);
      }
    }

    loadRecent();
    window.addEventListener("focus", loadRecent);
    return () => window.removeEventListener("focus", loadRecent);
  }, []);

  const title = topic?.title || "JavaScript Core Internals";
  const category = (topic?.category || "INTERVIEW").toUpperCase();
  const sectionCount = topic?.sections?.length || 6;
  const codeContent =
    topic?.sections?.[0]?.content && topic.sections[0].content.length > 20
      ? topic.sections[0].content.replace(/#+\s*/g, "").slice(0, 160)
      : DEFAULT_SAMPLE_CODE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="group rounded-2xl bg-[#10141E]/90 border border-white/[0.08] p-5 backdrop-blur-xl shadow-xl hover:border-white/15 transition-all flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <StickyNote className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-none">
                Recent Custom Notes
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Custom Notes notebook</p>
            </div>
          </div>

          <Link
            href="/custom-notes"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-medium"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Sub-header meta row */}
        <div className="flex items-center justify-between text-xs mt-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {category}
            </span>
            <span className="text-[11px] text-zinc-500">modified 14m ago</span>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            {sectionCount} sections
          </span>
        </div>

        {/* Topic Title */}
        <h4 className="text-base font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
          {title}
        </h4>

        {/* Code / Logic Snippet Card */}
        <div className="mt-3 p-3 rounded-xl bg-[#0B0F17] border border-white/5 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-hidden">
          <pre className="whitespace-pre-wrap font-mono text-zinc-400">
            <code>{codeContent}</code>
          </pre>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] font-mono text-zinc-500">v2.4 active draft</span>
        <Link
          href="/custom-notes"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141923] hover:bg-[#1E2430] text-zinc-200 hover:text-white border border-white/10 transition-all hover:scale-[1.02]"
        >
          <span>Continue Notes</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
        </Link>
      </div>
    </motion.div>
  );
}
