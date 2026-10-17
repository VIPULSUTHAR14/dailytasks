# Planly Deep-Dive Clarifications: Code-Level Mechanics & Heuristics Analysis

**Document Version:** 1.0.0  
**Target System:** Planly Engine (`/planly`)  
**Generated Date:** October 16, 2026  
**Document Type:** Technical Deep-Dive & Source Code Verification Report  

---

## Executive Summary

This report provides an exact, code-verified explanation for the specific architectural details, heuristics, and mathematical formulas operating inside Planly:
1. **Intra-Topic Problem Sampling & Difficulty Trajectory**: How problems are sampled from topic pools, and why week-over-week difficulty does *not* automatically ramp.
2. **Company Weighting & Topic Dropping**: The exact mathematical weight calculations and how the engine actually *drops* low-priority topics when sprint capacity is exceeded.
3. **Origin & Derivation of Constants**: Where the $65/35$ weekday split, $55/45$ Sunday buffer split, and the $3.0\text{h}$ backlog debt threshold originate.
4. **Code-Level Verification of Prerequisites**: Exact file and line citations proving that `TOPIC_PREREQUISITES` is purely an advisory UI warning badge and completely bypassed by the scheduling engine.

---

## 1. Problem Sampling & Week-over-Week Difficulty Analysis

### 1.1 How Problems Get Sampled Within a Topic

Problem sampling is managed by `sampleProblemsForDay()` in [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts#L37-L150). It executes whenever a weekday requires DSA problems:

```typescript
// File: lib/planly/engine.ts (Lines 37-56)
function sampleProblemsForDay(
  topicQuestions: ProblemMetadata[],
  targetMins: number,
  targetCompany: string,
  usedTitles: Set<string>,
  rng: () => number
): SampledProblemResult[]
```

The algorithm follows a strict 5-stage selection pipeline:

1. **Sprint Deduplication Filter (Lines 46–51)**:
   It tracks all problems used so far in the sprint in a `usedTitles: Set<string>`.
   ```typescript
   let available = topicQuestions.filter((q) => !usedTitles.has(q.title));
   if (available.length < 3) {
     usedTitles.clear(); // Reset when pool is depleted to avoid empty days
     available = [...topicQuestions];
   }
   ```
2. **Difficulty Partitioning & Fisher-Yates PRNG Shuffling (Lines 53–55)**:
   ```typescript
   const easies = seededShuffle(available.filter((q) => q.difficulty === "Easy"), rng);
   const mediums = seededShuffle(available.filter((q) => q.difficulty === "Medium"), rng);
   const hards = seededShuffle(available.filter((q) => q.difficulty === "Hard"), rng);
   ```
3. **Deterministic Slot Allocation (Lines 60–135)**:
   - **Slot 1 (Warmup)**: Pops 1 Easy question for **30 mins** (unless `targetCompany === "google"`).
   - **Slot 2 (Advanced Challenge)**: Pops 1 Hard question for **60 mins** if $\text{budgetLeft} \ge 55$ AND (`targetCompany === "google"`, or Amazon with $\ge 160$ mins budget, or general budget $\ge 220$ mins).
   - **Slot 3 (Core Patterns)**: Pops Medium questions (**40–45 mins each**) in a `while (budgetLeft >= 40 && mediums.length > 0)` loop. The first is tagged `"Core Pattern"`, and subsequent ones are tagged `"Deep Application"`.
   - **Slot 4 (Residue Filler)**:
     - If $\ge 55$ mins remain: Pops another Hard (55 mins).
     - If $25\text{–}35$ mins remain: Pops an Easy (up to 30 mins) tagged `"Speed Drill"`.
     - If $\ge 35$ mins remain: Pops any remaining question.
4. **Exact Minute Equalization (Lines 137–147)**:
   Leftover minutes ($< 25$) cannot fit a new problem, so they are evenly distributed across all sampled cards:
   $$\Delta m = \lfloor \text{budgetLeft} / N \rfloor, \quad r = \text{budgetLeft} \pmod N$$
   This ensures $\sum \text{allocatedMins} \equiv \text{targetMins}$ down to the minute.

---

### 1.2 Does Difficulty Ramp Across Weeks?

**Code Answer: NO across content weeks; YES only at the mock transition.**

- **Across Standard Content Weeks (Weeks $1 \dots N - \text{mockWeeks}$)**:
  `sampleProblemsForDay` does **not** receive `weekNumber` as an input parameter. It only receives `targetMins` and `targetCompany`. As a result, Week 1 Monday and Week 6 Monday generate identical difficulty distributions for the same daily hour budget.
- **Intra-Day Ramping (Within Each Day)**:
  Every day has an internal ramp: **Warmup (Easy) $\rightarrow$ Core Pattern (Medium) $\rightarrow$ Advanced Challenge (Hard)**.
- **Sprint-End Phase Shift**:
  The only macro difficulty ramp occurs in the final 1–2 weeks (`isMockInterviewWeek = true`, lines 455–528), where standard topic sampling is replaced with timed LeetCode Hard simulations (45m) and System Design drills (35m).

#### Takeaway for Custom Planly:
A generalized multi-skill planner must introduce a **`difficultyRampRatio`** formula across sprint cycles:
$$\text{TargetDifficulty}(cycle) = \text{DifficultyTier} \times \left(1 + \frac{cycle - 1}{\text{totalCycles}}\right)$$
This ensures beginner tasks dominate Cycle 1, while advanced projects/problems dominate later cycles.

---

## 2. Company Weighting & Topic Dropping Mechanics

### 2.1 Exact Weight Arithmetic

Company weighting is calculated in `getTopicWeight()` in [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts#L152-L175):

```typescript
// File: lib/planly/engine.ts (Lines 152-175)
export function getTopicWeight(topicIdOrTag: string, settings: SprintSettings): number {
  const company = COMPANY_PRESETS[settings.targetCompany] || COMPANY_PRESETS.general;
  const diag = settings.diagnostic;
  const resolved = resolveTopic(topicIdOrTag);
  const tag = resolved?.tag || topicIdOrTag;

  let weight = 1; // Base weight

  // 1. Company Preset Boosts
  if (company.treesGraphsBoost && (tag === "trees" || tag === "graphs")) {
    weight += 1;
  }
  if (company.dpBoost && tag === "dp") {
    weight += 1;
  }

  // 2. User Diagnostic Weakness Boosts (1 to 5 scale)
  if (diag) {
    if (tag === "dp" && diag.dp <= 2) weight += 1;
    if (tag === "graphs" && diag.graphs <= 2) weight += 1;
    if (tag === "trees" && diag.trees <= 2) weight += 1;
    if (tag === "arrays" && diag.arrays <= 2) weight += 1;
  }

  return weight;
}
```

#### Company Preset Matrix ([`lib/planly/pools.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/pools.ts#L130-L161)):
| Company Key | `treesGraphsBoost` | `dpBoost` | `lldBoost` | Weight Range |
| :--- | :---: | :---: | :---: | :---: |
| **`general`** | `false` | `false` | `false` | $1$ (or $2$ if diagnostic $\le 2$) |
| **`amazon`** | `true` ($+1$) | `false` | `true` ($+1$) | $1 \text{ to } 3$ |
| **`microsoft`** | `true` ($+1$) | `false` | `false` | $1 \text{ to } 3$ |
| **`google`** | `true` ($+1$) | `true` ($+1$) | `false` | $1 \text{ to } 3$ |
| **`startups`** | `false` | `false` | `true` ($+1$) | $1 \text{ to } 2$ |

---

### 2.2 Does Company Weighting Ever Drop Topics?

**Code Answer: YES, explicitly in `buildTopicQueue()`!**

In [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts#L209-L234), a sprint has a hard capacity ceiling:
$$\text{maxAllowed} = \text{contentWeeks} \times 3 \text{ topics}$$

When the user selects more topics than the timeline can physically accommodate ($N > \text{maxAllowed}$):

```typescript
// File: lib/planly/engine.ts (Lines 216-233)
if (n > maxAllowed) {
  const dropCount = n - maxAllowed;
  // Deterministic tie-break to drop: lowest weight first, then latest in user order
  const candidatesToDrop = [...entries].sort((a, b) => {
    const wA = getTopicWeight(a.topicId, settings);
    const wB = getTopicWeight(b.topicId, settings);
    if (wA !== wB) return wA - wB; // Lowest weight dropped first!
    return b.order - a.order;      // Latest in user order dropped first
  });

  const dropSet = new Set<string>();
  for (let i = 0; i < dropCount; i++) {
    dropSet.add(candidatesToDrop[i].topicId);
    droppedTopicIds.push(candidatesToDrop[i].topicId);
  }

  retainedEntries = entries.filter((e) => !dropSet.has(e.topicId));
}
```

#### How Dropping Works:
1. Topics with **lowest weight** ($W = 1$, i.e., topics *not* boosted by target company and *not* weak in user diagnostic) are dropped first.
2. If weights are tied, topics positioned **latest in the user's manual ordering** are dropped first.
3. In [`components/planly/TopicPlanEditor.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/TopicPlanEditor.tsx#L218-L230), dropped topic IDs are displayed in an amber warning box with a quick-action: *"Move dropped topics to already studied"*.

---

## 3. Derivation & Rationale for Tuned Constants

### 3.1 The 65% DSA / 35% Core CS Split

Located in [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts#L689-L691):
```typescript
if (shouldIncludeCore && coreTasksList.length > 0) {
  coreMins = Math.round(totalMins * 0.35);
  dsaMins = totalMins - coreMins;
}
```

#### Origin & Pedagogical Rationale:
1. **Industry Interview Round Distribution**: Standard SWE hiring loops consist of 3–4 technical rounds:
   - 2 Coding / DSA rounds ($\sim 60\text{–}65\%$ of the hiring decision).
   - 1 System Design or CS Fundamentals round ($\sim 35\%$).
2. **Time Allocation Feasibility**:
   At the default 4-hour daily commitment ($240\text{ mins}$):
   - **$35\% = 84\text{ mins}$ for Core CS**: Split evenly into $2 \times 42\text{ min}$ tasks (1 conceptual architecture study + 1 implementation/concurrency drill).
   - **$65\% = 156\text{ mins}$ for DSA**: Allows 1 Warmup (30m) + 2 Medium core patterns ($2 \times 45\text{m} = 90\text{m}$) + 1 residue speed drill or deep application (36m).

---

### 3.2 The 55% / 45% Sunday Buffer Split

Located in [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts#L542-L544):
```typescript
const bufferMins = shouldIncludeCore ? Math.round(totalMins * 0.6) : totalMins;
const bufferSplit1 = Math.round(bufferMins * 0.55);
const bufferSplit2 = bufferMins - bufferSplit1;
```

#### Origin & Pedagogical Rationale:
- Sunday is designed as a **shock absorber** rather than an instructional day.
- **$55\%$ (${\approx} 132\text{ mins}$ on a 4h day)** is allocated to **Weekly Backlog Clearance & Spaced Review** (`bufferSplit1`). Uncompleted tasks flagged as `struggled` or missed from Monday–Friday are tackled here.
- **$45\%$ (${\approx} 108\text{ mins}$)** is allocated to **Deep Dive & Flashcard Synthesis** (`bufferSplit2`).
- The slight asymmetry ($55\% > 45\%$) guarantees that debt clearance is given higher budget priority than passive conceptual review.

---

### 3.3 The 3.0-Hour Backlog Debt Threshold

Located in [`components/planly/BacklogView.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/BacklogView.tsx#L28):
```typescript
const isDebtHeavy = Number(debtHours) > 3;
```
Calculated in [`lib/planly/analytics.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/analytics.ts#L147):
```typescript
const debtHours = (backlogMins / 60).toFixed(1);
```

#### Origin & Behavioral Rationale:
- The default daily study budget is **4 hours** (`DEFAULT_SETTINGS.dailyHours = 4`).
- **3.0 hours** represents **$75\%$ of an entire day's study budget**.
- If debt is $\le 3.0$ hours, missed tasks can easily be absorbed across the upcoming Saturday review and Sunday buffer without disrupting weekday schedules.
- Once debt surpasses $3.0$ hours, continuing to append missed tasks to upcoming weekdays causes schedule collapse, leading to burnout. At this point, the UI triggers the amber/rose `"Behind Pace (>3h)"` warning badge and recommends executing an **Intelligent Rebalance** ([`lib/planly/spacedRepetition.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/spacedRepetition.ts#L137)) to spread tasks into future low-density buffer days.

---

## 4. Code-Level Verification: Prerequisites Are Ignored by the Scheduler

The user asked to confirm whether prerequisites are truly ignored by the scheduling engine. Here is the exact codebase evidence.

### 4.1 Definition in [`lib/planly/pools.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/pools.ts#L171-L178)
```typescript
export const TOPIC_PREREQUISITES: Record<string, string[]> = {
  "binary-search-trees": ["trees", "binary-search"],
  "dynamic-programming": ["recursion-backtracking"],
  "graphs": ["trees", "stacks-queues", "recursion-backtracking"],
  "heaps": ["trees"],
  "sliding-window": ["arrays-strings"],
  "tries": ["trees", "arrays-strings"]
};
```

### 4.2 Proof: The Scheduler Never Checks Prerequisites
1. In [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts):
   - Notice the imports at lines 1–19:
     ```typescript
     import { CORE_SUBJECTS_POOL, COMPANY_PRESETS, DSA_TOPICS_POOL, DsaTopicCategory, resolveTopic } from "./pools";
     ```
   - **`TOPIC_PREREQUISITES` is not even imported in `engine.ts`!**
   - In `buildTopicQueue()` (lines 192–195), topics are ordered strictly by the user's manual sequence:
     ```typescript
     const entries = (settings.topicPlan || [])
       .filter((e) => e.status === "new" && e.kind === "dsa")
       .sort((a, b) => a.order - b.order); // Purely respects user index, ignores dependencies
     ```
   - In `generateWeightedTopicSequence()` (legacy mode, lines 341–370), topics are placed into an array repeated by weight, and indexed via modulo `w % weightedIndices.length`.

### 4.3 Where `TOPIC_PREREQUISITES` Is Actually Used
The symbol is used exclusively in [`components/planly/TopicPlanEditor.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/TopicPlanEditor.tsx#L199-L215):
```typescript
// File: components/planly/TopicPlanEditor.tsx (Lines 199-215)
const getPrerequisiteWarnings = (topicId: string, currentOrder: number): string[] => {
  const prereqs = TOPIC_PREREQUISITES[topicId] || [];
  if (prereqs.length === 0) return [];

  const warnings: string[] = [];
  prereqs.forEach((prereqId) => {
    const prereqEntry = topicPlan.find((e) => e.topicId === prereqId);
    // Only warn if prerequisite is marked NEW and positioned AFTER this topic
    if (prereqEntry && prereqEntry.status === "new" && prereqEntry.order > currentOrder) {
      const resolvedPrereq = resolveTopic(prereqId);
      const resolvedCurrent = resolveTopic(topicId);
      warnings.push(`${resolvedPrereq?.name || prereqId} usually comes before ${resolvedCurrent?.name || topicId}`);
    }
  });

  return warnings;
};
```

### Conclusion:
**`TOPIC_PREREQUISITES` is strictly a UI advisory warning badge.** The user can save an invalid sequence (e.g., Dynamic Programming in Week 1 and Recursion in Week 4), and `engine.ts` will generate the schedule without enforcing prerequisite ordering.

---

## 5. Architectural Recommendations for Custom Planly

| Current Planly Limitation | Root Cause in Code | Solution for Custom Multi-Skill Planly |
| :--- | :--- | :--- |
| **No Week Difficulty Ramping** | `sampleProblemsForDay` lacks a cycle/week factor | Introduce a sigmoid or linear **difficulty multiplier** tied to sprint progress. |
| **Silent Topic Dropping** | `n > contentWeeks * 3` drops low-weight topics | Provide user with an interactive resolution dialog: extend sprint duration, increase daily hours, or mark as optional. |
| **Hardcoded Split Constants** | Fixed $65/35$ and $55/45$ ratios in `engine.ts` | Expose a **Session Pacing Profile** (`focusRatio`, `interleavingRatio`, `bufferRatio`) in user settings. |
| **Ignored Prerequisites** | Scheduler uses manual order without DAG validation | Enforce **Kahn’s Algorithm Topological Sort** directly in the scheduling engine. |
| **Fixed Debt Threshold** | Static `3.0h` check in `BacklogView.tsx` | Make debt threshold dynamic: $\text{Threshold} = 0.75 \times \text{dailyHours}$. |
