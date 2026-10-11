import { PlanTask, SprintPlan, TargetCompanyKey } from "./types";
import { DSA_TOPICS_POOL } from "./pools";

export interface TopicMasteryStat {
  topic: string;
  tag: string;
  id?: string;
  totalScheduled: number;
  totalQuestions: number;
  completed: number;
  struggled: number;
  clean: number;
  hints: number;
  masteryPercentage: number;
}

export interface PlanMetrics {
  totalTasks: number;
  completedTasks: number;
  backlogList: (PlanTask & { dayNumber: number; weekNumber: number })[];
  completionPct: number;
  debtHours: string;
  struggledCount: number;
  dsaCount: number;
  coreCount: number;
  readinessScore: number;
  topicMastery: TopicMasteryStat[];
}

export function computePlanMetrics(
  plan: SprintPlan | null,
  currentDayNumber: number = 1
): PlanMetrics {
  if (!plan) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      backlogList: [],
      completionPct: 0,
      debtHours: "0.0",
      struggledCount: 0,
      dsaCount: 0,
      coreCount: 0,
      readinessScore: 0,
      topicMastery: []
    };
  }

  let total = 0;
  let completed = 0;
  let struggled = 0;
  let cleanCount = 0;
  let hintCount = 0;
  let dsa = 0;
  let core = 0;
  const backlog: (PlanTask & { dayNumber: number; weekNumber: number })[] = [];
  let backlogMins = 0;

  // Track counts per topic tag
  const tagStats: Record<
    string,
    { total: number; done: number; struggled: number; clean: number; hints: number }
  > = {};

  DSA_TOPICS_POOL.forEach((t) => {
    tagStats[t.tag] = { total: 0, done: 0, struggled: 0, clean: 0, hints: 0 };
  });

  plan.weeks.forEach((w) => {
    w.days.forEach((d) => {
      d.tasks.forEach((t) => {
        total++;
        if (t.track === "DSA") dsa++;
        if (t.track === "Core CS") core++;

        // Identify DSA topic tag if present
        const matchedTopic = DSA_TOPICS_POOL.find((dt) =>
          (t.topicId && dt.id === t.topicId) ||
          t.title.toLowerCase().includes(dt.topic.toLowerCase().split("&")[0].trim().toLowerCase())
        );
        if (matchedTopic && tagStats[matchedTopic.tag]) {
          tagStats[matchedTopic.tag].total++;
          if (t.completed) {
            tagStats[matchedTopic.tag].done++;
            if (t.confidence === "clean") tagStats[matchedTopic.tag].clean++;
            if (t.confidence === "hint") tagStats[matchedTopic.tag].hints++;
            if (t.confidence === "struggled") tagStats[matchedTopic.tag].struggled++;
          }
        }

        if (t.completed) {
          completed++;
          if (t.confidence === "struggled") struggled++;
          if (t.confidence === "clean") cleanCount++;
          if (t.confidence === "hint") hintCount++;
        } else if (t.isBacklogEligible && d.dayNumber < currentDayNumber) {
          // Uncompleted tasks prior to current active day are backlog debt
          backlog.push({ ...t, dayNumber: d.dayNumber, weekNumber: w.weekNumber });
          backlogMins += t.timeMins;
        }
      });
    });
  });

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const debtHours = (backlogMins / 60).toFixed(1);

  // Compute Topic Mastery Grid
  const topicMastery: TopicMasteryStat[] = DSA_TOPICS_POOL.map((dt) => {
    const stats = tagStats[dt.tag] || { total: 0, done: 0, struggled: 0, clean: 0, hints: 0 };
    // Score considers clean (1.0) and hint (0.6) vs total
    const effectiveDone = stats.clean * 1.0 + stats.hints * 0.6 + stats.struggled * 0.3;
    const masteryPct = stats.total > 0 ? Math.min(100, Math.round((effectiveDone / stats.total) * 100)) : 0;
    return {
      topic: dt.topic,
      tag: dt.tag,
      id: dt.id,
      totalScheduled: stats.total,
      totalQuestions: dt.questions?.length || 0,
      completed: stats.done,
      struggled: stats.struggled,
      clean: stats.clean,
      hints: stats.hints,
      masteryPercentage: masteryPct
    };
  });

  // Calculate Target Company Readiness Score %
  const targetCompany = (plan.metadata.targetCompany || "general").toLowerCase();
  let readinessScore = 0;

  if (total > 0) {
    let weightedPoints = 0;
    let totalWeight = 0;

    topicMastery.forEach((tm) => {
      let weight = 1;
      if (targetCompany.includes("google") && (tm.tag === "dp" || tm.tag === "graphs")) weight = 3;
      if (targetCompany.includes("amazon") && (tm.tag === "trees" || tm.tag === "graphs")) weight = 2.5;
      if (targetCompany.includes("microsoft") && (tm.tag === "arrays" || tm.tag === "trees")) weight = 2;

      weightedPoints += tm.masteryPercentage * weight;
      totalWeight += weight;
    });

    const dsaReadiness = totalWeight > 0 ? weightedPoints / totalWeight : completionPct;
    // Blend DSA readiness (75%) with global completion (25%)
    readinessScore = Math.min(100, Math.round(dsaReadiness * 0.75 + completionPct * 0.25));
  }

  return {
    totalTasks: total,
    completedTasks: completed,
    backlogList: backlog,
    completionPct,
    debtHours,
    struggledCount: struggled,
    dsaCount: dsa,
    coreCount: core,
    readinessScore,
    topicMastery
  };
}
