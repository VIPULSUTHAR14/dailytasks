"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Code2, BookOpen, Clock, CheckSquare, GraduationCap, ArrowRight, X } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const items = [
    { title: "Task Manager View", path: "/tasks", type: "Tasks", icon: CheckSquare, shortcut: "T" },
    { title: "DSA Questions Catalog (147 Problems)", path: "/dsaquestions", type: "DSA", icon: Code2, shortcut: "Q" },
    { title: "DSA Notes — Arrays & Strings", path: "/notes", type: "Notes", icon: BookOpen, shortcut: "N" },
    { title: "Daily Time Table & Execution Engine", path: "/timetable", type: "Schedule", icon: Clock, shortcut: "S" },
    { title: "Aptitude Prep Matrix (43 Subtopics)", path: "/aptitude", type: "Prep", icon: GraduationCap, shortcut: "A" },
    { title: "Custom Notebooks", path: "/custom-notes", type: "Notes", icon: BookOpen, shortcut: "C" },
    { title: "Two Sum (LeetCode #1)", path: "/dsaquestions", type: "Question", icon: Code2, shortcut: "2S" },
    { title: "Best Time to Buy & Sell Stock (LeetCode #121)", path: "/dsaquestions", type: "Question", icon: Code2, shortcut: "BS" },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#10141E] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden shadow-black/80">
        <div className="flex items-center px-4 py-3 border-b border-[#1E293B]">
          <Search size={16} className="text-zinc-500 mr-2 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or jump to section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No matching modules or questions found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    router.push(item.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs hover:bg-[#181C24] hover:text-white transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded bg-[#141923] border border-[#1E293B] flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40">
                      <Icon size={12} />
                    </div>
                    <span className="truncate text-zinc-300 group-hover:text-white font-medium">
                      {item.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400">
                    <span className="text-[10px] font-mono">Jump</span>
                    <ArrowRight size={12} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#0B0F17] border-t border-[#1E293B] flex items-center justify-between text-[10px] text-zinc-500">
          <span>Use ⌘K or Esc to dismiss</span>
          <span className="font-mono text-cyan-400">AlgoCraft Command Center</span>
        </div>
      </div>
    </div>
  );
}
