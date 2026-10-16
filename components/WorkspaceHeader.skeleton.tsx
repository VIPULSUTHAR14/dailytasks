import React from "react";
import { Skeleton, SkeletonAvatar, SkeletonPill } from "./ui/Skeleton";

export function WorkspaceHeaderSkeleton() {
  return (
    <header
      role="status"
      aria-busy="true"
      aria-label="Loading workspace header"
      className="glass-header w-full h-14 px-3.5 sm:px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shrink-0 select-none"
    >
      <span className="sr-only">Loading navigation header...</span>

      {/* Left: Breadcrumbs & Logo */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="md:hidden w-8 h-8 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="hidden sm:flex flex-col gap-1">
            <Skeleton className="w-20 h-3.5 rounded" />
            <Skeleton className="w-12 h-2.5 rounded" />
          </div>
        </div>
        <span className="text-[var(--border-subtle)] hidden sm:inline">/</span>
        <SkeletonPill className="w-20 hidden md:block" />
        <SkeletonPill className="w-24 hidden lg:block" />
      </div>

      {/* Center: Search / metric placeholder */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-xs mx-4">
        <Skeleton className="w-full h-7 rounded-lg" />
      </div>

      {/* Right: Actions, Theme, and Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <Skeleton className="h-8.5 w-16 rounded-lg hidden sm:block" />
        <Skeleton className="w-8.5 h-8.5 rounded-lg" />
        <Skeleton className="h-8.5 w-24 rounded-lg hidden sm:block" />
        <SkeletonAvatar size="w-8.5 h-8.5" />
      </div>
    </header>
  );
}

export default WorkspaceHeaderSkeleton;
