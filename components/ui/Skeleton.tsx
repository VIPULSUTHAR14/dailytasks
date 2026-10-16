import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base atomic Skeleton component.
 * Renders an accessible, aria-hidden shimmering placeholder.
 */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton shrink-0 ${className}`}
      {...props}
    />
  );
}

/**
 * SkeletonTitle: heading/title placeholder
 */
export function SkeletonTitle({ className = "", ...props }: SkeletonProps) {
  return <Skeleton className={`h-6 w-2/5 rounded-lg ${className}`} {...props} />;
}

/**
 * SkeletonText: multi-line paragraph placeholder with natural varied line widths
 */
export interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  gap?: string;
  lineHeight?: string;
}

export function SkeletonText({
  lines = 3,
  gap = "space-y-2",
  lineHeight = "h-3.5",
  className = "",
  ...props
}: SkeletonTextProps) {
  const widths = ["w-full", "w-[92%]", "w-[85%]", "w-[78%]", "w-[65%]", "w-[50%]"];

  return (
    <div aria-hidden="true" className={`w-full ${gap} ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        const widthClass = isLast
          ? widths[Math.min(i, widths.length - 1)] || "w-3/5"
          : widths[i % (widths.length - 1)] || "w-full";
        return (
          <Skeleton
            key={i}
            className={`${lineHeight} ${widthClass} rounded-md`}
          />
        );
      })}
    </div>
  );
}

/**
 * SkeletonAvatar: circular avatar placeholder
 */
export interface SkeletonAvatarProps extends SkeletonProps {
  size?: string;
}

export function SkeletonAvatar({
  size = "w-10 h-10",
  className = "",
  ...props
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={`rounded-full shrink-0 ${size} ${className}`}
      {...props}
    />
  );
}

/**
 * SkeletonPill: badge / status chip placeholder
 */
export function SkeletonPill({ className = "", ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={`h-5 w-16 rounded-full shrink-0 ${className}`}
      {...props}
    />
  );
}

/**
 * SkeletonCard: surface container with elevation border and internal structure
 */
export function SkeletonCard({ className = "", children, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`surface-1 rounded-2xl p-4 sm:p-5 border border-[var(--border-subtle)] space-y-3 ${className}`}
      {...props}
    >
      {children || (
        <>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3 rounded-md" />
            <SkeletonPill className="w-14" />
          </div>
          <SkeletonText lines={2} />
        </>
      )}
    </div>
  );
}

/**
 * SkeletonRow: tabular / list row placeholder
 */
export function SkeletonRow({ className = "", children, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-3 py-3 px-4 rounded-xl border border-[var(--border-subtle)]/50 ${className}`}
      {...props}
    >
      {children || (
        <>
          <SkeletonAvatar size="w-6 h-6" />
          <Skeleton className="h-4 flex-1 rounded-md" />
          <SkeletonPill className="w-16" />
        </>
      )}
    </div>
  );
}
