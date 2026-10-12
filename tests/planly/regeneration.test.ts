import { describe, it, expect } from "vitest";
import { generateSchedule, regenerateFrom } from "@/lib/planly/engine";
import { SprintSettings, TopicPlanEntry } from "@/lib/planly/types";
import { getDefaultTopicPlan } from "@/lib/planly/storage";
import { resolveTopic } from "@/lib/planly/pools";

describe("Phase 6: Partial Regeneration & Mid-Sprint Adaptation (regenerateFrom)", () => {
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

  const defaultTopicPlan = getDefaultTopicPlan(baseSettings);
  const settingsWithPlan: SprintSettings = {
    ...baseSettings,
    topicPlan: defaultTopicPlan
  };

  it("Day 1 regeneration produces full schedule with new settings", () => {
    const originalPlan = generateSchedule(settingsWithPlan);
    expect(originalPlan.weeks).toHaveLength(8);

    // Regenerate from Day 1 with dailyHours changed to 6
    const updatedSettings: SprintSettings = {
      ...settingsWithPlan,
      dailyHours: 6
    };

    const regenerated = regenerateFrom(updatedSettings, originalPlan, 1);
    expect(regenerated.metadata.dailyHours).toBe(6);
    expect(regenerated.weeks).toHaveLength(8);
  });

  it("Mid-week regeneration (Day 10) preserves Days 1–10 verbatim and updates upcoming days", () => {
    const initialPlan = generateSchedule(settingsWithPlan);

    // Mark task on Day 5 and Day 9 as completed
    const day5Task = initialPlan.weeks[0].days[4].tasks[0];
    day5Task.completed = true;
    const day9Task = initialPlan.weeks[1].days[1].tasks[0];
    day9Task.completed = true;

    // Rearrange topicPlan so that 'graphs' is placed before 'trees'
    const newTopicPlan: TopicPlanEntry[] = defaultTopicPlan.map((entry) => {
      if (entry.topicId === "graphs") return { ...entry, order: 1 };
      if (entry.topicId === "trees") return { ...entry, order: 20 };
      return entry;
    });

    const newSettings: SprintSettings = {
      ...settingsWithPlan,
      topicPlan: newTopicPlan
    };

    const regenerated = regenerateFrom(newSettings, initialPlan, 10);

    // 1. Days 1 to 10 must be preserved exactly
    for (let dayNum = 1; dayNum <= 10; dayNum++) {
      const origWeekIdx = Math.floor((dayNum - 1) / 7);
      const origDayIdx = (dayNum - 1) % 7;
      const origDay = initialPlan.weeks[origWeekIdx].days[origDayIdx];

      const regenWeekIdx = Math.floor((dayNum - 1) / 7);
      const regenDayIdx = (dayNum - 1) % 7;
      const regenDay = regenerated.weeks[regenWeekIdx].days[regenDayIdx];

      expect(regenDay.dayNumber).toBe(dayNum);
      expect(regenDay.tasks.length).toBe(origDay.tasks.length);
      expect(regenDay.tasks[0].id).toBe(origDay.tasks[0].id);
    }

    // Verify completed flags preserved
    expect(regenerated.weeks[0].days[4].tasks[0].completed).toBe(true);
    expect(regenerated.weeks[1].days[1].tasks[0].completed).toBe(true);

    // 2. Straddling week (Week 2): Days 8, 9, 10 preserved, Days 11-14 newly generated
    const straddlingWeek = regenerated.weeks[1];
    expect(straddlingWeek.days).toHaveLength(7);

    // Week 2 topicIds should combine past preserved topics and new topics
    expect(straddlingWeek.topicIds?.length).toBeGreaterThan(0);

    // Sunday (Day 14) revision session should exist and total exactly 240 mins
    const sundayDay = straddlingWeek.days[6];
    expect(sundayDay.dayOfWeek).toBe(7);
    const sundayTotalMins = sundayDay.tasks.reduce((sum, t) => sum + t.timeMins, 0);
    expect(sundayTotalMins).toBe(240);
  });

  it("End of week regeneration (Day 14) preserves Weeks 1 and 2 completely", () => {
    const initialPlan = generateSchedule(settingsWithPlan);

    // Regenerate from Day 14
    const newSettings: SprintSettings = {
      ...settingsWithPlan,
      targetCompany: "google"
    };

    const regenerated = regenerateFrom(newSettings, initialPlan, 14);

    // Weeks 1 and 2 must match original plan
    expect(regenerated.weeks[0].days[0].tasks[0].id).toBe(
      initialPlan.weeks[0].days[0].tasks[0].id
    );
    expect(regenerated.weeks[1].days[6].tasks[0].id).toBe(
      initialPlan.weeks[1].days[6].tasks[0].id
    );

    // Future weeks (Week 3 onwards) reflect Google target
    expect(regenerated.metadata.targetCompany).toBe("Google");
  });

  it("Carries over scheduled Spaced Repetition tasks from future unpreserved days", () => {
    const initialPlan = generateSchedule(settingsWithPlan);

    // Inject an uncompleted SR task on Day 16 (Week 3, which is unpreserved when fromDayNumber=10)
    const srTask = {
      id: "sr-5-16-custom-drill",
      track: "Spaced Repetition" as const,
      title: "[Re-attempt Drill] Two Sum Warmup",
      subject: "Spaced Retention Engine",
      details: ["Re-attempt with fresh intuition"],
      timeMins: 30,
      confidence: null,
      completed: false,
      isBacklogEligible: true
    };
    initialPlan.weeks[2].days[1].tasks.push(srTask);

    // Regenerate from Day 10
    const regenerated = regenerateFrom(settingsWithPlan, initialPlan, 10);

    // Check that srTask is carried over into the regenerated schedule
    const allRegenTasks = regenerated.weeks.flatMap((w) =>
      w.days.flatMap((d) => d.tasks)
    );
    const carriedOver = allRegenTasks.find((t) => t.id === "sr-5-16-custom-drill");
    expect(carriedOver).toBeDefined();
    expect(carriedOver?.title).toBe("[Re-attempt Drill] Two Sum Warmup");
  });

  it("Excludes already-taught topics from future new content queue", () => {
    const initialPlan = generateSchedule(settingsWithPlan);

    // On Week 1 (Days 1–7), the scheduled topic was arrays / hashing
    const week1TopicId = initialPlan.weeks[0]?.topicIds?.[0];
    expect(week1TopicId).toBeDefined();

    // Regenerate from Day 8 (after Week 1 completed)
    const regenerated = regenerateFrom(settingsWithPlan, initialPlan, 8);

    // In remaining topicPlan metadata, the taught topic should now be marked as studied
    const taughtEntry = regenerated.metadata.topicPlan?.find(
      (e) => resolveTopic(e.topicId)?.id === resolveTopic(week1TopicId!)?.id
    );
    expect(taughtEntry?.status).toBe("studied");
  });

  it("Preserves future days if any task within them is completed ahead of time", () => {
    const initialPlan = generateSchedule(settingsWithPlan);

    // User completed a task ahead of time on Day 20 (Week 3)
    const earlyTask = initialPlan.weeks[2].days[5].tasks[0];
    earlyTask.completed = true;

    // Regenerate from Day 8
    const regenerated = regenerateFrom(settingsWithPlan, initialPlan, 8);

    // Day 20 must be preserved with its completed task intact
    const regenDay20 = regenerated.weeks[2].days[5];
    expect(regenDay20.dayNumber).toBe(20);
    expect(regenDay20.tasks.some((t) => t.completed)).toBe(true);
  });
});
