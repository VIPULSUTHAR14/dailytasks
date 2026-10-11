import {
  PlanDay,
  PlanTask,
  PlanWeek,
  ProblemMetadata,
  SprintPlan,
  SprintSettings
} from "./types";
import {
  CORE_SUBJECTS_POOL,
  COMPANY_PRESETS,
  DSA_TOPICS_POOL,
  DsaTopicCategory
} from "./pools";

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  usedTitles: Set<string>
): SampledProblemResult[] {
  if (!topicQuestions || topicQuestions.length === 0) return [];

  // Filter out questions recently used in this sprint
  let available = topicQuestions.filter((q) => !usedTitles.has(q.title));
  if (available.length < 3) {
    usedTitles.clear();
    available = [...topicQuestions];
  }

  const easies = shuffleArray(available.filter((q) => q.difficulty === "Easy"));
  const mediums = shuffleArray(available.filter((q) => q.difficulty === "Medium"));
  const hards = shuffleArray(available.filter((q) => q.difficulty === "Hard"));

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
      shuffleArray(topicQuestions).find((q) => !results.some((r) => r.problem.title === q.title)) ||
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

export function generateSchedule(settings: SprintSettings): SprintPlan {
  const {
    weeks = 8,
    dailyHours = 4,
    coreScheduleMode = "weekends",
    selectedCores = ["os", "dbms", "cn"],
    targetCompany = "general",
    language = "Java",
    includeMockContests = true,
    startDate
  } = settings;

  const totalDays = weeks * 7;
  const companyPreset = COMPANY_PRESETS[targetCompany] || COMPANY_PRESETS.general;

  // Flatten selected core subjects
  const coreTasksList: { subject: string; title: string; items: string[] }[] = [];
  selectedCores.forEach((cKey) => {
    const list = (CORE_SUBJECTS_POOL as Record<string, { title: string; items: string[] }[]>)[cKey] || [];
    list.forEach((entry) => {
      coreTasksList.push({
        subject: cKey.toUpperCase(),
        title: entry.title,
        items: entry.items
      });
    });
  });

  const baseDate = startDate ? new Date(startDate) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const { topicList, mockWeeksCount } = generateWeightedTopicSequence(weeks, settings);
  const usedTitlesByTopic = new Map<string, Set<string>>();

  const generatedWeeks: PlanWeek[] = [];
  let coreTopicIndex = 0;
  let dayCounter = 1;
  const totalMins = dailyHours * 60;

  for (let w = 1; w <= weeks; w++) {
    const isMockWeek = w > weeks - mockWeeksCount;
    const weekDays: PlanDay[] = [];
    const currentDsaTopic = topicList[(w - 1) % topicList.length];

    if (!usedTitlesByTopic.has(currentDsaTopic.topic)) {
      usedTitlesByTopic.set(currentDsaTopic.topic, new Set<string>());
    }
    const topicUsedSet = usedTitlesByTopic.get(currentDsaTopic.topic)!;

    for (let d = 1; d <= 7; d++) {
      const isSaturday = d === 6;
      const isSunday = d === 7;
      const isBufferDay = isSunday;
      const dayTasks: PlanTask[] = [];

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
          // Break mock interview day into realistic sub-phases
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
      // CASE B: Standard Sprint Weeks - Sunday Buffer Day
      else if (isBufferDay) {
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
          const coreItem = coreTasksList[coreTopicIndex % coreTasksList.length];
          coreTopicIndex++;
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
      // CASE C: Saturday Timed Contest + Core CS
      else if (isSaturday && includeMockContests) {
        // Multi-problem contest format: 1 Easy (20m) + 1 Medium (35m) + 1 Hard (35m) = 90m
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
            "1 Medium core problem",
            "Target: optimal data structure selection & boundary checks"
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
          title: `Contest Q3: Hard Optimization Drill (35 mins)`,
          subject: `${companyPreset.name} Timed Contest (${language})`,
          details: [
            "1 Hard pattern / Graph / Multi-Dimensional DP",
            "Target: analyze state compression and memory constraints"
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
          const coreItem = coreTasksList[coreTopicIndex % coreTasksList.length];
          coreTopicIndex++;
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

        // Dynamically sample multiple diverse problems from current topic to fill dsaMins
        const sampledProblems = sampleProblemsForDay(
          currentDsaTopic.questions,
          dsaMins,
          targetCompany,
          topicUsedSet
        );

        sampledProblems.forEach((sampled, subIdx) => {
          const q = sampled.problem;
          dayTasks.push({
            id: `task-${dayCounter}-dsa-${subIdx + 1}`,
            track: "DSA",
            title: q.title,
            subject: `${sampled.slotType} • ${currentDsaTopic.topic} (${language})`,
            details: [
              q.pattern ? `Pattern: ${q.pattern}` : `Topic: ${currentDsaTopic.topic}`,
              q.timeComplexity ? `Complexity Target: ${q.timeComplexity} time` : "Solve optimally",
              q.intuitionHint ? `Hint: ${q.intuitionHint}` : "Focus on clean implementation"
            ],
            timeMins: sampled.allocatedMins,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            difficulty: q.difficulty,
            problemUrl: q.leetcodeUrl,
            intuitionHint: q.intuitionHint,
            pattern: q.pattern,
            timeComplexity: q.timeComplexity,
            spaceComplexity: q.spaceComplexity,
            topicId: q.topicId || currentDsaTopic.id,
            originDay: dayCounter
          });
        });

        // Add Core CS task(s) if applicable
        if (shouldIncludeCore && coreTasksList.length > 0) {
          const coreItem = coreTasksList[coreTopicIndex % coreTasksList.length];
          coreTopicIndex++;

          // If coreMins >= 60, break into 2 focused sub-modules
          if (coreMins >= 60) {
            const splitA = Math.round(coreMins * 0.45);
            const splitB = coreMins - splitA;

            dayTasks.push({
              id: `task-${dayCounter}-core-1`,
              track: "Core CS",
              title: `${coreItem.subject}: ${coreItem.title} (Concepts)`,
              subject: coreItem.subject,
              details: coreItem.items.slice(0, 2),
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

      weekDays.push({
        dayNumber: dayCounter,
        dayOfWeek: d,
        calendarDate: calendarDateStr,
        isBufferDay,
        isSaturday,
        allocatedMins: totalMins,
        tasks: dayTasks
      });

      dayCounter++;
    }

    generatedWeeks.push({
      weekNumber: w,
      weekFocus: isMockWeek
        ? `Mock Interview Sprints & Full ${companyPreset.name} Simulations`
        : `${currentDsaTopic.topic} + ${coreScheduleMode === "weekends" ? "Weekend Core CS" : "Parallel Core CS"}`,
      isMockInterviewWeek: isMockWeek,
      days: weekDays
    });
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      targetCompany: companyPreset.name,
      language,
      totalWeeks: weeks,
      totalDays,
      dailyHours,
      coreScheduleMode,
      selectedCores,
      targetInterviewDate: settings.targetInterviewDate,
      startDate: formatISODate(baseDate)
    },
    weeks: generatedWeeks
  };
}
