import React from "react";
import { Skeleton, SkeletonText } from "./ui/Skeleton";

export function RichTextEditorSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading editor"
      className="flex flex-col h-full min-h-[340px] surface-2 border border-[var(--border-subtle)] rounded-xl overflow-hidden select-none"
    >
      <span className="sr-only">Loading rich text editor and content canvas...</span>

      {/* Toolbar Placeholders */}
      <div className="h-11 px-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface)] gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Format buttons */}
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-7 h-7 rounded-md" />
          ))}
          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />
          {/* List and block buttons */}
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`b-${i}`} className="w-7 h-7 rounded-md" />
          ))}
          <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1 hidden sm:block" />
          {/* Light color pips */}
          <div className="hidden sm:flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <Skeleton key={`p-${p}`} className="w-3 h-3 rounded-full" />
            ))}
          </div>
        </div>

        {/* Toolbar Right: Save status & Fullscreen toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="w-16 h-6 rounded-md hidden sm:block" />
          <Skeleton className="w-7 h-7 rounded-md" />
        </div>
      </div>

      {/* Editor Body: 6 Text Lines of Varied Width */}
      <div className="p-5 sm:p-6 space-y-3.5 flex-1 overflow-hidden">
        <Skeleton className="w-1/3 h-5 rounded-md" />
        <SkeletonText lines={6} gap="space-y-3" lineHeight="h-4" />
      </div>
    </div>
  );
}

export default RichTextEditorSkeleton;
