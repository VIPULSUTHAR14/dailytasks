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

  const targetDayNum = currentDayNumber + offset;
  const totalDays = plan.metadata.totalDays;

  // If outside sprint bounds, clamp to the nearest buffer day or drop
  if (targetDayNum > totalDays) {
    return { updatedPlan: plan, scheduledDay: null };
  }

  let foundTarget = false;
  const newWeeks = plan.weeks.map((w) => ({
    ...w,
    days: w.days.map((d) => {
      if (d.dayNumber === targetDayNum) {
        foundTarget = true;
        const revisitTask: PlanTask = {
          id: `revisit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
          intuitionHint: sourceTask.intuitionHint,
          topicId: sourceTask.topicId,
          pattern: sourceTask.pattern,
          timeComplexity: sourceTask.timeComplexity,
          spaceComplexity: sourceTask.spaceComplexity,
          originDay: currentDayNumber
        };
        return {
          ...d,
          tasks: [...d.tasks, revisitTask]
        };
      }
      return d;
    })
  }));

  return {
    updatedPlan: { ...plan, weeks: newWeeks },
    scheduledDay: foundTarget ? targetDayNum : null
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
          id: `rest-${Date.now()}`,
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
            id: `shifted-${Date.now()}-${taskIdx}`,
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
      // Inject into future Saturday / Sunday buffer slots that aren't overloaded (<= 4 tasks)
      if ((d.isBufferDay || d.isSaturday) && d.dayNumber > 7 && pending.length > 0 && clonedTasks.length < 5) {
        const moveTask = pending.shift();
        if (moveTask) {
          clonedTasks.push({
            id: `rebalanced-${Date.now()}-${rebalancedCount}`,
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
            intuitionHint: moveTask.intuitionHint,
            topicId: moveTask.topicId,
            pattern: moveTask.pattern,
            timeComplexity: moveTask.timeComplexity,
            spaceComplexity: moveTask.spaceComplexity
          });
          rebalancedCount++;
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
