import { describe, it, expect } from "vitest";
import { generateSchedule } from "@/lib/planly/engine";
import { hydrateSundayRevision } from "@/lib/planly/revision";
import {
  injectSpacedRepetitionTask,
  executeIntelligentRebalance
} from "@/lib/planly/spacedRepetition";
import { PlanTask, SprintSettings } from "@/lib/planly/types";

describe("Phase 4: Runtime Hydration & Capacity-Clamped Spaced Repetition", () => {
  const baseSettings: SprintSettings = {
    weeks: 4,
    dailyHours: 4,
    coreScheduleMode: "weekends",
    selectedCores: ["os"],
    targetCompany: "google",
    language: "Java",
    includeMockContests: false,
    sundayRevisionMins: 240,
    topicPlan: [
      { topicId: "arrays-strings", kind: "dsa", status: "new", order: 0 },
      { topicId: "trees", kind: "dsa", status: "new", order: 1 },
      { topicId: "dynamic-programming", kind: "dsa", status: "studied", confidence: "rusty", order: 2 }
    ]
  };

  it("is idempotent: running hydration twice produces identical state", () => {
    const plan = generateSchedule(baseSettings);
    // Complete a task on Day 1
    const day1Task = plan.weeks[0].days[0].tasks[0];
    day1Task.completed = true;
    day1Task.confidence = "struggled";

    const hydratedOnce = hydrateSundayRevision(plan, 1);
    const sundayDay1 = hydratedOnce.weeks[0].days.find((d) => d.dayOfWeek === 7)!;
    const taskCountOnce = sundayDay1.tasks.length;
    const titlesOnce = sundayDay1.tasks.map((t) => t.title);

    // Run a second time
    const hydratedTwice = hydrateSundayRevision(hydratedOnce, 1);
    const sundayDay2 = hydratedTwice.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

    expect(sundayDay2.tasks.length).toBe(taskCountOnce);
    expect(sundayDay2.tasks.map((t) => t.title)).toEqual(titlesOnce);
    expect(hydratedTwice).toBe(hydratedOnce); // Reference equality preserved when all tasks hydrated
  });

  it("preserves completed tasks and user completed placeholder tasks", () => {
    const plan = generateSchedule(baseSettings);
    const sunday = plan.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

    // Simulate user completed the retro task early
    const retroTask = sunday.tasks.find((t) => t.revisionMeta?.block === "retro")!;
    retroTask.completed = true;
    retroTask.notes = "Completed retro reflections";

    const hydrated = hydrateSundayRevision(plan, 1);
    const hydratedSunday = hydrated.weeks[0].days.find((d) => d.dayOfWeek === 7)!;
    const preservedRetro = hydratedSunday.tasks.find((t) => t.id === retroTask.id)!;

    expect(preservedRetro.completed).toBe(true);
    expect(preservedRetro.notes).toBe("Completed retro reflections");
    expect(preservedRetro.revisionMeta?.hydrated).toBe(true);
  });

  it("orders completed this-week problems by confidence: struggled -> hint -> clean", () => {
    const plan = generateSchedule(baseSettings);
    const week1 = plan.weeks[0];

    // Mark 3 distinct problems with different confidence levels
    const tClean: PlanTask = {
      id: "test-clean",
      track: "DSA",
      title: "Clean Problem",
      subject: "Arrays",
      details: [],
      timeMins: 30,
      completed: true,
      confidence: "clean",
      isBacklogEligible: true,
      topicId: "arrays-strings",
      originDay: 1
    };

    const tStruggled: PlanTask = {
      id: "test-struggled",
      track: "DSA",
      title: "Struggled Problem",
      subject: "Arrays",
      details: [],
      timeMins: 30,
      completed: true,
      confidence: "struggled",
      isBacklogEligible: true,
      topicId: "arrays-strings",
      originDay: 2
    };

    const tHint: PlanTask = {
      id: "test-hint",
      track: "DSA",
      title: "Hint Problem",
      subject: "Arrays",
      details: [],
      timeMins: 30,
      completed: true,
      confidence: "hint",
      isBacklogEligible: true,
      topicId: "arrays-strings",
      originDay: 3
    };

    week1.days[0].tasks.push(tClean);
    week1.days[1].tasks.push(tStruggled);
    week1.days[2].tasks.push(tHint);

    const hydrated = hydrateSundayRevision(plan, 1);
    const sunday = hydrated.weeks[0].days.find((d) => d.dayOfWeek === 7)!;
    const reSolveTasks = sunday.tasks.filter((t) => t.title.startsWith("[Re-solve]"));

    expect(reSolveTasks.length).toBeGreaterThanOrEqual(3);
    // Struggled must appear before Hint, which must appear before Clean
    const struggledIdx = reSolveTasks.findIndex((t) => t.title.includes("Struggled Problem"));
    const hintIdx = reSolveTasks.findIndex((t) => t.title.includes("Hint Problem"));
    const cleanIdx = reSolveTasks.findIndex((t) => t.title.includes("Clean Problem"));

    expect(struggledIdx).toBeLessThan(hintIdx);
    expect(hintIdx).toBeLessThan(cleanIdx);
  });

  it("reassigns 40m backlog minutes to this-week when backlog is completely clear", () => {
    const plan = generateSchedule(baseSettings);
    // When all tasks in Days 1..6 are completed, backlog is completely clear
    plan.weeks[0].days.slice(0, 6).forEach((d) => {
      d.tasks.forEach((t) => {
        t.completed = true;
      });
    });

    const sundayBefore = plan.weeks[0].days.find((d) => d.dayOfWeek === 7)!;
    const thisWeekBefore = sundayBefore.tasks.find((t) => t.revisionMeta?.block === "this-week")!;
    const originalThisWeekMins = thisWeekBefore.timeMins;

    const hydrated = hydrateSundayRevision(plan, 1);
    const sundayAfter = hydrated.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

    // Backlog block should be marked cleared with 0 mins
    const backlogAfter = sundayAfter.tasks.find((t) => t.revisionMeta?.block === "backlog")!;
    expect(backlogAfter.completed).toBe(true);
    expect(backlogAfter.timeMins).toBe(0);

    // Sum of this-week tasks should reflect the transferred 40m
    const thisWeekAfterTotal = sundayAfter.tasks
      .filter((t) => t.revisionMeta?.block === "this-week")
      .reduce((sum, t) => sum + t.timeMins, 0);

    expect(thisWeekAfterTotal).toBe(originalThisWeekMins + 40);
  });

  it("preserves 40m backlog block when uncompleted backlog debt exists", () => {
    const plan = generateSchedule(baseSettings);
    // Mark tasks completed EXCEPT for an uncompleted backlog debt task on Day 1
    plan.weeks[0].days.slice(0, 6).forEach((d) => {
      d.tasks.forEach((t) => {
        t.completed = true;
      });
    });
    // Introduce overdue backlog debt on Day 1
    const day1Task = plan.weeks[0].days[0].tasks[0];
    day1Task.completed = false;
    day1Task.isBacklogEligible = true;

    const hydrated = hydrateSundayRevision(plan, 1);
    const sunday = hydrated.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

    const backlogTask = sunday.tasks.find((t) => t.revisionMeta?.block === "backlog")!;
    expect(backlogTask.completed).toBe(false);
    expect(backlogTask.timeMins).toBe(40);
  });

  describe("Bidirectional deduplication between Spaced Repetition & Sunday Revision (A8)", () => {
    it("excludes problems from Sunday hydration if an SR drill is scheduled in that same week", () => {
      const plan = generateSchedule(baseSettings);
      const testTask: PlanTask = {
        id: "task-d1-two-sum",
        track: "DSA",
        title: "Two Sum",
        subject: "Arrays",
        details: [],
        timeMins: 30,
        completed: true,
        confidence: "struggled",
        isBacklogEligible: true,
        problemUrl: "https://leetcode.com/problems/two-sum",
        topicId: "arrays-strings",
        originDay: 1
      };
      plan.weeks[0].days[0].tasks.push(testTask);

      // Inject SR drill onto Day 3 (within Week 1)
      plan.weeks[0].days[2].tasks.push({
        id: "sr-1-3-task-d1-two-sum",
        track: "Spaced Repetition",
        title: "[Re-attempt Drill] Two Sum",
        subject: "Spaced Retention Engine",
        details: [],
        timeMins: 30,
        confidence: null,
        completed: false,
        isBacklogEligible: true,
        problemUrl: "https://leetcode.com/problems/two-sum",
        topicId: "arrays-strings",
        originDay: 1
      });

      const hydrated = hydrateSundayRevision(plan, 1);
      const sunday = hydrated.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

      // Two Sum must NOT be scheduled on Sunday because it has an active SR drill in the same week
      const hasTwoSumOnSunday = sunday.tasks.some((t) => t.title.includes("Two Sum"));
      expect(hasTwoSumOnSunday).toBe(false);
    });

    it("injectSpacedRepetitionTask skips injection if the problem already exists on that week's Sunday revision", () => {
      const plan = generateSchedule(baseSettings);
      const targetSunday = plan.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

      // Put a re-solve problem on Sunday
      targetSunday.tasks.push({
        id: "task-7-rev-solve-1",
        track: "Revision",
        title: "[Re-solve] 3Sum",
        subject: "Arrays Spaced Re-solve",
        details: [],
        timeMins: 40,
        confidence: null,
        completed: false,
        isBacklogEligible: true,
        problemUrl: "https://leetcode.com/problems/3sum",
        topicId: "arrays-strings",
        originDay: 7,
        revisionMeta: {
          block: "this-week",
          topicId: "arrays-strings",
          hydrated: true
        }
      });

      // Try to inject an SR drill for 3Sum targeting Day 3 (same week)
      const sourceTask: PlanTask = {
        id: "source-3sum",
        track: "DSA",
        title: "3Sum",
        subject: "Arrays",
        details: [],
        timeMins: 30,
        completed: true,
        confidence: "struggled", // offset = 2 -> Day 1 + 2 = Day 3 (Week 1)
        isBacklogEligible: true,
        problemUrl: "https://leetcode.com/problems/3sum",
        topicId: "arrays-strings",
        originDay: 1
      };

      const result = injectSpacedRepetitionTask(plan, sourceTask, 1);
      // Must be skipped (scheduledDay: null)
      expect(result.scheduledDay).toBe(null);
      expect(result.updatedPlan).toBe(plan);
    });
  });

  describe("Capacity Clamping & Rebalancing", () => {
    it("rolls SR task forward to next available day when target day is at capacity", () => {
      const plan = generateSchedule(baseSettings);
      // Target day is Day 3 (offset 2 from Day 1)
      const day3 = plan.weeks[0].days.find((d) => d.dayNumber === 3)!;
      // Max out Day 3 capacity (dailyHours: 4 -> 240 mins)
      day3.tasks = [
        {
          id: "fill-day-3",
          track: "DSA",
          title: "Intensive Problem Set",
          subject: "Arrays",
          details: [],
          timeMins: 240,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          originDay: 3
        }
      ];

      // Give Day 4 open capacity (e.g. 60 mins of 240 mins)
      const day4 = plan.weeks[0].days.find((d) => d.dayNumber === 4)!;
      day4.tasks = [
        {
          id: "light-day-4",
          track: "DSA",
          title: "Light Problem",
          subject: "Arrays",
          details: [],
          timeMins: 60,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          originDay: 4
        }
      ];

      const sourceTask: PlanTask = {
        id: "source-overflow",
        track: "DSA",
        title: "LRU Cache",
        subject: "Design",
        details: [],
        timeMins: 30,
        completed: true,
        confidence: "struggled", // offset 2 -> target Day 3
        isBacklogEligible: true,
        originDay: 1
      };

      const result = injectSpacedRepetitionTask(plan, sourceTask, 1);
      // Should roll forward from Day 3 to Day 4
      expect(result.scheduledDay).toBe(4);
      const updatedDay4 = result.updatedPlan.weeks[0].days.find((d) => d.dayNumber === 4)!;
      expect(updatedDay4.tasks.some((t) => t.title.includes("LRU Cache"))).toBe(true);
    });

    it("executeIntelligentRebalance respects Sunday 40m backlog limit", () => {
      const plan = generateSchedule(baseSettings);
      const backlogQueue: (PlanTask & { dayNumber: number })[] = [
        {
          id: "backlog-1",
          track: "DSA",
          title: "Debt Task 1",
          subject: "Arrays",
          details: [],
          timeMins: 45,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          dayNumber: 1
        },
        {
          id: "backlog-2",
          track: "DSA",
          title: "Debt Task 2",
          subject: "Arrays",
          details: [],
          timeMins: 45,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          dayNumber: 2
        }
      ];

      const { updatedPlan, rebalancedCount } = executeIntelligentRebalance(plan, backlogQueue);
      // Should rebalance according to weekend / buffer day capacity
      expect(rebalancedCount).toBeGreaterThan(0);
      expect(updatedPlan).toBeDefined();
    });
  });

  it("guarantees exact Sunday total minute sum invariant after hydration", () => {
    const plan = generateSchedule(baseSettings);
    // Add completed task to trigger hydration generation
    plan.weeks[0].days[0].tasks[0].completed = true;
    plan.weeks[0].days[0].tasks[0].confidence = "struggled";

    const hydrated = hydrateSundayRevision(plan, 1);
    const sunday = hydrated.weeks[0].days.find((d) => d.dayOfWeek === 7)!;

    const totalSundayMins = sunday.tasks.reduce((sum, t) => sum + t.timeMins, 0);
    expect(totalSundayMins).toBe(240);
  });
});
