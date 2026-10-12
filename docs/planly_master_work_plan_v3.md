# Planly Upgrade: Master Work Plan v3.0

**Target System:** Planly AI Sprint Planner (`/planly`)  
**Audience:** AI Coding Agent inside the `dailytasks` repository  
**Document Version:** 3.0.0  
**Source of Truth for Current Design:** [`docs/planly_plan_generation_report.md`](file:///d:/Development%20Projects/dailytasks/docs/planly_plan_generation_report.md)  
**Target Code:**
- [`lib/planly/random.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/random.ts) (new seeded PRNG)
- [`lib/planly/types.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/types.ts)
- [`lib/planly/pools.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/pools.ts)
- [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts)
- [`lib/planly/revision.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/revision.ts) (new revision & hydration engine)
- [`lib/planly/spacedRepetition.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/spacedRepetition.ts)
- [`lib/planly/analytics.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/analytics.ts)
- [`lib/planly/storage.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/storage.ts)
- [`components/planly/ProblemCard.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/ProblemCard.tsx)
- [`components/planly/OnboardingWizardModal.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/OnboardingWizardModal.tsx)
- [`components/planly/SprintSettingsModal.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/SprintSettingsModal.tsx)
- [`components/planly/TopicPlanEditor.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/TopicPlanEditor.tsx) (new shared component)

---

## Change Log: v2.0 → v3.0 Mapping & Audit

| Item ID | Issue / Requirement | Status in Codebase & Resolution | Section in v3.0 |
| :--- | :--- | :--- | :--- |
| **A1** | Migration breaks backward compatibility by silently injecting `topicPlan` into legacy plans. | **Confirmed by code audit:** Legacy plans in `storage.ts` must keep `settings.topicPlan` as `undefined`. Undefined = legacy sequencer & legacy Sunday run. Defined = new queue builder & new Sunday run. Legacy plans only convert when the user edits topics in Settings and confirms regeneration. | [Section 2](#2-decisions-and-defaults), [Phase 1](#phase-1-test-infrastructure-types-seeded-prng-and-migration) |
| **A2** | Announced fixes (`resolveTopic`, seeded PRNG, deterministic IDs, snapshot tests) had no tasks. | **Confirmed by code audit:** `engine.ts` currently uses `Math.random()` and `spacedRepetition.ts` uses `Date.now()`. Added concrete tasks to Phase 1: `resolveTopic` normalizer in `pools.ts`, `mulberry32` PRNG in `random.ts`, deterministic ID generation, and characterization snapshot tests. | [Phase 1](#phase-1-test-infrastructure-types-seeded-prng-and-migration) |
| **A3** | Core CS has no revision path in Sunday hydration. | **Confirmed by code audit:** `CORE_SUBJECTS_POOL` contains conceptual modules without LeetCode links. Added Core CS Recall Card format (`10m recall + 15m write-from-memory + 5m quiz`), covered in Sunday `weekTopicIds` and prior-pool round-robin. | [Section 3](#3-data-models), [Phase 3](#phase-3-revision-pool-core-cs-recall-cards-and-sunday-skeleton-f1-f2) |
| **A4** | Revision weeks have no content, and `buildTopicQueue` was not wired into `generateSchedule`. | **Confirmed by code audit:** `engine.ts` only called `generateWeightedTopicSequence`. Added explicit wiring task in Phase 2, populated `PlanWeek.topicIds`, defined revision-week weekday allocation (2-3 topics from revision pool in sequential day blocks), and sequential weekday splitting (e.g. 3 topics over 5 days $\to$ 2/2/1). | [Phase 2](#phase-2-pedagogical-prerequisites-topic-queue-builder-and-engine-wiring-f1-f3) |
| **A5** | Dropped topics when $n > \text{contentWeeks} \times 3$ were silent in UI, and tie-breaking was ambiguous. | **Confirmed by code audit:** Added deterministic tie-break (lowest company/diagnostic weight first, then latest in user's ordering sequence). Added warning banner in Step 5 / Settings UI with actions to lengthen sprint, mark studied, or reorder. | [Section 2](#2-decisions-and-defaults), [Phase 2](#phase-2-pedagogical-prerequisites-topic-queue-builder-and-engine-wiring-f1-f3), [Phase 5](#phase-5-onboarding-wizard-ui-f1-f3) |
| **A6** | Backlog overflow and rebalancer were task-count based instead of minute-based; 3-hour debt alert was undefined. | **Confirmed by code audit:** `executeIntelligentRebalance` currently checks task count (`< 5`). Replaced with minute-based capacity (default 40m). Unfinished backlog rolls to next Sunday's 40m block. Debt alert triggers when backlog $> 180\text{m}$. Sunday total never exceeds `sundayRevisionMins`. | [Section 2](#2-decisions-and-defaults), [Phase 4](#phase-4-runtime-hydration-and-capacity-clamped-spaced-repetition) |
| **A7** | Hydration trigger, shape, non-destructive rules, and rendering were under-specified. | **Confirmed by code audit:** Justified trigger from `PlanlyDashboard` active day / Saturday completion. Defined 1-to-many card split preserving block `timeMins`. Ticked placeholders marked `hydrated: true` without regeneration. Preserved completed tasks. Added `"Revision"` track styling in `ProblemCard` and sync compatibility. | [Section 2](#2-decisions-and-defaults), [Phase 4](#phase-4-runtime-hydration-and-capacity-clamped-spaced-repetition) |
| **A8** | Spaced Repetition and Sunday hydration could double-schedule the same problem. | **Confirmed by code audit:** Made deduplication bidirectional: Sunday hydration excludes problems with active/completed SR drills in that week; SR injection skips problems scheduled in Sunday revision. | [Phase 4](#phase-4-runtime-hydration-and-capacity-clamped-spaced-repetition) |
| **A9** | Mid-sprint regeneration (`regenerateFrom`) was vague about taught topics and straddling weeks. | **Confirmed by code audit:** Defined exact algorithm: determine already-taught topics from preserved days ($\le \text{fromDayNumber}$ or days with completed tasks), re-run queue builder for untaught topics over remaining weeks, synthesize straddling week's `topicIds` from past + new days, and re-clamp SR tasks. | [Phase 6](#phase-6-sprint-settings-modal-and-mid-sprint-regeneration) |
| **B1** | Order was not explicitly scoped per kind (DSA vs Core CS). | **Confirmed by code audit:** Defined `order` as 0-based and unique within `kind: "dsa"` and `kind: "core"` separately. | [Section 3](#3-data-models) |
| **B2** | Missing `sundayRevisionMins` control in UI with validation and notice for daily hours $< 4$. | **Confirmed by code audit:** Added `sundayRevisionMins` input (60–360 min range, default 240) in wizard and settings modal with pace difference notice. | [Phase 5](#phase-5-onboarding-wizard-ui-f1-f3), [Phase 6](#phase-6-sprint-settings-modal-and-mid-sprint-regeneration) |
| **B3** | Pre-filling confidence for studied topics from diagnostic was missing. | **Confirmed by code audit:** Wizard collects 1-5 ratings for DP, graphs, trees, arrays. Pre-fill: $\le 2 \to \text{rusty}$, $3 \to \text{okay}$, $\ge 4 \to \text{solid}$. User can edit anytime. | [Section 2](#2-decisions-and-defaults), [Phase 5](#phase-5-onboarding-wizard-ui-f1-f3) |
| **B4** | Company-critical bump for studied topics in revision pool was not documented. | **Confirmed by code audit:** Topics critical to the company preset (e.g. DP/Graphs for Google, Trees/Graphs/LLD for Amazon) receive +1 weight step in the revision pool (`rusty=4, okay=3, solid=2`). | [Section 2](#2-decisions-and-defaults), [Phase 3](#phase-3-revision-pool-core-cs-recall-cards-and-sunday-skeleton-f1-f2) |
| **B5** | Vitest alias for `@/` path resolution was not configured. | **Confirmed by code audit:** Configured `vitest.config.ts` with `resolve.alias: { '@': path.resolve(__dirname, './') }` and `environment: 'node'`. | [Phase 1](#phase-1-test-infrastructure-types-seeded-prng-and-migration) |
| **B6** | Drag-and-drop dependency risks with React 19. | **Confirmed by code audit:** `package.json` uses `react: 19.2.3`. Set accessible Up/Down/Top/Bottom buttons as primary controls with native HTML5 drag-and-drop as progressive enhancement. Zero external drag dependencies. | [Phase 5](#phase-5-onboarding-wizard-ui-f1-f3) |
| **B7** | Seven critical edge case tests were missing from Phase 8. | **Confirmed by code audit:** Restored all 7 edge cases into Phase 8 unit tests. | [Phase 8](#phase-8-full-test-suite-edge-cases-and-qa) |
| **B8** | Manual UI QA checklist for keyboard, mobile, and dropped-topic warnings was missing. | **Confirmed by code audit:** Added structured Manual UI QA checklist. | [Phase 8](#phase-8-full-test-suite-edge-cases-and-qa) |
| **B9** | Sections from v1 were dropped (Rules, Out of Scope, DoD, Kickoff prompt). | **Confirmed by code audit:** Restored all sections into the master work plan. | [Section 0](#0-rules-for-the-agent-read-first), [Section 7](#7-out-of-scope-do-not-implement-now), [Section 8](#8-definition-of-done), [Section 9](#9-kickoff-prompt-paste-this-to-the-ai-agent) |

---

## 0. Rules for the Agent (Read First)

1. **Read before writing**: Before any change, open and read: [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts), [`types.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/types.ts), [`pools.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/pools.ts), [`spacedRepetition.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/spacedRepetition.ts), [`analytics.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/analytics.ts), [`storage.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/storage.ts), the onboarding wizard components, and [`SprintSettingsModal.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/SprintSettingsModal.tsx). If code differs from this plan, follow the code's conventions and document the deviation.
2. **Work phase by phase**: Finish a phase, run typecheck (`npm run lint`), execute Vitest unit tests, and fix all errors before moving to the next phase.
3. **Strict backward compatibility**: Plans already saved in `localStorage` must continue to load and function identically. Every new field is optional and has a fallback default. If `settings.topicPlan` is undefined, execute the legacy sequencer and legacy Sunday buffer day.
4. **No unrelated refactors**: Do not touch contest logic (Saturday 90m 3-question contests), mock-week logic (final 1–2 weeks), company presets, or diagnostic weighting except where this plan explicitly specifies.
5. **Do not ask the user questions**: Every open decision has an explicit default in [Section 2](#2-decisions-and-defaults). Use it and list your assumptions in the summary.
6. **Keep functions pure and testable**: Engine functions take inputs and return outputs. No `localStorage`, no unseeded `Date.now()`, and no unseeded `Math.random()`. Use the seeded PRNG and deterministic ID generators.
7. **Report deviations after each phase**: Output files changed, functions added, tests added, and any deviations from this plan before proceeding.

---

## 1. Features Overview

| # | Feature | Summary |
| :--- | :--- | :--- |
| **F1** | **Already-studied topics** | User marks topics they have already covered (with confidence: `rusty`, `okay`, `solid`, plus optional `skipRevision`). These topics skip learning weeks and populate the revision pool. |
| **F2** | **Sunday 240-minute revision** | Every non-mock Sunday becomes a fixed 240-minute (or custom `sundayRevisionMins`) session covering topics studied that week, prior-pool studied topics, backlog clearance, and a retrospective. |
| **F3** | **Topic order selection** | User reorders "new" topics in a dedicated UI step. The plan allocates content weeks strictly according to this custom sequence. |

---

## 2. Decisions and Defaults

* **Sunday Definition**: Day 7 of each sprint week (`REVISION_DAY_INDEX = 7`). Non-mock weeks only. No calendar dependencies.
* **Sunday Duration**: `settings.sundayRevisionMins ?? 240` (validated to 60–360 mins).
* **Legacy Plans vs New Plans**:
  * `settings.topicPlan === undefined`: Legacy sequencer (`generateWeightedTopicSequence`) and legacy Sunday buffer day run.
  * `settings.topicPlan !== undefined`: New queue builder (`buildTopicQueue`) and new Sunday revision run.
  * A legacy plan only migrates to new-style when the user opens Settings, configures topics, and confirms regeneration.
* **Topic Normalizer**: All topic lookups canonicalize through `resolveTopic(idOrTag)` in `pools.ts`. Topic IDs for DSA are category IDs (e.g. `"dynamic-programming"`), and for Core CS are subject keys (`"os"`, `"dbms"`, `"cn"`, `"lld"`).
* **Confidence Weights**: `rusty = 3`, `okay = 2`, `solid = 1`.
* **Company-Critical Bump**: If a studied topic is critical to the target company preset (e.g. Google $\to$ DP/Graphs; Amazon $\to$ Trees/Graphs/LLD; Microsoft $\to$ Arrays/Trees/OS), its weight in the revision pool increases by +1 step (`rusty = 4`, `okay = 3`, `solid = 2`).
* **Confidence Mastery Seed (Analytics only)**: `rusty = 0.20`, `okay = 0.50`, `solid = 0.80`.
* **Diagnostic Pre-fill**: Pre-fill studied confidence from diagnostic ratings: $\le 2 \to \text{rusty}$, $3 \to \text{okay}$, $\ge 4 \to \text{solid}$. User can freely override.
* **Dropped Topics Tie-Break**: When $n > \text{contentWeeks} \times 3$, drop topics with lowest company/diagnostic weight first; if weights tie, drop the topic placed latest in the user's order. Display a warning banner in the ordering UI with options to extend sprint length, mark as studied, or reorder. Never drop silently.
* **Backlog Minute-Based Capacity**: Sunday backlog block has a fixed budget (default 40m). Leftover debt rolls to the next Sunday's backlog block. The 3.0-hour debt alert stays active when accumulated backlog $> 180\text{m}$. Sunday total never exceeds `sundayRevisionMins`.
* **Bidirectional Deduplication**: Sunday hydration excludes any problem with an active or completed Spaced Repetition (SR) drill in that week. SR injection skips any problem already scheduled in that week's Sunday revision.
* **Hydration Trigger & Invariance**: Hydration runs when Sunday is first opened as the active day in `PlanlyDashboard` or when Saturday is completed. If a user ticks a placeholder before hydration, treat it as complete, set `hydrated = true`, and preserve it. Never overwrite tasks with `completed === true` or `hydrated === true`.

---

## 3. Data Models

### Additions to [`lib/planly/types.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/types.ts)

```typescript
export type TopicStatus = "new" | "studied";
export type TopicConfidence = "rusty" | "okay" | "solid";

export interface TopicPlanEntry {
  topicId: string;             // Canonical DSA category ID (e.g. "dynamic-programming") or Core CS key ("os")
  kind: "dsa" | "core";
  status: TopicStatus;
  confidence?: TopicConfidence; // Required when status === "studied"
  skipRevision?: boolean;      // Optional, studied topics only
  order: number;               // 0-based sequence order unique within its kind ("dsa" or "core")
}

export type RevisionBlockType = "retro" | "backlog" | "prior-pool" | "this-week";

export interface RevisionBlockMeta {
  block: RevisionBlockType;
  topicId?: string;
  kind?: "dsa" | "core";
  hydrated: boolean;          // false until filled with concrete problems/cards
}

// Extend TrackType:
export type TrackType =
  | "DSA"
  | "Core CS"
  | "Mock Contest"
  | "Buffer & Consolidation"
  | "Spaced Repetition"
  | "Revision"               // Dedicated track for Sunday 240m Revision
  | "Custom";

// Add to PlanTask (optional):
// revisionMeta?: RevisionBlockMeta;

// Add to PlanWeek (optional):
// topicIds?: string[];        // DSA category IDs covered in this week
// coreTopicIds?: string[];    // Core CS subject keys covered in this week

// Add to SprintSettings (optional):
// topicPlan?: TopicPlanEntry[];
// sundayRevisionMins?: number; // default 240, range 60..360

// Add to PlanMetadata (optional):
// schemaVersion: number;      // current = 4
// revisionCursor?: number;    // Round-robin index for prior-pool studied topics
```

---

## 4. Phase-by-Phase Implementation Plan

### Phase 1: Test Infrastructure, Types, Seeded PRNG, and Migration
**Target Files:**
- `package.json`
- `vitest.config.ts` (new)
- `tests/planly/characterization.test.ts` (new snapshot characterization test)
- [`lib/planly/random.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/random.ts) (new)
- [`lib/planly/types.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/types.ts)
- [`lib/planly/pools.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/pools.ts)
- [`lib/planly/storage.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/storage.ts)

**Tasks:**
1. **Configure Vitest**: Add `vitest` to `devDependencies` in `package.json`. Create `vitest.config.ts` with `@/` path alias pointing to project root (`resolve.alias: { '@': path.resolve(__dirname, './') }`) and `environment: 'node'`. Add `"test": "vitest run"` script.
2. **Characterization Snapshot Test**: Write `characterization.test.ts` capturing the current plan generation output of `generateSchedule` for 3 fixed settings (General 8-week, Google 12-week, Amazon 4-week). This snapshot baseline must remain green across all phases for legacy settings (`topicPlan === undefined`).
3. **Canonical Normalizer in `pools.ts`**: Implement and export:
   ```typescript
   export function resolveTopic(idOrTag: string): { id: string; tag: string; kind: "dsa" | "core"; name: string } | null;
   ```
   Normalizes lookups regardless of whether an ID (`"dynamic-programming"`) or tag (`"dp"`) is passed.
4. **Seeded PRNG in `random.ts`**: Implement a 32-bit seeded PRNG (`mulberry32`) and array shuffle helper:
   ```typescript
   export function createPRNG(seed: number): () => number;
   export function seededShuffle<T>(arr: T[], rng: () => number): T[];
   ```
   Thread an optional seed or rng through `engine.ts` sampling, defaulting to a hash of `settings.targetCompany + settings.weeks + settings.language` so plan generation is stable and testable.
5. **Deterministic Task IDs**: Refactor task ID generation in `engine.ts` and `spacedRepetition.ts` from `Date.now() + Math.random()` to deterministic patterns:
   - Spaced Repetition: `sr-${originDay}-${targetDay}-${sourceTaskId}`
   - Revision: `task-${dayNumber}-rev-${block}-${index}`
   Existing saved task IDs remain backward-compatible when reading from storage.
6. **Data Models in `types.ts`**: Add `TopicPlanEntry`, `RevisionBlockMeta`, update `SprintSettings`, `PlanTask`, `PlanWeek`, `PlanMetadata`, and add `"Revision"` to `TrackType`.
7. **Storage Migration (`migratePlan`)**:
   - Bump schema version to `4`.
   - `migratePlan(raw: any): PlanlyState`: If `raw.version < 4` or `raw.plan.metadata.schemaVersion < 4`, upgrade the envelope metadata but **leave `settings.topicPlan` undefined**.
   - Implement `getDefaultTopicPlan(settings: SprintSettings): TopicPlanEntry[]` which returns all topics as `"new"`, with `order` sequential based on existing company/diagnostic weights and prerequisites.

**Done when:**
- `npm run test` executes successfully and passes `characterization.test.ts`.
- `migratePlan` tests prove an old saved plan (v2/v3 without `topicPlan`) loads without errors and preserves its legacy behavior.

---

### Phase 2: Pedagogical Prerequisites, Topic Queue Builder, and Engine Wiring (F1, F3)
**Target Files:**
- [`lib/planly/pools.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/pools.ts)
- [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts)
- `tests/planly/queueBuilder.test.ts` (new)

**Tasks:**
1. **Canonical Prerequisites in `pools.ts`**: Export:
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
2. **Topic Queue Builder Algorithm (`buildTopicQueue`)**:
   Implement and export in `engine.ts`:
   ```typescript
   export interface WeekAssignment {
     week: number;              // 1-based content week index
     topicIds: string[];        // 1..3 DSA topic IDs in order
     isRevisionWeek: boolean;
   }
   export interface BuildTopicQueueResult {
     assignments: WeekAssignment[];
     droppedTopicIds: string[];
   }
   export function buildTopicQueue(settings: SprintSettings, contentWeeks: number): BuildTopicQueueResult;
   ```
   **Algorithm:**
   - Filter `entries = settings.topicPlan.filter(e => e.status === "new" && e.kind === "dsa").sort((a,b) => a.order - b.order)`.
   - If `entries` is empty: Return all `contentWeeks` as `isRevisionWeek: true`.
   - $n = \text{entries.length}$.
   - **Case A ($n \ge \text{contentWeeks}$)**:
     - Distribute topics across weeks preserving user order as evenly as possible using `floor(n / contentWeeks)` and `ceil`.
     - Cap at 3 topics per week.
     - If $n > \text{contentWeeks} \times 3$, drop excess topics using deterministic tie-break (lowest weight first; if tied, topic placed latest in user's order). Add dropped topics to `droppedTopicIds`.
   - **Case B ($n < \text{contentWeeks}$)**:
     - Give each topic 1 week.
     - Extra weeks = $\text{contentWeeks} - n$. Distribute extra weeks by company topic weight (largest-remainder method), capped at 3 weeks per topic, keeping topics contiguous in the user's order.
     - Any weeks still unassigned become dedicated Revision Weeks placed immediately prior to mock interview weeks.
3. **Engine Wiring in `generateSchedule`**:
   - Check: `if (settings.topicPlan) { ... use buildTopicQueue ... } else { ... use legacy sequencer ... }`.
   - Store `topicIds` on each `PlanWeek`.
   - **Sequential Weekday Splitting**: For weeks with 2–3 DSA topics, distribute the 5 weekdays sequentially across topics (earlier topics get extra days, e.g. 3 topics over 5 weekdays $\to$ Days 1–2 on Topic 1, Days 3–4 on Topic 2, Day 5 on Topic 3; 2 topics over 5 weekdays $\to$ Days 1–3 on Topic 1, Days 4–5 on Topic 2).
   - **Revision Weeks Weekdays**: If `isRevisionWeek === true`, weekday DSA time samples problems from the revision pool (weighted by confidence `rusty > okay > solid`).
   - **Core CS Integration**: Filter Core CS by `kind === "core" && status === "new"`, sorted by `order`. Studied Core CS subjects skip learning and route to Sunday revision.

**Done when:**
- Unit tests in `queueBuilder.test.ts` pass for all 5 scenarios: all new, all studied, some studied, $n > \text{contentWeeks}$, $n < \text{contentWeeks}$, cap of 3 topics/week, and deterministic tie-break dropping.
- Legacy settings snapshot tests remain 100% green.

---

### Phase 3: Revision Pool, Core CS Recall Cards, and Sunday Skeleton (F1, F2)
**Target Files:**
- [`lib/planly/revision.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/revision.ts) (new)
- [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts)
- `tests/planly/sundayRevision.test.ts` (new)

**Tasks:**
1. **Revision Pool Builder (`buildRevisionPool`)**:
   Implement in `lib/planly/revision.ts`:
   ```typescript
   export interface RevisionPoolItem {
     topicId: string;
     kind: "dsa" | "core";
     weight: number; // rusty=3, okay=2, solid=1 (+1 if company-critical)
   }
   export function buildRevisionPool(settings: SprintSettings): RevisionPoolItem[];
   ```
   Filters studied topics where `skipRevision !== true`. Applies +1 weight boost if the topic matches company-critical priorities. Sorts by `weight desc`.
2. **Core CS Recall Cards**:
   Define Core CS recall card builder:
   ```typescript
   export function buildCoreCsRecallTask(args: {
     subjectKey: string;
     dayNumber: number;
     timeMins: number;
     subtopicTitle?: string;
     items?: string[];
   }): PlanTask;
   ```
   Builds structured tasks with title: `"Revise [Subject]: [Subtopic]"`, details: `["10-min active recall", "15-min write-from-memory schema/flow", "5-min self-quiz"]`, sourced from `CORE_SUBJECTS_POOL`.
3. **Sunday Skeleton Generator (`buildSundayRevision`)**:
   Implement in `lib/planly/revision.ts`:
   ```typescript
   export function buildSundayRevision(args: {
     weekNumber: number;
     dayNumber: number;
     weekTopicIds: string[];
     pool: RevisionPoolItem[];
     totalMins: number; // settings.sundayRevisionMins ?? 240
   }): PlanTask[];
   ```
   **Exact Minute Allocation Algorithm:**
   - Total budget: `totalMins` (default 240).
   - `retro`: 20 mins.
   - `backlog`: 40 mins placeholder.
   - `remainder = Math.max(0, totalMins - 60)`.
   - `prior-pool`: If `pool.length > 0`, allocate `Math.round((remainder * 0.15) / 5) * 5` mins; else 0 mins.
   - `this-week`: `remainder - priorPoolMins`. Split equally across `weekTopicIds` (remainder minutes allocated to the first topic).
   - Edge cases: If `weekTopicIds` is empty (Revision Week), `this-week` minutes roll into `prior-pool`. If both are empty, minutes roll into `backlog` and a general pattern synthesis block.
   - Exact sum invariant: **Sum of all generated task `timeMins` must equal `totalMins` exactly**.
   - Every block creates a `PlanTask` with `track: "Revision"`, `completed: false`, `revisionMeta: { block, topicId, hydrated: false }`.
4. **Wire Sunday Revision into `generateSchedule`**:
   When `settings.topicPlan` is present and week is not a mock week, generate the Sunday day using `buildSundayRevision`.

**Done when:**
- Unit tests verify the sum of minutes equals `240` (and custom values like 180, 300) across 0, 1, 2, 3 week topics, empty pools, and populated pools.
- Mock week Sundays remain completely unchanged.

---

### Phase 4: Runtime Hydration and Capacity-Clamped Spaced Repetition
**Target Files:**
- [`lib/planly/revision.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/revision.ts)
- [`lib/planly/spacedRepetition.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/spacedRepetition.ts)
- [`components/planly/ProblemCard.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/ProblemCard.tsx)
- [`components/planly/PlanlyDashboard.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/PlanlyDashboard.tsx)
- `tests/planly/hydration.test.ts` (new)

**Tasks:**
1. **Pure Runtime Hydration (`hydrateSundayRevision`)**:
   ```typescript
   export function hydrateSundayRevision(
     plan: SprintPlan,
     weekNumber: number,
     completionLog: PlanTask[]
   ): SprintPlan;
   ```
   - **This-Week Block**: Gathers problems from that topic completed in days 1–6 of the week. Orders by confidence: `struggled` first, then `hint`, then `clean`. Fills block minutes with re-solve tasks. If minutes remain, samples 1–2 fresh medium questions from the pool, then a 10-minute recall card.
   - **Prior-Pool Block**: Uses round-robin `plan.metadata.revisionCursor` to pick topics from the revision pool. Generates questions (DSA) or recall cards (Core CS). Advances cursor.
   - **Backlog Minute Reassignment**: If cumulative overdue backlog at hydration is 0, transfer the 40m backlog budget into `this-week` problems.
   - **Preservation & Idempotency Rules**:
     - Never alter or replace tasks where `completed === true` or `hydrated === true`.
     - If a user completed a placeholder task before hydration, mark it `completed: true, hydrated: true` and preserve it.
     - Running `hydrateSundayRevision` multiple times produces identical state without re-shuffling or adding duplicates.
2. **Bidirectional Deduplication with Spaced Repetition**:
   - In `hydrateSundayRevision`: Do not select any problem that has an SR drill scheduled or completed in that same week.
   - In `injectSpacedRepetitionTask`: Check if the problem already exists in that week's Sunday revision. If present, skip injection.
3. **Capacity Clamping & Minute-Based Rebalancing**:
   - In `injectSpacedRepetitionTask`: Compute scheduled minutes on target day $D+k$. If adding exceeds daily budget, roll task forward to the next day with capacity. If Sunday is the target, absorb into the `this-week` block (reducing fresh problem minutes rather than blowing the daily budget).
   - In `applyRestDay` & `executeIntelligentRebalance`: Sunday tasks are capped by the 40m backlog capacity, not a 5-task count. Overflow rolls to subsequent Sunday backlog blocks. If no future Sunday has capacity, retain as debt and trigger the 3.0-hour alert.
4. **Trigger & Rendering Adjustments**:
   - In `PlanlyDashboard.tsx`: Trigger hydration when `currentDayNumber % 7 === 0` (Sunday is active) or when Day 6 (Saturday) is completed.
   - In `ProblemCard.tsx`: Add track badge color for `"Revision"` (`text-purple-400 bg-purple-500/10 border-purple-500/25`). Support non-URL Core CS recall cards gracefully.
   - In `storage.ts`: Ensure `syncDayToHabitTasks` exports `"Revision"` track tasks cleanly to the `/tasks` widget.

**Done when:**
- Unit tests verify:
  - Hydration is idempotent and preserves completed tasks.
  - Bidirectional deduplication stops SR and Sunday from double-booking.
  - Day capacity is never exceeded.
  - Backlog minutes transfer to `this-week` when backlog is empty.

---

### Phase 5: Onboarding Wizard UI (F1, F3)
**Target Files:**
- [`components/planly/TopicPlanEditor.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/TopicPlanEditor.tsx) (new shared component)
- [`components/planly/OnboardingWizardModal.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/OnboardingWizardModal.tsx)

**Tasks:**
1. **Build `TopicPlanEditor.tsx`**:
   A shared, reusable, responsive component managing two sequential steps:
   - **Step A: Already Studied**:
     - List all 17 DSA topics from `DSA_TOPICS_POOL` and selected Core CS subjects.
     - Toggle: `New` vs `Already Studied`.
     - When `Already Studied` is selected: Show confidence selector (`Rusty`, `Okay`, `Solid`) and optional `Skip revision` checkbox.
     - Pre-fill confidence automatically from the wizard's diagnostic ratings ($\le 2 \to \text{rusty}$, $3 \to \text{okay}$, $\ge 4 \to \text{solid}$).
     - Quick action buttons: "Mark all as new" and "Select all studied".
   - **Step B: Order Your Topics**:
     - Tabs for `DSA Topics` and `Core CS Subjects`.
     - Accessible reordering: Primary controls are one-click Up ($\uparrow$), Down ($\downarrow$), Top, and Bottom buttons. Progressive enhancement with native HTML5 drag-and-drop handles. Zero third-party drag library dependencies to ensure React 19 compatibility.
     - Prerequisite warnings: For each topic, if a prerequisite defined in `TOPIC_PREREQUISITES` is marked `new` and positioned after it, display an inline warning badge (e.g. *"Recursion usually comes before Dynamic Programming"*). If the prerequisite is marked `studied`, do not show a warning.
     - Live Capacity & Dropped Topics Warning: Call `buildTopicQueue`. Display live summary: *"Fits in X of Y content weeks"*. If $n > \text{contentWeeks} \times 3$, display a clear alert banner listing the dropped topics with action buttons: *"Increase sprint duration"*, *"Move to already studied"*, or *"Reorder"*.
     - "Reset to suggested order" button.
2. **Sunday Duration Control**:
   - In Step 2 (Commitment), add an input for `Sunday Revision Minutes` (number input / buttons, 60–360 min range, default 240).
   - If user sets daily hours $< 4$, display a helpful note: *"Sunday revision is set to 240m (4 hrs) for deep retention"*.
3. **Integrate into `OnboardingWizardModal.tsx`**:
   - Expand wizard from 3 steps to 5 steps:
     - Step 1: Target Company Profile
     - Step 2: Sprint Duration, Daily Hours & Sunday Revision Length
     - Step 3: Self-Assessment Diagnostic
     - Step 4: Already Studied Topics (Step A)
     - Step 5: Order Your Topics (Step B)
   - Preserve state when navigating Back and Next.
   - On completion, write `topicPlan` into settings and invoke `generateSchedule`.

**Done when:**
- User can walk through all 5 steps of the wizard.
- Generated plan reflects the chosen topic order and excludes studied topics from content learning weeks.

---

### Phase 6: Sprint Settings Modal and Mid-Sprint Regeneration
**Target Files:**
- [`components/planly/SprintSettingsModal.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/SprintSettingsModal.tsx)
- [`lib/planly/engine.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/engine.ts)
- `tests/planly/regeneration.test.ts` (new)

**Tasks:**
1. **Embed `TopicPlanEditor` into `SprintSettingsModal.tsx`**:
   - Add a dedicated "Study Status & Topic Order" section or tab reusing `TopicPlanEditor`.
   - Add `Sunday Revision Length` field (default 240, range 60–360).
2. **Implement Precise `regenerateFrom` in `engine.ts`**:
   ```typescript
   export function regenerateFrom(
     settings: SprintSettings,
     currentPlan: SprintPlan,
     fromDayNumber: number
   ): SprintPlan;
   ```
   **Algorithm:**
   - **Preserved Days**: Retain all days where `dayNumber <= fromDayNumber` OR where any task has `completed === true`.
   - **Identify Taught Topics**: Collect all DSA and Core CS topic IDs from preserved days.
   - **Remaining Queue**: Filter `settings.topicPlan` for `new` topics that have NOT yet been taught in preserved days.
   - **Re-allocate Future Weeks**: Run `buildTopicQueue` for remaining topics over remaining content weeks.
   - **Straddling Week**: For the week containing `fromDayNumber`, combine the preserved days with newly generated days. Set `week.topicIds` to reflect all topics actually scheduled in that week (past and new combined) so Sunday revision covers what was actually taught.
   - **Carry Over Spaced Repetition**: Retain scheduled SR re-attempt tasks from future days and re-run them through capacity clamping.
3. **Confirmation Dialog in Modal**:
   - When saving changes, show modal confirmation: *"Future days will be updated with your new topic order. Completed work, past days, and streaks are safely preserved."*

**Done when:**
- Modifying topic order on Day 10 preserves Days 1–10 and all completed tasks, updating only upcoming days.
- Unit test in `regeneration.test.ts` validates straddling week topic coverage and SR task preservation.

---

### Phase 7: Analytics and Topic Readiness
**Target Files:**
- [`lib/planly/analytics.ts`](file:///d:/Development%20Projects/dailytasks/lib/planly/analytics.ts)
- [`components/planly/AnalyticsView.tsx`](file:///d:/Development%20Projects/dailytasks/components/planly/AnalyticsView.tsx)
- `tests/planly/analytics.test.ts` (new)

**Tasks:**
1. **Seed Studied Topics in Readiness Calculations**:
   - In `computePlanMetrics`, look up studied topics from `settings.topicPlan`.
   - Seed baseline mastery percentage: `rusty = 20%`, `okay = 50%`, `solid = 80%`.
   - Do not alter `effectiveDone` formulas or artificially inflate completed task counts.
   - Canonicalize lookups with `resolveTopic` so tag vs ID indexing produces 0 mismatch errors.
2. **Count Completed Sunday Revision Tasks**:
   - When a task with `track === "Revision"` is marked completed with confidence (`clean`, `hint`, `struggled`), register it toward topic mastery like any standard DSA problem.
3. **Add Revision Metrics in `AnalyticsView.tsx`**:
   - Add metric properties to `PlanMetrics`: `revisionMinsCompleted` and `revisionMinsPlanned`.
   - Render a sleek stat pill in `AnalyticsView.tsx` displaying: *"Sunday Revision Velocity: Xh completed / Yh planned"*.

**Done when:**
- Studied topics display baseline readiness scores on the analytics dashboard immediately upon plan creation.
- Completing Sunday revision tasks raises topic mastery percentages.

---

### Phase 8: Full Test Suite, Edge Cases, and QA
**Target Files:**
- `tests/planly/*.test.ts`
- Documentation & Summary Report

**Tasks:**
1. **Unit Test Suite Coverage**:
   - `buildTopicQueue`: All 5 distribution scenarios, cap of 3 topics/week, ordering preservation, and deterministic tie-breaking.
   - `buildSundayRevision`: Exact sum equals 240 (and custom minute values), 0–3 week topics, empty and populated pools.
   - `hydrateSundayRevision`: Idempotency, confidence ordering (`struggled` $\to$ `hint` $\to$ `clean`), unused backlog reassignment, preservation of completed work.
   - `injectSpacedRepetitionTask`: Bidirectional duplicate prevention with Sunday revision, minute capacity roll-forward.
   - `migratePlan`: Old v3 / v2 plan migration leaving `topicPlan` undefined.
   - Characterization snapshot test: Legacy settings produce identical plans.
2. **Edge Case Tests**:
   - Daily hours under 4 (Sunday still 240 default).
   - Saturday Rest Day when Sunday backlog block is already full (rolls to following Sunday).
   - 6-week sprint with 17 new topics (1 mock week, 5 content weeks $\to$ $5 \times 3 = 15$ max topics $\to$ drops 2 lowest-priority topics with warning).
   - Changing topic order mid-sprint after days 1–5 are completed.
   - Mock-week Sunday remains unchanged.
   - All topics marked studied (generates revision-only schedule).
   - No topics marked studied (all topics new).
3. **Manual UI QA Checklist**:
   - [ ] Wizard keyboard navigation: Enter, Space, and Tab cycle through toggles.
   - [ ] Wizard mobile responsiveness: Up/Down buttons and select pills fit small screens.
   - [ ] Wizard state preservation: Clicking "Back" and "Next" maintains all toggles and custom order.
   - [ ] Dropped topics warning: Triggers appropriately and offers direct resolution actions.
   - [ ] Sprint Settings Modal: Editing topics and regenerating preserves completed checkboxes on `/planly`.

**Done when:**
- All Vitest unit tests pass (`100% passing`).
- `npm run lint` and TypeScript typechecking pass with 0 errors.

---

## 5. Definition of Done

- [ ] All three features (F1: Already-studied topics, F2: Sunday 240m revision, F3: Topic order selection) work end-to-end through the UI.
- [ ] Studied topics never appear as new learning tasks in weekday schedules.
- [ ] Every non-mock Sunday in a new-style plan totals exactly `sundayRevisionMins` minutes (sum of task durations equals target).
- [ ] Generated topic sequence strictly matches the user's custom chosen order.
- [ ] No review task or backlog overflow exceeds a day's minute capacity.
- [ ] Legacy saved plans load without error and behave as before (`settings.topicPlan` undefined).
- [ ] `vitest run` passes all snapshot, unit, and edge-case tests.
- [ ] `npm run lint` passes cleanly.
- [ ] Final summary lists changed files, new functions, tests added, and any deviations.

---

## 6. Out of Scope (Do Not Implement Now)

- Directed Acyclic Graph (DAG) / Kahn's algorithm topological schedulers (prerequisite warnings are soft advisories in UI; user's custom sequence governs schedule).
- Velocity-adaptive dynamic daily time budgets.
- Full SM-2 / FSRS spaced repetition algorithm replacement.
- Interleaved spiral curriculum interleaving.
- ICS / Apple / Google calendar export.
- Real contest question sets (keep existing 3-tier contest structure).

---

## 7. Kickoff Prompt (Paste This to the AI Agent)

```text
Read docs/planly_master_work_plan_v3.md in full, then read the Planly source files it lists.
Implement the plan phase by phase, starting with Phase 1. After each phase, run typecheck,
lint, and Vitest tests, fix any problems, and report what changed before continuing.
Follow the rules in Section 0 and use the defaults in Section 2 instead of asking questions.
```
