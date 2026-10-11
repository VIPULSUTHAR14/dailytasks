"use client";

import React, { useState } from "react";
import { Terminal, Copy, Download, Upload, Check } from "lucide-react";
import { SprintPlan } from "@/lib/planly/types";

interface JsonViewProps {
  plan: SprintPlan;
  onImportPlan: (imported: SprintPlan) => void;
}

export default function JsonView({ plan, onImportPlan }: JsonViewProps) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2200);
  };

  const handleDownloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const dlNode = document.createElement("a");
    dlNode.setAttribute("href", dataStr);
    dlNode.setAttribute(
      "download",
      `planly_${plan.metadata.targetCompany.toLowerCase().replace(/\s+/g, "_")}_schedule.json`
    );
    document.body.appendChild(dlNode);
    dlNode.click();
    dlNode.remove();
  };

  const handleUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const loaded = JSON.parse(evt.target?.result as string);
        if (loaded.weeks && loaded.metadata) {
          onImportPlan(loaded);
        }
      } catch (err) {
        alert("Invalid Planly JSON roadmap format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#10141E] border border-[#1E293B] rounded-2xl p-5 flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-zinc-200 uppercase font-mono">
            planly_{plan.metadata.coreScheduleMode}_schedule.json
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyJSON}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141923] hover:bg-[#181F2E] text-xs text-zinc-300 border border-[#1E293B] transition"
          >
            {copyFeedback ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copyFeedback ? "Copied!" : "Copy JSON"}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs text-black font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141923] hover:bg-[#181F2E] text-xs text-zinc-300 border border-[#1E293B] cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleUploadJSON} className="hidden" />
          </label>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-[#0B0F17] p-4 rounded-xl text-zinc-300 font-mono text-[11px] overflow-auto max-h-[540px] leading-relaxed border border-[#1E293B] selection:bg-cyan-500/30 selection:text-cyan-200">
          {JSON.stringify(plan, null, 2)}
        </pre>
      </div>
    </div>
  );
}
