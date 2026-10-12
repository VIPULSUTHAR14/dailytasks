import { describe, it, expect } from "vitest";
import { generateSchedule } from "@/lib/planly/engine";
import { computePlanMetrics } from "@/lib/planly/analytics";
import { SprintSettings, TopicPlanEntry } from "@/lib/planly/types";
import { getDefaultTopicPlan } from "@/lib/planly/storage";
import { resolveTopic } from "@/lib/planly/pools";

describe("Phase 7: Analytics and Topic Readiness (computePlanMetrics)", () => {
  const baseSettings: SprintSettings = {
    targetCompany: "general",
    weeks: 8,
    dailyHours: 4,
    coreScheduleMode: "weekends",
    selectedCores: ["os", "dbms", "cn"],
    language: "Java",
    includeMockContests: true,
    sundayRevisionMins: 240,
    startDate: "2026-03-01"
  };

  it("seeds baseline mastery percentage for studied topics on freshly created plan", () => {
    const customTopicPlan: TopicPlanEntry[] = [
      {
        topicId: "arrays",
        kind: "dsa",
        status: "studied",
        confidence: "solid",
        order: 1
      },
      {
        topicId: "binary-search",
        kind: "dsa",
        status: "studied",
        confidence: "okay",
        order: 2
      },
      {
        topicId: "sliding-window",
        kind: "dsa",
        status: "studied",
        confidence: "rusty",
        order: 3
      },
      {
        topicId: "trees",
        kind: "dsa",
        status: "new",
        order: 4
      }
    ];

    const plan = generateSchedule({
      ...baseSettings,
      topicPlan: customTopicPlan
    });

    const metrics = computePlanMetrics(plan, 1);

    // Arrays (solid): baseline should be 80%
    const arraysStat = metrics.topicMastery.find(
      (tm) => resolveTopic(tm.id || tm.tag)?.id === resolveTopic("arrays")?.id
    );
    expect(arraysStat).toBeDefined();
    expect(arraysStat?.masteryPercentage).toBe(80);

    // Binary Search (okay): baseline should be 50%
    const bsStat = metrics.topicMastery.find(
      (tm) => resolveTopic(tm.id || tm.tag)?.id === resolveTopic("binary-search")?.id
    );
    expect(bsStat).toBeDefined();
    expect(bsStat?.masteryPercentage).toBe(50);

    // Sliding Window (rusty): baseline should be 20%
    const slidingWindowStat = metrics.topicMastery.find(
      (tm) => resolveTopic(tm.id || tm.tag)?.id === resolveTopic("sliding-window")?.id
    );
    expect(slidingWindowStat).toBeDefined();
    expect(slidingWindowStat?.masteryPercentage).toBe(20);

    // Trees (new, no tasks completed yet): mastery should be 0%
    const treesStat = metrics.topicMastery.find(
      (tm) => resolveTopic(tm.id || tm.tag)?.id === resolveTopic("trees")?.id
    );
    expect(treesStat).toBeDefined();
    expect(treesStat?.masteryPercentage).toBe(0);

    // Overall readiness score should reflect studied baseline
    expect(metrics.readinessScore).toBeGreaterThan(0);
  });

  it("counts completed Sunday revision tasks toward topic mastery and raises score", () => {
    const customTopicPlan: TopicPlanEntry[] = [
      {
        topicId: "arrays",
        kind: "dsa",
        status: "studied",
        confidence: "okay", // 50% baseline
        order: 1
      }
    ];

    const plan = generateSchedule({
      ...baseSettings,
      topicPlan: customTopicPlan
    });

    const initialMetrics = computePlanMetrics(plan, 1);
    const initialArraysMastery = initialMetrics.topicMastery.find(
      (tm) => resolveTopic(tm.id || tm.tag)?.id === resolveTopic("arrays")?.id
    )?.masteryPercentage;
    expect(initialArraysMastery).toBe(50);

    // Find Sunday revision day (Day 7)
    const sundayDay = plan.weeks[0].days[6];
    expect(sundayDay.dayOfWeek).toBe(7);

    // Add a completed revision task for Arrays with confidence="clean"
    sundayDay.tasks.push({
      id: "test-rev-arrays-clean",
      track: "Revision",
      title: "[Review Drill] Two Sum",
      subject: "Arrays & Hashing",
      details: ["Re-solve under 25 mins"],
      timeMins: 40,
      confidence: "clean",
      completed: true,
      isBacklogEligible: false,
      topicId: "arrays-strings"
    });

    const updatedMetrics = computePlanMetrics(plan, 1);
    const updatedArraysMastery = updatedMetrics.topicMastery.find(
      (tm) => resolveTopic(tm.id || tm.tag)?.id === resolveTopic("arrays")?.id
    )?.masteryPercentage;

    // Completing Sunday revision tasks raises topic mastery above baseline
    expect(updatedArraysMastery).toBeGreaterThan(50);
  });

  it("computes revisionMinsPlanned and revisionMinsCompleted accurately", () => {
    const plan = generateSchedule({
      ...baseSettings,
      topicPlan: getDefaultTopicPlan(baseSettings)
    });

    const initialMetrics = computePlanMetrics(plan, 1);
    // 7 content weeks * 240 mins each = 1680 mins planned
    expect(initialMetrics.revisionMinsPlanned).toBeGreaterThan(0);
    expect(initialMetrics.revisionMinsCompleted).toBe(0);

    // Mark 2 Sunday revision tasks as completed
    const sundayDay = plan.weeks[0].days[6];
    const revTask1 = sundayDay.tasks[0];
    const revTask2 = sundayDay.tasks[1];

    revTask1.completed = true;
    revTask2.completed = true;

    const completedMins = revTask1.timeMins + revTask2.timeMins;

    const updatedMetrics = computePlanMetrics(plan, 1);
    expect(updatedMetrics.revisionMinsCompleted).toBe(completedMins);
    expect(updatedMetrics.revisionMinsPlanned).toBe(initialMetrics.revisionMinsPlanned);
  });

  it("preserves backward compatibility when topicPlan is undefined", () => {
    const legacyPlan = generateSchedule(baseSettings);
    expect(legacyPlan.metadata.topicPlan).toBeUndefined();

    const metrics = computePlanMetrics(legacyPlan, 1);
    expect(metrics.totalTasks).toBeGreaterThan(0);
    expect(metrics.topicMastery.length).toBeGreaterThan(0);
    // Baseline for all topics is 0 when uncompleted in legacy plan
    metrics.topicMastery.forEach((tm) => {
      expect(tm.masteryPercentage).toBe(0);
    });
  });
});
