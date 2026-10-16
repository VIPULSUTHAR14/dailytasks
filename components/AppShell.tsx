"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const PUBLIC_ROUTES = new Set(["/", "/Login", "/signup"]);

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell: Persistent workspace layout wrapper.
 * Keeps the Sidebar mounted continuously across route transitions,
 * eliminating sidebar flickering/unmounting during page changes.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Public landing / auth routes don't render the workspace sidebar
  const isPublicRoute =
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/Login") ||
    pathname.startsWith("/signup");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full bg-[#0B0F17] text-white overflow-hidden font-sans select-none relative">
      {/* Dynamic Ambient Background Elements - Active across all workspace routes */}
      <div className="fixed top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none z-0" />


      {/* Persistent Sidebar - never unmounts on page routing */}
      <Sidebar />

      {/* Main Page Area - swaps content smoothly on route changes with active blueprint grid */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto relative z-10 blueprint-grid">
        {children}
      </div>
    </div>
  );
}

export default AppShell;
