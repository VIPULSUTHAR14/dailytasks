import React from "react";
import WorkspaceHeaderSkeleton from "@/components/WorkspaceHeader.skeleton";
import DashboardHeaderSkeleton from "@/components/dashboard/DashboardHeader.skeleton";

export default function TimetableLoading() {
  return (
    <div className="min-h-screen bg-transparent text-[#F1F5F9] font-sans flex flex-col">
      <WorkspaceHeaderSkeleton />
      <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 md:p-6">
        <main className="p-4 sm:p-6 md:p-8 pb-16 md:pb-8 max-w-7xl mx-auto w-full space-y-6 flex-1 bg-transparent">
          <DashboardHeaderSkeleton />
        </main>
      </div>
    </div>
  );
}
