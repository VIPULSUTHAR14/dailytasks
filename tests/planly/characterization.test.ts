import { describe, it, expect } from "vitest";
import { generateSchedule } from "@/lib/planly/engine";
import { SprintSettings } from "@/lib/planly/types";
import { DEFAULT_DIAGNOSTIC } from "@/lib/planly/pools";

describe("Characterization Snapshot & Determinism Tests (Legacy Settings)", () => {
  const fixedDate = new Date("2026-01-01T00:00:00.000Z");

  it("produces deterministic, stable plan for General 8-week profile", () => {
    const settings: SprintSettings = {
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

    const plan1 = generateSchedule(settings, { baseDate: fixedDate });
    const plan2 = generateSchedule(settings, { baseDate: fixedDate });

    // Determinism check: multiple runs produce identical plans
    expect(plan1).toEqual(plan2);

    // Structure checks
    expect(plan1.metadata.totalWeeks).toBe(8);
    expect(plan1.metadata.totalDays).toBe(56);
    expect(plan1.metadata.schemaVersion).toBe(4);
    expect(plan1.weeks.length).toBe(8);

    // Mock week check (8 weeks has 1 mock week at the end)
    expect(plan1.weeks[7].isMockInterviewWeek).toBe(true);
    expect(plan1.weeks[0].isMockInterviewWeek).toBe(false);

    // Check Sunday on content week 1 is legacy buffer day
    const week1Sunday = plan1.weeks[0].days[6];
    expect(week1Sunday.isBufferDay).toBe(true);
    expect(week1Sunday.tasks[0].title).toBe("Weekly Backlog Clearance & Spaced Review");
    expect(week1Sunday.tasks[1].title).toBe("Deep Dive into Missed Concepts & Flashcards");
  });

  it("produces deterministic, stable plan for Google 12-week profile", () => {
    const settings: SprintSettings = {
      weeks: 12,
      dailyHours: 6,
      coreScheduleMode: "daily",
      selectedCores: ["os", "dbms", "cn", "lld"],
      targetCompany: "google",
      language: "Python",
      includeMockContests: true,
      reserveMockWeeks: true,
      diagnostic: {
        arrays: 3,
        trees: 2,
        graphs: 1,
        dp: 1,
        systemDesign: 2
      }
    };

    const plan1 = generateSchedule(settings, { baseDate: fixedDate });
    const plan2 = generateSchedule(settings, { baseDate: fixedDate });

    expect(plan1).toEqual(plan2);
    expect(plan1.metadata.totalWeeks).toBe(12);
    expect(plan1.metadata.totalDays).toBe(84);

    // 12 weeks has 2 mock interview weeks
    expect(plan1.weeks[10].isMockInterviewWeek).toBe(true);
    expect(plan1.weeks[11].isMockInterviewWeek).toBe(true);
    expect(plan1.weeks[9].isMockInterviewWeek).toBe(false);
  });

  it("produces deterministic, stable plan for Amazon 4-week profile", () => {
    const settings: SprintSettings = {
      weeks: 4,
      dailyHours: 2,
      coreScheduleMode: "weekends",
      selectedCores: ["lld"],
      targetCompany: "amazon",
      language: "C++",
      includeMockContests: true,
      reserveMockWeeks: false,
      diagnostic: DEFAULT_DIAGNOSTIC
    };

    const plan1 = generateSchedule(settings, { baseDate: fixedDate });
    const plan2 = generateSchedule(settings, { baseDate: fixedDate });

    expect(plan1).toEqual(plan2);
    expect(plan1.metadata.totalWeeks).toBe(4);
    expect(plan1.metadata.totalDays).toBe(28);

    // No mock weeks when weeks < 6 or reserveMockWeeks is false
    expect(plan1.weeks.every((w) => !w.isMockInterviewWeek)).toBe(true);
  });
});
