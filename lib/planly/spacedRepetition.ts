import { ConfidenceLevel, PlanTask, SprintPlan } from "./types";

export function getSpacedRepetitionOffset(confidence: ConfidenceLevel): number | null {
  if (confidence === "struggled") return 2;
  if (confidence === "hint") return 5;
  if (confidence === "clean") return 10;
  return null;
}

export function injectSpacedRepetitionTask(
  plan: SprintPlan,
  sourceTask: PlanTask,
  currentDayNumber: number
): { updatedPlan: SprintPlan; scheduledDay: number | null } {
  const offset = getSpacedRepetitionOffset(sourceTask.confidence);
  if (!offset) return { updatedPlan: plan, scheduledDay: null };

  const baseTargetDay = currentDayNumber + offset;
  const totalDays = plan.metadata.totalDays;

  if (baseTargetDay > totalDays) {
    return { updatedPlan: plan, scheduledDay: null };
  }

  // Bidirectional Deduplication (A8):
  // Check if problem already exists in that week's Sunday revision
  const targetWeekNum = Math.ceil(baseTargetDay / 7);
  const targetWeek = plan.weeks.find((w) => w.weekNumber === targetWeekNum);

  if (targetWeek) {
    const sundayDay = targetWeek.days.find((d) => d.dayOfWeek === 7);
    if (sundayDay) {
      const cleanSrcTitle = sourceTask.title.replace(/^\[(Re-attempt Drill|Re-solve|Fresh Challenge)\]\s*/, "").trim();
      const existsOnSunday = sundayDay.tasks.some((t) => {
        if (sourceTask.problemUrl && t.problemUrl && t.problemUrl === sourceTask.problemUrl) return true;
        const cleanTTitle = t.title.replace(/^\[(Re-attempt Drill|Re-solve|Fresh Challenge)\]\s*/, "").trim();
        return cleanTTitle.length > 3 && cleanTTitle === cleanSrcTitle;
      });
      if (existsOnSunday) {
        return { updatedPlan: plan, scheduledDay: null };
      }
    }
  }

  // Capacity-clamped day selection:
  // Starting from baseTargetDay, find first day with remaining capacity for 30 mins
  let chosenDayNum: number | null = null;
  for (let candDay = baseTargetDay; candDay <= totalDays; candDay++) {
    for (const w of plan.weeks) {
      const d = w.days.find((day) => day.dayNumber === candDay);
      if (d) {
        const currentMins = d.tasks.reduce((sum, t) => sum + t.timeMins, 0);
        const dayLimit = d.allocatedMins || (plan.metadata.dailyHours * 60);

        if (currentMins + 30 <= dayLimit) {
          chosenDayNum = candDay;
          break;
        }

        // Sunday revision day with this-week block can absorb 30 mins
        if (d.dayOfWeek === 7 && d.tasks.some((t) => t.revisionMeta?.block === "this-week")) {
          chosenDayNum = candDay;
          break;
        }
      }
    }
    if (chosenDayNum !== null) break;
  }

  if (chosenDayNum === null) {
    return { updatedPlan: plan, scheduledDay: null };
  }

  const revisitTask: PlanTask = {
    id: `sr-${currentDayNumber}-${chosenDayNum}-${sourceTask.id}`,
    track: "Spaced Repetition",
    title: `[Re-attempt Drill] ${sourceTask.title}`,
    subject: "Spaced Retention Engine",
    details: [
      "Re-code solution with fresh intuition",
      sourceTask.confidence === "struggled"
        ? "Target: complete without viewing hints/editorials"
        : "Target: optimize for speed and space complexity"
    ],
    timeMins: 30,
    confidence: null,
    completed: false,
    isBacklogEligible: true,
    difficulty: sourceTask.difficulty,
    problemUrl: sourceTask.problemUrl,
    videoUrl: sourceTask.videoUrl,
    intuitionHint: sourceTask.intuitionHint,
    topicId: sourceTask.topicId,
    pattern: sourceTask.pattern,
    timeComplexity: sourceTask.timeComplexity,
    spaceComplexity: sourceTask.spaceComplexity,
    originDay: currentDayNumber
  };

  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      if (d.dayNumber !== chosenDayNum) return d;

      const adjustedTasks = [...d.tasks];
      const currentMins = d.tasks.reduce((sum, t) => sum + t.timeMins, 0);
      const dayLimit = d.allocatedMins || (plan.metadata.dailyHours * 60);

      // If Sunday absorbs and total exceeds limit, shorten a non-completed this-week task
      if (currentMins + 30 > dayLimit && d.dayOfWeek === 7) {
        const thisWeekBlock = adjustedTasks.find(
          (t) => t.revisionMeta?.block === "this-week" && !t.completed && t.timeMins > 30
        );
        if (thisWeekBlock) {
          thisWeekBlock.timeMins -= 30;
        }
      }

      return {
        ...d,
        tasks: [...adjustedTasks, revisitTask]
      };
    })
  }));

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    scheduledDay: chosenDayNum
  };
}

export function applyRestDay(
  plan: SprintPlan,
  currentDayNumber: number
): { updatedPlan: SprintPlan; affectedTasksCount: number } {
  let affectedTasksCount = 0;
  const tasksToShift: PlanTask[] = [];

  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      if (d.dayNumber === currentDayNumber) {
        // Collect uncompleted tasks from this day
        d.tasks.forEach((t) => {
          if (!t.completed) {
            tasksToShift.push({ ...t });
            affectedTasksCount++;
          }
        });
        const restTask: PlanTask = {
          id: `rest-${currentDayNumber}`,
          track: "Buffer & Consolidation",
          title: "Scheduled Rest & Brain Recovery Day",
          subject: "Wellbeing & Cognitive Reset",
          details: [
            "Tasks have been pushed forward to future slots without penalty debt",
            "Rest, hydration, and light physical activity"
          ],
          timeMins: 0,
          confidence: null,
          completed: true,
          isBacklogEligible: false
        };

        return {
          ...d,
          isRestDay: true,
          tasks: [restTask]
        };
      }
      return d;
    })
  }));

  // Redistribute shifted tasks into subsequent buffer/weekend days or next days
  if (tasksToShift.length > 0) {
    let taskIdx = 0;
    newWeeks.forEach((w) => {
      w.days.forEach((d) => {
        if (d.dayNumber > currentDayNumber && (d.isBufferDay || d.isSaturday) && taskIdx < tasksToShift.length) {
          const item = tasksToShift[taskIdx++];
          d.tasks.push({
            ...item,
            id: `shifted-${currentDayNumber}-${d.dayNumber}-${item.id}`,
            title: `[Shifted] ${item.title}`
          });
        }
      });
    });
  }

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    affectedTasksCount
  };
}

export function executeIntelligentRebalance(
  plan: SprintPlan,
  backlogTasks: (PlanTask & { dayNumber: number })[]
): { updatedPlan: SprintPlan; rebalancedCount: number } {
  if (!backlogTasks || backlogTasks.length === 0) {
    return { updatedPlan: plan, rebalancedCount: 0 };
  }

  const pending = [...backlogTasks];
  let rebalancedCount = 0;

  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      const clonedTasks = [...d.tasks];

      // Minute-based capacity for Sunday and Saturday
      if ((d.isBufferDay || d.isSaturday) && d.dayNumber > 7 && pending.length > 0) {
        const isSunday = d.dayOfWeek === 7;
        const sundayBacklogBlock = isSunday
          ? clonedTasks.find((t) => t.revisionMeta?.block === "backlog")
          : null;

        // Sunday backlog capacity is 40m; Saturday is 45m
        const maxCapacity = sundayBacklogBlock ? sundayBacklogBlock.timeMins : 45;
        let currentBacklogMins = clonedTasks
          .filter((t) => t.id.startsWith("rebalanced-") || t.id.startsWith("shifted-"))
          .reduce((sum, t) => sum + t.timeMins, 0);

        while (pending.length > 0 && currentBacklogMins + 45 <= maxCapacity) {
          const moveTask = pending.shift();
          if (moveTask) {
            clonedTasks.push({
              id: `rebalanced-${d.dayNumber}-${moveTask.id}`,
              track: moveTask.track,
              title: `[Rebalanced] ${moveTask.title}`,
              subject: `Backlog from Day ${moveTask.dayNumber}`,
              details: moveTask.details,
              timeMins: 45,
              confidence: null,
              completed: false,
              isBacklogEligible: false,
              difficulty: moveTask.difficulty,
              problemUrl: moveTask.problemUrl,
              videoUrl: moveTask.videoUrl,
              intuitionHint: moveTask.intuitionHint,
              topicId: moveTask.topicId,
              pattern: moveTask.pattern,
              timeComplexity: moveTask.timeComplexity,
              spaceComplexity: moveTask.spaceComplexity
            });
            currentBacklogMins += 45;
            rebalancedCount++;
          }
        }
      }

      return {
        ...d,
        tasks: clonedTasks
      };
    })
  }));

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    rebalancedCount
  };
}
