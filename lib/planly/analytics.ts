import { PlanTask, SprintPlan } from "./types";
import { DSA_TOPICS_POOL, DsaTopicCategory, resolveTopic } from "./pools";

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
  revisionMinsCompleted: number;
  revisionMinsPlanned: number;
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
      topicMastery: [],
      revisionMinsCompleted: 0,
      revisionMinsPlanned: 0
    };
  }

  let total = 0;
  let completed = 0;
  let struggled = 0;
  let dsa = 0;
  let core = 0;
  let revisionMinsPlanned = 0;
  let revisionMinsCompleted = 0;
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

        // Track Sunday Revision time
        if (t.track === "Revision" || (d.dayOfWeek === 7 && t.revisionMeta)) {
          revisionMinsPlanned += t.timeMins;
          if (t.completed) {
            revisionMinsCompleted += t.timeMins;
          }
        }

        // Identify DSA topic tag if present
        let matchedTopic: DsaTopicCategory | undefined = undefined;

        if (t.topicId) {
          const resolved = resolveTopic(t.topicId);
          if (resolved) {
            matchedTopic = DSA_TOPICS_POOL.find(
              (dt) => dt.id === resolved.id || dt.tag === resolved.id
            );
          }
        }

        if (!matchedTopic && t.revisionMeta?.topicId) {
          const resolved = resolveTopic(t.revisionMeta.topicId);
          if (resolved) {
            matchedTopic = DSA_TOPICS_POOL.find(
              (dt) => dt.id === resolved.id || dt.tag === resolved.id
            );
          }
        }

        if (!matchedTopic) {
          matchedTopic = DSA_TOPICS_POOL.find((dt) =>
            t.title.toLowerCase().includes(dt.topic.toLowerCase().split("&")[0].trim().toLowerCase())
          );
        }

        if (matchedTopic && tagStats[matchedTopic.tag]) {
          if (t.track === "DSA") {
            tagStats[matchedTopic.tag].total++;
            if (t.completed) {
              tagStats[matchedTopic.tag].done++;
              if (t.confidence === "clean") tagStats[matchedTopic.tag].clean++;
              if (t.confidence === "hint") tagStats[matchedTopic.tag].hints++;
              if (t.confidence === "struggled") tagStats[matchedTopic.tag].struggled++;
            }
          } else if (t.track === "Revision" && t.completed && t.confidence) {
            // Count completed Sunday revision tasks toward topic mastery
            tagStats[matchedTopic.tag].total++;
            tagStats[matchedTopic.tag].done++;
            if (t.confidence === "clean") tagStats[matchedTopic.tag].clean++;
            if (t.confidence === "hint") tagStats[matchedTopic.tag].hints++;
            if (t.confidence === "struggled") tagStats[matchedTopic.tag].struggled++;
          }
        }

        if (t.completed) {
          completed++;
          if (t.confidence === "struggled") struggled++;
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

  // Look up studied topics from settings.topicPlan / metadata.topicPlan to seed baseline readiness
  const topicPlan = plan.settings?.topicPlan || plan.metadata.topicPlan || [];

  // Compute Topic Mastery Grid
  const topicMastery: TopicMasteryStat[] = DSA_TOPICS_POOL.map((dt) => {
    const stats = tagStats[dt.tag] || { total: 0, done: 0, struggled: 0, clean: 0, hints: 0 };
    const effectiveDone = stats.clean * 1.0 + stats.hints * 0.6 + stats.struggled * 0.3;

    // Check baseline mastery for studied topics: rusty = 20%, okay = 50%, solid = 80%
    const resolvedDt = resolveTopic(dt.id || dt.tag);
    const canonId = resolvedDt ? resolvedDt.id : (dt.id || dt.tag);

    const planEntry = topicPlan.find((entry) => {
      if (entry.kind !== "dsa") return false;
      const res = resolveTopic(entry.topicId);
      return (res ? res.id : entry.topicId) === canonId;
    });

    let baseline = 0;
    if (planEntry && planEntry.status === "studied") {
      if (planEntry.confidence === "solid") baseline = 80;
      else if (planEntry.confidence === "rusty") baseline = 20;
      else baseline = 50;
    }

    let masteryPct = baseline;
    if (stats.total > 0) {
      const earnedRatio = effectiveDone / stats.total;
      if (baseline > 0) {
        masteryPct = Math.min(100, Math.round(baseline + (100 - baseline) * earnedRatio));
      } else {
        masteryPct = Math.min(100, Math.round(earnedRatio * 100));
      }
    }

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

  if (topicMastery.length > 0) {
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
    topicMastery,
    revisionMinsCompleted,
    revisionMinsPlanned
  };
}
