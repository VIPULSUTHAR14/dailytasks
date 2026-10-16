# AlgoCraft CSS Depth System (DEPTH.md)

## 1. Overview
The AlgoCraft CSS Depth System is a multi-tier physical design system that transforms flat dark/light user interfaces into tactile, elevated, and responsive materials. It is built strictly on CSS cascade layers:

```css
@layer reset, tokens, materials, components, utilities, a11y;
```

---

## 2. Core Tokens & Cascade

### 2.1 Elevation Scale
Shadow strength scales dynamically with `--shadow-k` (dark themes use `1`, light themes use `.38` with warm-tinted shadows).

| Token | Purpose | Specs |
|---|---|---|
| `--e1` | Pills, list rows, table headers | Low contact shadow + `--rim-1` |
| `--e2` | Default cards, panels, Kanban cards | Medium shadow + `--rim-2` |
| `--e3` | Hovered cards, sticky bars, active panels | Elevated shadow + `--rim-2` |
| `--e4` | Dropdowns, popovers, toolbars | Floating shadow + `--rim-3` |
| `--e5` | Modals, fullscreen focus panels | Deep cinematic shadow + `--rim-3` |

### 2.2 Specular Rims & Channels
- **`--rim-1`, `--rim-2`, `--rim-3`**: Simulated overhead light striking the top 1px bevel of cards.
- **`--channel` & `--channel-lip`**: Inset contact shadows for sunken wells and recessed input fields.

### 2.3 RGB Triplets
Every theme defines RGB triplets without alpha so components can cleanly compose alphas with `rgb(var(--accent-rgb) / .15)`:
- `--accent-rgb`: Primary theme accent.
- `--accent-2-rgb`: Secondary theme accent.
- `--grid-rgb`: Grid line tint.
- Status triplets: `--success-rgb`, `--warn-rgb`, `--danger-rgb`.

---

## 3. Utility Classes (Do & Don't)

### 3.1 Material Surfaces
- `.surface-1`: Low elevation card surface (`--e1`).
- `.surface-2`: Default elevation card surface (`--e2`, `border-radius: 14px`).
- `.surface-3`: Raised card surface (`--e3`, `border-radius: 16px`).
- `.surface-well`: Sunken container well for Kanban columns, input groups, code panes.
- `.glass`: Refractive frosted glass (`backdrop-filter: blur(14px) saturate(140%)`).

### 3.2 Interaction Physics
- `.btn-haptic`: Raised springy button with hover lift (`translateY(-1.5px)`) and click compression (`translateY(1px)`).
- `.btn-quiet`: Secondary/ghost button with subtle specular rim.
- `.hover-depth`: Card hover lift with reactive accent shadow glow.
- `.input-tactile`: Recessed form input with inset channel and glowing focus ring.
- `.spotlight`: Cursor-tracking radial spotlight (powered by `lib/spotlight.ts`).

### 3.3 Visual Badges & Visuals
- `.pill-glass`: Frosted glass badge (`.pill-easy`, `.pill-medium`, `.pill-hard`).
- `.pip-live`: Breathing live status indicator with animated ping wave.
- `.ring-neon`: SVG gauge progress stroke with neon drop-shadow glow.
- `.streak-aura`: Radial breathing backlight for streak flame counters.
- `.keycap`: Mechanical keycap styling with 2px bottom rim extrusion.

---

## 4. Kill Switch & Accessibility Guardrails
- **`data-depth="off"`**: Setting `data-depth="off"` on `<html>` zeroes out all shadows, channels, and rims instantly, restoring flat mode without breaking layout.
- **`prefers-reduced-motion`**: Disables hover lifts, spring physics, and infinite animations.
- **`prefers-reduced-transparency`**: Removes `backdrop-filter` and falls back to solid surfaces.
- **`prefers-contrast: more`**: Strips specular rims and boosts border contrasts.
- **`forced-colors`**: Maps all borders and buttons to system color targets (`CanvasText`, `ButtonText`).
