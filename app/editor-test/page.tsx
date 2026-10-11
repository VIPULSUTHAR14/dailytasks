"use client";

import React, { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";

const SAMPLE_NOTE_1 = `# Array Data Structure

Array is a linear data structure that stores elements of identical types in contiguous memory locations.

## Key Properties
- Fast index access: **O(1)**
- Insertion at end: **O(1)** amortized
- Search (unsorted): **O(n)**

### Code Example
\`\`\`typescript
function findMax(nums: number[]): number {
  let max = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > max) max = nums[i];
  }
  return max;
}
\`\`\`

> Remember: Check for null/empty arrays before accessing index 0.
`;

const SAMPLE_LEGACY_NOTE = `# Legacy Notes & Highlight Migration

Demonstrating seamless backward compatibility with AlgoCraft's custom syntax:

- ==r:Critical edge case / bug==: Watch for integer overflow when index approaches 2^31 - 1.
- ==g:Optimal insight==: Two-pointer technique achieves O(n) time and O(1) space.
- ==b:Standard library method==: Use \`std::lower_bound\` for binary search.
- ==y:Interviewer follow-up==: What if input is a stream rather than an in-memory array?
- ==p:Formula / Pattern==: Recurrence is ==p:dp[i] = max(dp[i-1], dp[i-2] + nums[i])==.

### Code Block (Highlights are preserved as raw code inside)
\`\`\`typescript
// The highlight syntax below MUST NOT be converted:
const pattern = "==r:bug==";
console.log(pattern);
\`\`\`

### Mermaid Diagram
\`\`\`mermaid
graph TD
  A[Start] --> B{Valid?}
  B -->|Yes| C[Process]
  B -->|No| D[Reject]
\`\`\`
`;

export default function EditorTestPage() {
    const [content, setContent] = useState(SAMPLE_NOTE_1);
    const [savedNotice, setSavedNotice] = useState(false);

    const handleSave = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#070a0f] text-slate-100 p-6 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span>TipTap Editor Isolation Test</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Phase 1
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Verifying Markdown input/output sync, external updates, and hydration stability.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setContent(SAMPLE_NOTE_1)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                        >
                            Load Sample 1
                        </button>
                        <button
                            type="button"
                            onClick={() => setContent(SAMPLE_LEGACY_NOTE)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow transition"
                        >
                            Load Legacy Highlights Note
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Rich Editor Pane */}
                    <div className="space-y-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            WYSIWYG Rich Editor
                        </h2>
                        <RichTextEditor
                            label="Core Note Test"
                            value={content}
                            onChange={(val) => setContent(val)}
                            onSave={handleSave}
                            isSaved={savedNotice}
                        />
                    </div>

                    {/* Markdown Output Pane */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Output Markdown (Storage Format)
                            </h2>
                            <span className="text-[11px] font-mono text-emerald-400">
                                {content.length} chars
                            </span>
                        </div>
                        <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 min-h-[360px] font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto selection:bg-blue-600/30">
                            {content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
