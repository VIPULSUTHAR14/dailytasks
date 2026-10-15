"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UserProfileCard from "@/components/dashboard/UserProfileCard";
import RecentCustomNoteCard from "@/components/dashboard/RecentCustomNoteCard";
import RecentDsaNoteCard from "@/components/dashboard/RecentDsaNoteCard";
import PlanlyTodayTasksCard from "@/components/dashboard/PlanlyTodayTasksCard";
import { UserProfileData } from "@/components/dashboard/EditProfileModal";
import { loadPlanlyState } from "@/lib/planly/storage";

export default function DashboardPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    name: "Developer",
    avatarEmoji: "🧑‍💻",
    targetRole: "Software Development Engineer",
    targetCompany: "Google / Tier-1 Tech",
    dailyHours: 4,
    preferredTheme: "current",
  });
  const [streakDays, setStreakDays] = useState(5);

  // Load user profile & streaks
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id,
            name: data.name || "Developer",
            email: data.email,
            avatarEmoji: data.avatarEmoji || "🧑‍💻",
            targetRole: data.targetRole || "Software Development Engineer",
            targetCompany: data.targetCompany || "Google / Tier-1 Tech",
            dailyHours: data.dailyHours ?? 4,
            preferredTheme: data.preferredTheme || "current",
          });
        }
      } catch (err) {
        console.warn("Failed to fetch user data:", err);
      }

      // Check planly streaks
      try {
        const planlyState = loadPlanlyState();
        if (planlyState?.streaks?.currentStreak) {
          setStreakDays(planlyState.streaks.currentStreak);
        }
      } catch {
        // Fallback to default
      }
    }

    fetchUserData();
  }, []);

  // Update profile handler (PATCH /api/users)
  const handleUpdateProfile = async (updated: UserProfileData) => {
    // Optimistic UI update
    setProfile(updated);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          avatarEmoji: updated.avatarEmoji,
          targetRole: updated.targetRole,
          targetCompany: updated.targetCompany,
          dailyHours: updated.dailyHours,
          preferredTheme: updated.preferredTheme,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.user) {
          setProfile((prev) => ({
            ...prev,
            ...result.user,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0B0F17] text-white selection:bg-white selection:text-zinc-950 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
        brandTitle="AlgoCraft"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Header Bar */}
          <DashboardHeader
            userName={profile.name}
            avatarEmoji={profile.avatarEmoji}
            onToggleSidebar={() => setIsMobileNavOpen(!isMobileNavOpen)}
            preferredTheme={profile.preferredTheme}
            onThemeChange={(newTheme) =>
              handleUpdateProfile({ ...profile, preferredTheme: newTheme })
            }
            streakDays={streakDays}
          />

          {/* Main 2-Column Content Grid (Matches Screenshot Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (Profile Hub + Side-by-Side Notes Grid) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Card 1: Profile & Focus Hub */}
              <UserProfileCard
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                currentStreak={streakDays}
              />

              {/* Row: Recent Custom Notes + Recent DSA Notes side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RecentCustomNoteCard />
                <RecentDsaNoteCard />
              </div>
            </div>

            {/* Right Column: Planly Today Tasks */}
            <div className="lg:col-span-5 h-full">
              <PlanlyTodayTasksCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
