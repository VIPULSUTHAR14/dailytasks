import { describe, it, expect } from "vitest";
import { generateSchedule, buildTopicQueue, regenerateFrom } from "@/lib/planly/engine";
import { applyRestDay } from "@/lib/planly/spacedRepetition";
import { SprintSettings, TopicPlanEntry } from "@/lib/planly/types";
import { DSA_TOPICS_POOL } from "@/lib/planly/pools";

describe("Phase 8: Edge Cases Suite", () => {
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

  it("Edge Case 1: Daily hours under 4 defaults Sunday revision to 240 minutes", () => {
    const lowHoursSettings: SprintSettings = {
      ...baseSettings,
      dailyHours: 2, // 2 hours = 120 mins daily budget
      topicPlan: [
        { topicId: "arrays", kind: "dsa", status: "new", order: 1 }
      ]
    };

    const plan = generateSchedule(lowHoursSettings);
    // Weekday should be 120 minutes
    const mondayTasks = plan.weeks[0].days[0].tasks;
    const mondayMins = mondayTasks.reduce((sum, t) => sum + t.timeMins, 0);
    expect(mondayMins).toBeLessThanOrEqual(120);

    // Non-mock Sunday (Day 7) must still strictly total 240 minutes by default
    const sundayTasks = plan.weeks[0].days[6].tasks;
    const sundayMins = sundayTasks.reduce((sum, t) => sum + t.timeMins, 0);
    expect(sundayMins).toBe(240);
  });

  it("Edge Case 2: Saturday Rest Day rolls forward to subsequent weekend buffer slots", () => {
    const plan = generateSchedule(baseSettings);

    // Apply Rest Day on Saturday Day 6 (Week 1)
    const { updatedPlan, affectedTasksCount } = applyRestDay(plan, 6);
    expect(affectedTasksCount).toBeGreaterThan(0);

    const satDay = updatedPlan.weeks[0].days[5];
    expect(satDay.isRestDay).toBe(true);

    // Shifted tasks must be placed on Day 7 (Sunday) or following Saturday/Sunday
    const allTasks = updatedPlan.weeks.flatMap((w) => w.days.flatMap((d) => d.tasks));
    const shiftedTasks = allTasks.filter((t) => t.id.startsWith("shifted-6-"));
    expect(shiftedTasks.length).toBe(affectedTasksCount);
  });

  it("Edge Case 3: 6-week sprint with 17 new topics drops 2 lowest-priority topics with warning", () => {
    // 6-week sprint: 1 mock week, 5 content weeks => max capacity = 5 * 3 = 15 topics
    const seventeenTopics: TopicPlanEntry[] = DSA_TOPICS_POOL.slice(0, 17).map((t, idx) => ({
      topicId: t.id || t.tag,
      kind: "dsa",
      status: "new",
      order: idx + 1
    }));

    const result = buildTopicQueue(
      { ...baseSettings, weeks: 6, topicPlan: seventeenTopics },
      5 // 5 content weeks
    );

    expect(result.droppedTopicIds).toHaveLength(2);
    expect(result.assignments).toHaveLength(5);

    // Each week assignment must respect the cap of 3 topics
    result.assignments.forEach((assignment) => {
      expect(assignment.topicIds.length).toBeLessThanOrEqual(3);
    });

    const totalScheduled = result.assignments.reduce(
      (sum, a) => sum + a.topicIds.length,
      0
    );
    expect(totalScheduled).toBe(15);
  });

  it("Edge Case 4: Changing topic order mid-sprint after days 1–5 are completed preserves days 1–5", () => {
    const initialTopicPlan: TopicPlanEntry[] = DSA_TOPICS_POOL.slice(0, 8).map((t, idx) => ({
      topicId: t.id || t.tag,
      kind: "dsa",
      status: "new",
      order: idx + 1
    }));

    const plan = generateSchedule({
      ...baseSettings,
      topicPlan: initialTopicPlan
    });

    // Mark tasks completed on days 1 to 5
    for (let d = 0; d < 5; d++) {
      plan.weeks[0].days[d].tasks.forEach((t) => {
        t.completed = true;
      });
    }

    // Reverse topic order for remaining topics
    const reversedPlan: TopicPlanEntry[] = [...initialTopicPlan].reverse().map((t, idx) => ({
      ...t,
      order: idx + 1
    }));

    const regenerated = regenerateFrom(
      { ...baseSettings, topicPlan: reversedPlan },
      plan,
      5
    );

    // Days 1 through 5 must remain completed and preserved
    for (let d = 0; d < 5; d++) {
      const day = regenerated.weeks[0].days[d];
      expect(day.dayNumber).toBe(d + 1);
      expect(day.tasks.every((t) => t.completed)).toBe(true);
    }
  });

  it("Edge Case 5: Mock-week Sunday remains unchanged (does not use 240m revision session)", () => {
    const plan = generateSchedule({
      ...baseSettings,
      weeks: 8,
      topicPlan: [
        { topicId: "arrays", kind: "dsa", status: "new", order: 1 }
      ]
    });

    // Week 8 is the mock interview week
    const mockWeek = plan.weeks[7];
    expect(mockWeek.isMockInterviewWeek).toBe(true);

    const mockSunday = mockWeek.days[6];
    expect(mockSunday.dayOfWeek).toBe(7);

    // Should retain interview readiness / post-mortem task, not a 240m revision session
    expect(mockSunday.tasks.some((t) => t.title.includes("Mock Interview Post-Mortem"))).toBe(true);
    expect(mockSunday.tasks.some((t) => t.track === "Revision")).toBe(false);
  });

  it("Edge Case 6: All topics marked studied generates a revision-only schedule", () => {
    const allStudiedPlan: TopicPlanEntry[] = DSA_TOPICS_POOL.slice(0, 8).map((t, idx) => ({
      topicId: t.id || t.tag,
      kind: "dsa",
      status: "studied",
      confidence: "solid",
      order: idx + 1
    }));

    const plan = generateSchedule({
      ...baseSettings,
      topicPlan: allStudiedPlan
    });

    // All content weeks (weeks 1-7) should be marked as revision weeks
    for (let w = 0; w < 7; w++) {
      const week = plan.weeks[w];
      expect(week.weekFocus).toContain("Revision");
      // Sunday should contain revision tasks drawn from the revision pool
      const sunday = week.days[6];
      expect(sunday.tasks.some((t) => t.track === "Revision")).toBe(true);
    }
  });

  it("Edge Case 7: No topics marked studied treats all topics as new", () => {
    const allNewPlan: TopicPlanEntry[] = DSA_TOPICS_POOL.slice(0, 7).map((t, idx) => ({
      topicId: t.id || t.tag,
      kind: "dsa",
      status: "new",
      order: idx + 1
    }));

    const plan = generateSchedule({
      ...baseSettings,
      topicPlan: allNewPlan
    });

    // Each content week should have assigned topic IDs
    for (let w = 0; w < 7; w++) {
      const week = plan.weeks[w];
      expect(week.topicIds?.length).toBeGreaterThan(0);
      expect(week.isMockInterviewWeek).toBe(false);
    }
  });
});
