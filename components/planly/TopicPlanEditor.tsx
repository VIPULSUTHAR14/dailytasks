"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  AlertTriangle,
  RotateCcw,
  Info
} from "lucide-react";
import {
  SprintSettings,
  TopicConfidence,
  TopicPlanEntry,
  TopicStatus,
  UserDiagnostic
} from "@/lib/planly/types";
import { DSA_TOPICS_POOL, TOPIC_PREREQUISITES, resolveTopic } from "@/lib/planly/pools";
import { buildTopicQueue } from "@/lib/planly/engine";

export interface TopicPlanEditorProps {
  topicPlan: TopicPlanEntry[];
  onChange: (updated: TopicPlanEntry[]) => void;
  settings: SprintSettings;
  diagnostic?: UserDiagnostic;
  mode?: "all" | "studied" | "order";
  onIncreaseWeeks?: () => void;
}

export default function TopicPlanEditor({
  topicPlan,
  onChange,
  settings,
  diagnostic,
  mode = "all",
  onIncreaseWeeks
}: TopicPlanEditorProps) {
  const [activeTab, setActiveTab] = useState<"studied" | "order">(
    mode === "order" ? "order" : "studied"
  );
  const [orderSubTab, setOrderSubTab] = useState<"dsa" | "core">("dsa");
  const [filterStudiedTab, setFilterStudiedTab] = useState<"all" | "dsa" | "core">("all");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Helper to map diagnostic score to default confidence
  const getDiagnosticConfidence = (topicId: string): TopicConfidence => {
    if (!diagnostic) return "okay";
    const clean = topicId.toLowerCase();
    let score = 3;

    if (clean.includes("dp") || clean.includes("dynamic")) score = diagnostic.dp;
    else if (clean.includes("graph")) score = diagnostic.graphs;
    else if (clean.includes("tree") || clean.includes("heap") || clean.includes("trie")) score = diagnostic.trees;
    else if (clean.includes("array") || clean.includes("string") || clean.includes("window") || clean.includes("pointer")) score = diagnostic.arrays;
    else if (clean.includes("design") || clean.includes("lld")) score = diagnostic.systemDesign;

    if (score <= 2) return "rusty";
    if (score >= 4) return "solid";
    return "okay";
  };

  // Toggle study status
  const handleToggleStatus = (topicId: string) => {
    const updated: TopicPlanEntry[] = topicPlan.map((entry) => {
      if (entry.topicId === topicId) {
        const nextStatus: TopicStatus = entry.status === "new" ? "studied" : "new";
        return {
          ...entry,
          status: nextStatus,
          confidence: nextStatus === "studied" ? (entry.confidence || getDiagnosticConfidence(topicId)) : undefined,
          skipRevision: nextStatus === "studied" ? entry.skipRevision : undefined
        };
      }
      return entry;
    });
    onChange(updated);
  };

  // Set confidence
  const handleSetConfidence = (topicId: string, confidence: TopicConfidence) => {
    const updated: TopicPlanEntry[] = topicPlan.map((entry) => {
      if (entry.topicId === topicId) {
        return { ...entry, confidence };
      }
      return entry;
    });
    onChange(updated);
  };

  // Toggle skip revision
  const handleToggleSkipRevision = (topicId: string) => {
    const updated = topicPlan.map((entry) => {
      if (entry.topicId === topicId) {
        return { ...entry, skipRevision: !entry.skipRevision };
      }
      return entry;
    });
    onChange(updated);
  };

  // Quick Action: Mark all as new
  const handleMarkAllNew = () => {
    const updated = topicPlan.map((entry) => ({
      ...entry,
      status: "new" as const,
      confidence: undefined,
      skipRevision: undefined
    }));
    onChange(updated);
  };

  // Quick Action: Select all as studied
  const handleMarkAllStudied = () => {
    const updated: TopicPlanEntry[] = topicPlan.map((entry) => ({
      ...entry,
      status: "studied" as const,
      confidence: (entry.confidence || getDiagnosticConfidence(entry.topicId)) as TopicConfidence,
      skipRevision: false
    }));
    onChange(updated);
  };

  // Reorder controls within kind (DSA or Core)
  const dsaEntries = useMemo(
    () => topicPlan.filter((e) => e.kind === "dsa").sort((a, b) => a.order - b.order),
    [topicPlan]
  );
  const coreEntries = useMemo(
    () => topicPlan.filter((e) => e.kind === "core").sort((a, b) => a.order - b.order),
    [topicPlan]
  );

  const reorderKindList = (kind: "dsa" | "core", fromIdx: number, toIdx: number) => {
    const currentList = kind === "dsa" ? [...dsaEntries] : [...coreEntries];
    if (fromIdx < 0 || fromIdx >= currentList.length || toIdx < 0 || toIdx >= currentList.length || fromIdx === toIdx) {
      return;
    }

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    // Re-assign sequential order indices
    const updatedKindList = currentList.map((entry, idx) => ({ ...entry, order: idx }));
    const otherKindList = topicPlan.filter((e) => e.kind !== kind);

    onChange([...updatedKindList, ...otherKindList]);
  };

  // Reset to canonical order
  const handleResetOrder = () => {
    const canonicalDsaIds = DSA_TOPICS_POOL.map((dt) => dt.id || dt.tag);
    const updatedDsa = [...dsaEntries].sort((a, b) => {
      const idxA = canonicalDsaIds.indexOf(a.topicId);
      const idxB = canonicalDsaIds.indexOf(b.topicId);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    }).map((entry, idx) => ({ ...entry, order: idx }));

    const updatedCore = [...coreEntries].map((entry, idx) => ({ ...entry, order: idx }));
    onChange([...updatedDsa, ...updatedCore]);
  };

  // HTML5 Native Drag Handlers
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedIndex === null || draggedIndex === dropIdx) return;
    reorderKindList(orderSubTab, draggedIndex, dropIdx);
    setDraggedIndex(null);
  };

  // Compute live capacity & prerequisite warnings
  const contentWeeks = Math.max(
    1,
    settings.weeks - (settings.reserveMockWeeks && settings.weeks >= 6 ? (settings.weeks >= 12 ? 2 : 1) : 0)
  );

  const queueResult = useMemo(() => {
    const currentSettingsWithPlan: SprintSettings = {
      ...settings,
      topicPlan
    };
    return buildTopicQueue(currentSettingsWithPlan, contentWeeks);
  }, [settings, topicPlan, contentWeeks]);

  const newDsaCount = dsaEntries.filter((e) => e.status === "new").length;
  const maxCapacity = contentWeeks * 3;
  const isOverCapacity = newDsaCount > maxCapacity;

  // Prerequisite warnings calculation
  const getPrerequisiteWarnings = (topicId: string, currentOrder: number): string[] => {
    const prereqs = TOPIC_PREREQUISITES[topicId] || [];
    if (prereqs.length === 0) return [];

    const warnings: string[] = [];
    prereqs.forEach((prereqId) => {
      const prereqEntry = topicPlan.find((e) => e.topicId === prereqId);
      // Only warn if prerequisite is marked NEW and positioned AFTER this topic
      if (prereqEntry && prereqEntry.status === "new" && prereqEntry.order > currentOrder) {
        const resolvedPrereq = resolveTopic(prereqId);
        const resolvedCurrent = resolveTopic(topicId);
        warnings.push(`${resolvedPrereq?.name || prereqId} usually comes before ${resolvedCurrent?.name || topicId}`);
      }
    });

    return warnings;
  };

  // Convert dropped topic IDs to human names
  const droppedTopicNames = queueResult.droppedTopicIds.map((id) => {
    const resolved = resolveTopic(id);
    return resolved ? resolved.name : id;
  });

  // Action: Move dropped topics to already studied
  const handleMoveDroppedToStudied = () => {
    const droppedSet = new Set(queueResult.droppedTopicIds);
    const updated: TopicPlanEntry[] = topicPlan.map((entry) => {
      if (droppedSet.has(entry.topicId)) {
        return {
          ...entry,
          status: "studied" as const,
          confidence: (entry.confidence || getDiagnosticConfidence(entry.topicId)) as TopicConfidence,
          skipRevision: false
        };
      }
      return entry;
    });
    onChange(updated);
  };

  const renderStudiedView = () => {
    const filteredEntries = topicPlan.filter((entry) => {
      if (filterStudiedTab === "dsa") return entry.kind === "dsa";
      if (filterStudiedTab === "core") return entry.kind === "core";
      return true;
    });

    return (
      <div className="space-y-4">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#1E293B]">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterStudiedTab("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterStudiedTab === "all"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Topics ({topicPlan.length})
            </button>
            <button
              onClick={() => setFilterStudiedTab("dsa")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterStudiedTab === "dsa"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              DSA ({dsaEntries.length})
            </button>
            <button
              onClick={() => setFilterStudiedTab("core")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterStudiedTab === "core"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Core CS ({coreEntries.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllNew}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded border border-[#1E293B] hover:border-zinc-700 transition"
            >
              Mark all as new
            </button>
            <button
              onClick={handleMarkAllStudied}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 transition"
            >
              Select all studied
            </button>
          </div>
        </div>

        {/* Informative Note */}
        <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-[#141923] border border-[#1E293B] text-xs text-zinc-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Topics marked <span className="text-purple-300 font-semibold">Already Studied</span> skip regular weekday theory and are routed to Sunday revision &amp; spaced repetition.
          </p>
        </div>

        {/* List of Topics */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredEntries.map((entry) => {
            const resolved = resolveTopic(entry.topicId);
            const isStudied = entry.status === "studied";
            const topicName = resolved ? resolved.name : entry.topicId;

            return (
              <div
                key={entry.topicId}
                className={`p-3 rounded-xl border transition ${
                  isStudied
                    ? "bg-purple-500/5 border-purple-500/25 hover:border-purple-500/40"
                    : "bg-[#141923] border-[#1E293B] hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        entry.kind === "dsa"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                          : "text-cyan-400 bg-cyan-500/10 border-cyan-500/25"
                      }`}
                    >
                      {entry.kind === "dsa" ? "DSA" : "Core CS"}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">{topicName}</span>
                  </div>

                  {/* Toggle New vs Studied */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex bg-[#10141E] p-0.5 rounded-lg border border-[#1E293B]">
                      <button
                        onClick={() => entry.status !== "new" && handleToggleStatus(entry.topicId)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                          !isStudied
                            ? "bg-emerald-500 text-black font-bold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        New
                      </button>
                      <button
                        onClick={() => !isStudied && handleToggleStatus(entry.topicId)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                          isStudied
                            ? "bg-purple-500 text-white font-bold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Studied
                      </button>
                    </div>
                  </div>
                </div>

                {/* Studied Options: Confidence Selector & Skip Revision */}
                {isStudied && (
                  <div className="mt-2.5 pt-2 border-t border-[#1E293B]/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] text-zinc-400 mr-1">Confidence:</span>
                      {(["rusty", "okay", "solid"] as TopicConfidence[]).map((lvl) => {
                        const isCurrent = entry.confidence === lvl;
                        const colors = {
                          rusty: "bg-rose-500/15 border-rose-500 text-rose-300",
                          okay: "bg-amber-500/15 border-amber-500 text-amber-300",
                          solid: "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                        };
                        return (
                          <button
                            key={lvl}
                            onClick={() => handleSetConfidence(entry.topicId, lvl)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize transition ${
                              isCurrent
                                ? `${colors[lvl]} font-bold`
                                : "bg-[#10141E] border-[#1E293B] text-zinc-400 hover:text-white"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>

                    <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-zinc-400 hover:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={entry.skipRevision === true}
                        onChange={() => handleToggleSkipRevision(entry.topicId)}
                        className="rounded border-[#1E293B] bg-[#10141E] text-purple-500 focus:ring-purple-400 w-3.5 h-3.5"
                      />
                      <span>Skip revision pool</span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOrderView = () => {
    const activeList = orderSubTab === "dsa" ? dsaEntries : coreEntries;

    return (
      <div className="space-y-4">
        {/* Sub-tabs & Reset Button */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setOrderSubTab("dsa")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                orderSubTab === "dsa"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              DSA Topics ({dsaEntries.length})
            </button>
            <button
              onClick={() => setOrderSubTab("core")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                orderSubTab === "core"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Core CS Subjects ({coreEntries.length})
            </button>
          </div>

          <button
            onClick={handleResetOrder}
            className="flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded border border-[#1E293B] hover:border-zinc-700 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Suggested</span>
          </button>
        </div>

        {/* Live Capacity Feedback */}
        {orderSubTab === "dsa" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                New Topics: <strong className="text-white">{newDsaCount}</strong> (Max capacity: {maxCapacity})
              </span>
              <span>
                Fits in <strong className="text-emerald-400">{Math.min(contentWeeks, queueResult.assignments.filter((a) => !a.isRevisionWeek).length)}</strong> of <strong className="text-white">{contentWeeks}</strong> content weeks
              </span>
            </div>

            {/* Over capacity warning banner */}
            {isOverCapacity && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
                <div className="flex items-start space-x-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-300">
                      Capacity Exceeded: {queueResult.droppedTopicIds.length} topic(s) cannot fit in {contentWeeks} content weeks (cap 3 topics/week):
                    </span>
                    <p className="mt-0.5 font-medium text-rose-200">{droppedTopicNames.join(", ")}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  {onIncreaseWeeks && (
                    <button
                      onClick={onIncreaseWeeks}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-semibold transition"
                    >
                      Increase sprint duration
                    </button>
                  )}
                  <button
                    onClick={handleMoveDroppedToStudied}
                    className="px-2.5 py-1 rounded-lg bg-[#141923] hover:bg-[#1E293B] text-zinc-200 border border-[#1E293B] text-[11px] font-semibold transition"
                  >
                    Move to already studied
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Topic Reordering List */}
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
          {activeList.map((entry, idx) => {
            const resolved = resolveTopic(entry.topicId);
            const topicName = resolved ? resolved.name : entry.topicId;
            const warnings = entry.kind === "dsa" ? getPrerequisiteWarnings(entry.topicId, entry.order) : [];

            return (
              <div
                key={entry.topicId}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`p-2.5 rounded-xl border flex flex-col space-y-1.5 transition ${
                  draggedIndex === idx
                    ? "opacity-50 border-cyan-500 bg-cyan-500/10"
                    : "bg-[#141923] border-[#1E293B] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 w-5">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white truncate">{topicName}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        entry.status === "studied"
                          ? "text-purple-400 bg-purple-500/10 border-purple-500/25"
                          : "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                      }`}
                    >
                      {entry.status === "studied" ? "Studied" : "New"}
                    </span>
                  </div>

                  {/* Reorder Buttons: Top, Up, Down, Bottom */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => reorderKindList(orderSubTab, idx, 0)}
                      disabled={idx === 0}
                      title="Move to top"
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderKindList(orderSubTab, idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderKindList(orderSubTab, idx, idx + 1)}
                      disabled={idx === activeList.length - 1}
                      title="Move down"
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderKindList(orderSubTab, idx, activeList.length - 1)}
                      disabled={idx === activeList.length - 1}
                      title="Move to bottom"
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Prerequisite Warnings */}
                {warnings.length > 0 && (
                  <div className="space-y-1 pl-7">
                    {warnings.map((w, wIdx) => (
                      <div
                        key={wIdx}
                        className="flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (mode === "studied") {
    return renderStudiedView();
  }

  if (mode === "order") {
    return renderOrderView();
  }

  // Combined mode ("all" or "both")
  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="flex bg-[#141923] p-1 rounded-xl border border-[#1E293B]">
        <button
          onClick={() => setActiveTab("studied")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "studied"
              ? "bg-cyan-500 text-black shadow-sm font-bold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          1. Already Studied Topics
        </button>
        <button
          onClick={() => setActiveTab("order")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "order"
              ? "bg-cyan-500 text-black shadow-sm font-bold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          2. Topic Learning Order
        </button>
      </div>

      {activeTab === "studied" ? renderStudiedView() : renderOrderView()}
    </div>
  );
}
