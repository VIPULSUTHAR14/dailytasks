import React from "react";
import { Skeleton, SkeletonTitle, SkeletonPill } from "../ui/Skeleton";

export function PlanlyDashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Planly Dashboard"
      className="min-h-full bg-transparent text-zinc-100 font-sans flex flex-col p-2 sm:p-4 select-none"
    >
      <span className="sr-only">Loading Planly AI Sprint Dashboard...</span>

      {/* Main Container - matching .app-shell wrapper */}
      <div className="app-shell flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-6 space-y-5 rounded-2xl border border-[var(--border-subtle)] shadow-xl">
        {/* Top Cockpit Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2.5">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-36 h-5 rounded-md" />
                  <SkeletonPill className="w-20" />
                </div>
                <Skeleton className="w-56 h-3 rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-44 rounded-xl hidden sm:block" />
            <SkeletonPill className="w-28 h-8 rounded-xl" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* Focus Banner with Circular Progress Ring */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-5 w-full md:w-auto">
            {/* Circular Progress Ring Placeholder */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-[var(--border-subtle)] border-t-[var(--accent-rgb)] animate-spin" />
              <div className="absolute flex flex-col items-center">
                <Skeleton className="w-8 h-4 rounded" />
                <Skeleton className="w-6 h-2 rounded mt-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <Skeleton className="w-40 h-5 rounded-md" />
                <Skeleton className="w-28 h-6 rounded-lg" />
              </div>
              <Skeleton className="w-64 h-3.5 rounded" />
              <div className="flex items-center space-x-3">
                <Skeleton className="w-24 h-3 rounded" />
                <Skeleton className="w-28 h-3 rounded" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* Kanban Columns with 3 Card Skeletons Each */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {[1, 2, 3].map((col) => (
            <div
              key={col}
              className="surface-well p-3.5 sm:p-4 rounded-xl border border-[var(--border-subtle)]/60 space-y-3.5"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]/40">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-2.5 h-2.5 rounded-full" />
                  <Skeleton className="w-24 h-4 rounded" />
                </div>
                <SkeletonPill className="w-8 h-4" />
              </div>

              {/* 3 Problem / Task Cards */}
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="surface-1 rounded-xl p-3.5 border border-[var(--border-subtle)] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-3/5 h-4 rounded" />
                    <SkeletonPill className="w-14 h-4" />
                  </div>
                  <Skeleton className="w-4/5 h-3 rounded" />
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/40">
                    <Skeleton className="w-20 h-3 rounded" />
                    <Skeleton className="w-16 h-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Heatmap Grid of Small Squares */}
        <div className="surface-2 p-5 rounded-2xl border border-[var(--border-subtle)] space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]/50">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-6 h-6 rounded-md" />
              <SkeletonTitle className="w-48 h-4" />
            </div>
            <Skeleton className="w-32 h-3 rounded hidden sm:block" />
          </div>

          {/* Matrix of small squares */}
          <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-21 gap-2 pt-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-full aspect-square rounded-md"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanlyDashboardSkeleton;
