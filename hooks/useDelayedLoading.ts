"use client";

import { useState, useEffect, useRef } from "react";

export interface DelayedLoadingOptions {
  /**
   * Time in milliseconds to wait before displaying the skeleton.
   * Prevents layout flicker on fast networks/cache hits.
   * @default 150
   */
  delayMs?: number;
  /**
   * Minimum duration in milliseconds the skeleton remains visible once shown.
   * Prevents jarring micro-flicker if data arrives shortly after delayMs.
   * @default 400
   */
  minDurationMs?: number;
}

export interface DelayedLoadingResult {
  /** Whether the skeleton placeholder should be rendered */
  showSkeleton: boolean;
  /** Accessibility attributes to attach to loading container */
  ariaProps: {
    "aria-busy": boolean;
  };
}

/**
 * useDelayedLoading hook
 * Delays showing skeleton for 150ms to avoid flashing on instant data loads,
 * and ensures skeletons remain visible for at least 400ms once presented.
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: DelayedLoadingOptions = {}
): DelayedLoadingResult {
  const { delayMs = 150, minDurationMs = 400 } = options;
  const [showSkeleton, setShowSkeleton] = useState(false);

  const shownAtRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timers on state change
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (minDurationTimerRef.current) {
      clearTimeout(minDurationTimerRef.current);
      minDurationTimerRef.current = null;
    }

    if (isLoading) {
      // Start delay timer
      delayTimerRef.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShowSkeleton(true);
      }, delayMs);
    } else {
      // Finished loading
      if (shownAtRef.current) {
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = minDurationMs - elapsed;

        if (remaining > 0) {
          // Keep skeleton visible until minimum duration completes
          minDurationTimerRef.current = setTimeout(() => {
            setShowSkeleton(false);
            shownAtRef.current = null;
          }, remaining);
        } else {
          setShowSkeleton(false);
          shownAtRef.current = null;
        }
      } else {
        // Was never shown (fast load < delayMs)
        setShowSkeleton(false);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);
    };
  }, [isLoading, delayMs, minDurationMs]);

  return {
    showSkeleton,
    ariaProps: {
      "aria-busy": showSkeleton,
    },
  };
}
