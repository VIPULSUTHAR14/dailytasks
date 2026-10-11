"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Pin,
  Sparkles,
  FileText,
  BookOpen
} from "lucide-react";
import { ConfidenceLevel, PlanTask } from "@/lib/planly/types";

interface ProblemCardProps {
  task: PlanTask;
  onUpdate: (updates: Partial<PlanTask>) => void;
  onConfidenceSelect: (confidence: ConfidenceLevel) => void;
}

export default function ProblemCard({ task, onUpdate, onConfidenceSelect }: ProblemCardProps) {
  const router = useRouter();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsSpent, setSecondsSpent] = useState(task.timeSpentSecs || 0);
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(task.notes || "");

  const openInDsaCatalog = () => {
    const titleParts = task.title.split(":");
    const questionName = (titleParts[titleParts.length - 1] || task.title).trim();
    const topicParam = task.topicId ? `&topic=${encodeURIComponent(task.topicId)}` : "";
    router.push(`/dsaquestions?q=${encodeURIComponent(questionName)}${topicParam}`);
  };

  // Sync external time changes when not running
  useEffect(() => {
    if (task.timeSpentSecs !== undefined && !isTimerRunning) {
      setSecondsSpent(task.timeSpentSecs);
    }
  }, [task.timeSpentSecs, isTimerRunning]);

  // Stopwatch interval purely updates local state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setSecondsSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      onUpdate({ timeSpentSecs: secondsSpent });
    } else {
      setIsTimerRunning(true);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsSpent(0);
    onUpdate({ timeSpentSecs: 0 });
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const handleNotesBlur = () => {
    onUpdate({ notes: notesText });
  };

  const togglePin = () => {
    onUpdate({ isPinned: !task.isPinned });
  };

  const difficultyColors = {
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Hard: "text-rose-400 bg-rose-500/10 border-rose-500/30"
  };

  const trackColors = {
    DSA: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    "Core CS": "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    "Mock Contest": "text-purple-400 bg-purple-500/10 border-purple-500/25",
    "Buffer & Consolidation": "text-amber-400 bg-amber-500/10 border-amber-500/25",
    "Spaced Repetition": "text-pink-400 bg-pink-500/10 border-pink-500/25",
    Custom: "text-zinc-400 bg-zinc-500/10 border-zinc-500/25"
  };

  return (
    <div
      className={`border rounded-xl transition duration-200 ${
        task.completed
          ? "bg-emerald-500/5 border-emerald-500/40 shadow-sm"
          : "bg-[#10141E] border-[#1E293B] hover:border-[#334155] shadow-md"
      }`}
    >
      <div className="p-3.5 space-y-3">
        {/* Header Tags & Action Links */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                trackColors[task.track] || "text-zinc-400 bg-[#141923] border-[#1E293B]"
              }`}
            >
              {task.track}
            </span>

            {task.difficulty && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  difficultyColors[task.difficulty]
                }`}
              >
                {task.difficulty}
              </span>
            )}

            {task.pattern && (
              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono truncate max-w-[140px]">
                {task.pattern}
              </span>
            )}

            {task.isPinned && (
              <span className="flex items-center space-x-1 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                <Pin className="w-2.5 h-2.5 fill-cyan-400" />
                <span>Pinned</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={openInDsaCatalog}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-medium transition"
              title="Open problem in AlgoCraft DSA Sheet Catalog"
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">DSA Sheet</span>
            </button>

            <button
              onClick={togglePin}
              title={task.isPinned ? "Unpin task" : "Pin task from rebalancer"}
              className={`p-1 rounded transition text-xs ${
                task.isPinned ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            {task.problemUrl && (
              <a
                href={task.problemUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open problem in LeetCode"
                className="p-1 rounded text-zinc-400 hover:text-white transition flex items-center"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 hover:text-cyan-400" />
              </a>
            )}
          </div>
        </div>

        {/* Task Title & Details */}
        <div className="flex items-start space-x-2.5">
          <button
            onClick={() => onUpdate({ completed: !task.completed })}
            className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition shrink-0"
          >
            {task.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h4
              onClick={task.track === "DSA" ? openInDsaCatalog : undefined}
              className={`text-xs font-semibold tracking-tight ${
                task.completed ? "line-through text-zinc-500" : "text-white"
              } ${task.track === "DSA" ? "cursor-pointer hover:text-cyan-300 transition" : ""}`}
              title={task.track === "DSA" ? "Click to open in DSA Sheet" : undefined}
            >
              {task.title}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{task.subject}</p>

            {(task.timeComplexity || task.spaceComplexity) && (
              <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-zinc-400">
                {task.timeComplexity && <span>Time: {task.timeComplexity}</span>}
                {task.timeComplexity && task.spaceComplexity && <span>•</span>}
                {task.spaceComplexity && <span>Space: {task.spaceComplexity}</span>}
              </div>
            )}

            {task.intuitionHint && (
              <div className="mt-1 text-[11px] text-cyan-300 bg-[#141923] border border-cyan-500/30 px-2.5 py-1.5 rounded-lg flex items-start space-x-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{task.intuitionHint}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stopwatch & Notes Action Row */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1E293B]">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-[#141923] px-2 py-0.5 rounded-lg border border-[#1E293B] text-[11px] font-mono text-zinc-300">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{formatTimer(secondsSpent)}</span>
            </div>

            <button
              onClick={handleToggleTimer}
              className={`p-1 rounded-lg transition text-xs flex items-center space-x-1 border ${
                isTimerRunning
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold"
                  : "bg-[#141923] hover:bg-[#181F2E] text-zinc-300 border-[#1E293B]"
              }`}
              title={isTimerRunning ? "Pause stopwatch" : "Start problem stopwatch"}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            {secondsSpent > 0 && !isTimerRunning && (
              <button
                onClick={handleResetTimer}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                title="Reset stopwatch"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowNotes((prev) => !prev)}
            className="flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-white transition"
          >
            <FileText className="w-3 h-3" />
            <span>{notesText ? "Notes (1)" : "Add Notes"}</span>
            {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Notes Drawer */}
        {showNotes && (
          <div className="pt-2">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Record your intuition, mistakes made, or time complexity insights..."
              className="w-full bg-[#141923] border border-[#1E293B] rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none h-16"
            />
          </div>
        )}

        {/* Confidence Scoring for Spaced Repetition */}
        <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px]">
          <span className="text-[10px] text-zinc-400 font-medium">Confidence:</span>
          <div className="flex items-center space-x-1">
            {[
              {
                id: "clean" as ConfidenceLevel,
                label: "Clean (+10d)",
                active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold",
                hover: "hover:bg-emerald-500/10 hover:text-emerald-400"
              },
              {
                id: "hint" as ConfidenceLevel,
                label: "Needed Hint (+5d)",
                active: "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold",
                hover: "hover:bg-amber-500/10 hover:text-amber-400"
              },
              {
                id: "struggled" as ConfidenceLevel,
                label: "Struggled (+2d)",
                active: "bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold",
                hover: "hover:bg-rose-500/10 hover:text-rose-400"
              }
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  onUpdate({ completed: true, confidence: lvl.id });
                  onConfidenceSelect(lvl.id);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition border ${
                  task.confidence === lvl.id
                    ? lvl.active
                    : `border-transparent text-zinc-400 ${lvl.hover}`
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
