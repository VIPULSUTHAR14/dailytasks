# Rich Text Editor Technical Report & Feature Specification

> **Document Scope:** Comprehensive overview of the text editing architecture, dependencies, extensions, toolbar controls, formatting semantics, and UX features implemented in the Notes system.
> **Date:** October 2026  
> **App:** AlgoCraft / DailyTasks  
> **Target Module:** Notes & DSA Workbench Editor  

---

## 1. Executive Summary & Core Libraries

The Notes editor is powered by **TipTap v3**, an industry-leading, headless rich text editing framework built directly on top of the **ProseMirror** state machine.

### Core Dependencies Overview

| Library / Package | Version | Purpose |
| :--- | :--- | :--- |
| **`@tiptap/react`** | `^3.31.4` | React 19 bindings and component wrapper for TipTap. |
| **`@tiptap/pm`** | `^3.31.4` | Core ProseMirror packages (state, view, model, transform) powering the content-editable engine. |
| **`@tiptap/starter-kit`** | `^3.31.4` | Standard suite of document primitives (Document, Paragraph, Text, Heading, Blockquote, Bold, Italic, Strike, History/Undo-Redo). |
| **`tiptap-markdown`** | `^0.9.0` | Bidirectional parser and serializer converting between ProseMirror document trees and clean Markdown. |
| **`lowlight`** | `^3.3.0` | Abstract Syntax Tree (AST) code highlight engine. |
| **`highlight.js`** | `^11.12.0` | Syntax definitions for programming languages. |
| **`isomorphic-dompurify`** | `^4.5.0` | Sanitizes pasted HTML, preventing XSS and stripping foreign Microsoft Office/Word formatting. |
| **`lucide-react`** | `^0.577.0` | Vector icons for toolbars, dropdowns, menus, and outlines. |

---

## 2. TipTap Extension Architecture

The editor instance is initialized with the following extension set:

```ts
extensions: [
    StarterKit.configure({ codeBlock: false }),
    Underline,
    Highlight.configure({ multicolor: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({ placeholder: "Start writing...", emptyEditorClass: "is-editor-empty" }),
    Link.configure({ openOnClick: false, autolink: true }),
    Markdown.configure({ html: true, tightLists: true, bulletListMarker: "-" }),
]
```

### Detailed Feature Breakdown

### 2.1. Basic Formatting & Typography
* **Headings**: H1, H2, and H3 with theme-tailored line heights, weights, and divider borders.
* **Inline Marks**:
  * **Bold**: `**text**` (`Ctrl+B` / `Cmd+B`)
  * **Italic**: `*text*` (`Ctrl+I` / `Cmd+I`)
  * **Underline**: Via `@tiptap/extension-underline` (`Ctrl+U` / `Cmd+U`)
  * **Strikethrough**: `~~text~~` (`Ctrl+Shift+X` / `Cmd+Shift+X`)
  * **Inline Code**: `` `text` ``
* **Lists**:
  * **Bullet Lists**: `- item` or `* item`
  * **Numbered Lists**: `1. item`
  * **Nested Task Lists** (`@tiptap/extension-task-list`, `@tiptap/extension-task-item`): Interactive checkboxes with nesting support.
* **Blockquotes**: `> Quote text` with thematic accent border.
* **Horizontal Dividers**: `---` for section separation.
* **Full History**: Undo (`Ctrl+Z`) and Redo (`Ctrl+Y` / `Ctrl+Shift+Z`).

---

### 2.2. AlgoCraft Semantic 5-Color Highlighting
Custom color semantic highlighting integrated through `@tiptap/extension-highlight` and converted for Markdown storage:

| Color | Hex Token | Meaning | Markdown Format | HTML Tag |
| :--- | :--- | :--- | :--- | :--- |
| 🌹 **Rose** | `#f43f5e` | Bug / Critical Edge Case | `==r:text==` | `<mark data-color="#f43f5e">` |
| 🌲 **Emerald** | `#10b981` | Optimal Insight / Pattern | `==g:text==` | `<mark data-color="#10b981">` |
| 🌊 **Sky / Cyan** | `#06b6d4` | Standard Library / Method | `==b:text==` | `<mark data-color="#06b6d4">` |
| 🍯 **Amber** | `#f59e0b` | Follow-up / Check Later | `==y:text==` | `<mark data-color="#f59e0b">` |
| 🔮 **Purple** | `#a855f7` | Formula / Big-O Math | `==p:text==` | `<mark data-color="#a855f7">` |

---

### 2.3. Multi-Language Code Blocks
Syntax highlighting is handled by `@tiptap/extension-code-block-lowlight` with custom registered grammars:
* **Languages Supported**: JavaScript, TypeScript, Python, Java, C++, C, SQL, JSON, XML/HTML, CSS, Bash/Shell.
* **Toolbar Switcher**: Direct dropdown menu in the top toolbar to switch language syntax highlighting dynamically.

---

### 2.4. Structured Tables
Implemented via `@tiptap/extension-table`:
* **Resizable Columns**: Interactive drag handles on table column borders.
* **Contextual Operations**: Insert row above/below, delete row, insert column left/right, delete column, and delete table.
* **Styled Headers & Striping**: High-contrast header rows with subtle cell borders.

---

### 2.5. Hyperlinks
Handled by `@tiptap/extension-link`:
* **Autolink**: Automatically creates clickable links when URLs are pasted or typed.
* **Inline Link Editing**: Bubble popover allowing quick edit or removal of links without leaving keyboard flow.

---

## 3. UI/UX Interaction Systems

### 3.1. Word-Style Top Formatting Toolbar (`RichTextToolbar.tsx`)
A sticky or embedded toolbar providing instant access to:
* Heading dropdown selector (Paragraph, H1, H2, H3)
* Inline toggles (B, I, U, S, Inline Code)
* Color highlighter dropdown with the 5 semantic swatches
* List formatting (Bullets, Numbers, Checkboxes)
* Quote block and horizontal divider insertion
* Table creation and contextual column/row controls
* Code block creation and syntax language selector
* Undo and Redo buttons

---

### 3.2. Notion-Style Slash Commands (`RichTextSlashMenu.tsx`)
Triggered immediately upon typing `/`:
* Instant keyboard navigation (Up, Down, Enter, Escape)
* Search filtering across labels and aliases (e.g., typing `/h1`, `/code`, `/table`, `/todo`)
* Contextual insertion at current cursor position

---

### 3.3. Floating Selection Mini-Toolbar (`RichTextFloatingToolbar.tsx`)
Appears directly above any highlighted text selection:
* Quick buttons for Bold, Italic, Link
* 5 color circle swatches for one-click semantic highlighting

---

### 3.4. Document Outline & Table of Contents
* Scans all heading nodes (`H1`, `H2`, `H3`) in real-time.
* Displays heading count badge: `Outline (10)`.
* Dropdown list with indentation by level.
* Clicking any heading performs smooth scrolling directly to that section.

---

### 3.5. Fullscreen Studio Canvas & Elevated Document Sheet
* Uses React Portal (`createPortal`) to mount directly to `document.body` with `z-[99999]`.
* **Elevated Document Sheet**: The document is contained on an elevated sheet (`bg-[var(--card)]`, `rounded-2xl`, `shadow-xl`, `border`) centered on the screen.
* **Ambient Canvas**: The outer margins display a blueprint grid and soft ambient glow, providing a focused, distraction-free writing environment (similar to Notion / Linear).
* **Escape Key Binding**: Pressing `Escape` cleanly exits fullscreen mode.

---

### 3.6. Section & Phase Tabs
* Supports segmented multi-phase documents (e.g., `Overview (868 words)`, `phase 0`, `phase 1`, etc.).
* Displays live word count badges per tab.

---

### 3.7. Performance & State Synchronization
* **Debounced Persistence (350ms)**: Batches keystrokes before invoking `onChange` to ensure smooth 60fps typing.
* **External Sync Guard**: Compares pending changes to avoid re-rendering or cursor jumping when external props update.
* **Word & Character Statistics**: Computes counts off the typing hot path and displays them in the footer status bar (`757 words · 5362 chars`).
* **Visual Status Indicators**: Real-time feedback (`Saving...` with pulse dot ➔ `Saved` checkmark).
* **Zero-Layout-Shift Loading Skeleton (`RichTextEditor.skeleton.tsx`)**: Renders structured toolbar and content skeleton placeholders while the editor initializes.

---

## 4. File Structure Reference

```
components/
├── RichTextEditor.tsx           # Main editor component, fullscreen portal, and state
├── RichTextToolbar.tsx          # Word-style top formatting toolbar
├── RichTextSlashMenu.tsx        # Notion-style slash commands menu
├── RichTextFloatingToolbar.tsx  # Floating text selection bubble menu
├── RichTextEditor.skeleton.tsx  # Accessible loading skeleton
├── rich-editor.css              # Theme-aware styling across all 11 AlgoCraft themes
lib/
└── markdownHighlightConverter.ts # Converter between storage markdown and TipTap marks
docs/
└── rich_text_editor_library_report.md # This documentation report
```
