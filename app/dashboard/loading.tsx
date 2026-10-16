import React from "react";
import DashboardHeaderSkeleton from "@/components/dashboard/DashboardHeader.skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 md:p-6">
      <div className="app-shell w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 rounded-2xl border border-[var(--border-subtle)] shadow-xl">
        <DashboardHeaderSkeleton />
      </div>
    </div>
  );
}
