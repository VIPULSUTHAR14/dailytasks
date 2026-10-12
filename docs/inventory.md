# AlgoCraft Application Inventory: Pages & API Routes

This inventory serves as the baseline ground truth for security auditing and performance refactoring.

---

## 1. Page Inventory (11 Application Pages)

| # | Route | File Path | Auth Requirement | Who Calls / Navigation | Rendering Strategy | What It Renders & APIs Used |
|---|---|---|---|---|---|---|
| 1 | `/` | `app/page.tsx` | Public | Direct URL, root entry | Static prerender + Middleware redirect | Splash / landing view. If no session, `proxy.ts` redirects to `/Login`. If session present, redirects to `/dashboard`. |
| 2 | `/Login` | `app/Login/page.tsx` | Public | Direct URL, redirected from `/` or protected routes | Server Page + Client Form | Sign-in interface. Calls `/api/auth/Login`. Redirects to `/dashboard` upon session creation. |
| 3 | `/signup` | `app/signup/page.tsx` | Public | Direct URL, linked from `/Login` | Server Page + Client Form | Registration interface. Calls `/api/auth/Signup`. |
| 4 | `/dashboard` | `app/dashboard/page.tsx` | Protected | Post-login redirect destination | Client redirector component | Mounts client-side and issues `router.replace("/timetable")`. Target for optimization (hop removal). |
| 5 | `/timetable` | `app/timetable/page.tsx` | Protected | Sidebar, redirected from `/dashboard` | Client Component (`Timetable.tsx`) | 24-hour daily scheduler, time tracking slots, energy levels. Calls `/api/timetable`. |
| 6 | `/tasks` | `app/tasks/page.tsx` | Protected | Sidebar navigation | Client Component (`tasks/page.tsx`) | Daily tasks, Kanban/list views, habit streaks. Calls `/api/task`, `/api/tasktoday`, `/api/habits`. |
| 7 | `/notes` | `app/notes/page.tsx` | Public / Partial | Sidebar, direct URL | Client Component (`DsaNotes.tsx`) | 29+ DSA curriculum topics, spaced repetition, mastery matrices. Calls `/api/notes`. Heavy TipTap bundle. |
| 8 | `/custom-notes` | `app/custom-notes/page.tsx` | Public / Partial | Sidebar, direct URL | Client Component (`CustomNotes.tsx`) | Modular engineering notebooks, system design docs. Calls `/api/custom-notes`. Heavy TipTap bundle. |
| 9 | `/planly` | `app/planly/page.tsx` | Public / Partial | Sidebar, direct URL | Client Component (`PlanlyDashboard.tsx`) | Sprint engine, stopwatch metrics, LeetCode reflections. Uses `localStorage` persistence. |
| 10 | `/aptitude` | `app/aptitude/page.tsx` | Protected | Sidebar navigation | Client Component (`aptitude/page.tsx`) | Placement preparation roadmap across Quant, Logic, Verbal. Calls `/api/aptitude`. Heavy inline data. |
| 11 | `/dsaquestions` | `app/dsaquestions/page.tsx` | Protected | Sidebar navigation | Client Component (`DsaQuestions.tsx`) | Algorithmic question tracker, difficulty filters, status toggles. Calls `/api/dsaquestions`. |

---

## 2. API Routes Inventory (13 Routes)

| # | Endpoint | HTTP Methods | Current Auth Gate | Caller Locations | Current Return Shape | Security & Performance Status |
|---|---|---|---|---|---|---|
| 1 | `/api/users` | `GET` | **NONE (Vulnerable)** | **No callers** in frontend | Unfiltered array of all database users | ⚠️ **Critical Vulnerability**: Leaks full user list and credentials. Must gate behind session and scope to current user. |
| 2 | `/api/auth/Login` | `POST` | Public | `components/auth/` | `{ message: string }` + `session_token` cookie | Sets cookie (`httpOnly: true`, `sameSite: lax`). Session TTL mismatch (24h in DB vs 7d cookie). |
| 3 | `/api/auth/Signup` | `POST` | Public | `components/auth/` | `{ message: string }` + `session_token` cookie | Validates with Zod. Sets cookie (`sameSite: strict`). Same TTL mismatch. |
| 4 | `/api/auth/Logout` | `POST` | Cookie lookup | `components/Sidebar.tsx` | `{ message: string }` + cookie deleted | Deletes from MongoDB `sessions` collection and deletes cookie. Needs session cache invalidation. |
| 5 | `/api/token/refresh` | `POST` | Cookie lookup | `lib/api_client.ts` | `{ accessToken: string }` + cookie cycled | Cycles session record in DB and rotates cookie. |
| 6 | `/api/timetable` | `GET`, `POST` | Cookie lookup | `components/Timetable.tsx` | `{ schedule: [...] }` / updated document | Validates session in DB on every request. Scoped by `userId`. |
| 7 | `/api/task` | `GET`, `POST`, `PUT`, `DELETE` | Cookie lookup | `app/tasks/page.tsx` | Tasks array / single task document | Validates session in DB on every request. Scoped by `user_id`. |
| 8 | `/api/tasktoday` | `GET`, `POST`, `PUT`, `DELETE` | Cookie lookup | `app/tasks/page.tsx` | Today's tasks array / mutated task | Validates session in DB on every request. Scoped by `user_id`. |
| 9 | `/api/notes` | `GET`, `POST`, `PUT` | Cookie lookup | `components/DsaNotes.tsx` | Topics notes array / updated topic | Validates session in DB on every request. Scoped by `user_id`. |
| 10 | `/api/custom-notes` | `GET`, `POST`, `PUT`, `DELETE` | Cookie lookup | `components/CustomNotes.tsx` | Notebooks array / created/updated doc | Validates session in DB on every request. Scoped by `user_id`. |
| 11 | `/api/dsaquestions` | `GET`, `POST`, `PUT`, `DELETE` | Cookie lookup | `components/DsaQuestions.tsx` | Questions array / updated question | Validates session in DB on every request. Scoped by `user_id`. |
| 12 | `/api/habits` | `GET`, `POST`, `PUT`, `DELETE` | Cookie lookup | `app/tasks/page.tsx` | Habits array / mutated habit | Validates session in DB on every request. Scoped by `user_id`. |
| 13 | `/api/aptitude` | `GET`, `POST`, `PUT` | Cookie lookup | `app/aptitude/page.tsx` | Aptitude records array / updated doc | Validates session in DB on every request. Scoped by `user_id`. |
