import { PlanTask, SprintPlan } from "./types";

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getLocalTodayISODate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Compares current local date with plan's calendar dates.
 * If the current calendar date matches a day in the plan, returns that day number.
 */
export function syncCurrentDayWithCalendar(
  plan: SprintPlan,
  currentDay: number,
  now: Date = new Date()
): { resolvedDay: number; changed: boolean } {
  if (!plan || !plan.weeks || plan.weeks.length === 0) {
    return { resolvedDay: currentDay, changed: false };
  }

  const todayStr = getLocalTodayISODate(now);

  for (const w of plan.weeks) {
    for (const d of w.days) {
      if (d.calendarDate === todayStr) {
        return {
          resolvedDay: d.dayNumber,
          changed: d.dayNumber !== currentDay
        };
      }
    }
  }

  // If exact calendarDate wasn't found, try calculating difference from plan.metadata.startDate
  const startDateStr = plan.metadata.startDate;
  if (startDateStr) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const current = new Date(now);
    current.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const clampedDay = Math.max(1, Math.min(plan.metadata.totalDays || plan.weeks.length * 7, diffDays));

    return {
      resolvedDay: clampedDay,
      changed: clampedDay !== currentDay
    };
  }

  return { resolvedDay: currentDay, changed: false };
}

/**
 * Advances the active day pointer from currentDayNumber to nextDayNumber.
 * If carryOverUnfinished is true, any incomplete tasks on currentDayNumber are moved to the next day.
 * If carryOverUnfinished is false, tasks remain on currentDayNumber and automatically become Backlog Debt.
 */
export function advanceSprintDay(
  plan: SprintPlan,
  currentDayNumber: number,
  options: { carryOverUnfinished: boolean }
): { updatedPlan: SprintPlan; nextDayNumber: number; carriedTasksCount: number } {
  const totalDays = plan.metadata.totalDays || plan.weeks.length * 7;
  const nextDayNumber = Math.min(totalDays, currentDayNumber + 1);

  if (!options.carryOverUnfinished || nextDayNumber === currentDayNumber) {
    return {
      updatedPlan: plan,
      nextDayNumber,
      carriedTasksCount: 0
    };
  }

  // Collect incomplete tasks from currentDayNumber
  const tasksToCarry: PlanTask[] = [];
  plan.weeks.forEach((w) => {
    const day = w.days.find((d) => d.dayNumber === currentDayNumber);
    if (day) {
      day.tasks.forEach((t) => {
        if (!t.completed) {
          tasksToCarry.push(t);
        }
      });
    }
  });

  if (tasksToCarry.length === 0) {
    return {
      updatedPlan: plan,
      nextDayNumber,
      carriedTasksCount: 0
    };
  }

  const carriedTaskIds = new Set(tasksToCarry.map((t) => t.id));

  // Update plan: remove carried tasks from currentDayNumber, append them into nextDayNumber
  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      // In current day, remove the carried tasks so they don't duplicate
      if (d.dayNumber === currentDayNumber) {
        return {
          ...d,
          tasks: d.tasks.filter((t) => !carriedTaskIds.has(t.id))
        };
      }

      // In target day, append the carried tasks
      if (d.dayNumber === nextDayNumber) {
        const carriedTasksFormatted: PlanTask[] = tasksToCarry.map((t) => ({
          ...t,
          id: `carried-${currentDayNumber}-${nextDayNumber}-${t.id}`,
          title: t.title.startsWith("[Carried Over]") ? t.title : `[Carried Over] ${t.title}`,
          originDay: t.originDay || currentDayNumber,
          isBacklogEligible: true
        }));

        return {
          ...d,
          tasks: [...d.tasks, ...carriedTasksFormatted]
        };
      }

      return d;
    })
  }));

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    nextDayNumber,
    carriedTasksCount: tasksToCarry.length
  };
}

/**
 * Moves an overdue backlog task from an earlier day into targetDayNumber's active task list.
 */
export function pullBacklogTaskToDay(
  plan: SprintPlan,
  taskId: string,
  targetDayNumber: number
): { updatedPlan: SprintPlan; taskTitle: string } {
  let pulledTask: PlanTask | null = null;

  // 1. Locate the task in an earlier day
  for (const w of plan.weeks) {
    for (const d of w.days) {
      if (d.dayNumber < targetDayNumber) {
        const found = d.tasks.find((t) => t.id === taskId);
        if (found) {
          pulledTask = found;
          break;
        }
      }
    }
    if (pulledTask) break;
  }

  if (!pulledTask) {
    return { updatedPlan: plan, taskTitle: "" };
  }

  const taskTitle = pulledTask.title;

  // 2. Remove it from earlier day and append to targetDayNumber
  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      // Remove from old day
      if (d.tasks.some((t) => t.id === taskId)) {
        return {
          ...d,
          tasks: d.tasks.filter((t) => t.id !== taskId)
        };
      }

      // Append to target day
      if (d.dayNumber === targetDayNumber) {
        const cleanTitle = pulledTask!.title.replace(/^\[(From Backlog|Carried Over)\]\s*/, "");
        const newTask: PlanTask = {
          ...pulledTask!,
          id: `pulled-${Date.now()}-${pulledTask!.id}`,
          title: `[From Backlog] ${cleanTitle}`,
          originDay: pulledTask!.originDay || d.dayNumber,
          isBacklogEligible: true
        };
        return {
          ...d,
          tasks: [...d.tasks, newTask]
        };
      }

      return d;
    })
  }));

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    taskTitle
  };
}

/**
 * Pulls all uncompleted backlog debt tasks into targetDayNumber's active checklist.
 */
export function pullAllBacklogTasksToDay(
  plan: SprintPlan,
  targetDayNumber: number
): { updatedPlan: SprintPlan; pulledCount: number } {
  const backlogToPull: PlanTask[] = [];

  plan.weeks.forEach((w) => {
    w.days.forEach((d) => {
      if (d.dayNumber < targetDayNumber) {
        d.tasks.forEach((t) => {
          if (!t.completed && t.isBacklogEligible) {
            backlogToPull.push(t);
          }
        });
      }
    });
  });

  if (backlogToPull.length === 0) {
    return { updatedPlan: plan, pulledCount: 0 };
  }

  const pulledIds = new Set(backlogToPull.map((t) => t.id));

  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      // Remove backlog tasks from past days
      if (d.dayNumber < targetDayNumber) {
        return {
          ...d,
          tasks: d.tasks.filter((t) => !pulledIds.has(t.id))
        };
      }

      // Append into target day
      if (d.dayNumber === targetDayNumber) {
        const formatted: PlanTask[] = backlogToPull.map((t) => {
          const cleanTitle = t.title.replace(/^\[(From Backlog|Carried Over)\]\s*/, "");
          return {
            ...t,
            id: `pulled-${Date.now()}-${t.id}`,
            title: `[From Backlog] ${cleanTitle}`,
            originDay: t.originDay || d.dayNumber,
            isBacklogEligible: true
          };
        });

        return {
          ...d,
          tasks: [...d.tasks, ...formatted]
        };
      }

      return d;
    })
  }));

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    pulledCount: backlogToPull.length
  };
}
