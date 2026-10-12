import {
  PlanDay,
  PlanTask,
  PlanWeek,
  ProblemMetadata,
  SprintPlan,
  SprintSettings,
  TopicPlanEntry
} from "./types";
import {
  CORE_SUBJECTS_POOL,
  COMPANY_PRESETS,
  DSA_TOPICS_POOL,
  DsaTopicCategory,
  resolveTopic
} from "./pools";
import { createPRNG, seededShuffle } from "./random";
import { buildRevisionPool, buildSundayRevision, RevisionPoolItem } from "./revision";

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface SampledProblemResult {
  problem: ProblemMetadata;
  allocatedMins: number;
  slotType: "Warmup" | "Core Pattern" | "Deep Application" | "Advanced Challenge" | "Speed Drill";
}

/**
 * Dynamically samples multiple distinct problems from a topic pool
 * to fill the day's DSA time budget with realistic per-problem durations.
 */
function sampleProblemsForDay(
  topicQuestions: ProblemMetadata[],
  targetMins: number,
  targetCompany: string,
  usedTitles: Set<string>,
  rng: () => number
): SampledProblemResult[] {
  if (!topicQuestions || topicQuestions.length === 0) return [];

  // Filter out questions recently used in this sprint
  let available = topicQuestions.filter((q) => !usedTitles.has(q.title));
  if (available.length < 3) {
    usedTitles.clear();
    available = [...topicQuestions];
  }

  const easies = seededShuffle(available.filter((q) => q.difficulty === "Easy"), rng);
  const mediums = seededShuffle(available.filter((q) => q.difficulty === "Medium"), rng);
  const hards = seededShuffle(available.filter((q) => q.difficulty === "Hard"), rng);

  const results: SampledProblemResult[] = [];
  let budgetLeft = targetMins;

  // 1. Warmup problem (Easy ~25-30 mins) if budget permits
  if (easies.length > 0 && budgetLeft >= 30 && targetCompany !== "google") {
    const q = easies.pop()!;
    usedTitles.add(q.title);
    results.push({
      problem: q,
      allocatedMins: 30,
      slotType: "Warmup"
    });
    budgetLeft -= 30;
  }

  // 2. Hard challenge problem (55-60 mins) for Google or long budgets
  if (
    hards.length > 0 &&
    budgetLeft >= 55 &&
    (targetCompany === "google" || (targetCompany === "amazon" && budgetLeft >= 160) || budgetLeft >= 220)
  ) {
    const q = hards.pop()!;
    usedTitles.add(q.title);
    results.push({
      problem: q,
      allocatedMins: 60,
      slotType: "Advanced Challenge"
    });
    budgetLeft -= 60;
  }

  // 3. Medium core pattern problems (40-45 mins each)
  let mediumCount = 1;
  while (budgetLeft >= 40 && mediums.length > 0) {
    const q = mediums.pop()!;
    usedTitles.add(q.title);
    const mins = Math.min(45, budgetLeft);
    results.push({
      problem: q,
      allocatedMins: mins,
      slotType: mediumCount === 1 ? "Core Pattern" : "Deep Application"
    });
    budgetLeft -= mins;
    mediumCount++;
  }

  // 4. Fill remaining budget with secondary Hard or Easy
  if (budgetLeft >= 55 && hards.length > 0) {
    const q = hards.pop()!;
    usedTitles.add(q.title);
    results.push({
      problem: q,
      allocatedMins: 55,
      slotType: "Advanced Challenge"
    });
    budgetLeft -= 55;
  } else if (budgetLeft >= 25 && easies.length > 0) {
    const q = easies.pop()!;
    usedTitles.add(q.title);
    const mins = Math.min(30, budgetLeft);
    results.push({
      problem: q,
      allocatedMins: mins,
      slotType: "Speed Drill"
    });
    budgetLeft -= mins;
  } else if (budgetLeft >= 35 && topicQuestions.length > 0) {
    const anyQ =
      seededShuffle(topicQuestions, rng).find((q) => !results.some((r) => r.problem.title === q.title)) ||
      topicQuestions[0];
    const mins = Math.min(45, budgetLeft);
    results.push({
      problem: anyQ,
      allocatedMins: mins,
      slotType: "Deep Application"
    });
    budgetLeft -= mins;
  }

  // 5. Distribute remaining small residue minutes across problems so total equals targetMins
  if (budgetLeft > 0 && results.length > 0) {
    const addEach = Math.floor(budgetLeft / results.length);
    let rem = budgetLeft % results.length;
    results.forEach((r) => {
      r.allocatedMins += addEach;
      if (rem > 0) {
        r.allocatedMins += 1;
        rem--;
      }
    });
  }

  return results;
}

export function getTopicWeight(topicIdOrTag: string, settings: SprintSettings): number {
  const company = COMPANY_PRESETS[settings.targetCompany] || COMPANY_PRESETS.general;
  const diag = settings.diagnostic;
  const resolved = resolveTopic(topicIdOrTag);
  const tag = resolved?.tag || topicIdOrTag;

  let weight = 1;

  if (company.treesGraphsBoost && (tag === "trees" || tag === "graphs")) {
    weight += 1;
  }
  if (company.dpBoost && tag === "dp") {
    weight += 1;
  }

  if (diag) {
    if (tag === "dp" && diag.dp <= 2) weight += 1;
    if (tag === "graphs" && diag.graphs <= 2) weight += 1;
    if (tag === "trees" && diag.trees <= 2) weight += 1;
    if (tag === "arrays" && diag.arrays <= 2) weight += 1;
  }

  return weight;
}

export interface WeekAssignment {
  week: number;
  topicIds: string[];
  isRevisionWeek: boolean;
}

export interface BuildTopicQueueResult {
  assignments: WeekAssignment[];
  droppedTopicIds: string[];
}

export function buildTopicQueue(
  settings: SprintSettings,
  contentWeeks: number
): BuildTopicQueueResult {
  const entries = (settings.topicPlan || [])
    .filter((e) => e.status === "new" && e.kind === "dsa")
    .sort((a, b) => a.order - b.order);

  if (entries.length === 0) {
    const assignments: WeekAssignment[] = [];
    for (let w = 1; w <= contentWeeks; w++) {
      assignments.push({
        week: w,
        topicIds: [],
        isRevisionWeek: true
      });
    }
    return { assignments, droppedTopicIds: [] };
  }

  const n = entries.length;
  const maxAllowed = contentWeeks * 3;

  // CASE A: n >= contentWeeks
  if (n >= contentWeeks) {
    let retainedEntries = [...entries];
    const droppedTopicIds: string[] = [];

    if (n > maxAllowed) {
      const dropCount = n - maxAllowed;
      // Deterministic tie-break to drop: lowest weight first, then latest in user order
      const candidatesToDrop = [...entries].sort((a, b) => {
        const wA = getTopicWeight(a.topicId, settings);
        const wB = getTopicWeight(b.topicId, settings);
        if (wA !== wB) return wA - wB; // lowest weight first
        return b.order - a.order;      // latest in user order first
      });

      const dropSet = new Set<string>();
      for (let i = 0; i < dropCount; i++) {
        dropSet.add(candidatesToDrop[i].topicId);
        droppedTopicIds.push(candidatesToDrop[i].topicId);
      }

      retainedEntries = entries.filter((e) => !dropSet.has(e.topicId));
    }

    const assignments: WeekAssignment[] = [];
    const totalRetained = retainedEntries.length;
    const baseCount = Math.floor(totalRetained / contentWeeks);
    const extraSlots = totalRetained % contentWeeks;

    let cursor = 0;
    for (let w = 1; w <= contentWeeks; w++) {
      const countForWeek = w <= extraSlots ? baseCount + 1 : baseCount;
      const weekTopics = retainedEntries.slice(cursor, cursor + countForWeek).map((e) => e.topicId);
      cursor += countForWeek;

      assignments.push({
        week: w,
        topicIds: weekTopics,
        isRevisionWeek: weekTopics.length === 0
      });
    }

    return { assignments, droppedTopicIds };
  }

  // CASE B: n < contentWeeks
  const extraWeeks = contentWeeks - n;
  const weights = entries.map((e) => getTopicWeight(e.topicId, settings));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const allocatedExtra = new Array(n).fill(0);
  let remainingExtra = extraWeeks;

  const fractions = entries.map((e, idx) => {
    const rawShare = totalWeight > 0 ? (weights[idx] / totalWeight) * extraWeeks : extraWeeks / n;
    const intPart = Math.min(2, Math.floor(rawShare));
    allocatedExtra[idx] = intPart;
    return {
      index: idx,
      order: e.order,
      frac: rawShare - intPart
    };
  });

  remainingExtra -= allocatedExtra.reduce((sum, a) => sum + a, 0);

  // Largest-remainder distribution for extra weeks, capped at 2 extra weeks (3 total)
  fractions.sort((a, b) => {
    if (Math.abs(b.frac - a.frac) > 1e-6) return b.frac - a.frac;
    return a.order - b.order;
  });

  for (const item of fractions) {
    if (remainingExtra <= 0) break;
    if (allocatedExtra[item.index] < 2) {
      allocatedExtra[item.index] += 1;
      remainingExtra -= 1;
    }
  }

  const assignments: WeekAssignment[] = [];
  let currentWeekNum = 1;

  for (let i = 0; i < n; i++) {
    const totalWeeksForTopic = 1 + allocatedExtra[i];
    const topicId = entries[i].topicId;
    for (let w = 0; w < totalWeeksForTopic; w++) {
      assignments.push({
        week: currentWeekNum++,
        topicIds: [topicId],
        isRevisionWeek: false
      });
    }
  }

  // Any remaining extra weeks become revision weeks placed immediately before mock weeks
  while (currentWeekNum <= contentWeeks) {
    assignments.push({
      week: currentWeekNum++,
      topicIds: [],
      isRevisionWeek: true
    });
  }

  return { assignments, droppedTopicIds: [] };
}

function getWeekdayTopicId(weekTopicIds: string[], dayOfWeek: number): string | null {
  if (!weekTopicIds || weekTopicIds.length === 0) return null;
  if (weekTopicIds.length === 1) return weekTopicIds[0];
  if (weekTopicIds.length === 2) {
    return dayOfWeek <= 3 ? weekTopicIds[0] : weekTopicIds[1];
  }
  // 3 topics over 5 weekdays: 2 / 2 / 1
  if (dayOfWeek <= 2) return weekTopicIds[0];
  if (dayOfWeek <= 4) return weekTopicIds[1];
  return weekTopicIds[2];
}

export function generateWeightedTopicSequence(
  totalWeeks: number,
  settings: SprintSettings
): { topicList: DsaTopicCategory[]; mockWeeksCount: number } {
  const company = COMPANY_PRESETS[settings.targetCompany] || COMPANY_PRESETS.general;
  const diag = settings.diagnostic;

  const mockWeeksCount =
    settings.reserveMockWeeks !== false ? (totalWeeks >= 12 ? 2 : totalWeeks >= 6 ? 1 : 0) : 0;

  const contentWeeksCount = Math.max(1, totalWeeks - mockWeeksCount);
  const weightedIndices: number[] = [];

  DSA_TOPICS_POOL.forEach((item, index) => {
    let weight = 1;

    if (company.treesGraphsBoost && (item.tag === "trees" || item.tag === "graphs")) {
      weight += 1;
    }
    if (company.dpBoost && item.tag === "dp") {
      weight += 1;
    }

    if (diag) {
      if (item.tag === "dp" && diag.dp <= 2) weight += 1;
      if (item.tag === "graphs" && diag.graphs <= 2) weight += 1;
      if (item.tag === "trees" && diag.trees <= 2) weight += 1;
      if (item.tag === "arrays" && diag.arrays <= 2) weight += 1;
    }

    for (let i = 0; i < weight; i++) {
      weightedIndices.push(index);
    }
  });

  const finalSequence: DsaTopicCategory[] = [];
  for (let w = 0; w < contentWeeksCount; w++) {
    const topicIdx = weightedIndices[w % weightedIndices.length];
    finalSequence.push(DSA_TOPICS_POOL[topicIdx]);
  }

  return { topicList: finalSequence, mockWeeksCount };
}

interface GenerateSingleWeekParams {
  w: number;
  weekTopicIds: string[];
  isMockWeek: boolean;
  isRevisionWeek: boolean;
  settings: SprintSettings;
  baseDate: Date;
  dayCounterStart: number;
  rng: () => number;
  usedTitlesByTopic: Map<string, Set<string>>;
  coreTasksList: { subject: string; title: string; items: string[] }[];
  coreIndexRef: { current: number };
  revisionPool: RevisionPoolItem[];
  companyPreset: { name: string };
  hasTopicPlan: boolean;
  legacyTopicList: DsaTopicCategory[];
}

function generateSingleWeekDays(params: GenerateSingleWeekParams): { days: PlanDay[]; weekFocus: string } {
  const {
    w,
    weekTopicIds,
    isMockWeek,
    isRevisionWeek,
    settings,
    baseDate,
    dayCounterStart,
    rng,
    usedTitlesByTopic,
    coreTasksList,
    coreIndexRef,
    revisionPool,
    companyPreset,
    hasTopicPlan,
    legacyTopicList
  } = params;

  const { dailyHours, coreScheduleMode, includeMockContests, language, targetCompany } = settings;
  const totalMins = dailyHours * 60;
  const weekDays: PlanDay[] = [];
  let dayCounter = dayCounterStart;

  for (let d = 1; d <= 7; d++) {
    const isSaturday = d === 6;
    const isSunday = d === 7;
    const isBufferDay = isSunday;
    const dayTasks: PlanTask[] = [];

    let currentDsaTopic: DsaTopicCategory;
    if (hasTopicPlan) {
      const activeTopicId = getWeekdayTopicId(weekTopicIds, d);
      if (activeTopicId) {
        currentDsaTopic =
          DSA_TOPICS_POOL.find((t) => t.id === activeTopicId || t.tag === activeTopicId) ||
          DSA_TOPICS_POOL[0];
      } else {
        currentDsaTopic = DSA_TOPICS_POOL[(w + d) % DSA_TOPICS_POOL.length];
      }
    } else {
      currentDsaTopic = legacyTopicList[(w - 1) % legacyTopicList.length];
    }

    if (!usedTitlesByTopic.has(currentDsaTopic.topic)) {
      usedTitlesByTopic.set(currentDsaTopic.topic, new Set<string>());
    }
    const topicUsedSet = usedTitlesByTopic.get(currentDsaTopic.topic)!;

    const currentCalendarDate = new Date(baseDate);
    currentCalendarDate.setDate(baseDate.getDate() + (dayCounter - 1));
    const calendarDateStr = formatISODate(currentCalendarDate);

    let shouldIncludeCore = false;
    if (coreScheduleMode === "weekends") {
      shouldIncludeCore = isSaturday || isSunday;
    } else if (coreScheduleMode === "daily") {
      shouldIncludeCore = !isBufferDay;
    } else if (coreScheduleMode === "alternate") {
      shouldIncludeCore = d % 2 === 0;
    }

    // CASE A: Mock Interview Week (Final 1-2 weeks)
    if (isMockWeek) {
      if (isBufferDay) {
        dayTasks.push({
          id: `task-${dayCounter}-mock-review`,
          track: "Buffer & Consolidation",
          title: "Mock Interview Post-Mortem & Deep Notes Consolidation",
          subject: "Final Sprint Polish",
          details: [
            "Re-verify failed test cases from earlier contest rounds",
            "STAR method behavioral interview notes review",
            "System design architecture synthesis"
          ],
          timeMins: totalMins,
          confidence: null,
          completed: false,
          isBacklogEligible: false,
          originDay: dayCounter
        });
      } else {
        const mockAlgoMins = Math.min(60, Math.round(totalMins * 0.45));
        const mockDesignMins = Math.min(60, Math.round(totalMins * 0.35));
        const mockReviewMins = Math.max(30, totalMins - (mockAlgoMins + mockDesignMins));

        dayTasks.push({
          id: `task-${dayCounter}-mock-algo`,
          track: "Mock Contest",
          title: `45m Timed Coding Interview (${companyPreset.name} Style)`,
          subject: `LeetCode Hard Simulation (${language})`,
          details: [
            "45m strict timed constraint with zero hint lookup",
            "State intuition, edge cases, and Big-O before coding"
          ],
          timeMins: mockAlgoMins,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          difficulty: "Hard",
          originDay: dayCounter
        });

        dayTasks.push({
          id: `task-${dayCounter}-mock-sysdesign`,
          track: "Core CS",
          title: "High-Level Architecture & Concurrency Simulation",
          subject: "System Design Drill",
          details: [
            "Scope functional & non-functional requirements",
            "Define data models, bottlenecks, and scaling strategy"
          ],
          timeMins: mockDesignMins,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          originDay: dayCounter
        });

        if (mockReviewMins > 0) {
          dayTasks.push({
            id: `task-${dayCounter}-mock-retro`,
            track: "Spaced Repetition",
            title: "Mock Retrospective & Post-Mortem Analysis",
            subject: "Retention & Speed",
            details: [
              "Analyze runtime trade-offs and alternative approaches",
              "Log behavioral and technical takeaways"
            ],
            timeMins: mockReviewMins,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            originDay: dayCounter
          });
        }
      }
    }
    // CASE B: Standard Sprint Weeks - Sunday Revision / Buffer Day
    else if (isBufferDay) {
      if (hasTopicPlan) {
        const sundayTasks = buildSundayRevision({
          weekNumber: w,
          dayNumber: dayCounter,
          weekTopicIds,
          pool: revisionPool,
          totalMins: settings.sundayRevisionMins ?? 240
        });
        dayTasks.push(...sundayTasks);
      } else {
        const bufferMins = shouldIncludeCore ? Math.round(totalMins * 0.6) : totalMins;
        const bufferSplit1 = Math.round(bufferMins * 0.55);
        const bufferSplit2 = bufferMins - bufferSplit1;

        dayTasks.push({
          id: `task-${dayCounter}-buffer-backlog`,
          track: "Buffer & Consolidation",
          title: "Weekly Backlog Clearance & Spaced Review",
          subject: "Retention Engine",
          details: [
            "Clear flagged 'Struggled' problems from the past 7 days",
            "Re-solve weak spot bookmarks without looking at hints"
          ],
          timeMins: bufferSplit1,
          confidence: null,
          completed: false,
          isBacklogEligible: false,
          originDay: dayCounter
        });

        dayTasks.push({
          id: `task-${dayCounter}-buffer-notes`,
          track: "Buffer & Consolidation",
          title: "Deep Dive into Missed Concepts & Flashcards",
          subject: "Pattern Synthesis",
          details: [
            "Review handwritten notes and editorial key insights",
            "Consolidate mental models for next week's topic"
          ],
          timeMins: bufferSplit2,
          confidence: null,
          completed: false,
          isBacklogEligible: false,
          originDay: dayCounter
        });

        if (shouldIncludeCore && coreTasksList.length > 0) {
          const coreItem = coreTasksList[coreIndexRef.current % coreTasksList.length];
          coreIndexRef.current++;
          dayTasks.push({
            id: `task-${dayCounter}-core-weekend`,
            track: "Core CS",
            title: `${coreItem.subject}: ${coreItem.title}`,
            subject: coreItem.subject,
            details: coreItem.items,
            timeMins: Math.round(totalMins * 0.4),
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            originDay: dayCounter
          });
        }
      }
    }
    // CASE C: Saturday Timed Contest + Core CS
    else if (isSaturday && includeMockContests) {
      dayTasks.push({
        id: `task-${dayCounter}-contest-q1`,
        track: "Mock Contest",
        title: `Contest Q1: Easy Warmup Sprint (15 mins)`,
        subject: `${companyPreset.name} Timed Contest (${language})`,
        details: [
          "1 Easy warmup problem",
          "Target: 15-20 mins bug-free first submission"
        ],
        timeMins: 20,
        confidence: null,
        completed: false,
        isBacklogEligible: true,
        difficulty: "Easy",
        originDay: dayCounter
      });

      dayTasks.push({
        id: `task-${dayCounter}-contest-q2`,
        track: "Mock Contest",
        title: `Contest Q2: Core Medium Algorithmic Sprint (35 mins)`,
        subject: `${companyPreset.name} Timed Contest (${language})`,
        details: [
          "1 Core medium algorithm challenge",
          "Target: identify optimal pattern & boundary invariants"
        ],
        timeMins: 35,
        confidence: null,
        completed: false,
        isBacklogEligible: true,
        difficulty: "Medium",
        originDay: dayCounter
      });

      dayTasks.push({
        id: `task-${dayCounter}-contest-q3`,
        track: "Mock Contest",
        title: `Contest Q3: Advanced Challenge Problem (35 mins)`,
        subject: `${companyPreset.name} Timed Contest (${language})`,
        details: [
          "1 Hard/Upper-Medium algorithmic challenge",
          "Target: complete edge-case proof and optimize space complexity"
        ],
        timeMins: 35,
        confidence: null,
        completed: false,
        isBacklogEligible: true,
        difficulty: "Hard",
        originDay: dayCounter
      });

      const remainingSatMins = Math.max(0, totalMins - 90);
      if (shouldIncludeCore && coreTasksList.length > 0 && remainingSatMins > 0) {
        const coreItem = coreTasksList[coreIndexRef.current % coreTasksList.length];
        coreIndexRef.current++;
        dayTasks.push({
          id: `task-${dayCounter}-core-sat`,
          track: "Core CS",
          title: `${coreItem.subject}: ${coreItem.title}`,
          subject: coreItem.subject,
          details: coreItem.items,
          timeMins: remainingSatMins,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          originDay: dayCounter
        });
      } else if (remainingSatMins > 0) {
        dayTasks.push({
          id: `task-${dayCounter}-dsa-sat`,
          track: "DSA",
          title: `${currentDsaTopic.topic} Contest Post-Mortem`,
          subject: `Striver Sheet Editorial Review (${language})`,
          details: [
            "Contest editorial walkthrough & benchmark analysis",
            "Review alternative O(N) time complexities"
          ],
          timeMins: remainingSatMins,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          originDay: dayCounter
        });
      }
    }
    // CASE D: Regular Weekdays (Dynamic Multi-Problem Allocation)
    else {
      let dsaMins = totalMins;
      let coreMins = 0;

      if (shouldIncludeCore && coreTasksList.length > 0) {
        coreMins = Math.round(totalMins * 0.35);
        dsaMins = totalMins - coreMins;
      }

      const sampledProblems = sampleProblemsForDay(
        currentDsaTopic.questions,
        dsaMins,
        targetCompany,
        topicUsedSet,
        rng
      );

      sampledProblems.forEach((sampled, subIdx) => {
        const q = sampled.problem;
        dayTasks.push({
          id: `task-${dayCounter}-dsa-${subIdx + 1}`,
          track: "DSA",
          title: q.title,
          subject: `${sampled.slotType} • ${currentDsaTopic.topic} (${language})`,
          details: [
            q.pattern ? `Pattern focus: ${q.pattern}` : "Algorithmic implementation drill",
            `Target: ${sampled.allocatedMins} mins`
          ],
          timeMins: sampled.allocatedMins,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          difficulty: q.difficulty,
          problemUrl: q.leetcodeUrl,
          intuitionHint: q.intuitionHint,
          topicId: q.topicId,
          pattern: q.pattern,
          timeComplexity: q.timeComplexity,
          spaceComplexity: q.spaceComplexity,
          originDay: dayCounter
        });
      });

      if (shouldIncludeCore && coreTasksList.length > 0 && coreMins > 0) {
        const coreItem = coreTasksList[coreIndexRef.current % coreTasksList.length];
        coreIndexRef.current++;

        if (coreMins >= 60) {
          const splitA = Math.floor(coreMins / 2);
          const splitB = coreMins - splitA;

          dayTasks.push({
            id: `task-${dayCounter}-core-1`,
            track: "Core CS",
            title: `${coreItem.subject}: ${coreItem.title}`,
            subject: coreItem.subject,
            details: coreItem.items.slice(0, 1),
            timeMins: splitA,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            originDay: dayCounter
          });

          dayTasks.push({
            id: `task-${dayCounter}-core-2`,
            track: "Core CS",
            title: `${coreItem.subject}: Deep Implementation Drill`,
            subject: coreItem.subject,
            details: coreItem.items.slice(1),
            timeMins: splitB,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            originDay: dayCounter
          });
        } else {
          dayTasks.push({
            id: `task-${dayCounter}-core`,
            track: "Core CS",
            title: `${coreItem.subject}: ${coreItem.title}`,
            subject: coreItem.subject,
            details: coreItem.items,
            timeMins: coreMins,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            originDay: dayCounter
          });
        }
      }
    }

    const allocatedDayMins = hasTopicPlan && isBufferDay && !isMockWeek
      ? (settings.sundayRevisionMins ?? 240)
      : totalMins;

    weekDays.push({
      dayNumber: dayCounter,
      dayOfWeek: d,
      calendarDate: calendarDateStr,
      isBufferDay,
      isSaturday,
      allocatedMins: allocatedDayMins,
      tasks: dayTasks
    });

    dayCounter++;
  }

  let weekFocus = "";
  if (isMockWeek) {
    weekFocus = `Mock Interview Sprints & Full ${companyPreset.name} Simulations`;
  } else if (isRevisionWeek) {
    weekFocus = `Dedicated Consolidation & Revision Sprint`;
  } else if (hasTopicPlan) {
    const topicTitles = weekTopicIds.map((id) => {
      const resolved = resolveTopic(id);
      return resolved ? resolved.name : id;
    });
    const topicLabel = topicTitles.length > 0 ? topicTitles.join(" + ") : "DSA Review";
    weekFocus = `${topicLabel} + ${coreScheduleMode === "weekends" ? "Weekend Core CS" : "Parallel Core CS"}`;
  } else {
    const currentLegacy = legacyTopicList[(w - 1) % legacyTopicList.length];
    weekFocus = `${currentLegacy.topic} + ${coreScheduleMode === "weekends" ? "Weekend Core CS" : "Parallel Core CS"}`;
  }

  return { days: weekDays, weekFocus };
}

export function generateSchedule(
  settings: SprintSettings,
  options?: { rng?: () => number; baseDate?: Date }
): SprintPlan {
  const {
    weeks = 8,
    dailyHours = 4,
    coreScheduleMode = "weekends",
    selectedCores = ["os", "dbms", "cn"],
    targetCompany = "general",
    language = "Java",
    startDate
  } = settings;

  const hasTopicPlan = settings.topicPlan !== undefined;
  const seedKey = `${targetCompany}:${weeks}:${language}:${dailyHours}:${selectedCores.join(",")}:${settings.diagnostic ? JSON.stringify(settings.diagnostic) : ""}`;
  const rng = options?.rng || createPRNG(seedKey);
  const totalDays = weeks * 7;
  const companyPreset = COMPANY_PRESETS[targetCompany] || COMPANY_PRESETS.general;

  // Flatten selected core subjects (honoring topicPlan if defined)
  const corePlanEntries = hasTopicPlan
    ? settings.topicPlan!.filter((e) => e.kind === "core")
    : [];

  const coreSubjectKeys = corePlanEntries.length > 0
    ? corePlanEntries
        .filter((e) => e.status === "new")
        .sort((a, b) => a.order - b.order)
        .map((e) => e.topicId)
    : selectedCores;

  const coreTasksList: { subject: string; title: string; items: string[] }[] = [];
  coreSubjectKeys.forEach((cKey) => {
    const list = (CORE_SUBJECTS_POOL as Record<string, { title: string; items: string[] }[]>)[cKey] || [];
    list.forEach((entry) => {
      coreTasksList.push({
        subject: cKey.toUpperCase(),
        title: entry.title,
        items: entry.items
      });
    });
  });

  const baseDate = options?.baseDate
    ? new Date(options.baseDate)
    : startDate
    ? new Date(startDate)
    : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const mockWeeksCount =
    settings.reserveMockWeeks !== false ? (weeks >= 12 ? 2 : weeks >= 6 ? 1 : 0) : 0;
  const contentWeeksCount = Math.max(1, weeks - mockWeeksCount);

  let legacyTopicList: DsaTopicCategory[] = [];
  let topicQueueResult: BuildTopicQueueResult | null = null;

  if (hasTopicPlan) {
    topicQueueResult = buildTopicQueue(settings, contentWeeksCount);
  } else {
    const legacySeq = generateWeightedTopicSequence(weeks, settings);
    legacyTopicList = legacySeq.topicList;
  }

  const usedTitlesByTopic = new Map<string, Set<string>>();
  const generatedWeeks: PlanWeek[] = [];
  const coreIndexRef = { current: 0 };
  let dayCounter = 1;
  const revisionPool = hasTopicPlan ? buildRevisionPool(settings) : [];

  for (let w = 1; w <= weeks; w++) {
    const isMockWeek = w > weeks - mockWeeksCount;

    let weekTopicIds: string[] = [];
    let isRevisionWeek = false;

    if (hasTopicPlan && topicQueueResult) {
      if (isMockWeek) {
        weekTopicIds = [];
      } else {
        const assignment = topicQueueResult.assignments[w - 1];
        weekTopicIds = assignment ? assignment.topicIds : [];
        isRevisionWeek = assignment ? assignment.isRevisionWeek : false;
      }
    } else {
      const currentLegacy = legacyTopicList[(w - 1) % legacyTopicList.length];
      weekTopicIds = currentLegacy ? [currentLegacy.id || currentLegacy.tag] : [];
    }

    const { days: weekDays, weekFocus } = generateSingleWeekDays({
      w,
      weekTopicIds,
      isMockWeek,
      isRevisionWeek,
      settings,
      baseDate,
      dayCounterStart: dayCounter,
      rng,
      usedTitlesByTopic,
      coreTasksList,
      coreIndexRef,
      revisionPool,
      companyPreset,
      hasTopicPlan,
      legacyTopicList
    });

    dayCounter += 7;

    generatedWeeks.push({
      weekNumber: w,
      weekFocus,
      isMockInterviewWeek: isMockWeek,
      topicIds: weekTopicIds,
      coreTopicIds: coreSubjectKeys,
      days: weekDays
    });
  }

  return {
    metadata: {
      generatedAt: (options?.baseDate || baseDate).toISOString(),
      targetCompany: companyPreset.name,
      language,
      totalWeeks: weeks,
      totalDays,
      dailyHours,
      coreScheduleMode,
      selectedCores,
      targetInterviewDate: settings.targetInterviewDate,
      startDate: formatISODate(baseDate),
      schemaVersion: 4,
      topicPlan: settings.topicPlan,
      sundayRevisionMins: settings.sundayRevisionMins
    },
    weeks: generatedWeeks,
    settings
  };
}

export function regenerateFrom(
  settings: SprintSettings,
  currentPlan: SprintPlan,
  fromDayNumber: number
): SprintPlan {
  // If fromDayNumber <= 1 and no tasks are completed, perform fresh generation
  const hasAnyCompleted = currentPlan.weeks.some((w) =>
    w.days.some((d) => d.tasks.some((t) => t.completed))
  );

  const baseDate = currentPlan.metadata.startDate
    ? new Date(currentPlan.metadata.startDate)
    : new Date();
  baseDate.setHours(0, 0, 0, 0);

  if (fromDayNumber <= 1 && !hasAnyCompleted) {
    return generateSchedule(settings, { baseDate });
  }

  const effectiveFromDay = Math.max(1, fromDayNumber);
  const totalWeeks = settings.weeks || currentPlan.metadata.totalWeeks;
  const mockWeeksCount =
    settings.reserveMockWeeks !== false ? (totalWeeks >= 12 ? 2 : totalWeeks >= 6 ? 1 : 0) : 0;
  const contentWeeksCount = Math.max(1, totalWeeks - mockWeeksCount);

  // 1. Determine preserved days:
  // Day is preserved if dayNumber <= effectiveFromDay OR day has any completed task
  const isDayPreserved = (d: PlanDay): boolean => {
    return d.dayNumber <= effectiveFromDay || d.tasks.some((t) => t.completed);
  };

  const preservedDaysMap = new Map<number, PlanDay>();
  for (const w of currentPlan.weeks) {
    for (const d of w.days) {
      if (isDayPreserved(d)) {
        preservedDaysMap.set(d.dayNumber, d);
      }
    }
  }

  // 2. Identify taught topics from preserved days
  const taughtDsaTopicIds = new Set<string>();
  const taughtCoreSubjects = new Set<string>();

  for (const d of preservedDaysMap.values()) {
    for (const t of d.tasks) {
      if (t.topicId) {
        const resolved = resolveTopic(t.topicId);
        taughtDsaTopicIds.add(resolved ? resolved.id : t.topicId);
      }
      if (t.track === "Core CS" && t.subject) {
        taughtCoreSubjects.add(t.subject.toLowerCase());
      }
    }
  }

  // 3. Filter settings.topicPlan for remaining untaught topics
  const hasTopicPlan = settings.topicPlan !== undefined;
  let remainingTopicPlan: TopicPlanEntry[] | undefined = undefined;

  if (hasTopicPlan && settings.topicPlan) {
    remainingTopicPlan = settings.topicPlan.map((entry) => {
      if (entry.kind === "dsa") {
        const resolved = resolveTopic(entry.topicId);
        const canonId = resolved ? resolved.id : entry.topicId;
        if (taughtDsaTopicIds.has(canonId)) {
          return { ...entry, status: "studied" as const };
        }
      } else if (entry.kind === "core") {
        if (taughtCoreSubjects.has(entry.topicId.toLowerCase())) {
          return { ...entry, status: "studied" as const };
        }
      }
      return entry;
    });
  }

  // 4. Carry over uncompleted Spaced Repetition tasks from future unpreserved days
  interface PendingSrTask {
    targetDayNumber: number;
    task: PlanTask;
  }
  const pendingSrTasks: PendingSrTask[] = [];

  for (const w of currentPlan.weeks) {
    for (const d of w.days) {
      if (!isDayPreserved(d)) {
        for (const t of d.tasks) {
          if (
            (t.track === "Spaced Repetition" || t.id.startsWith("sr-")) &&
            !t.completed
          ) {
            pendingSrTasks.push({ targetDayNumber: d.dayNumber, task: t });
          }
        }
      }
    }
  }

  // 5. Build queue for remaining future content weeks
  const activeWeekNumber = Math.ceil(effectiveFromDay / 7);

  // Check if activeWeekNumber has unpreserved days needing generation
  const activeWeekStartDay = (activeWeekNumber - 1) * 7 + 1;
  const activeWeekHasNewDays = [0, 1, 2, 3, 4, 5, 6].some(
    (offset) => !preservedDaysMap.has(activeWeekStartDay + offset)
  );

  const startContentWeek = activeWeekHasNewDays ? activeWeekNumber : activeWeekNumber + 1;
  const remainingContentWeeks = Math.max(0, contentWeeksCount - startContentWeek + 1);

  let topicQueueResult: BuildTopicQueueResult | null = null;
  if (hasTopicPlan && remainingContentWeeks > 0) {
    topicQueueResult = buildTopicQueue(
      { ...settings, topicPlan: remainingTopicPlan },
      remainingContentWeeks
    );
  }

  // 6. Setup generation state & seed PRNG
  const seedKey = `regen:${effectiveFromDay}:${settings.targetCompany}:${totalWeeks}:${settings.dailyHours}`;
  const rng = createPRNG(seedKey);
  const companyPreset = COMPANY_PRESETS[settings.targetCompany] || COMPANY_PRESETS.general;

  // Track titles used in preserved days to prevent duplicate problems
  const usedTitlesByTopic = new Map<string, Set<string>>();
  for (const d of preservedDaysMap.values()) {
    for (const t of d.tasks) {
      if (t.topicId) {
        if (!usedTitlesByTopic.has(t.topicId)) {
          usedTitlesByTopic.set(t.topicId, new Set<string>());
        }
        usedTitlesByTopic.get(t.topicId)!.add(t.title);
      }
    }
  }

  // Core CS tasks
  const corePlanEntries = hasTopicPlan && remainingTopicPlan
    ? remainingTopicPlan.filter((e) => e.kind === "core")
    : [];

  const coreSubjectKeys = corePlanEntries.length > 0
    ? corePlanEntries
        .filter((e) => e.status === "new")
        .sort((a, b) => a.order - b.order)
        .map((e) => e.topicId)
    : settings.selectedCores;

  const coreTasksList: { subject: string; title: string; items: string[] }[] = [];
  coreSubjectKeys.forEach((cKey) => {
    const list = (CORE_SUBJECTS_POOL as Record<string, { title: string; items: string[] }[]>)[cKey] || [];
    list.forEach((entry) => {
      coreTasksList.push({
        subject: cKey.toUpperCase(),
        title: entry.title,
        items: entry.items
      });
    });
  });

  const coreIndexRef = { current: 0 };
  const revisionPool = hasTopicPlan ? buildRevisionPool({ ...settings, topicPlan: remainingTopicPlan }) : [];

  let legacyTopicList: DsaTopicCategory[] = [];
  if (!hasTopicPlan) {
    const legacySeq = generateWeightedTopicSequence(totalWeeks, settings);
    legacyTopicList = legacySeq.topicList;
  }

  const generatedWeeks: PlanWeek[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const isMockWeek = w > totalWeeks - mockWeeksCount;
    const weekStartDay = (w - 1) * 7 + 1;

    // Check if entire week is preserved
    const allDaysPreserved = [0, 1, 2, 3, 4, 5, 6].every((offset) =>
      preservedDaysMap.has(weekStartDay + offset)
    );

    if (allDaysPreserved) {
      const existingWeek = currentPlan.weeks.find((cw) => cw.weekNumber === w);
      if (existingWeek) {
        generatedWeeks.push(existingWeek);
        continue;
      }
    }

    // Determine week topic IDs for new generation
    let weekTopicIds: string[] = [];
    let isRevisionWeek = false;

    if (hasTopicPlan && topicQueueResult) {
      if (isMockWeek) {
        weekTopicIds = [];
      } else {
        const queueIndex = w - startContentWeek;
        if (queueIndex >= 0 && queueIndex < topicQueueResult.assignments.length) {
          const assignment = topicQueueResult.assignments[queueIndex];
          weekTopicIds = assignment ? assignment.topicIds : [];
          isRevisionWeek = assignment ? assignment.isRevisionWeek : false;
        }
      }
    } else if (!hasTopicPlan) {
      const currentLegacy = legacyTopicList[(w - 1) % legacyTopicList.length];
      weekTopicIds = currentLegacy ? [currentLegacy.id || currentLegacy.tag] : [];
    }

    // Generate single week days
    const singleWeek = generateSingleWeekDays({
      w,
      weekTopicIds,
      isMockWeek,
      isRevisionWeek,
      settings,
      baseDate,
      dayCounterStart: weekStartDay,
      rng,
      usedTitlesByTopic,
      coreTasksList,
      coreIndexRef,
      revisionPool,
      companyPreset,
      hasTopicPlan,
      legacyTopicList
    });

    // Merge preserved days with newly generated days
    const mergedDays: PlanDay[] = [];
    const preservedTopicsInWeek = new Set<string>();

    for (let d = 1; d <= 7; d++) {
      const dayNum = weekStartDay + d - 1;
      const preserved = preservedDaysMap.get(dayNum);
      if (preserved) {
        mergedDays.push(preserved);
        for (const t of preserved.tasks) {
          if (t.topicId) preservedTopicsInWeek.add(t.topicId);
        }
      } else {
        const newlyGeneratedDay = singleWeek.days[d - 1];
        mergedDays.push(newlyGeneratedDay);
      }
    }

    // Straddling week: combine past and new topics for week.topicIds
    const combinedWeekTopicIds = Array.from(
      new Set([...Array.from(preservedTopicsInWeek), ...weekTopicIds])
    );

    // If this is a straddling week and Sunday (d=7) was newly generated,
    // re-hydrate its Sunday revision so it covers combinedWeekTopicIds
    const sundayDayNum = weekStartDay + 6;
    if (!preservedDaysMap.has(sundayDayNum) && !isMockWeek && hasTopicPlan) {
      const sundayDay = mergedDays[6];
      if (sundayDay && sundayDay.dayOfWeek === 7) {
        const sundayMins = settings.sundayRevisionMins || 240;
        const freshSundayTasks = buildSundayRevision({
          weekNumber: w,
          dayNumber: sundayDayNum,
          weekTopicIds: combinedWeekTopicIds,
          pool: revisionPool,
          totalMins: sundayMins
        });
        sundayDay.tasks = freshSundayTasks;
        sundayDay.allocatedMins = sundayMins;
      }
    }

    generatedWeeks.push({
      weekNumber: w,
      weekFocus: singleWeek.weekFocus,
      isMockInterviewWeek: isMockWeek,
      topicIds: combinedWeekTopicIds,
      coreTopicIds: coreSubjectKeys,
      days: mergedDays
    });
  }

  // 7. Re-inject pending SR tasks with capacity clamping
  const targetDailyMins = settings.dailyHours * 60;
  for (const item of pendingSrTasks) {
    let placed = false;
    for (let candDayNum = item.targetDayNumber; candDayNum <= totalWeeks * 7; candDayNum++) {
      if (preservedDaysMap.has(candDayNum)) continue;

      for (const w of generatedWeeks) {
        const d = w.days.find((day) => day.dayNumber === candDayNum);
        if (d) {
          const currentMins = d.tasks.reduce((sum, t) => sum + t.timeMins, 0);
          const limit = d.allocatedMins || targetDailyMins;

          if (currentMins + item.task.timeMins <= limit) {
            d.tasks.push(item.task);
            placed = true;
            break;
          }

          const flexibleTask = d.tasks.find(
            (t) => !t.completed && t.track !== "Spaced Repetition" && t.timeMins >= 60
          );
          if (flexibleTask) {
            flexibleTask.timeMins -= item.task.timeMins;
            d.tasks.push(item.task);
            placed = true;
            break;
          }

          if (d.dayOfWeek === 7) {
            const thisWeekBlock = d.tasks.find(
              (t) => t.revisionMeta?.block === "this-week" && !t.completed && t.timeMins > 30
            );
            if (thisWeekBlock) {
              thisWeekBlock.timeMins -= item.task.timeMins;
              d.tasks.push(item.task);
              placed = true;
              break;
            }
          }
        }
      }
      if (placed) break;
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      targetCompany: companyPreset.name,
      language: settings.language,
      totalWeeks,
      totalDays: totalWeeks * 7,
      dailyHours: settings.dailyHours,
      coreScheduleMode: settings.coreScheduleMode,
      selectedCores: settings.selectedCores,
      targetInterviewDate: settings.targetInterviewDate,
      startDate: currentPlan.metadata.startDate || formatISODate(baseDate),
      schemaVersion: 4,
      topicPlan: remainingTopicPlan || settings.topicPlan,
      sundayRevisionMins: settings.sundayRevisionMins
    },
    weeks: generatedWeeks,
    settings: {
      ...settings,
      topicPlan: remainingTopicPlan || settings.topicPlan
    }
  };
}
