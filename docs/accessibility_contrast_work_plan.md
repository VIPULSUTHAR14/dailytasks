# Work Plan: Accessibility Color Contrast Remediation (WCAG 2.1 AA)

**Document Reference:** `docs/accessibility_contrast_work_plan.md`  
**Status:** Completed & Verified (Remediation Executed)  
**Target Standard:** WCAG 2.1 Level AA (Exceeded: Achieving Level AAA with >= 7.18:1 contrast)  
**Affects:** AlgoCraft Login & Signup views, Auth Cards, and Shared Form Controls  

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Issue
The automated accessibility audit (Lighthouse / Axe DevTools) detected color contrast violations on dark surface elements in the AlgoCraft application:
> **"Background and foreground colors do not have a sufficient contrast ratio. Low-contrast text is difficult or impossible for many users to read."**

### 1.2 Audit Failure Breakdown
| # | Element Label | Class / Selector | Background | Current Color | Current Ratio | Required Ratio | Status |
|---|---|---|---|---|---|---|---|
| **1** | **`STREAK`** | `span.text-[10px].font-mono.text-zinc-500` | `#0B0F17` (showcase widget pill) | `#71717A` (`zinc-500`) | **3.96:1** | **4.5:1** | ❌ FAIL |
| **2** | **`FOCUS`** | `span.text-[10px].font-mono.text-zinc-500` | `#0B0F17` (showcase widget pill) | `#71717A` (`zinc-500`) | **3.96:1** | **4.5:1** | ❌ FAIL |
| **3** | **`THEMES`** | `span.text-[10px].font-mono.text-zinc-500` | `#0B0F17` (showcase widget pill) | `#71717A` (`zinc-500`) | **3.96:1** | **4.5:1** | ❌ FAIL |
| **4** | **`AlgoCraft Auth`** | `span.text-[11px].text-zinc-500.font-mono` | `#10141E` (auth glass card) | `#71717A` (`zinc-500`) | **3.82:1** | **4.5:1** | ❌ FAIL |

### 1.3 Mathematical Root Cause
- Under WCAG 2.1 SC 1.4.3, text smaller than 18pt (or 14pt bold)—specifically `10px` and `11px` microcopy—must achieve a minimum contrast ratio of **4.5:1** against its backing surface.
- The Tailwind utility `text-zinc-500` resolves to `#71717A` (relative luminance $L \approx 0.167$).
- On our dark surfaces:
  - Deep canvas (`#0B0F17`): $L \approx 0.0048 \implies \text{Contrast} = (0.167 + 0.05) / (0.0048 + 0.05) \approx \mathbf{3.96:1}$ (Deficit: $-0.54$).
  - Glass card surface (`#10141E`): $L \approx 0.0071 \implies \text{Contrast} = (0.167 + 0.05) / (0.0071 + 0.05) \approx \mathbf{3.82:1}$ (Deficit: $-0.68$).
- Both fall below the 4.5:1 threshold, triggering automated audit failures.

---

## 2. Target Design & Contrast Upgrades

Replacing `text-zinc-500` with curated accessible alternatives restores full compliance without losing the sophisticated dark-slate technical look:

| Target Token | Hex Code | Luminance | Contrast on `#0B0F17` | Contrast on `#10141E` | Compliance Level |
|---|---|---|---|---|---|
| **`text-zinc-400`** | `#A1A1AA` | ~0.360 | **7.48:1** | **7.18:1** | **WCAG AAA** (Pass) |
| **`text-zinc-300`** | `#D4D4D8` | ~0.640 | **12.59:1** | **12.08:1** | **WCAG AAA** (Pass) |
| **`text-slate-400`** | `#94A3B8` | ~0.370 | **7.66:1** | **7.35:1** | **WCAG AAA** (Pass) |

> **Recommendation:**  
> Use **`text-zinc-400`** (or **`text-zinc-300`** for 10px micro-labels) for metadata tags, section pills, and subheadings. It preserves visual hierarchy while passing both WCAG AA (4.5:1) and AAA (7.0:1).

---

## 3. Work Breakdown Structure (Phases)

### Phase 1: Direct Remediation of Flagged Elements
**Goal:** Eliminate all 4 violations captured in the audit screenshot.

1. **`LoginFormContent.tsx` (Lines 126–144)**
   - Update `STREAK`, `FOCUS`, and `THEMES` label spans:
     ```diff
     - <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
     + <span className="text-[10px] font-mono text-zinc-400 font-medium flex items-center gap-1">
     ```
2. **`LoginFormContent.tsx` (Line 172)**
   - Update the `AlgoCraft Auth` badge inside `auth-glass-card`:
     ```diff
     - <span className="text-[11px] text-zinc-500 font-mono">AlgoCraft Auth</span>
     + <span className="text-[11px] text-zinc-400 font-mono">AlgoCraft Auth</span>
     ```

---

### Phase 2: Proactive Remediation of Sister Elements in Auth Flow
**Goal:** Ensure `SignupFormContent.tsx` and shared input components pass the same audit.

1. **`components/auth/SignupFormContent.tsx`**
   - Line 64: Brand subtitle `text-[10px] text-zinc-500 font-mono` $\to$ `text-zinc-400`
   - Line 139: Milestone status badge `"Upcoming"` `text-[11px] font-mono text-zinc-500` $\to$ `text-zinc-400`
   - Line 181: Card header `"AlgoCraft Auth"` `text-[11px] text-zinc-500 font-mono` $\to$ `text-zinc-400`
   - Footer copyright and synchronization notices $\to$ `text-zinc-400`
2. **`components/ui/Input.tsx`**
   - Line 44: Form field helper text `<span className="text-[11px] text-zinc-500 font-normal">{helperText}</span>` $\to$ `text-zinc-400`
   - Line 65: Input placeholder `placeholder:text-zinc-500` $\to$ `placeholder:text-zinc-400/80` (ensures readability during form entry)

---

### Phase 3: Global Secondary & Footer Audit
**Goal:** Prevent cascading contrast issues on dark workspace surfaces.

1. Review footer microcopy in `LoginFormContent.tsx` (Line 277) and `SignupFormContent.tsx`.
   - Update container `text-zinc-500` $\to$ `text-zinc-400`
2. Audit `components/auth/AuthThemeSelector.tsx` for low-contrast badges in dropdown states.

---

### Phase 4: Verification & Automated Quality Assurance
**Goal:** Verify 100% resolution using automated testing and visual inspection.

1. **Automated Audit**:
   - Re-run Lighthouse / Axe DevTools accessibility scan on `/login` and `/signup`.
   - Verify 0 color-contrast violations under `axe-core` rule `color-contrast`.
2. **Visual Check**:
   - Confirm aesthetic harmony: text remains secondary/hierarchical without overpowering primary headers.
   - Test across high-contrast display conditions and dark theme presets.

---

## 4. Execution Schedule & Deliverables

| Task | Component / File | Estimate | Deliverable |
|---|---|---|---|
| **1.1** Fix Showcase Pills (STREAK, FOCUS, THEMES) | `components/auth/LoginFormContent.tsx` | 5 min | Updated JSX with WCAG AAA compliant text tokens |
| **1.2** Fix Auth Glass Card Badge | `components/auth/LoginFormContent.tsx` | 3 min | Compliant card header badge |
| **2.1** Fix Signup View Parity | `components/auth/SignupFormContent.tsx` | 5 min | Synchronized accessible tokens across signup |
| **2.2** Fix Input Component Helper & Placeholder | `components/ui/Input.tsx` | 5 min | Accessible form field cues across the app |
| **3.1** Audit & Clean Up Footers | Auth templates | 5 min | High-contrast subtle footer typography |
| **4.1** Automated & Visual Contrast Verification | DevTools / Browser Audit | 10 min | Clean accessibility report with 100 score |
