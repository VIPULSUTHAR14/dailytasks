"use client";

import React from "react";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import PlanlyDashboard from "@/components/planly/PlanlyDashboard";

export default function PlanlyPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-full">
      <WorkspaceHeader activeTrack="Planly AI Sprint" />
      <div className="flex-1">
        <PlanlyDashboard />
      </div>
    </div>
  );
}
