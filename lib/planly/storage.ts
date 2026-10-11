import { PlanlyState, PlanTask, SprintPlan, SprintSettings } from "./types";
import { DEFAULT_DIAGNOSTIC } from "./pools";
import { generateSchedule } from "./engine";

const STATE_KEY = "algocraft_planly_v3";
const LEGACY_STATE_KEY = "algocraft_planly_v2";
const HISTORY_KEY = "algocraft_planly_history_v3";
const HABITS_STORAGE_KEY = "algocraft_weekly_habits_v1";
export const PLANLY_SYNCED_TASKS_KEY = "algocraft_planly_synced_tasks_v1";

export interface SyncedSprintTask {
  id: string;
  planTaskId: string;
  title: string;
  track: string;
  subject: string;
  details: string[];
  timeMins: number;
  completed: boolean;
  difficulty?: string;
  problemUrl?: string;
  intuitionHint?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  topicId?: string;
  syncedDate: string; // YYYY-MM-DD
}

export const DEFAULT_SETTINGS: SprintSettings = {
  weeks: 8,
  dailyHours: 4,
  coreScheduleMode: "weekends",
  selectedCores: ["os", "dbms", "cn"],
  targetCompany: "general",
  language: "Java",
  includeMockContests: true,
  reserveMockWeeks: true,
  diagnostic: DEFAULT_DIAGNOSTIC
};

export function getInitialPlanlyState(): PlanlyState {
  const initialPlan = generateSchedule(DEFAULT_SETTINGS);
  return {
    version: 3,
    settings: DEFAULT_SETTINGS,
    plan: initialPlan,
    streaks: {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: new Date().toISOString().split("T")[0]
    },
    currentDayNumber: 1,
    updatedAt: new Date().toISOString()
  };
}

export function loadPlanlyState(): PlanlyState {
  if (typeof window === "undefined") return getInitialPlanlyState();

  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.plan && parsed.version === 3) {
        return parsed as PlanlyState;
      }
    }

    // Auto-migrate from v2 if user had previously generated plan with old single-problem engine
    const legacyRaw = localStorage.getItem(LEGACY_STATE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      const userSettings = legacyParsed.settings || DEFAULT_SETTINGS;
      const freshPlan = generateSchedule(userSettings);
      const migratedState: PlanlyState = {
        version: 3,
        settings: userSettings,
        plan: freshPlan,
        streaks: legacyParsed.streaks || {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date().toISOString().split("T")[0]
        },
        currentDayNumber: legacyParsed.currentDayNumber || 1,
        updatedAt: new Date().toISOString()
      };
      savePlanlyState(migratedState);
      return migratedState;
    }
  } catch (e) {
    console.error("Failed to load Planly state from localStorage", e);
  }

  return getInitialPlanlyState();
}

export function savePlanlyState(state: PlanlyState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist Planly state", e);
  }
}

// Snapshot stack for Undo
export function pushUndoSnapshot(plan: SprintPlan): void {
  if (typeof window === "undefined" || !plan) return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: SprintPlan[] = raw ? JSON.parse(raw) : [];
    // Keep last 6 snapshots
    const nextHistory = [plan, ...history].slice(0, 6);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  } catch (e) {
    console.error("Failed to push undo snapshot", e);
  }
}

export function popUndoSnapshot(): SprintPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const history: SprintPlan[] = JSON.parse(raw);
    if (history.length === 0) return null;
    const popped = history.shift() || null;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return popped;
  } catch (e) {
    console.error("Failed to pop undo snapshot", e);
    return null;
  }
}

// Dedicated helpers for Synced Sprint Tasks (isolated from weekly habits)
export function loadSyncedSprintTasks(): SyncedSprintTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLANLY_SYNCED_TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSyncedSprintTasks(tasks: SyncedSprintTask[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLANLY_SYNCED_TASKS_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent("algocraft-planly-sync-updated"));
  } catch (e) {
    console.error("Failed to save synced sprint tasks", e);
  }
}

// Export sprint tasks to isolated Planly Synced Store
export function syncDayToHabitTasks(dayTasks: PlanTask[]): { addedCount: number; message: string } {
  if (typeof window === "undefined") return { addedCount: 0, message: "Window unavailable" };

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const existing = loadSyncedSprintTasks();
    const existingTaskIds = new Set(existing.map((t) => t.planTaskId));

    const newItems: SyncedSprintTask[] = [];

    dayTasks.forEach((t) => {
      if (!existingTaskIds.has(t.id)) {
        newItems.push({
          id: `synced-${t.id}-${Date.now()}`,
          planTaskId: t.id,
          title: t.title,
          track: t.track,
          subject: t.subject,
          details: t.details,
          timeMins: t.timeMins,
          completed: t.completed,
          difficulty: t.difficulty,
          problemUrl: t.problemUrl,
          intuitionHint: t.intuitionHint,
          pattern: t.pattern,
          timeComplexity: t.timeComplexity,
          spaceComplexity: t.spaceComplexity,
          topicId: t.topicId,
          syncedDate: todayStr
        });
      }
    });

    // Also purge any accidental legacy [Planly] entries in habits storage so habits remain completely unpolluted
    try {
      const rawHabits = localStorage.getItem(HABITS_STORAGE_KEY);
      if (rawHabits) {
        const habits = JSON.parse(rawHabits);
        const filtered = habits.filter((h: any) => !h.title.startsWith("[Planly]"));
        if (filtered.length !== habits.length) {
          localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(filtered));
        }
      }
    } catch {}

    const updated = [...newItems, ...existing];
    saveSyncedSprintTasks(updated);

    return {
      addedCount: newItems.length,
      message: `Exported ${newItems.length} task(s) to Planly Sprint widget on /tasks!`
    };
  } catch (e) {
    console.error("Failed to sync sprint tasks", e);
    return { addedCount: 0, message: "Failed to sync to Tasks" };
  }
}

// Two-way sync: Reconcile completed state between isolated synced store and Planly state
export function reconcileWithCompletedHabits(plan: SprintPlan): { updatedPlan: SprintPlan; syncedCount: number } {
  if (typeof window === "undefined" || !plan) return { updatedPlan: plan, syncedCount: 0 };

  try {
    const syncedTasks = loadSyncedSprintTasks();
    if (syncedTasks.length === 0) return { updatedPlan: plan, syncedCount: 0 };

    const completedTaskIds = new Set(
      syncedTasks.filter((t) => t.completed).map((t) => t.planTaskId)
    );

    let syncedCount = 0;
    const newWeeks = plan.weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => ({
        ...d,
        tasks: d.tasks.map((t) => {
          if (!t.completed && completedTaskIds.has(t.id)) {
            syncedCount++;
            return { ...t, completed: true, confidence: t.confidence || "clean" };
          }
          return t;
        })
      }))
    }));

    return {
      updatedPlan: { ...plan, weeks: newWeeks },
      syncedCount
    };
  } catch (e) {
    return { updatedPlan: plan, syncedCount: 0 };
  }
}
