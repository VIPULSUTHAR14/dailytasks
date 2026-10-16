import React from "react";
import { Skeleton, SkeletonTitle, SkeletonText, SkeletonPill } from "../ui/Skeleton";

export function DsaQuestionFullscreenModalSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading question modal"
      className="fixed inset-0 z-[100] w-screen h-screen bg-[var(--background)] flex flex-col overflow-hidden m-0 p-0 select-none"
    >
      <span className="sr-only">Loading fullscreen question workspace and editor...</span>

      {/* Top Header Title Bar */}
      <div className="glass-header shrink-0 flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Title & Topic Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <Skeleton className="w-2.5 h-2.5 rounded-full" />
          <Skeleton className="w-20 h-3.5 rounded" />
          <span className="text-[var(--border-subtle)] font-mono">/</span>
          <Skeleton className="w-48 sm:w-64 h-5 rounded-md" />
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Skeleton className="w-20 h-6 rounded-md hidden sm:block" />
          <Skeleton className="w-16 h-7 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>

      {/* Main Split Grid (Notes Editor & Question Details) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 p-2 sm:p-3 overflow-hidden">
        {/* Left Side: Rich Editor Canvas */}
        <div className="lg:col-span-7 flex flex-col min-h-0 h-full overflow-hidden surface-2 border border-[var(--border-subtle)] rounded-xl">
          {/* Editor Toolbar Placeholder */}
          <div className="h-11 px-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface)]">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <Skeleton key={b} className="w-7 h-7 rounded-md" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-6 rounded-md" />
              <Skeleton className="w-7 h-7 rounded-md" />
            </div>
          </div>

          {/* Editor Body with Text Lines */}
          <div className="flex-1 p-5 sm:p-6 space-y-3.5 overflow-hidden">
            <Skeleton className="w-2/5 h-6 rounded-md" />
            <SkeletonText lines={7} gap="space-y-2.5" />
          </div>
        </div>

        {/* Right Side: Question Context & Details */}
        <div className="lg:col-span-5 surface-1 border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 overflow-y-auto space-y-4 text-xs min-h-0 h-full">
          {/* Tag Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]/80">
            <div className="flex items-center gap-2">
              <SkeletonPill className="w-16 h-6" />
              <SkeletonPill className="w-28 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-24 h-6 rounded-md" />
              <Skeleton className="w-20 h-6 rounded-md" />
            </div>
          </div>

          {/* Context Text Lines */}
          <div className="space-y-2.5">
            <SkeletonTitle className="w-32 h-4" />
            <SkeletonText lines={4} gap="space-y-2" />
          </div>

          {/* Code Block Skeleton */}
          <div className="code-frame rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="code-frame__bar flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
              </div>
              <Skeleton className="w-16 h-3 rounded" />
            </div>
            <div className="p-4 space-y-2 bg-[var(--surface-well)]">
              <Skeleton className="w-4/5 h-3.5 rounded font-mono" />
              <Skeleton className="w-3/5 h-3.5 rounded font-mono ml-4" />
              <Skeleton className="w-2/3 h-3.5 rounded font-mono ml-4" />
              <Skeleton className="w-1/2 h-3.5 rounded font-mono" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DsaQuestionFullscreenModalSkeleton;
