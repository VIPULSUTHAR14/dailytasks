"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Brain, Zap } from "lucide-react";
import Link from "next/link";

interface DsaTopic {
  id: number;
  name: string;
  level?: string;
  confidence?: number;
  notes?: string;
  relatedTopics?: string[];
}

const DEFAULT_DSA_CODE = `while (fast && fast.next) {
  slow = slow.next; fast = fast.next.next;
}`;

export default function RecentDsaNoteCard() {
  const [topic, setTopic] = useState<DsaTopic | null>(null);

  useEffect(() => {
    async function loadDsaNote() {
      try {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            let matchedTopic: DsaTopic | null = null;
            if (typeof window !== "undefined") {
              const lastId = localStorage.getItem("algocraft_last_dsa_topic_id");
              if (lastId) {
                matchedTopic = data.find((t: DsaTopic) => String(t.id) === lastId) || null;
              }
            }

            if (matchedTopic) {
              setTopic(matchedTopic);
            } else {
              const active =
                data.find(
                  (t: DsaTopic) =>
                    (t.confidence && t.confidence > 0) || (t.notes && t.notes.trim().length > 0)
                ) || data[0];
              setTopic(active);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load DSA note:", err);
      }
    }

    loadDsaNote();
    window.addEventListener("focus", loadDsaNote);
    return () => window.removeEventListener("focus", loadDsaNote);
  }, []);

  const name = topic?.name || "Linked List Data Structures";
  const level = (topic?.level || "BEGINNER").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="group rounded-2xl bg-[#10141E]/90 border border-white/[0.08] p-5 backdrop-blur-xl shadow-xl hover:border-white/15 transition-all flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Brain className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-none">
                Recent DSA Notes
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">DSA Notebook system</p>
            </div>
          </div>

          <Link
            href="/notes"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-medium"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Sub-header meta row */}
        <div className="flex items-center justify-between text-xs mt-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
              {level} ★★★★
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            12 problems linked
          </span>
        </div>

        {/* Topic Title */}
        <h4 className="text-base font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
          {name}
        </h4>

        {/* Core Patterns & Subtopics */}
        <div className="mt-2.5 space-y-1.5">
          <p className="text-[11px] text-zinc-400 font-medium">Core Patterns & Subtopics:</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#0B0F17] text-cyan-300 border border-cyan-500/25 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400/20" /> Fast & Slow Pointers
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#0B0F17] text-amber-300 border border-amber-500/25 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20" /> In-place Reversal
            </span>
          </div>
        </div>

        {/* Logic Snippet Box */}
        <div className="mt-2.5 p-3 rounded-xl bg-[#0B0F17] border border-white/5 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-hidden">
          <pre className="whitespace-pre-wrap font-mono text-zinc-400">
            <code>{DEFAULT_DSA_CODE}</code>
          </pre>
        </div>
      </div>

      {/* Footer CTAs */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <Link
          href="/dsaquestions"
          className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors font-medium"
        >
          <span>Practice Qs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-[1.02]"
        >
          <span>Open DSA Notes</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
