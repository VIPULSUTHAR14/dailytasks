# Expense Tracker - Design & Architecture Documentation

## 1. Visual Tokens (Tailwind CSS)

### Theme: Strictly Black & White
- **Backgrounds**: 
  - Main App Background: `bg-zinc-950`
  - Cards / Containers: `bg-zinc-900` or transparent with `border-white/10`
  - Primary Action (Buttons): `bg-white text-zinc-950 hover:bg-zinc-200`
  - Secondary/Ghost Actions: `bg-transparent hover:bg-white/10 text-white`
  - Error States: `bg-red-500/10 text-red-500 border-red-500/20` (Only semantic accent color allowed)
- **Borders & Dividers**:
  - Soft Borders: `border-white/10`
  - Primary Accents: `border-white`
  - Input Focus Rings: `focus:ring-white`
- **Typography Colors**:
  - Primary Text: `text-white`
  - Secondary Text: `text-zinc-400`
  - Placeholder Text: `placeholder-zinc-500`

### Typography (Inter or Sans)
- **Headings**: `text-2xl md:text-3xl font-bold tracking-tight text-white`
- **Body**: `text-sm md:text-base font-medium text-white`
- **Small Details**: `text-xs text-zinc-400`

### Spacing, Layout & Breakpoint Strategy (Mobile-First)

**Constraint**: Use Tailwind CSS `container` classes generally, scaling up to a strict maximum width on ultra-wide screens (`mx-auto max-w-7xl`).

- **Mobile (<640px / Default)**: 
  - Layout: Single column.
  - Views: Stacked forms, bottom navigation (`BottomNav`).
- **Tablet (640px - 1024px / `sm` & `md`)**: 
  - Layout: 2-column grid for the Dashboard.
  - Views: Centered forms for Login/Signup.
- **Desktop (>1024px / `lg` & `xl`)**: 
  - Layout: 3-column layout (Sidebar | Main Content | Stats/Details).
- **Core Spacing Tokens**:
  - Container Padding: `p-4 sm:p-6 md:p-8`
  - Element Spacing: `space-y-4 sm:space-y-6`, `gap-4`
  - Border Radius: Sharp or subtle curves (`rounded-md` or `rounded-none`) for a brutalist monochrome feel.

---

## 2. Component Architecture (Atomic Design)

### Atoms
- **`Button`**: Solid white or outlined. Managed by Framer Motion for animations. `w-full` on mobile, `w-auto` on desktop.
- **`Input`**: High-contrast minimalist inputs. Dark background (`bg-zinc-950`), white borders (`border-white/20 focus:border-white`).
- **`Icon`**: White SVG icons.
- **`Typography`**: Sans-serif, white/zinc.

### Molecules
- **`FormField`**: Combines `Label` (`text-zinc-400`), `Input`, and `ErrorMessage` (red semantic text).
- **`StatisticCard`**: Minimalist border-lined box (`border border-white/10 bg-zinc-900/50`) displaying an Icon, Title, and Value.
- **`TransactionRow`**: Displays a single transaction. `flex-col` on mobile, `flex-row justify-between` on desktop.

### Organisms
- **`AuthForm`**: Responsive form (`max-w-md w-full`) integrating Framer Motion for staggered children animations.
- **`Navigation`**:
  - **Desktop**: `Sidebar` component (`hidden md:flex flex-col w-64 border-r border-white/10 bg-zinc-950`).
  - **Mobile**: `BottomNav` component (`flex md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950 z-50`).
- **`Header`**: Top bar with page title.
- **`TransactionList`**: Scrollable container for `TransactionRow`s.
- **`MainLayout`**: Wrapper managing the `Sidebar` vs `BottomNav` layout shift depending on the viewport.

### Templates (Pages)
- **`LoginPage`**: Centered `AuthForm` for signing in.
- **`SignupPage`**: Centered `AuthForm` for registration.
- **`Homepage` (Path `/`)**:
  - **Hero Section**: Bold monochrome heading.
  - **Features Grid**: Task Organization, Real-time Progress, and Responsive Design.
  - **Primary Aesthetic**: 'Dark Mode' (Black background, white text).
  - **Responsive Layout**: Ensure the Home Page uses a 1-column layout on mobile and 3-columns on desktop.
- **`DashboardPage`**: Responsive grid wrapper for statistics and recent transactions.

---

## 3. Animations (Framer Motion Specs)

All fluid animations should be handled via `framer-motion`.

- **Form Elements (Staggered Fade-in)**:
  - Parent container `variants`: `visible: { transition: { staggerChildren: 0.1 } }`
  - Child elements (Inputs, Labels) `variants`: `hidden: { opacity: 0, y: 10 }`, `visible: { opacity: 1, y: 0 }`
- **Buttons (Spring Transitions)**:
  - Hover: `whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}`
  - Tap: `whileTap={{ scale: 0.98 }}`
- **Page Transitions**:
  - Mount/Unmount: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`

---

## 4. Functionality Brief

### Login & Signup Pages
- **Validation Rules (Zod)**: 
  - Email: Valid format required.
  - Password: Min 4 characters.
  - Name (Signup): Min 3 characters.
- **Loading States**: Submit buttons disable, indicating an active request without breaking the monochrome aesthetic.
- **Error Handling**: Red semantic colors strictly reserved for rendering Zod validation or API errors. Form clears specific field errors `onChange`.

### Dashboard Layout
- **Dashboard Progress**:
  - Specify a Progress Section at the top.
  - **Logic**: `(completedTasks / totalTasks) * 100`.
  - **Design**: A thin, sleek white bar on a dark zinc track.
- **Mobile-First Navigation**: 
  - Users on narrow screens (`< md`) navigate via a sticky `BottomNav` bar.
  - Users on wider screens (`>= md`) see a fixed `Sidebar` on the left.
- **Main Content & Task Manager View**: 
  - Displays summary statistics cards at the top and a list of recent transactions below.
  - Contains a **Task Manager** feed for task cards. The `Sidebar` also integrates filtering actions to sort tasks by status (e.g., `pending` or `completed`).

---

## 5. Data Requirements (PostgreSQL/MongoDB)

The **Dashboard** requires dynamic data securely fetched from the backend APIs:

1. **User Profile**: `User.name`, `User.email`
2. **Aggregates**:
   - **Total Balance**: Sum(Income) - Sum(Expenses)
   - **Total Income**: Sum(`amount`) where `type = 'Income'`
   - **Total Expenses**: Sum(`amount`) where `type = 'Expense'`
3. **Recent Transactions**: Focus on `id`, `amount`, `category`, `date`, `description`, `type` (limit to 5-10 records).
4. **Task State Management**: 
   - The UI must handle a nested object structure matching the tasks API: an outer layer with `user_id` and an inner `task` object holding `title`, `status`, and `updated_at`.

---

## 6. Task UI Interactions

- **POST**: Add a floating `+` button that opens a minimalist, monochrome modal to create a new task.
- **PATCH**: Clicking a task card directly toggles its status seamlessly between `pending` and `completed`.
- **DELETE**: Append a subtle 'trash' icon to each task card to visually trigger deletion.
