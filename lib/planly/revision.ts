import { PlanTask, SprintPlan, SprintSettings } from "./types";
import { CORE_SUBJECTS_POOL, DSA_TOPICS_POOL, resolveTopic } from "./pools";

export interface RevisionPoolItem {
  topicId: string;
  kind: "dsa" | "core";
  weight: number; // rusty=3, okay=2, solid=1 (+1 if company-critical)
}

function isCompanyCriticalTopic(topicId: string, targetCompany?: string): boolean {
  if (!targetCompany) return false;
  const resolved = resolveTopic(topicId);
  const tag = resolved?.tag || topicId.toLowerCase();
  const c = targetCompany.toLowerCase();

  if (c.includes("google") && (tag === "dp" || tag === "graphs")) return true;
  if (c.includes("amazon") && (tag === "trees" || tag === "graphs" || tag === "lld")) return true;
  if (c.includes("microsoft") && (tag === "arrays" || tag === "trees" || tag === "os")) return true;
  if (c.includes("startup") && tag === "lld") return true;

  return false;
}

/**
 * Builds the revision pool of studied topics where skipRevision !== true.
 * Applies company-critical weight boost (+1 step) and sorts by weight desc.
 */
export function buildRevisionPool(settings?: Partial<SprintSettings>): RevisionPoolItem[] {
  if (!settings || !settings.topicPlan || settings.topicPlan.length === 0) return [];

  const studied = settings.topicPlan.filter(
    (e) => e.status === "studied" && e.skipRevision !== true
  );

  const pool: RevisionPoolItem[] = studied.map((entry) => {
    let baseWeight = 2; // fallback
    if (entry.confidence === "rusty") baseWeight = 3;
    else if (entry.confidence === "okay") baseWeight = 2;
    else if (entry.confidence === "solid") baseWeight = 1;

    if (isCompanyCriticalTopic(entry.topicId, settings.targetCompany)) {
      baseWeight += 1;
    }

    return {
      topicId: entry.topicId,
      kind: entry.kind,
      weight: baseWeight
    };
  });

  // Sort by weight desc, tie-break alphabetically by topicId
  pool.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.topicId.localeCompare(b.topicId);
  });

  return pool;
}

/**
 * Builds a structured recall drill card for a Core CS subject.
 */
export function buildCoreCsRecallTask(args: {
  subjectKey: string;
  dayNumber: number;
  timeMins: number;
  subtopicTitle?: string;
  items?: string[];
}): PlanTask {
  const { subjectKey, dayNumber, timeMins } = args;
  const resolved = resolveTopic(subjectKey);
  const subjectName = resolved ? resolved.name : subjectKey.toUpperCase();

  const poolList = (CORE_SUBJECTS_POOL as Record<string, { title: string; items: string[] }[]>)[subjectKey] || [];
  const defaultSubtopic = poolList[0] || { title: "Core Architecture & Principles", items: ["Core principles review"] };
  const title = args.subtopicTitle || defaultSubtopic.title;
  const details = args.items || [
    "10-min active recall: key definitions & principles without notes",
    "15-min write-from-memory: draw architecture, protocol flow, or schema",
    "5-min self-quiz: explain edge-case trade-offs and failure modes"
  ];

  return {
    id: `task-${dayNumber}-rev-core-${subjectKey}`,
    track: "Revision",
    title: `Revise ${subjectKey.toUpperCase()}: ${title}`,
    subject: subjectName,
    details,
    timeMins,
    confidence: null,
    completed: false,
    isBacklogEligible: false,
    topicId: subjectKey,
    originDay: dayNumber,
    revisionMeta: {
      block: "prior-pool",
      topicId: subjectKey,
      kind: "core",
      hydrated: true
    }
  };
}

/**
 * Builds the Sunday 240-minute revision skeleton tasks.
 * Guarantees that the sum of task timeMins strictly equals totalMins.
 */
export function buildSundayRevision(args: {
  weekNumber: number;
  dayNumber: number;
  weekTopicIds: string[];
  pool: RevisionPoolItem[];
  totalMins: number; // settings.sundayRevisionMins ?? 240
}): PlanTask[] {
  const { weekNumber, dayNumber, weekTopicIds, pool, totalMins = 240 } = args;

  // 1. Fixed baselines: Retro (20m) and Backlog placeholder (40m)
  let retroMins = Math.min(20, Math.floor(totalMins * 0.1));
  let backlogMins = Math.min(40, Math.floor(totalMins * 0.2));

  if (totalMins >= 60) {
    retroMins = 20;
    backlogMins = 40;
  }

  const remainder = Math.max(0, totalMins - retroMins - backlogMins);

  // 2. Prior pool calculation (15% of remainder rounded to nearest 5 min, 0 if pool empty)
  let priorPoolMins = pool.length > 0 ? Math.round((remainder * 0.15) / 5) * 5 : 0;
  let thisWeekTotal = remainder - priorPoolMins;

  // 3. Handle empty weekTopicIds or empty pool edge cases
  let generalReviewMins = 0;
  if (weekTopicIds.length === 0) {
    // In revision weeks, this-week minutes roll into prior-pool
    if (pool.length > 0) {
      priorPoolMins += thisWeekTotal;
      thisWeekTotal = 0;
    } else {
      // Both empty: split into backlog clearance + general pattern review
      const half = Math.floor(thisWeekTotal / 2);
      backlogMins += half;
      generalReviewMins = thisWeekTotal - half;
      thisWeekTotal = 0;
    }
  }

  const tasks: PlanTask[] = [];

  // Retro task
  if (retroMins > 0) {
    tasks.push({
      id: `task-${dayNumber}-rev-retro`,
      track: "Revision",
      title: "Weekly Retrospective & Pattern Synthesis",
      subject: "Cognitive Consolidation",
      details: [
        "Review key algorithmic patterns and intuition breakthroughs from this week",
        "Consolidate handwritten diagrams, edge-case notes, and complexity trade-offs"
      ],
      timeMins: retroMins,
      confidence: null,
      completed: false,
      isBacklogEligible: false,
      originDay: dayNumber,
      revisionMeta: {
        block: "retro",
        hydrated: true
      }
    });
  }

  // Backlog clearance placeholder task
  if (backlogMins > 0) {
    tasks.push({
      id: `task-${dayNumber}-rev-backlog`,
      track: "Revision",
      title: "Weekly Backlog Clearance & Re-solve Placeholder",
      subject: "Debt Engine",
      details: [
        "Dedicated buffer to clear overdue struggled problems without penalty",
        "Unused backlog minutes transfer directly to active revision upon hydration"
      ],
      timeMins: backlogMins,
      confidence: null,
      completed: false,
      isBacklogEligible: false,
      originDay: dayNumber,
      revisionMeta: {
        block: "backlog",
        hydrated: false
      }
    });
  }

  // Prior pool block
  if (priorPoolMins > 0) {
    tasks.push({
      id: `task-${dayNumber}-rev-prior`,
      track: "Revision",
      title: "Prior Studied Topics Revision Block",
      subject: "Spaced Retention Engine",
      details: [
        "Targeted re-attempts and recall drills from previously studied topics",
        "Populated from the studied topics pool based on confidence priority"
      ],
      timeMins: priorPoolMins,
      confidence: null,
      completed: false,
      isBacklogEligible: false,
      originDay: dayNumber,
      revisionMeta: {
        block: "prior-pool",
        hydrated: false
      }
    });
  }

  // This-week topic blocks
  if (thisWeekTotal > 0 && weekTopicIds.length > 0) {
    const k = weekTopicIds.length;
    const basePerTopic = Math.floor(thisWeekTotal / k);
    const remainderMins = thisWeekTotal % k;

    weekTopicIds.forEach((topicId, subIdx) => {
      const topicAlloc = subIdx === 0 ? basePerTopic + remainderMins : basePerTopic;
      const resolved = resolveTopic(topicId);
      const topicName = resolved ? resolved.name : topicId;

      tasks.push({
        id: `task-${dayNumber}-rev-this-week-${subIdx + 1}`,
        track: "Revision",
        title: `Sunday Revision: ${topicName}`,
        subject: `${topicName} (Week ${weekNumber})`,
        details: [
          "Re-solve problems completed this week with fresh intuition without hints",
          "Focus on speed, memory bounds, and alternative optimal implementations"
        ],
        timeMins: topicAlloc,
        confidence: null,
        completed: false,
        isBacklogEligible: false,
        topicId,
        originDay: dayNumber,
        revisionMeta: {
          block: "this-week",
          topicId,
          hydrated: false
        }
      });
    });
  }

  // General pattern review if both weekTopicIds and pool were empty
  if (generalReviewMins > 0) {
    tasks.push({
      id: `task-${dayNumber}-rev-general`,
      track: "Revision",
      title: "Algorithmic Pattern Synthesis & Edge Case Drills",
      subject: "Global Pattern Synthesis",
      details: [
        "Review foundational coding patterns across two-pointers, trees, and hashing",
        "Speed drills on time/space complexity boundary trade-offs"
      ],
      timeMins: generalReviewMins,
      confidence: null,
      completed: false,
      isBacklogEligible: false,
      originDay: dayNumber,
      revisionMeta: {
        block: "this-week",
        hydrated: true
      }
    });
  }

  // Final invariant clamp: ensure exact mathematical sum equals totalMins
  const sum = tasks.reduce((acc, t) => acc + t.timeMins, 0);
  const diff = totalMins - sum;
  if (diff !== 0 && tasks.length > 0) {
    tasks[tasks.length - 1].timeMins += diff;
  }

  return tasks;
}

/**
 * Pure runtime hydration for Sunday revision tasks.
 * Converts placeholder blocks into concrete problem re-solves and recall drills.
 * Non-destructive and strictly idempotent.
 */
export function hydrateSundayRevision(
  plan: SprintPlan,
  weekNumber: number,
  completionLog?: PlanTask[]
): SprintPlan {
  if (!plan || !plan.weeks || weekNumber < 1 || weekNumber > plan.weeks.length) {
    return plan;
  }

  const targetWeekIdx = weekNumber - 1;
  const targetWeek = plan.weeks[targetWeekIdx];
  if (!targetWeek || targetWeek.isMockInterviewWeek) {
    return plan;
  }

  const sundayDayIdx = targetWeek.days.findIndex((d) => d.dayOfWeek === 7);
  if (sundayDayIdx === -1) return plan;

  const sundayDay = targetWeek.days[sundayDayIdx];
  const existingTasks = sundayDay.tasks;

  // Idempotency check: if all tasks are already hydrated, return unchanged
  const allHydrated = existingTasks.every((t) => t.revisionMeta?.hydrated !== false);
  if (allHydrated && existingTasks.length > 0) {
    return plan;
  }

  // Identify active SR tasks already scheduled in this week to prevent double-scheduling (A8)
  const weekSrProblemTitles = new Set<string>();
  const weekSrProblemUrls = new Set<string>();
  targetWeek.days.forEach((d) => {
    d.tasks.forEach((t) => {
      if (t.track === "Spaced Repetition") {
        const cleanTitle = t.title.replace(/^\[(Re-attempt Drill|Re-solve)\]\s*/, "").trim();
        weekSrProblemTitles.add(cleanTitle);
        if (t.problemUrl) weekSrProblemUrls.add(t.problemUrl);
      }
    });
  });

  // Collect completed problems from Days 1..6 of this week
  const weekCompletedTasks: PlanTask[] = [];
  targetWeek.days.slice(0, 6).forEach((d) => {
    d.tasks.forEach((t) => {
      if (t.completed && (t.track === "DSA" || t.difficulty)) {
        weekCompletedTasks.push(t);
      }
    });
  });

  if (completionLog) {
    completionLog.forEach((t) => {
      if (t.completed && !weekCompletedTasks.some((w) => w.id === t.id)) {
        weekCompletedTasks.push(t);
      }
    });
  }

  // Filter out any problem that already has an SR drill this week
  const eligibleProblems = weekCompletedTasks.filter((p) => {
    const cleanPTitle = p.title.replace(/^\[(Re-attempt Drill|Re-solve)\]\s*/, "").trim();
    if (weekSrProblemTitles.has(cleanPTitle)) return false;
    if (p.problemUrl && weekSrProblemUrls.has(p.problemUrl)) return false;
    return true;
  });

  // Check backlog debt: count uncompleted backlog-eligible tasks strictly before this Sunday
  let overdueBacklogCount = 0;
  plan.weeks.forEach((w) => {
    w.days.forEach((d) => {
      if (d.dayNumber < sundayDay.dayNumber) {
        d.tasks.forEach((t) => {
          if (!t.completed && t.isBacklogEligible) {
            overdueBacklogCount++;
          }
        });
      }
    });
  });

  const isBacklogClear = overdueBacklogCount === 0;

  // Find placeholder blocks that need hydration
  let revisionCursor = plan.metadata.revisionCursor || 0;
  const newTasks: PlanTask[] = [];

  // Group eligible problems by topicId
  const problemsByTopic = new Map<string, PlanTask[]>();
  eligibleProblems.forEach((p) => {
    const topicKey = p.topicId || "general";
    if (!problemsByTopic.has(topicKey)) {
      problemsByTopic.set(topicKey, []);
    }
    problemsByTopic.get(topicKey)!.push(p);
  });

  // Sort each topic's completed problems: struggled first, then hint, then clean
  const confidenceOrder = { struggled: 0, hint: 1, clean: 2 };
  problemsByTopic.forEach((list) => {
    list.sort((a, b) => {
      const confA = a.confidence ? confidenceOrder[a.confidence] ?? 3 : 3;
      const confB = b.confidence ? confidenceOrder[b.confidence] ?? 3 : 3;
      return confA - confB;
    });
  });

  // Find total backlog minutes if backlog is clear to transfer to this-week
  let transferBacklogMins = 0;
  const backlogTask = existingTasks.find((t) => t.revisionMeta?.block === "backlog");
  if (isBacklogClear && backlogTask && !backlogTask.completed) {
    transferBacklogMins = backlogTask.timeMins;
  }

  const thisWeekPlaceholders = existingTasks.filter(
    (t) => t.revisionMeta?.block === "this-week" && t.revisionMeta?.hydrated === false
  );
  const extraPerThisWeek = thisWeekPlaceholders.length > 0
    ? Math.floor(transferBacklogMins / thisWeekPlaceholders.length)
    : 0;

  let taskCounter = 1;

  for (const t of existingTasks) {
    // Non-destructive rule: never alter or replace tasks that are completed or already hydrated
    if (t.completed || t.revisionMeta?.hydrated === true) {
      newTasks.push(t);
      continue;
    }

    // 1. Backlog block
    if (t.revisionMeta?.block === "backlog") {
      if (isBacklogClear) {
        // Backlog is clean -> transfer minutes to this-week, leave compact completed status card
        newTasks.push({
          ...t,
          title: "Backlog Fully Cleared (Capacity Reassigned to Problem Solving)",
          timeMins: 0,
          completed: true,
          revisionMeta: {
            ...t.revisionMeta,
            hydrated: true
          }
        });
      } else {
        newTasks.push({
          ...t,
          revisionMeta: {
            ...t.revisionMeta,
            hydrated: true
          }
        });
      }
      continue;
    }

    // 2. This-week block
    if (t.revisionMeta?.block === "this-week") {
      const topicId = t.revisionMeta.topicId || (targetWeek.topicIds && targetWeek.topicIds[0]);
      const availableMins = t.timeMins + extraPerThisWeek;
      let budgetRemaining = availableMins;

      const candidates = (topicId && problemsByTopic.get(topicId)) || [];
      const topicCategory = topicId ? DSA_TOPICS_POOL.find((dt) => dt.id === topicId || dt.tag === topicId) : null;
      const topicName = topicCategory?.topic || topicId || "DSA";

      const generatedForBlock: PlanTask[] = [];

      // A. Re-solve cards for problems completed during the week
      for (const cand of candidates) {
        if (budgetRemaining < 25) break;
        const duration = Math.min(
          budgetRemaining,
          cand.difficulty === "Easy" ? 30 : cand.difficulty === "Hard" ? 55 : 40
        );

        generatedForBlock.push({
          id: `task-${sundayDay.dayNumber}-rev-solve-${taskCounter++}`,
          track: "Revision",
          title: `[Re-solve] ${cand.title}`,
          subject: `${topicName} Spaced Re-solve`,
          details: [
            "Re-solve without checking hints or solutions",
            cand.confidence === "struggled"
              ? "Priority focus: solidify correct boundary condition & algorithm choice"
              : "Priority focus: optimize implementation speed and clean variable names"
          ],
          timeMins: duration,
          confidence: null,
          completed: false,
          isBacklogEligible: true,
          difficulty: cand.difficulty,
          problemUrl: cand.problemUrl,
          videoUrl: cand.videoUrl,
          intuitionHint: cand.intuitionHint,
          topicId: cand.topicId,
          pattern: cand.pattern,
          originDay: sundayDay.dayNumber,
          revisionMeta: {
            block: "this-week",
            topicId,
            hydrated: true
          }
        });
        budgetRemaining -= duration;
      }

      // B. Fresh medium problem if budget remains
      if (budgetRemaining >= 35 && topicCategory && topicCategory.questions) {
        const usedTitles = new Set(weekCompletedTasks.map((c) => c.title));
        const availableFresh = topicCategory.questions.filter((q) => !usedTitles.has(q.title));
        const freshQ = availableFresh.find((q) => q.difficulty === "Medium") || availableFresh[0];

        if (freshQ) {
          const freshDuration = Math.min(45, budgetRemaining);
          generatedForBlock.push({
            id: `task-${sundayDay.dayNumber}-rev-fresh-${taskCounter++}`,
            track: "Revision",
            title: `[Fresh Challenge] ${freshQ.title}`,
            subject: `${topicName} Mastery Drill`,
            details: [
              freshQ.pattern ? `Pattern: ${freshQ.pattern}` : "Apply core weekly patterns",
              "Target: solve within 35-45 minutes"
            ],
            timeMins: freshDuration,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            difficulty: freshQ.difficulty,
            problemUrl: freshQ.leetcodeUrl,
            videoUrl: freshQ.videoUrl,
            intuitionHint: freshQ.intuitionHint,
            topicId,
            pattern: freshQ.pattern,
            originDay: sundayDay.dayNumber,
            revisionMeta: {
              block: "this-week",
              topicId,
              hydrated: true
            }
          });
          budgetRemaining -= freshDuration;
        }
      }

      // C. Active recall card for leftover minutes (or if no candidates)
      if (budgetRemaining > 0 || generatedForBlock.length === 0) {
        const recallMins = Math.max(10, budgetRemaining);
        generatedForBlock.push({
          id: `task-${sundayDay.dayNumber}-rev-recall-${taskCounter++}`,
          track: "Revision",
          title: `Active Recall & Pattern Map: ${topicName}`,
          subject: "Mental Models",
          details: [
            "Draw decision tree for when to apply this pattern vs alternatives",
            "Review time & space complexity constraints"
          ],
          timeMins: recallMins,
          confidence: null,
          completed: false,
          isBacklogEligible: false,
          topicId,
          originDay: sundayDay.dayNumber,
          revisionMeta: {
            block: "this-week",
            topicId,
            hydrated: true
          }
        });
      }

      newTasks.push(...generatedForBlock);
      continue;
    }

    // 3. Prior-pool block
    if (t.revisionMeta?.block === "prior-pool") {
      const effectiveSettings = plan.settings || {
        topicPlan: plan.metadata.topicPlan,
        targetCompany: plan.metadata.targetCompany as SprintSettings["targetCompany"],
        sundayRevisionMins: plan.metadata.sundayRevisionMins
      };
      const pool = buildRevisionPool(effectiveSettings);
      if (pool.length === 0) {
        newTasks.push({
          ...t,
          revisionMeta: { ...t.revisionMeta, hydrated: true }
        });
        continue;
      }

      const pickedTopic = pool[revisionCursor % pool.length];
      revisionCursor++;

      if (pickedTopic.kind === "core") {
        const coreRecall = buildCoreCsRecallTask({
          subjectKey: pickedTopic.topicId,
          dayNumber: sundayDay.dayNumber,
          timeMins: t.timeMins
        });
        newTasks.push(coreRecall);
      } else {
        const cat = DSA_TOPICS_POOL.find((dt) => dt.id === pickedTopic.topicId || dt.tag === pickedTopic.topicId);
        const qList = cat?.questions || [];
        const cand = qList.find((q) => q.difficulty === (pickedTopic.weight >= 2 ? "Medium" : "Easy")) || qList[0];

        if (cand) {
          newTasks.push({
            id: `task-${sundayDay.dayNumber}-rev-prior-${taskCounter++}`,
            track: "Revision",
            title: `[Prior Topic Drill] ${cand.title}`,
            subject: `${cat?.topic || pickedTopic.topicId} Retention`,
            details: [
              "Targeted retention solve from previously studied topic pool",
              cand.pattern ? `Pattern focus: ${cand.pattern}` : "Solve with fresh intuition"
            ],
            timeMins: t.timeMins,
            confidence: null,
            completed: false,
            isBacklogEligible: true,
            difficulty: cand.difficulty,
            problemUrl: cand.leetcodeUrl,
            videoUrl: cand.videoUrl,
            intuitionHint: cand.intuitionHint,
            topicId: pickedTopic.topicId,
            pattern: cand.pattern,
            originDay: sundayDay.dayNumber,
            revisionMeta: {
              block: "prior-pool",
              topicId: pickedTopic.topicId,
              hydrated: true
            }
          });
        } else {
          newTasks.push({
            ...t,
            revisionMeta: { ...t.revisionMeta, hydrated: true }
          });
        }
      }
      continue;
    }

    // Retro or other blocks
    newTasks.push({
      ...t,
      revisionMeta: t.revisionMeta ? { ...t.revisionMeta, hydrated: true } : undefined
    });
  }

  // Exact minute sum invariant check:
  const targetTotal = sundayDay.allocatedMins || 240;
  const currentSum = newTasks.reduce((acc, task) => acc + task.timeMins, 0);
  const diff = targetTotal - currentSum;
  if (diff !== 0 && newTasks.length > 0) {
    const uncompleted = newTasks.slice().reverse().find((task) => !task.completed && task.timeMins + diff >= 10);
    if (uncompleted) {
      uncompleted.timeMins += diff;
    } else {
      newTasks[newTasks.length - 1].timeMins += diff;
    }
  }

  const updatedWeeks = plan.weeks.map((w, wIdx) => {
    if (wIdx !== targetWeekIdx) return w;
    return {
      ...w,
      days: w.days.map((d, dIdx) => {
        if (dIdx !== sundayDayIdx) return d;
        return {
          ...d,
          tasks: newTasks
        };
      })
    };
  });

  return {
    ...plan,
    metadata: {
      ...plan.metadata,
      revisionCursor
    },
    weeks: updatedWeeks
  };
}

