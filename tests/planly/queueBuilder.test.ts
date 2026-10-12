import { describe, it, expect } from "vitest";
import { buildTopicQueue, generateSchedule } from "@/lib/planly/engine";
import { SprintSettings, TopicPlanEntry } from "@/lib/planly/types";

describe("Phase 2: Topic Queue Builder & Engine Wiring Tests", () => {
  it("Scenario 1: All studied topics produces all revision weeks", () => {
    const settings: SprintSettings = {
      weeks: 8,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "general",
      language: "Java",
      includeMockContests: true,
      topicPlan: [
        { topicId: "arrays-strings", kind: "dsa", status: "studied", confidence: "solid", order: 0 },
        { topicId: "binary-search", kind: "dsa", status: "studied", confidence: "okay", order: 1 }
      ]
    };

    const result = buildTopicQueue(settings, 7);
    expect(result.assignments.length).toBe(7);
    expect(result.droppedTopicIds).toEqual([]);
    expect(result.assignments.every((a) => a.isRevisionWeek && a.topicIds.length === 0)).toBe(true);
  });

  it("Scenario 2: Topics < contentWeeks distributes extra weeks and revision weeks (Case B)", () => {
    // 2 new topics in 5 content weeks.
    // Extra weeks = 3. Capped at 2 extra weeks per topic (3 total weeks).
    const settings: SprintSettings = {
      weeks: 6,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "google", // DP gets weight boost
      language: "Java",
      includeMockContests: true,
      topicPlan: [
        { topicId: "dynamic-programming", kind: "dsa", status: "new", order: 0 },
        { topicId: "binary-search", kind: "dsa", status: "new", order: 1 }
      ]
    };

    const result = buildTopicQueue(settings, 5);
    expect(result.assignments.length).toBe(5);
    expect(result.droppedTopicIds).toEqual([]);

    // Topics appear in user's order: DP first, then binary-search
    const assignedTopicIds = result.assignments.flatMap((a) => a.topicIds);
    expect(assignedTopicIds[0]).toBe("dynamic-programming");

    // DP has higher weight, so it gets max 3 weeks (Weeks 1, 2, 3)
    expect(result.assignments[0].topicIds).toEqual(["dynamic-programming"]);
    expect(result.assignments[1].topicIds).toEqual(["dynamic-programming"]);
    expect(result.assignments[2].topicIds).toEqual(["dynamic-programming"]);

    // binary-search gets 2 weeks (Weeks 4, 5)
    expect(result.assignments[3].topicIds).toEqual(["binary-search"]);
    expect(result.assignments[4].topicIds).toEqual(["binary-search"]);
  });

  it("Scenario 3: Leftover weeks when all topics hit cap of 3 weeks become Revision Weeks", () => {
    // 1 topic in 5 content weeks.
    // 1 topic can take at most 3 weeks total (1 base + 2 extra).
    // Remaining 2 weeks become revision weeks placed at the end.
    const settings: SprintSettings = {
      weeks: 6,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "general",
      language: "Java",
      includeMockContests: true,
      topicPlan: [
        { topicId: "arrays-strings", kind: "dsa", status: "new", order: 0 }
      ]
    };

    const result = buildTopicQueue(settings, 5);
    expect(result.assignments.length).toBe(5);
    // Weeks 1-3: arrays-strings
    expect(result.assignments[0].topicIds).toEqual(["arrays-strings"]);
    expect(result.assignments[1].topicIds).toEqual(["arrays-strings"]);
    expect(result.assignments[2].topicIds).toEqual(["arrays-strings"]);
    // Weeks 4-5: Revision weeks
    expect(result.assignments[3].isRevisionWeek).toBe(true);
    expect(result.assignments[4].isRevisionWeek).toBe(true);
  });

  it("Scenario 4: Topics >= contentWeeks distributes topics evenly across weeks (Case A)", () => {
    // 6 topics across 4 content weeks -> 2 topics in week 1, 2 in week 2, 1 in week 3, 1 in week 4
    const settings: SprintSettings = {
      weeks: 4,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "general",
      language: "Java",
      includeMockContests: false,
      topicPlan: [
        { topicId: "arrays-strings", kind: "dsa", status: "new", order: 0 },
        { topicId: "sliding-window", kind: "dsa", status: "new", order: 1 },
        { topicId: "binary-search", kind: "dsa", status: "new", order: 2 },
        { topicId: "trees", kind: "dsa", status: "new", order: 3 },
        { topicId: "graphs", kind: "dsa", status: "new", order: 4 },
        { topicId: "dynamic-programming", kind: "dsa", status: "new", order: 5 }
      ]
    };

    const result = buildTopicQueue(settings, 4);
    expect(result.assignments.length).toBe(4);
    expect(result.droppedTopicIds).toEqual([]);

    expect(result.assignments[0].topicIds).toEqual(["arrays-strings", "sliding-window"]);
    expect(result.assignments[1].topicIds).toEqual(["binary-search", "trees"]);
    expect(result.assignments[2].topicIds).toEqual(["graphs"]);
    expect(result.assignments[3].topicIds).toEqual(["dynamic-programming"]);
  });

  it("Scenario 5: Cap of 3 topics per week drops lowest-weight tail topics with deterministic tie-break", () => {
    // 5 content weeks. Max capacity = 5 * 3 = 15 topics.
    // 17 topics provided. 2 topics must be dropped.
    const all17Topics = [
      "maths", "sorting", "arrays-strings", "binary-search",
      "recursion-backtracking", "bit-manipulation", "greedy", "linked-list",
      "stacks-queues", "sliding-window", "trees", "binary-search-trees",
      "heaps", "graphs", "dynamic-programming", "tries", "string-algorithms"
    ];

    const topicPlan: TopicPlanEntry[] = all17Topics.map((id, idx) => ({
      topicId: id,
      kind: "dsa",
      status: "new",
      order: idx
    }));

    const settings: SprintSettings = {
      weeks: 6, // 1 mock week, 5 content weeks
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "google", // Boosts DP and Graphs
      language: "Java",
      includeMockContests: true,
      topicPlan
    };

    const result = buildTopicQueue(settings, 5);
    expect(result.droppedTopicIds.length).toBe(2);

    // High weight topics like DP and Graphs must NOT be dropped
    expect(result.droppedTopicIds).not.toContain("dynamic-programming");
    expect(result.droppedTopicIds).not.toContain("graphs");

    // Exactly 15 topics retained across 5 weeks (3 per week)
    expect(result.assignments.length).toBe(5);
    expect(result.assignments.every((a) => a.topicIds.length === 3)).toBe(true);
  });

  it("Scenario 6: End-to-end generateSchedule respects custom user topic order and populates week topicIds", () => {
    const customOrder = [
      "dynamic-programming",
      "graphs",
      "trees",
      "binary-search"
    ];

    const topicPlan: TopicPlanEntry[] = customOrder.map((id, idx) => ({
      topicId: id,
      kind: "dsa",
      status: "new",
      order: idx
    }));

    const settings: SprintSettings = {
      weeks: 4,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["dbms"],
      targetCompany: "general",
      language: "Java",
      includeMockContests: false,
      topicPlan
    };

    const plan = generateSchedule(settings);
    expect(plan.weeks.length).toBe(4);

    // Week 1 should be DP, Week 2 Graphs, Week 3 Trees, Week 4 BS
    expect(plan.weeks[0].topicIds).toEqual(["dynamic-programming"]);
    expect(plan.weeks[1].topicIds).toEqual(["graphs"]);
    expect(plan.weeks[2].topicIds).toEqual(["trees"]);
    expect(plan.weeks[3].topicIds).toEqual(["binary-search"]);

    // Core CS subject populated on week
    expect(plan.weeks[0].coreTopicIds).toEqual(["dbms"]);
  });

  it("Scenario 7: Sequential weekday splitting in multi-topic weeks", () => {
    // 2 topics in Week 1: Days 1-3 on Topic 1, Days 4-5 on Topic 2
    const topicPlan: TopicPlanEntry[] = [
      { topicId: "arrays-strings", kind: "dsa", status: "new", order: 0 },
      { topicId: "binary-search", kind: "dsa", status: "new", order: 1 }
    ];

    const settings: SprintSettings = {
      weeks: 1,
      dailyHours: 4,
      coreScheduleMode: "weekends",
      selectedCores: ["os"],
      targetCompany: "general",
      language: "Java",
      includeMockContests: false,
      topicPlan
    };

    const plan = generateSchedule(settings);
    const week1 = plan.weeks[0];

    // Day 1, 2, 3 should feature Arrays & Strings
    const day1DsaTask = week1.days[0].tasks.find((t) => t.track === "DSA");
    expect(day1DsaTask?.subject).toContain("Arrays & Strings");

    const day3DsaTask = week1.days[2].tasks.find((t) => t.track === "DSA");
    expect(day3DsaTask?.subject).toContain("Arrays & Strings");

    // Day 4, 5 should feature Binary Search
    const day4DsaTask = week1.days[3].tasks.find((t) => t.track === "DSA");
    expect(day4DsaTask?.subject).toContain("Binary Search");

    const day5DsaTask = week1.days[4].tasks.find((t) => t.track === "DSA");
    expect(day5DsaTask?.subject).toContain("Binary Search");
  });
});
