# Product Requirements Document (PRD)
## AlgoCraft — Engineering Interview Preparation & Sprint Execution Platform

**Document Version:** 1.0.0  
**Product Stage:** Active Development / Design Baseline Complete  
**Target Design System:** Terminal Slate (`#0B0F17`, `#06B6D4`, `#10B981`, `#F59E0B`, `#F43F5E`)  
**Design Direction:** Refined Developer-First SaaS (Linear / Raycast Neo-Brutalist Aesthetic)

---

### 1. Executive Summary & Vision

#### 1.1 Overview
**AlgoCraft** is an all-in-one, developer-centric technical interview preparation and sprint execution system. Unlike traditional problem archives or generic task managers, AlgoCraft integrates rigorous spaced-repetition note taking, algorithmic problem tracking, aptitude preparation, and time-boxed daily schedule management into a single, cohesive workspace.

#### 1.2 Core Problem
Software engineers preparing for high-bar technical interviews face fragmented workflows:
- Tracking problems across spreadsheets or LeetCode lists without persistent context.
- Scattered notes lacking syntax highlighting, algorithmic complexity callouts, and memory diagrams.
- Disconnected daily routines where DSA practice, aptitude revision, and mock interviews clash.
- Loss of velocity and consistency due to high cognitive overhead and lack of sprint cadence.

#### 1.3 Strategic Solution
AlgoCraft unifies preparation into a distraction-free, keyboard-first dashboard with:
- Structured technical sprint roadmaps (e.g., 2-Month Backend Engineering Sprint).
- Deep DSA tracking with interview prompt callouts, complexity badges, and common pitfalls.
- In-depth markdown notes studio with inline algorithmic annotation syntaxes.
- A 4-pillar aptitude preparation matrix covering quantitative, logical, verbal, and programming logic.
- An hourly focus engine with chronometric heatmaps and interference shields.

---

### 2. User Personas & Target Audience

| Persona | Role & Context | Core Needs & Pain Points |
| :--- | :--- | :--- |
| **Alex Rivera** *(Primary)* | Final-year CS student / SDE-1 aiming for Tier-1 engineering roles | Needs structured roadmap, rapid spaced-repetition notes, LeetCode progress tracking, and zero distraction during deep work. |
| **Mid-Career Switcher** | Frontend or DevOps engineer transitioning to Backend/Distributed Systems | Requires targeted topic breakdown (Concurrency, Caching, Graph Algorithms) with clear time allocation blocks. |
| **Competitive Programmer / Campus Prep** | Candidate tackling campus placements | Needs rigorous quantitative & logical reasoning modules alongside pseudocode analysis. |

---

### 3. Information Architecture & Navigation Shell

AlgoCraft utilizes an adaptive, dark-slate workspace shell with a persistent left navigation sidebar and a top contextual command bar:

- **Top Bar**: Breadcrumbs (`AlgoCraft / Workspace / Backend Developer (2 Months) / Sprint 4`), global sync indicator, system status, notifications toggle, and `+ New` global action.
- **Command Palette (`⌘K`)**: Quick jump across problems, notes, tasks, and schedule blocks.
- **Left Sidebar Routes**:
  1. **Tasks & Dashboard** (Daily goals, active queue, sprint milestones)
  2. **Aptitude Prep** (Quantitative, Logical, Verbal, Programming Logic Matrix)
  3. **DSA Questions** (Curated algorithmic questions, problem drawer, complexity metrics)
  4. **DSA Notes** (Topic knowledge base, markdown editor with inline syntax tints)
  5. **Custom Notes** (User-defined notebooks, interview debriefs, cheat sheets)
  6. **Daily Time Table** (Execution engine, time slots, streak counters, active focus timer)
- **Account & System Footer**: Profile quick card (`Alex Rivera • Backend Track`) and live telemetry status (`All systems active`).

---

### 4. Detailed Module Requirements & Specifications

#### Module 1: Main Dashboard & Task Management View
* **Purpose:** Serves as the mission control center for daily accountability and sprint throughput.
* **Key Features:**
  - **Operational Health Deck:** Real-time metrics including Daily Goal completion radial gauge (e.g., Target: 4 Solves), Active Queue counter, and Sprint Velocity monitor.
  - **Focus Area Milestone Card:** Highlights active focus areas (e.g., Dynamic Programming & Two Pointers, Week 4) with time-budgeted targets.
  - **Filter System:** Tabbed segments (`Today`, `All Tasks`, `Pending`, `Completed`) with inline counter chips.
  - **Task Item Architecture:** Checkboxes with strike-through states, priority chips (`#High Priority`, `#DSA-Arrays`), estimated durations, and quick actions (Pin, Edit, Delete).
  - **Quick Creation Modal / Drawer:** Clean popover modal (`What needs to be done?`) with primary `Create Task` and keyboard shortcuts (`N` for new task, `Tab` to cycle views).

#### Module 2: Aptitude Preparation Matrix
* **Purpose:** Systematic tracking of non-coding technical screening rounds and foundational tests.
* **Key Features:**
  - **Sprint Track Header:** Track metadata (`Backend Developer`, `2 Months Timeline`) with radial mastery percentage indicator.
  - **Prep Progress Bar:** Segmented 43-subtopic visual progress tracker.
  - **Search & Priority Filtering:** Subtopic search bar paired with priority filters (`All`, `Medium`, `High`, `Very High`).
  - **4-Column Grid Structure:**
    - *Quantitative Aptitude:* Arithmetic (Percentages, Profit & Loss, Simple/Compound Interest), Time & Motion, Modern Math, Data Interpretation.
    - *Logical Reasoning:* Arrangements (Linear/Circular seating, Matrix match), Relational Logic (Blood relations, Direction), Critical Thinking, Series & Patterns.
    - *Verbal Ability:* Reading Comprehension, Grammar & Usage with WPM benchmark suggestions.
    - *Programming Logic:* Pseudocode Analysis (Dry running loops, Conditionals, Recursion stack) and Algorithmic Complexity with assessment warnings.

#### Module 3: Data Structures & Algorithms (DSA) Tracker
* **Purpose:** Curated catalog of 147 high-yield algorithmic challenges with LeetCode deep links.
* **Key Features:**
  - **Progress Breakdown Deck:** Category split across `Easy` (Emerald), `Medium` (Amber), and `Hard` (Rose) with solve percentages.
  - **Collapsible Topic Accordions:** Grouped collections (e.g., `Arrays & Strings [1/30]`, `Two Pointers & Sliding Windows`, `Binary Search`) with progress meters.
  - **Question Row Meta:** Mastered checkbox, question title, LeetCode external launch icon, difficulty badge, and linked notes trigger.
  - **Slide-out Detail Drawer (Context Pane):**
    - Problem overview and interview prompt focus callout.
    - Interactive revealable hints.
    - Time & Space complexity badges (`O(n)`, `O(1)`).
    - Prerequisites and expandable "Common Mistakes" warning box.
    - Follow-up interview extension questions.
    - One-click `Mark as Solved` primary action button.

#### Module 4: Notes Knowledge Base & Dedicated Markdown Editor
* **Purpose:** Clean, IDE-grade markdown editing environment for retaining algorithmic intuition and code templates.
* **Key Features:**
  - **Horizontal Section Navigation:** Top-level segmented pill tabs (`Core Notes`, `Revision Notes`, `Theory & Keywords`, `Math & Algorithms`, `Code & Patterns`, `Complexity Analysis`, `+ Section`) eliminating vertical sidebar clutter.
  - **Dedicated Editor Canvas:** Line-numbered code gutter (`01`–`87`), raw markdown support, and syntax highlighting for Java, C++, Python.
  - **Inline Highlighting Syntax:** Proprietary lightweight token highlights:
    - `==g:value==` (Mint / Optimal)
    - `==r:value==` (Rose / Suboptimal / Warning)
    - `==b:value==` (Cyan / Complexity & Keywords)
  - **Formatting Tool Palette:** Formatting tools supporting Headings (`H1`–`H3`), Code blocks, Mathematical operators, Lists, and color highlight pickers.
  - **Document Metadata:** Word count, line count, read-time calculation, revision count, and automatic cloud save heartbeat.

#### Module 5: Daily Time Table & Execution Engine
* **Purpose:** Chronometric schedule tracking to eliminate focus drift and enforce deliberate practice.
* **Key Features:**
  - **Cadence Tracker:** Completed vs. scheduled hours (`Today's Progress`), target velocity (`9.5h`), planned deep work (`8.0h`), and consecutive streak health (`14 Days`).
  - **Active Session Pill:** Live ticking timer (`Slot 01/05 • 42m 18s remaining`) with pause and fast-forward controls.
  - **Hourly Focus Matrix Table:** Comprehensive rows displaying block status, time interval (`08:00 AM - 10:00 AM`), duration, focus area / task, sprint tag, energy level (`Deep Work`, `Medium Focus`, `Rapid Drills`), and quick action buttons (`Log`, review).
  - **Chronometric Heatmap:** 24-hour visual intensity timeline mapping deep blocks, breaks, and rest windows.
  - **Interference Shield:** Status indicator showing notifications muted on Slack/Discord during deep sessions.

---

### 5. Non-Functional Requirements & Design Tokens

* **Aesthetics:** Dark neo-brutalist / developer IDE aesthetic (sharp 1px borders, subtle hover glows, terminal monospace highlights).
* **Color Palette (Terminal Slate):**
  - Background Canvas: `#0B0F17` / `#0F131C`
  - Container Surfaces: `#181C24` / `#1F2937`
  - Border Strokes: `#1E293B` / `#334155`
  - Primary Accent: Cyan `#06B6D4`
  - Positive / Solved: Emerald `#10B981`
  - Warning / In-Progress: Amber `#F59E0B`
  - Urgent / Hard / Pitfall: Rose `#F43F5E`
* **Typography:** Inter for primary UI elements; JetBrains Mono / Fira Code for code blocks, line numbers, and complexity annotations (`O(n)`).
* **Performance & Responsiveness:** Desktop-first 1440px+ optimized layout; sub-100ms client state transitions; zero cumulative layout shift on accordion and drawer expands.

---

### 6. Roadmap & Future Scope
1. **v1.1**: Real-time LeetCode / GitHub submission sync via personal access tokens.
2. **v1.2**: Spaced repetition flashcard algorithm (SM-2) for DSA Notes formulas.
3. **v1.3**: Peer mock interview audio room integration directly inside the Daily Time Table slot.
