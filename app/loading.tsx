import React from "react";
import DashboardHeaderSkeleton from "@/components/dashboard/DashboardHeader.skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 md:p-6 bg-transparent">
      <div className="w-full max-w-7xl mx-auto space-y-6 bg-transparent">
        <DashboardHeaderSkeleton />
      </div>
    </div>
  );
}
