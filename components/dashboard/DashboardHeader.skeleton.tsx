import React from "react";
import { Skeleton, SkeletonTitle, SkeletonText, SkeletonPill } from "../ui/Skeleton";

export function DashboardHeaderSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard overview"
      className="w-full space-y-6 select-none"
    >
      <span className="sr-only">Loading dashboard metrics, streak, and timetable...</span>

      {/* Top Header Row with Streak Counter */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 pt-1">
        {/* Left: Dynamic Greeting & Date */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-56 h-6 rounded-md" />
        </div>

        {/* Right: Streak Counter + Quick Actions */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="w-32 h-8 rounded-xl" />
          <Skeleton className="w-24 h-8 rounded-xl hidden sm:block" />
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-8 h-8 rounded-xl" />
        </div>
      </div>

      {/* Three Stat Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Profile Focus Hub + Side-by-Side Note Cards) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stat Card 1: User Profile / Focus Hub */}
          <div className="surface-1 rounded-2xl p-5 sm:p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-1.5">
                  <SkeletonTitle className="w-40 h-5" />
                  <Skeleton className="w-48 h-3 rounded" />
                </div>
              </div>
              <SkeletonPill className="w-20 h-6" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <div>
                <Skeleton className="w-16 h-2.5 rounded mb-1" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
              <div>
                <Skeleton className="w-16 h-2.5 rounded mb-1" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
              <div>
                <Skeleton className="w-16 h-2.5 rounded mb-1" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
            </div>
          </div>

          {/* Stat Cards 2 & 3: Side-by-Side Recent Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stat Card 2 */}
            <div className="surface-1 rounded-xl p-4 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-12 h-3.5 rounded" />
              </div>
              <SkeletonText lines={2} />
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/40">
                <Skeleton className="w-16 h-2.5 rounded" />
                <Skeleton className="w-14 h-2.5 rounded" />
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="surface-1 rounded-xl p-4 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-12 h-3.5 rounded" />
              </div>
              <SkeletonText lines={2} />
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]/40">
                <Skeleton className="w-16 h-2.5 rounded" />
                <Skeleton className="w-14 h-2.5 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Planly Today Tasks Card */}
        <div className="lg:col-span-5 h-full">
          <div className="surface-1 rounded-2xl p-5 border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-6 h-6 rounded-md" />
                <SkeletonTitle className="w-36 h-4" />
              </div>
              <SkeletonPill className="w-16 h-5" />
            </div>
            <Skeleton className="w-full h-2 rounded-full" />
            <div className="space-y-3 pt-1">
              {[1, 2, 3].map((task) => (
                <div
                  key={task}
                  className="surface-well p-3 rounded-xl border border-[var(--border-subtle)]/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-3/5 h-3.5 rounded" />
                    <SkeletonPill className="w-12 h-4" />
                  </div>
                  <Skeleton className="w-4/5 h-2.5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Grid Placeholder */}
      <div className="surface-1 rounded-2xl p-5 border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-6 h-6 rounded-md" />
            <SkeletonTitle className="w-44 h-4" />
          </div>
          <Skeleton className="w-32 h-3 rounded hidden sm:block" />
        </div>

        {/* Timetable Hourly Cadence Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[
            "08:00 - 10:00",
            "10:30 - 12:30",
            "14:00 - 15:30",
            "16:30 - 18:30",
            "19:00 - 20:30",
            "21:00 - 22:30",
          ].map((slot, idx) => (
            <div
              key={idx}
              className="surface-well p-3 rounded-xl border border-[var(--border-subtle)]/40 space-y-2"
            >
              <Skeleton className="w-20 h-2.5 rounded font-mono" />
              <Skeleton className="w-full h-3.5 rounded" />
              <SkeletonPill className="w-14 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardHeaderSkeleton;
