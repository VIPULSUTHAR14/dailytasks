import { describe, it, expect } from "vitest";
import { migratePlan, getDefaultTopicPlan, DEFAULT_SETTINGS } from "@/lib/planly/storage";
import { resolveTopic } from "@/lib/planly/pools";
import { generateSchedule } from "@/lib/planly/engine";

describe("Phase 1: Storage Migration & Topic Normalizer Tests", () => {
  it("migratePlan upgrades legacy v3 plan leaving settings.topicPlan undefined", () => {
    const legacyPlan = generateSchedule(DEFAULT_SETTINGS);
    const legacyRawState = {
      version: 3,
      settings: { ...DEFAULT_SETTINGS }, // no topicPlan
      plan: legacyPlan,
      streaks: { currentStreak: 5, longestStreak: 10, lastActiveDate: "2026-03-01" },
      currentDayNumber: 12,
      updatedAt: "2026-03-01T12:00:00.000Z"
    };

    const migrated = migratePlan(legacyRawState);

    expect(migrated.version).toBe(4);
    expect(migrated.plan?.metadata.schemaVersion).toBe(4);
    // Crucial backward compatibility: topicPlan MUST be undefined!
    expect(migrated.settings.topicPlan).toBeUndefined();
    expect(migrated.streaks.currentStreak).toBe(5);
    expect(migrated.currentDayNumber).toBe(12);
  });

  it("migratePlan preserves topicPlan when already present", () => {
    const rawState = {
      version: 4,
      settings: {
        ...DEFAULT_SETTINGS,
        topicPlan: [
          { topicId: "arrays-strings", kind: "dsa", status: "new", order: 0 }
        ]
      },
      plan: null
    };

    const migrated = migratePlan(rawState);
    expect(migrated.settings.topicPlan).toBeDefined();
    expect(migrated.settings.topicPlan?.length).toBe(1);
    expect(migrated.settings.topicPlan?.[0].topicId).toBe("arrays-strings");
  });

  it("getDefaultTopicPlan generates 0-based unique orders for DSA and Core CS", () => {
    const topicPlan = getDefaultTopicPlan(DEFAULT_SETTINGS);

    // All 17 DSA topics + 3 default core subjects = 20 entries
    const dsaEntries = topicPlan.filter((e) => e.kind === "dsa");
    const coreEntries = topicPlan.filter((e) => e.kind === "core");

    expect(dsaEntries.length).toBe(17);
    expect(coreEntries.length).toBe(3);

    // Status is all "new"
    expect(topicPlan.every((e) => e.status === "new")).toBe(true);

    // Orders are 0-based per kind
    expect(dsaEntries.map((e) => e.order)).toEqual([...Array(17).keys()]);
    expect(coreEntries.map((e) => e.order)).toEqual([...Array(3).keys()]);
  });

  it("resolveTopic normalizes IDs, tags, and Core CS keys correctly", () => {
    // DSA category ID
    const byId = resolveTopic("dynamic-programming");
    expect(byId).toEqual({
      id: "dynamic-programming",
      tag: "dp",
      kind: "dsa",
      name: "Dynamic Programming"
    });

    // DSA tag
    const byTag = resolveTopic("dp");
    expect(byTag?.id).toBe("dynamic-programming");
    expect(byTag?.tag).toBe("dp");

    // Case insensitive & whitespace
    const mixed = resolveTopic("  GrAPhS  ");
    expect(mixed?.id).toBe("graphs");
    expect(mixed?.kind).toBe("dsa");

    // Core CS subject
    const core = resolveTopic("os");
    expect(core).toEqual({
      id: "os",
      tag: "os",
      kind: "core",
      name: "Operating Systems (OS)"
    });

    // Unknown topic
    expect(resolveTopic("non-existent-topic")).toBeNull();
  });
});
