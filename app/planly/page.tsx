"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import PlanlyDashboard from "@/components/planly/PlanlyDashboard";

export default function PlanlyPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] font-sans flex flex-col md:flex-row antialiased">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <WorkspaceHeader
          activeTrack="Planly AI Sprint"
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <div className="flex-1">
          <PlanlyDashboard />
        </div>
      </div>
    </div>
  );
}
