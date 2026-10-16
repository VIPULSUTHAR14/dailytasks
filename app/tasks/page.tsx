"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Check,
  Plus,
  Trash2,
  Calendar,
  Flame,
  Sparkles,
  TrendingUp,
  Activity,
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  Moon,
  Sun,
  Smile,
  Bed,
  CheckCircle2,
  Target,
  BarChart3,
  Award,
  Cloud,
  Layers,
  ChevronRight,
} from "lucide-react";
import WorkspaceHeader from "@/components/WorkspaceHeader";

// --- Types & Interfaces ---
export interface Habit {
  id: number;
  name: string;
  emoji: string;
}

export interface TrackerData {
  habits: Habit[];
  // Month key: "YYYY-M" (e.g. "2026-2" for March 2026, 0-indexed month)
  log: Record<string, Record<string, number[]>>;
  mood: Record<string, Record<string, number>>;
  sleep: Record<string, Record<string, number>>;
}

const STORAGE_KEY = "algocraft_habit_tracker_v2";

const DEFAULT_HABITS: Habit[] = [
  { id: 1, name: "Solve 2 LeetCode Mediums", emoji: "💻" },
  { id: 2, name: "System Architecture Review", emoji: "🏛️" },
  { id: 3, name: "Engineering Reading", emoji: "📖" },
  { id: 4, name: "Daily 30m Workout", emoji: "⚡" },
  { id: 5, name: "Mindfulness & Journaling", emoji: "🧘" },
];

const MOOD_EMOJIS = ["", "😞", "🙁", "😐", "🙂", "🤩"];
const MOOD_LABELS = ["Not Set", "Exhausted", "Low", "Neutral", "Good", "Peak"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const FULL_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- Helper Functions ---
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export default function HabitTrackerPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  // Unified Central State
  const [tracker, setTracker] = useState<TrackerData>({
    habits: DEFAULT_HABITS,
    log: {},
    mood: {},
    sleep: {},
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const [isDbSynced, setIsDbSynced] = useState<boolean | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Action States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("⚡");

  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Safe Load on Mount with MongoDB Cloud Hydration & LocalStorage Fallback
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      let localState: TrackerData | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            localState = {
              habits: Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : DEFAULT_HABITS,
              log: parsed.log && typeof parsed.log === "object" ? parsed.log : {},
              mood: parsed.mood && typeof parsed.mood === "object" ? parsed.mood : {},
              sleep: parsed.sleep && typeof parsed.sleep === "object" ? parsed.sleep : {},
            };
          }
        }
      } catch (err) {
        console.warn("Local storage read blocked or failed; using default state.", err);
      }

      // Query MongoDB cloud storage for authenticated user
      try {
        const res = await fetch("/api/habit-tracker");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsDbSynced(true);
            if (data.tracker && typeof data.tracker === "object" && Array.isArray(data.tracker.habits)) {
              setTracker(data.tracker);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tracker));
              } catch {}
              setIsHydrated(true);
              return;
            } else if (localState) {
              // User has existing local tracker state; upload to their newly initialized DB record
              fetch("/api/habit-tracker", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tracker: localState }),
              }).catch(() => {});
            }
          }
        } else {
          // Guest session / unauthenticated
          if (isMounted) setIsDbSynced(false);
        }
      } catch (err) {
        console.warn("Could not reach /api/habit-tracker, using local state", err);
        if (isMounted) setIsDbSynced(false);
      }

      if (isMounted) {
        if (localState) {
          setTracker(localState);
        }
        setIsHydrated(true);
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safe Save: Immediate local persistence + debounced MongoDB cloud synchronization
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
    } catch (err) {
      console.warn("Storage write failed or blocked.", err);
    }

    if (isDbSynced === true) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        fetch("/api/habit-tracker", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracker }),
        }).catch((err) => console.error("Failed to sync habit tracker to MongoDB:", err));
      }, 500);
    }
  }, [tracker, isHydrated, isDbSynced]);

  // Calendar Dimensions
  const monthKey = useMemo(() => formatMonthKey(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const daysInMonth = useMemo(() => getDaysInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Current real-world date status
  const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() === selectedMonth;
  const currentRealDay = isCurrentMonth ? now.getDate() : -1;

  // Active month records
  const currentMonthLog = useMemo(() => tracker.log[monthKey] || {}, [tracker.log, monthKey]);
  const currentMonthMood = useMemo(() => tracker.mood[monthKey] || {}, [tracker.mood, monthKey]);
  const currentMonthSleep = useMemo(() => tracker.sleep[monthKey] || {}, [tracker.sleep, monthKey]);

  // Calendar Weeks Structure (Sunday through Saturday)
  const calendarWeeks = useMemo(() => {
    const weeks: { weekIndex: number; days: { day: number; weekday: number }[] }[] = [];
    let currentWeekDays: { day: number; weekday: number }[] = [];
    let weekIndex = 1;

    for (let day = 1; day <= daysInMonth; day++) {
      const weekday = new Date(selectedYear, selectedMonth, day).getDay();
      currentWeekDays.push({ day, weekday });

      if (weekday === 6 || day === daysInMonth) {
        weeks.push({ weekIndex, days: currentWeekDays });
        currentWeekDays = [];
        weekIndex++;
      }
    }
    return weeks;
  }, [selectedYear, selectedMonth, daysInMonth]);

  // --- Calculations Engine ---
  const activeHabits = tracker.habits;
  const habitCount = activeHabits.length;

  // Total ticks in current month
  const totalMonthTicks = useMemo(() => {
    let count = 0;
    for (const habit of activeHabits) {
      const ticked = currentMonthLog[String(habit.id)] || [];
      count += ticked.length;
    }
    return count;
  }, [activeHabits, currentMonthLog]);

  // Total ticks across ALL months (for leveling)
  const totalAllTimeTicks = useMemo(() => {
    let count = 0;
    for (const mKey of Object.keys(tracker.log)) {
      const mLog = tracker.log[mKey] || {};
      for (const hId of Object.keys(mLog)) {
        const list = mLog[hId];
        if (Array.isArray(list)) count += list.length;
      }
    }
    return count;
  }, [tracker.log]);

  // Summary Metrics
  const goal = habitCount * daysInMonth;
  const done = totalMonthTicks;
  const left = Math.max(0, goal - done);
  const monthPercent = goal > 0 ? Math.round((done / goal) * 100) : 0;

  // Gamified Level Progression
  const currentLevel = Math.floor(totalAllTimeTicks / 50) + 1;
  const levelProgress = ((totalAllTimeTicks % 50) / 50) * 100;
  const ticksToNextLevel = 50 - (totalAllTimeTicks % 50);

  // Per-Day Completion Stats
  const dayStats = useMemo(() => {
    return daysArray.map((day) => {
      let ticks = 0;
      for (const habit of activeHabits) {
        const ticked = currentMonthLog[String(habit.id)] || [];
        if (ticked.includes(day)) ticks++;
      }
      const percent = habitCount > 0 ? Math.round((ticks / habitCount) * 100) : 0;
      const isFuture = isCurrentMonth && day > currentRealDay;
      const isToday = isCurrentMonth && day === currentRealDay;
      const weekday = new Date(selectedYear, selectedMonth, day).getDay();
      return { day, weekday, ticks, percent, isFuture, isToday };
    });
  }, [daysArray, activeHabits, currentMonthLog, habitCount, isCurrentMonth, currentRealDay, selectedYear, selectedMonth]);

  // Per-Week Completion Stats
  const weekStats = useMemo(() => {
    return calendarWeeks.map((week) => {
      const daysCountInWeek = week.days.length;
      let ticksInWeek = 0;
      for (const { day } of week.days) {
        for (const habit of activeHabits) {
          const ticked = currentMonthLog[String(habit.id)] || [];
          if (ticked.includes(day)) ticksInWeek++;
        }
      }
      const possibleWeekTicks = habitCount * daysCountInWeek;
      const percent = possibleWeekTicks > 0 ? Math.round((ticksInWeek / possibleWeekTicks) * 100) : 0;
      return {
        weekIndex: week.weekIndex,
        daysCount: daysCountInWeek,
        ticks: ticksInWeek,
        percent,
      };
    });
  }, [calendarWeeks, activeHabits, currentMonthLog, habitCount]);

  // Streaks Calculation
  const { currentStreak, perfectDayStreak } = useMemo(() => {
    const maxDayToCheck = isCurrentMonth
      ? currentRealDay
      : selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth())
      ? daysInMonth
      : 0;

    let cStreak = 0;
    if (maxDayToCheck > 0) {
      for (let day = maxDayToCheck; day >= 1; day--) {
        const st = dayStats.find((d) => d.day === day);
        if (st && st.ticks > 0) {
          cStreak++;
        } else {
          break;
        }
      }
    }

    let pStreak = 0;
    if (maxDayToCheck > 0 && habitCount > 0) {
      for (let day = maxDayToCheck; day >= 1; day--) {
        const st = dayStats.find((d) => d.day === day);
        if (st && st.ticks === habitCount) {
          pStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak: cStreak, perfectDayStreak: pStreak };
  }, [isCurrentMonth, currentRealDay, selectedYear, selectedMonth, now, daysInMonth, dayStats, habitCount]);

  // Habit Breakdown & Ranking
  const habitAnalysis = useMemo(() => {
    return activeHabits.map((habit) => {
      const ticked = currentMonthLog[String(habit.id)] || [];
      const daysDone = ticked.length;
      const habitGoal = daysInMonth;
      const habitLeft = Math.max(0, habitGoal - daysDone);
      const percent = habitGoal > 0 ? Math.round((daysDone / habitGoal) * 100) : 0;

      const maxDayToCheck = isCurrentMonth ? currentRealDay : daysInMonth;
      let streak = 0;
      for (let d = maxDayToCheck; d >= 1; d--) {
        if (ticked.includes(d)) streak++;
        else break;
      }

      return {
        ...habit,
        goal: habitGoal,
        done: daysDone,
        left: habitLeft,
        percent,
        streak,
      };
    });
  }, [activeHabits, currentMonthLog, daysInMonth, isCurrentMonth, currentRealDay]);

  const topHabits = useMemo(() => {
    return [...habitAnalysis].sort((a, b) => b.done - a.done || b.streak - a.streak);
  }, [habitAnalysis]);

  // Insight Line Engine
  const insightSentence = useMemo(() => {
    if (habitCount === 0 || totalMonthTicks === 0) {
      return "Start ticking your habits to reveal your cadence insights and momentum patterns.";
    }

    const weekdayTicks = [0, 0, 0, 0, 0, 0, 0];
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];

    for (const stat of dayStats) {
      if (!stat.isFuture) {
        weekdayTicks[stat.weekday] += stat.ticks;
        weekdayTotals[stat.weekday] += habitCount;
      }
    }

    let strongestDay = 0;
    let weakestDay = 0;
    let maxRatio = -1;
    let minRatio = 999;

    for (let i = 0; i < 7; i++) {
      if (weekdayTotals[i] > 0) {
        const ratio = weekdayTicks[i] / weekdayTotals[i];
        if (ratio > maxRatio) {
          maxRatio = ratio;
          strongestDay = i;
        }
        if (ratio < minRatio) {
          minRatio = ratio;
          weakestDay = i;
        }
      }
    }

    const weakestHabit = [...habitAnalysis].sort((a, b) => a.done - b.done)[0];
    const strongestDayName = FULL_WEEKDAYS[strongestDay];
    const weakestDayName = FULL_WEEKDAYS[weakestDay];

    return `Strongest momentum on ${strongestDayName}s; ${weakestDayName} is your slowest cadence. Focus target: ${weakestHabit ? weakestHabit.name : "N/A"} (${weakestHabit ? weakestHabit.percent : 0}%).`;
  }, [habitCount, totalMonthTicks, dayStats, habitAnalysis]);

  // Sleep & Mood Monthly Averages
  const { avgSleep, avgMood } = useMemo(() => {
    const sleepVals = Object.values(currentMonthSleep).filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
    const moodVals = Object.values(currentMonthMood).filter((v) => typeof v === "number" && v >= 1 && v <= 5);

    const sAvg = sleepVals.length > 0 ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : "0.0";
    const mAvg = moodVals.length > 0 ? (moodVals.reduce((a, b) => a + b, 0) / moodVals.length).toFixed(1) : "0.0";

    return { avgSleep: sAvg, avgMood: mAvg };
  }, [currentMonthSleep, currentMonthMood]);

  // --- Handlers ---
  const handleToggleTick = (habitId: number, day: number) => {
    setTracker((prev) => {
      const mLog = { ...(prev.log[monthKey] || {}) };
      const currentDays = [...(mLog[String(habitId)] || [])];
      const hasDay = currentDays.includes(day);

      const nextDays = hasDay ? currentDays.filter((d) => d !== day) : [...currentDays, day].sort((a, b) => a - b);

      return {
        ...prev,
        log: {
          ...prev.log,
          [monthKey]: {
            ...mLog,
            [String(habitId)]: nextDays,
          },
        },
      };
    });
  };

  const handleCycleMood = (day: number) => {
    setTracker((prev) => {
      const mMood = { ...(prev.mood[monthKey] || {}) };
      const current = mMood[String(day)] || 0;
      const next = current >= 5 ? 0 : current + 1;

      if (next === 0) {
        delete mMood[String(day)];
      } else {
        mMood[String(day)] = next;
      }

      return {
        ...prev,
        mood: {
          ...prev.mood,
          [monthKey]: mMood,
        },
      };
    });
  };

  const handleSleepChange = (day: number, valStr: string) => {
    const num = parseFloat(valStr);
    setTracker((prev) => {
      const mSleep = { ...(prev.sleep[monthKey] || {}) };
      if (isNaN(num) || num < 0 || num > 24) {
        delete mSleep[String(day)];
      } else {
        mSleep[String(day)] = Math.round(num * 10) / 10;
      }
      return {
        ...prev,
        sleep: {
          ...prev.sleep,
          [monthKey]: mSleep,
        },
      };
    });
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name) return;

    const newId = Date.now();
    const newHabit: Habit = {
      id: newId,
      name,
      emoji: newHabitEmoji.trim() || "⚡",
    };

    setTracker((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));

    setNewHabitName("");
    setNewHabitEmoji("⚡");
    setIsAddModalOpen(false);
    showToast(`Added habit: ${newHabit.name}`);
  };

  const handleRenameHabit = (id: number) => {
    const trimmed = editingHabitName.trim();
    if (trimmed) {
      setTracker((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === id ? { ...h, name: trimmed } : h)),
      }));
      showToast("Habit renamed");
    }
    setEditingHabitId(null);
  };

  const handleDeleteHabit = (id: number) => {
    setTracker((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
    setDeleteConfirmId(null);
    showToast("Habit removed");
  };

  const handleResetMonth = () => {
    setTracker((prev) => {
      const nextLog = { ...prev.log };
      const nextMood = { ...prev.mood };
      const nextSleep = { ...prev.sleep };

      delete nextLog[monthKey];
      delete nextMood[monthKey];
      delete nextSleep[monthKey];

      return {
        ...prev,
        log: nextLog,
        mood: nextMood,
        sleep: nextSleep,
      };
    });
    setResetConfirmOpen(false);
    showToast(`Month ${monthNames[selectedMonth]} ${selectedYear} data reset.`);
  };

  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tracker, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `algocraft_habits_${selectedYear}_${selectedMonth + 1}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Backup exported successfully.");
    } catch (e) {
      showToast("Failed to export backup.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.habits) && parsed.log) {
          setTracker({
            habits: parsed.habits,
            log: parsed.log || {},
            mood: parsed.mood || {},
            sleep: parsed.sleep || {},
          });
          showToast("Backup imported successfully!");
        } else {
          alert("Invalid file format. Please upload a valid Habit Tracker JSON backup.");
        }
      } catch (err) {
        alert("Corrupted JSON file. Import rejected.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Month Names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 8 }, (_, i) => 2024 + i);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-full bg-transparent text-[var(--foreground)] font-sans antialiased selection:bg-[rgb(var(--accent-rgb)/0.25)] selection:text-[rgb(var(--accent-rgb))]">
      {/* Workspace Persistent Header with Sidebar Toggle & Theme Picker */}
      <WorkspaceHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Main Container - Floating with architectural depth on the project's blueprint grid */}
      <main className="p-3 sm:p-5 md:p-6 lg:p-8 pb-24 max-w-[1600px] mx-auto w-full space-y-5 flex-1 bg-transparent">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border bg-[var(--surface)] text-[var(--foreground)] border-[rgb(var(--accent-rgb)/0.4)] animate-fadeIn backdrop-blur-md">
            <CheckCircle2 size={15} className="text-[rgb(var(--accent-rgb))]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================= COMPONENT 1: COCKPIT HEADER & CONTROLS ================= */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden">
          {/* Ambient Glow Accent Corner */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-[rgb(var(--accent-rgb)/0.08)] blur-3xl pointer-events-none -mr-10 -mt-10" />

          {/* Left: Title & Controls */}
          <div className="flex flex-wrap items-center gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[rgb(var(--accent-rgb)/0.15)] border border-[rgb(var(--accent-rgb)/0.3)] text-[rgb(var(--accent-rgb))] shadow-inner">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
                    Habit Matrix
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[rgb(var(--accent-rgb)/0.12)] text-[rgb(var(--accent-rgb))] border border-[rgb(var(--accent-rgb)/0.25)]">
                    Execution Engine
                  </span>
                  {/* Database Cloud Sync Badge */}
                  {isDbSynced === true ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5" title="Connected to MongoDB">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      MongoDB Cloud
                    </span>
                  ) : isDbSynced === false ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--card)] text-zinc-400 flex items-center gap-1.5" title="Guest Mode - Local Storage">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      Guest Mirror
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-density execution matrix & personal discipline rhythms
                </p>
              </div>
            </div>

            {/* Calendar Selectors */}
            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border-subtle)] rounded-xl p-1 shadow-sm">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-[var(--foreground)] text-xs font-semibold px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[rgb(var(--accent-rgb))] cursor-pointer"
                aria-label="Select month"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx} className="bg-[var(--surface)] text-[var(--foreground)]">
                    {name}
                  </option>
                ))}
              </select>

              <span className="text-zinc-600 font-mono text-xs">•</span>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-[var(--foreground)] text-xs font-semibold px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[rgb(var(--accent-rgb))] cursor-pointer font-mono"
                aria-label="Select year"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-[var(--surface)] text-[var(--foreground)]">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* + Add Habit Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[rgb(var(--accent-rgb))] text-black shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Habit</span>
            </button>
          </div>

          {/* Right: Gamified Level & Streaks */}
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            {/* Level Card */}
            <div className="bg-[var(--card)] border border-[var(--border-subtle)] rounded-xl p-2.5 px-3.5 flex flex-col justify-center min-w-[190px] shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--accent-rgb))] flex items-center gap-1">
                  <Award size={13} />
                  Level {currentLevel}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {ticksToNextLevel} to Lv {currentLevel + 1}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface)] mt-1.5 overflow-hidden border border-[var(--border-subtle)]">
                <div
                  style={{ width: `${levelProgress}%` }}
                  className="h-full rounded-full bg-[rgb(var(--accent-rgb))] transition-all duration-500 ease-out shadow-[0_0_10px_rgb(var(--accent-rgb)/0.5)]"
                />
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-[var(--card)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-1.5 text-center min-w-[95px] shadow-sm">
              <div className="text-2xl font-extrabold font-mono leading-none text-[var(--foreground)] flex items-center justify-center gap-1">
                <Flame size={18} className="text-amber-400 fill-amber-400/20" />
                {currentStreak}
              </div>
              <div className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mt-0.5">
                Day Streak
              </div>
            </div>

            {/* Perfect Days */}
            <div className="bg-[var(--card)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-1.5 text-center min-w-[95px] shadow-sm">
              <div className="text-2xl font-extrabold font-mono leading-none text-[rgb(var(--accent-rgb))] flex items-center justify-center gap-1">
                <Target size={17} />
                {perfectDayStreak}
              </div>
              <div className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mt-0.5">
                Perfect Days
              </div>
            </div>
          </div>
        </div>

        {/* ================= COMPONENT 2: DYNAMIC INSIGHT LINE ================= */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] border-l-4 border-l-[rgb(var(--accent-rgb))] rounded-xl p-3.5 text-xs sm:text-sm font-medium tracking-wide shadow-md flex items-center gap-3">
          <Activity size={16} className="text-[rgb(var(--accent-rgb))] shrink-0" />
          <span className="text-[var(--foreground)]/90">{insightSentence}</span>
        </div>

        {/* ================= COMPONENT 3: HIGH-DENSITY EXECUTION MATRIX ================= */}
        <section className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-xl">
          {/* Table Header Bar */}
          <div className="px-4 py-2.5 bg-[var(--card)]/90 border-b border-[var(--border-subtle)] text-xs font-bold tracking-wider uppercase flex items-center justify-between">
            <span className="flex items-center gap-2 text-[var(--foreground)]">
              <Calendar size={14} className="text-[rgb(var(--accent-rgb))]" />
              Monthly Execution Matrix ({monthNames[selectedMonth]} {selectedYear})
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {daysInMonth} Days • {habitCount} Habits Monitored
            </span>
          </div>

          {/* Horizontally scrollable grid container */}
          <div className="overflow-x-auto w-full no-scrollbar focus:outline-none">
            <table className="border-collapse text-left min-w-full">
              <thead>
                {/* Week Clustering Row */}
                <tr className="bg-[var(--card)]/60 text-[var(--foreground)] text-xs border-b border-[var(--border-subtle)]">
                  <th className="sticky left-0 z-20 bg-[var(--surface)] border-r border-[var(--border-subtle)] px-4 py-2 font-bold min-w-[210px] max-w-[240px]">
                    Habit Protocol
                  </th>
                  {calendarWeeks.map((week) => (
                    <th
                      key={week.weekIndex}
                      colSpan={week.days.length}
                      className="px-1 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400 border-l border-[var(--border-subtle)]"
                    >
                      Week {week.weekIndex}
                    </th>
                  ))}
                </tr>

                {/* Weekday & Day Number Row */}
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface)]/50">
                  <th className="sticky left-0 z-20 bg-[var(--surface)] text-zinc-400 border-r border-[var(--border-subtle)] px-4 py-2 text-[10px] font-mono uppercase tracking-wider">
                    Timeline
                  </th>
                  {daysArray.map((day) => {
                    const weekdayNum = new Date(selectedYear, selectedMonth, day).getDay();
                    const isToday = isCurrentMonth && day === currentRealDay;
                    const isFuture = isCurrentMonth && day > currentRealDay;

                    return (
                      <th
                        key={day}
                        className={`p-1 text-center w-[30px] min-w-[30px] select-none transition-colors ${
                          isToday ? "bg-[rgb(var(--accent-rgb)/0.15)] rounded-lg" : ""
                        }`}
                      >
                        <div
                          className={`text-[9px] font-bold leading-none ${
                            isToday ? "text-[rgb(var(--accent-rgb))]" : isFuture ? "opacity-35 text-zinc-500" : "text-zinc-400"
                          }`}
                        >
                          {WEEKDAYS[weekdayNum]}
                        </div>
                        <div
                          className={`text-[11px] font-mono font-bold leading-none mt-0.5 ${
                            isToday
                              ? "bg-[rgb(var(--accent-rgb))] text-black px-1 py-0.5 rounded shadow-[0_0_8px_rgb(var(--accent-rgb)/0.5)]"
                              : isFuture
                              ? "opacity-35 text-zinc-500"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {day}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {activeHabits.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 1} className="text-center py-12 text-xs text-zinc-400">
                      No habits currently active. Click <strong>+ Add Habit</strong> above to start tracking.
                    </td>
                  </tr>
                ) : (
                  activeHabits.map((habit) => {
                    const tickedDays = currentMonthLog[String(habit.id)] || [];

                    return (
                      <tr
                        key={habit.id}
                        className="border-b border-[var(--border-subtle)]/70 hover:bg-[rgb(var(--accent-rgb)/0.03)] transition-colors group"
                      >
                        {/* Sticky Left Column: Habit Name, Emoji & Actions */}
                        <td className="sticky left-0 z-10 bg-[var(--surface)] border-r border-[var(--border-subtle)] px-4 py-2.5 min-w-[210px] max-w-[240px]">
                          <div className="flex items-center justify-between gap-2">
                            {editingHabitId === habit.id ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingHabitName}
                                onChange={(e) => setEditingHabitName(e.target.value)}
                                onBlur={() => handleRenameHabit(habit.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameHabit(habit.id);
                                  if (e.key === "Escape") setEditingHabitId(null);
                                }}
                                className="w-full text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--card)] text-[var(--foreground)] border border-[rgb(var(--accent-rgb))] outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingHabitId(habit.id);
                                  setEditingHabitName(habit.name);
                                }}
                                title="Click to rename habit"
                                className="text-xs font-semibold truncate hover:text-[rgb(var(--accent-rgb))] text-left flex items-center gap-2 cursor-pointer focus:outline-none transition-colors"
                              >
                                <span className="text-base select-none shrink-0">{habit.emoji}</span>
                                <span className="truncate text-[var(--foreground)]">{habit.name}</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(habit.id)}
                              title={`Delete ${habit.name}`}
                              className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-all"
                              aria-label={`Delete ${habit.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Interactive Checkbox Grid Cells */}
                        {daysArray.map((day) => {
                          const isTicked = tickedDays.includes(day);
                          const isFuture = isCurrentMonth && day > currentRealDay;
                          const isToday = isCurrentMonth && day === currentRealDay;

                          return (
                            <td
                              key={day}
                              className={`p-1 text-center align-middle ${
                                isToday ? "bg-[rgb(var(--accent-rgb)/0.03)]" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleTick(habit.id, day)}
                                aria-label={`${habit.name}, day ${day}`}
                                className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-rgb))] ${
                                  isTicked
                                    ? "bg-[rgb(var(--accent-rgb))] text-black shadow-md shadow-[rgb(var(--accent-rgb)/0.3)] scale-100 ring-1 ring-[rgb(var(--accent-rgb))]"
                                    : "bg-[var(--card)]/70 border border-[var(--border-subtle)] hover:border-[rgb(var(--accent-rgb)/0.6)] hover:scale-105"
                                } ${isFuture ? "opacity-35" : ""}`}
                              >
                                {isTicked && (
                                  <Check size={14} strokeWidth={3.5} className="animate-scaleIn" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}

                {/* ================= COMPONENT 4: MOOD ROW ================= */}
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--card)]/40">
                  <td className="sticky left-0 z-10 bg-[var(--surface)] border-r border-[var(--border-subtle)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Smile size={15} className="text-[rgb(var(--accent-rgb))]" />
                    <span>Daily Mood</span>
                  </td>
                  {daysArray.map((day) => {
                    const moodVal = currentMonthMood[String(day)] || 0;
                    const emoji = MOOD_EMOJIS[moodVal] || "·";
                    const isFuture = isCurrentMonth && day > currentRealDay;
                    const isToday = isCurrentMonth && day === currentRealDay;

                    return (
                      <td
                        key={day}
                        className={`p-1 text-center align-middle ${
                          isToday ? "bg-[rgb(var(--accent-rgb)/0.03)]" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleCycleMood(day)}
                          title={`Day ${day} Mood: ${MOOD_LABELS[moodVal]}. Click to cycle.`}
                          className={`w-7 h-7 mx-auto rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-xs hover:border-[rgb(var(--accent-rgb))] hover:bg-[var(--surface)] transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[rgb(var(--accent-rgb))] ${
                            isFuture ? "opacity-35" : ""
                          }`}
                        >
                          <span className={moodVal ? "scale-110" : "text-[10px] text-zinc-500 font-mono"}>
                            {emoji}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>

                {/* ================= COMPONENT 5: SLEEP ROW ================= */}
                <tr className="bg-[var(--card)]/40">
                  <td className="sticky left-0 z-10 bg-[var(--surface)] border-r border-[var(--border-subtle)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Bed size={15} className="text-[rgb(var(--accent-rgb))]" />
                    <span>Sleep (Hours)</span>
                  </td>
                  {daysArray.map((day) => {
                    const sleepVal = currentMonthSleep[String(day)];
                    const isFuture = isCurrentMonth && day > currentRealDay;
                    const isToday = isCurrentMonth && day === currentRealDay;

                    return (
                      <td
                        key={day}
                        className={`p-1 text-center align-middle ${
                          isToday ? "bg-[rgb(var(--accent-rgb)/0.03)]" : ""
                        }`}
                      >
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={sleepVal !== undefined ? sleepVal : ""}
                          onChange={(e) => handleSleepChange(day, e.target.value)}
                          placeholder="—"
                          className={`w-[32px] h-7 mx-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--foreground)] text-center text-[10px] font-mono font-bold p-0 focus:outline-none focus:border-[rgb(var(--accent-rgb))] focus:ring-1 focus:ring-[rgb(var(--accent-rgb))] transition-colors ${
                            isFuture ? "opacity-35" : ""
                          }`}
                          aria-label={`Sleep hours for day ${day}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= PROGRESS CHARTS GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ================= COMPONENT 6: DAILY COMPLETION RATE CHART ================= */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="px-4 py-2.5 bg-[var(--card)]/90 border-b border-[var(--border-subtle)] text-xs font-bold tracking-wider uppercase flex items-center justify-between text-[var(--foreground)]">
              <span className="flex items-center gap-2">
                <BarChart3 size={14} className="text-[rgb(var(--accent-rgb))]" />
                Daily Completion Index
              </span>
              <span className="font-mono text-[10px] text-zinc-400">Ticks / Active Habits</span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-end">
              <div className="h-[130px] flex items-end justify-between gap-1 pt-4 px-1 border-b border-[var(--border-subtle)]">
                {dayStats.map((st) => (
                  <div
                    key={st.day}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:flex z-30 px-1.5 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl pointer-events-none bg-[var(--card)] text-[var(--foreground)] border border-[var(--border-subtle)]">
                      Day {st.day}: {st.percent}% ({st.ticks}/{habitCount})
                    </div>

                    <div
                      style={{ height: `${st.percent}%` }}
                      className={`w-full min-w-[3px] max-w-[14px] rounded-t transition-all duration-300 ${
                        st.isToday
                          ? "bg-[rgb(var(--accent-rgb))] shadow-[0_0_8px_rgb(var(--accent-rgb)/0.5)]"
                          : "bg-[rgb(var(--accent-rgb)/0.5)] hover:bg-[rgb(var(--accent-rgb))]"
                      } ${st.isFuture ? "opacity-25" : ""}`}
                    />
                  </div>
                ))}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mt-2 px-1">
                {dayStats.map((st) => {
                  const showLabel = st.day === 1 || st.day % 5 === 0;
                  return (
                    <span key={st.day} className="flex-1 text-center">
                      {showLabel ? st.day : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= COMPONENT 7: WEEKLY PROGRESS CHART ================= */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="px-4 py-2.5 bg-[var(--card)]/90 border-b border-[var(--border-subtle)] text-xs font-bold tracking-wider uppercase flex items-center justify-between text-[var(--foreground)]">
              <span className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[rgb(var(--accent-rgb))]" />
                Weekly Velocity Breakdown
              </span>
              <span className="font-mono text-[10px] text-zinc-400">Sun – Sat Cadence</span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-end">
              <div className="h-[130px] flex items-end justify-around gap-3 pt-4 px-3 border-b border-[var(--border-subtle)]">
                {weekStats.map((w) => (
                  <div key={w.weekIndex} className="flex flex-col items-center justify-end h-full flex-1 max-w-[50px] group relative">
                    <div className="absolute -top-7 hidden group-hover:flex z-30 px-1.5 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl pointer-events-none bg-[var(--card)] text-[var(--foreground)] border border-[var(--border-subtle)]">
                      Week {w.weekIndex}: {w.percent}%
                    </div>

                    <div
                      style={{ height: `${w.percent}%` }}
                      className="w-full min-w-[22px] max-w-[48px] rounded-t transition-all duration-300 bg-[rgb(var(--accent-rgb)/0.7)] hover:bg-[rgb(var(--accent-rgb))] shadow-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-around items-center text-xs font-mono font-semibold mt-2.5 px-2 text-[var(--foreground)]">
                {weekStats.map((w) => (
                  <div key={w.weekIndex} className="text-center flex-1 max-w-[48px]">
                    <div className="font-bold">W{w.weekIndex}</div>
                    <div className="text-[10px] text-[rgb(var(--accent-rgb))]">{w.percent}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SUMMARY & BREAKDOWN SECTION ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ================= COMPONENT 8: MONTHLY COMPLETION DONUT ================= */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-lg flex flex-col items-center justify-between">
            <div className="w-full text-center pb-2 border-b border-[var(--border-subtle)]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Monthly Completion Donut
              </h2>
            </div>

            {/* SVG Donut Ring */}
            <div className="relative w-[150px] h-[150px] my-3 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="var(--border-subtle)"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgb(var(--accent-rgb))"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - monthPercent / 100)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.6s ease-in-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold font-mono leading-none text-[var(--foreground)]">
                  {monthPercent}%
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-[rgb(var(--accent-rgb))]">
                  Fulfilled
                </span>
              </div>
            </div>

            {/* Three Summary Metric Tiles: Goal, Done, Left */}
            <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-[var(--border-subtle)]">
              <div className="text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Goal</div>
                <div className="text-sm font-extrabold font-mono text-[var(--foreground)]">{goal}</div>
              </div>
              <div className="text-center border-x border-[var(--border-subtle)]">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Done</div>
                <div className="text-sm font-extrabold font-mono text-[rgb(var(--accent-rgb))]">{done}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Left</div>
                <div className="text-sm font-extrabold font-mono text-zinc-400">{left}</div>
              </div>
            </div>
          </div>

          {/* ================= COMPONENT 9: HABIT ANALYSIS TABLE ================= */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-lg flex flex-col md:col-span-2">
            <div className="px-4 py-2.5 bg-[var(--card)]/90 border-b border-[var(--border-subtle)] text-xs font-bold tracking-wider uppercase flex items-center justify-between text-[var(--foreground)]">
              <span>Habit Performance Matrix</span>
              <span className="font-mono text-[10px] text-zinc-400">{activeHabits.length} Tracks</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[10px] font-mono text-zinc-400 uppercase">
                    <th className="py-2.5 px-4">Habit Protocol</th>
                    <th className="py-2.5 px-2 text-center">Goal</th>
                    <th className="py-2.5 px-2 text-center">Done</th>
                    <th className="py-2.5 px-2 text-center">Left</th>
                    <th className="py-2.5 px-4 w-[35%]">Progress</th>
                    <th className="py-2.5 px-4 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/70">
                  {habitAnalysis.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--card)]/50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold flex items-center gap-2 text-[var(--foreground)]">
                        <span className="text-sm">{item.emoji}</span>
                        <span className="truncate">{item.name}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{item.goal}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[rgb(var(--accent-rgb))]">
                        {item.done}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{item.left}</td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="w-full h-2 rounded-full bg-[var(--card)] border border-[var(--border-subtle)] overflow-hidden">
                          <div
                            style={{ width: `${item.percent}%` }}
                            className="h-full rounded-full bg-[rgb(var(--accent-rgb))] transition-all duration-500 ease-out shadow-[0_0_8px_rgb(var(--accent-rgb)/0.4)]"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--foreground)]">
                        {item.percent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================= COMPONENT 10 & 11: TOP HABITS + SLEEP & MOOD ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Habits Leaderboard */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div className="px-4 py-2.5 bg-[var(--card)]/90 border-b border-[var(--border-subtle)] text-xs font-bold tracking-wider uppercase flex items-center justify-between text-[var(--foreground)]">
              <span>Discipline Leaderboard</span>
              <span className="font-mono text-[10px] text-zinc-400">Ranked by consistency</span>
            </div>

            <div className="p-4 divide-y divide-[var(--border-subtle)]/70 flex-1">
              {topHabits.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">No habits tracked yet.</div>
              ) : (
                topHabits.map((item, index) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs w-5 text-zinc-500">#{index + 1}</span>
                      <span className="text-base">{item.emoji}</span>
                      <span className="font-semibold text-[var(--foreground)]">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-[var(--foreground)]">{item.done} days</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Flame size={13} className="fill-amber-400/20" />
                        {item.streak} streak
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sleep and Mood Overview Panel */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="px-4 py-2.5 bg-[var(--card)]/90 border-b border-[var(--border-subtle)] text-xs font-bold tracking-wider uppercase flex items-center justify-between text-[var(--foreground)]">
              <span className="flex items-center gap-2">
                <Bed size={14} className="text-[rgb(var(--accent-rgb))]" />
                Sleep & Rest Hours (10h Scale)
              </span>
              <span className="font-mono text-[10px] text-zinc-400">Daily Health Rhythm</span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              {/* Daily Sleep Bar Graph */}
              <div className="h-[100px] flex items-end justify-between gap-1 pt-2 px-1 border-b border-[var(--border-subtle)]">
                {daysArray.map((day) => {
                  const val = currentMonthSleep[String(day)] || 0;
                  const percent = Math.min(100, Math.round((val / 10) * 100));
                  const isFuture = isCurrentMonth && day > currentRealDay;

                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-7 hidden group-hover:flex z-30 px-1 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl pointer-events-none bg-[var(--card)] text-[var(--foreground)] border border-[var(--border-subtle)]">
                        D{day}: {val}h
                      </div>
                      <div
                        style={{ height: `${percent}%` }}
                        className={`w-full min-w-[2px] max-w-[12px] rounded-t transition-all duration-300 ${
                          val > 0
                            ? "bg-[rgb(var(--accent-rgb)/0.75)] hover:bg-[rgb(var(--accent-rgb))]"
                            : "bg-zinc-700/20"
                        } ${isFuture ? "opacity-25" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Monthly Averages Summary line */}
              <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Avg Sleep: <strong className="text-[var(--foreground)] font-mono">{avgSleep} hrs/day</strong>
                </span>
                <span>
                  Avg Mood: <strong className="text-[rgb(var(--accent-rgb))] font-mono">{avgMood} / 5</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= COMPONENT 12: DATA SAFETY ACTIONS ================= */}
        <footer className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Layers size={15} className="text-[rgb(var(--accent-rgb))]" />
            <span>Habit Matrix Database Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card)] hover:border-[rgb(var(--accent-rgb))] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Export Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card)] hover:border-[rgb(var(--accent-rgb))] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <Upload size={13} />
              <span>Import Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Month</span>
            </button>
          </div>
        </footer>
      </main>

      {/* ================= MODAL: ADD HABIT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Plus size={16} className="text-[rgb(var(--accent-rgb))]" />
                Add New Habit
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold block mb-1 text-zinc-300">Habit Protocol Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 2 LeetCode Mediums, 30m Workout..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border-subtle)] text-[var(--foreground)] focus:outline-none focus:border-[rgb(var(--accent-rgb))] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-zinc-300">Emoji Icon</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="⚡"
                  value={newHabitEmoji}
                  onChange={(e) => setNewHabitEmoji(e.target.value)}
                  className="w-16 text-center text-lg px-2 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border-subtle)] text-[var(--foreground)] focus:outline-none focus:border-[rgb(var(--accent-rgb))]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold px-4 py-1.5 rounded-xl bg-[rgb(var(--accent-rgb))] text-black shadow-md hover:brightness-110 cursor-pointer transition-all"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Trash2 size={16} className="text-rose-400" />
              Delete Habit Protocol?
            </h3>
            <p className="text-xs leading-relaxed text-zinc-400">
              Are you sure you want to remove this habit? All associated check-in ticks across all months will be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteHabit(deleteConfirmId)}
                className="text-xs font-bold px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow-md"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET MONTH CONFIRMATION ================= */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <RotateCcw size={16} className="text-rose-400" />
              Reset {monthNames[selectedMonth]} {selectedYear}?
            </h3>
            <p className="text-xs leading-relaxed text-zinc-400">
              This will clear all check-in ticks, mood ratings, and sleep records for this specific month. All other months remain preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetMonth}
                className="text-xs font-bold px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow-md"
              >
                Reset Month
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
