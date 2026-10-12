import { describe, it, expect } from "vitest";
import {
  buildRevisionPool,
  buildSundayRevision,
  buildCoreCsRecallTask
} from "@/lib/planly/revision";
import { generateSchedule } from "@/lib/planly/engine";
import { SprintSettings } from "@/lib/planly/types";

describe("Phase 3: Revision Pool & Sunday Skeleton Tests", () => {
  it("buildRevisionPool filters studied topics and applies company-critical boost", () => {
    const settings: SprintSettings = {
      weeks: 8,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "google", // DP and Graphs get +1 boost
      language: "Java",
      includeMockContests: true,
      topicPlan: [
        { topicId: "dynamic-programming", kind: "dsa", status: "studied", confidence: "rusty", order: 0 }, // 3 + 1 = 4
        { topicId: "arrays-strings", kind: "dsa", status: "studied", confidence: "okay", order: 1 },       // 2 + 0 = 2
        { topicId: "trees", kind: "dsa", status: "studied", confidence: "solid", skipRevision: true, order: 2 }, // skipped!
        { topicId: "binary-search", kind: "dsa", status: "new", order: 3 } // new -> excluded from pool!
      ]
    };

    const pool = buildRevisionPool(settings);

    // Only 2 topics in pool (trees was skipped, binary-search is new)
    expect(pool.length).toBe(2);

    // Sorted by weight desc: DP (weight 4) first, arrays-strings (weight 2) second
    expect(pool[0].topicId).toBe("dynamic-programming");
    expect(pool[0].weight).toBe(4);

    expect(pool[1].topicId).toBe("arrays-strings");
    expect(pool[1].weight).toBe(2);
  });

  describe("buildSundayRevision exact minute invariant tests (sum === totalMins)", () => {
    const testCases = [
      { name: "0 week topics + empty pool", weekTopics: [], pool: [] },
      { name: "0 week topics + populated pool", weekTopics: [], pool: [{ topicId: "dp", kind: "dsa" as const, weight: 3 }] },
      { name: "1 week topic + empty pool", weekTopics: ["arrays-strings"], pool: [] },
      { name: "1 week topic + populated pool", weekTopics: ["arrays-strings"], pool: [{ topicId: "dp", kind: "dsa" as const, weight: 3 }] },
      { name: "2 week topics + empty pool", weekTopics: ["arrays-strings", "binary-search"], pool: [] },
      { name: "2 week topics + populated pool", weekTopics: ["arrays-strings", "binary-search"], pool: [{ topicId: "dp", kind: "dsa" as const, weight: 3 }] },
      { name: "3 week topics + populated pool", weekTopics: ["arrays-strings", "binary-search", "sliding-window"], pool: [{ topicId: "dp", kind: "dsa" as const, weight: 3 }] }
    ];

    testCases.forEach(({ name, weekTopics, pool }) => {
      it(`guarantees exact 240 mins for: ${name}`, () => {
        const tasks = buildSundayRevision({
          weekNumber: 1,
          dayNumber: 7,
          weekTopicIds: weekTopics,
          pool,
          totalMins: 240
        });

        const sum = tasks.reduce((acc, t) => acc + t.timeMins, 0);
        expect(sum).toBe(240);

        // Every task has Revision track and revisionMeta
        expect(tasks.every((t) => t.track === "Revision")).toBe(true);
        expect(tasks.every((t) => t.revisionMeta !== undefined)).toBe(true);
      });
    });

    it("guarantees exact sum for custom sundayRevisionMins (180 mins and 300 mins)", () => {
      [180, 300].forEach((mins) => {
        const tasks = buildSundayRevision({
          weekNumber: 2,
          dayNumber: 14,
          weekTopicIds: ["trees", "graphs"],
          pool: [{ topicId: "dp", kind: "dsa", weight: 3 }],
          totalMins: mins
        });

        const sum = tasks.reduce((acc, t) => acc + t.timeMins, 0);
        expect(sum).toBe(mins);
      });
    });
  });

  it("buildCoreCsRecallTask generates structured 3-part recall drill", () => {
    const task = buildCoreCsRecallTask({
      subjectKey: "os",
      dayNumber: 7,
      timeMins: 30
    });

    expect(task.track).toBe("Revision");
    expect(task.timeMins).toBe(30);
    expect(task.title).toContain("Revise OS");
    expect(task.details.length).toBe(3);
    expect(task.details[0]).toContain("10-min active recall");
    expect(task.revisionMeta?.kind).toBe("core");
  });

  it("generateSchedule integrates new Sunday revision while preserving mock week Sunday", () => {
    const settings: SprintSettings = {
      weeks: 6, // 5 content weeks + 1 mock week
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "general",
      language: "Java",
      includeMockContests: true,
      sundayRevisionMins: 240,
      topicPlan: [
        { topicId: "arrays-strings", kind: "dsa", status: "new", order: 0 }
      ]
    };

    const plan = generateSchedule(settings);

    // Week 1 (content week) Sunday has new 240m Sunday Revision tasks
    const week1Sunday = plan.weeks[0].days[6];
    expect(week1Sunday.allocatedMins).toBe(240);
    const w1SundaySum = week1Sunday.tasks.reduce((sum, t) => sum + t.timeMins, 0);
    expect(w1SundaySum).toBe(240);
    expect(week1Sunday.tasks.some((t) => t.track === "Revision")).toBe(true);

    // Week 6 (mock week) Sunday remains post-mortem mock review
    const week6Sunday = plan.weeks[5].days[6];
    expect(plan.weeks[5].isMockInterviewWeek).toBe(true);
    expect(week6Sunday.tasks[0].title).toBe("Mock Interview Post-Mortem & Deep Notes Consolidation");
  });
});
