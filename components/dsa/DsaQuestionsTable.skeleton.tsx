import React from "react";
import { Skeleton, SkeletonAvatar, SkeletonPill } from "../ui/Skeleton";

export function DsaQuestionsTableSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading DSA question table"
      className="w-full space-y-4 select-none"
    >
      <span className="sr-only">Loading DSA Question Roadmap and challenges...</span>

      {/* Metric Decks Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="surface-1 rounded-xl p-4 border border-[var(--border-subtle)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-3 rounded" />
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
            <Skeleton className="w-32 h-6 rounded-md" />
            <Skeleton className="w-full h-1.5 rounded-full mt-2" />
          </div>
        ))}
      </div>

      {/* Filter and Search Bar Placeholder */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
        <Skeleton className="w-full max-w-lg h-9 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-48 h-9 rounded-lg" />
          <Skeleton className="w-36 h-9 rounded-lg" />
        </div>
      </div>

      {/* Accordion Table Container */}
      <div className="surface-1 rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-md">
        {/* Topic Header Row */}
        <div className="w-full flex items-center justify-between p-3.5 bg-[var(--surface)] border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-44 h-4 rounded" />
            <Skeleton className="w-12 h-3.5 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-16 h-1.5 rounded-full hidden sm:block" />
            <Skeleton className="w-10 h-3.5 rounded" />
          </div>
        </div>

        {/* 8 Question Rows with real column widths & difficulty pill skeletons */}
        <div className="divide-y divide-[var(--border-subtle)]/60">
          {[
            { width: "w-3/5" },
            { width: "w-4/5" },
            { width: "w-1/2" },
            { width: "w-2/3" },
            { width: "w-3/4" },
            { width: "w-2/5" },
            { width: "w-3/5" },
            { width: "w-4/5" },
          ].map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4 py-3 text-xs"
            >
              {/* Checkbox + Title */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <SkeletonAvatar size="w-4 h-4" />
                <Skeleton className={`h-3.5 ${row.width} rounded`} />
              </div>

              {/* Difficulty Pill + Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                <SkeletonPill className="w-14 h-5" />
                <Skeleton className="w-6 h-6 rounded hidden sm:block" />
                <Skeleton className="w-6 h-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DsaQuestionsTableSkeleton;
