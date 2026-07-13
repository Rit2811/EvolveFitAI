# EvolveFit AI — Project and Progress Report

**Report date:** 13 July 2026<br>
**Project type:** Full-stack capstone web application<br>
**Current stage:** Demo-ready vertical slice

## 1. Executive summary

EvolveFit AI is a personalized fitness and nutrition coaching application for general wellness. It creates a complete seven-day workout and meal plan from a user's goals, experience, schedule, available equipment, dietary pattern, allergies, disliked foods, and cooking preferences. Users can submit daily recovery and adherence check-ins, receive an adapted version of their plan, review why it changed, monitor progress, and ask an AI coach questions grounded in their saved data.

The current implementation covers the intended end-to-end capstone journey:

`Register → Onboard → Generate Plan → View Workouts and Meals → Check In → Adapt Plan → Review Explanation → Dashboard/Progress → AI Coach`

The project prioritizes a reliable, polished demonstration over production-scale infrastructure. It includes backend AI validation and deterministic local fallbacks so the main demo remains usable if Gemini is unavailable or its free quota is exhausted.

## 2. Problem and proposed solution

Generic workout and meal plans often ignore practical constraints and do not respond when a user's sleep, soreness, stress, energy, or adherence changes. EvolveFit AI addresses this by combining:

- A structured onboarding profile that defines hard personal constraints.
- AI-generated weekly workout and meal planning.
- Daily recovery and adherence tracking.
- Conservative plan adaptation based on check-in signals.
- Plain-language explanations of every adaptation.
- A contextual coach that answers questions using the profile, active plan, and latest check-in.

The application provides general wellness guidance only. It does not diagnose conditions, prescribe medication or supplements, provide injury rehabilitation, or replace qualified professional care.

## 3. Project objectives

The core objectives are to:

1. Provide secure email/password authentication.
2. Collect enough profile information to personalize training and meals.
3. Generate and validate a complete seven-day plan.
4. Respect equipment, schedule, duration, diet, allergy, and disliked-food constraints.
5. Record daily check-ins and calculate a readiness score.
6. Adapt an active plan conservatively when recovery or adherence changes.
7. Explain what changed and why.
8. Present current activity and progress in a clear wellness dashboard.
9. Offer a grounded AI coach without exposing provider credentials to the browser.
10. Remain usable during an AI provider failure through local fallback behavior.

## 4. Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, JavaScript | Component-based user interface |
| Build tooling | Vite 7 | Development server and production bundling |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer | Responsive wellness interface |
| Routing | React Router 7 | Public, protected, and onboarding routes |
| Icons | Lucide React | Consistent interface iconography |
| Charts | Recharts 3 | Readiness, sleep, and adherence trends |
| Backend | Node.js 20+, Express 5 | API and server-side AI orchestration |
| Authentication | Supabase Auth | Email/password registration and sessions |
| Database | Supabase PostgreSQL | Profiles, plans, and check-ins |
| Authorization | PostgreSQL Row Level Security | Per-user data isolation |
| AI | Google GenAI SDK with Gemini | Plan generation, adaptation, and coaching |
| Testing | Node.js built-in test runner | Backend service and endpoint verification |
| Code quality | ESLint 9 | Frontend and backend static analysis |

## 5. Technical requirements

### Development requirements

- Node.js 20 or newer.
- npm with workspace support.
- A Supabase project with email/password authentication enabled.
- The four SQL migrations applied in numeric order.
- A modern browser with JavaScript and local storage enabled.
- Optional Google AI Studio API key for live Gemini responses.

### Runtime services

- Frontend development server: `http://localhost:5173`
- Express API: `http://localhost:3001`
- API health check: `GET http://localhost:3001/api/health`
- Supabase-hosted authentication and PostgreSQL database.
- Gemini Developer API when live AI mode is configured.

### Environment variables

Frontend (`client/.env`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_API_URL=http://localhost:3001
```

Backend (`server/.env`):

```env
PORT=3001
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your-server-only-key
GEMINI_MODEL=gemini-3.5-flash
```

The Gemini key is optional because safe local fallbacks are included. Supabase service-role credentials and AI provider keys must never be placed in frontend environment files.

## 6. System architecture

The application uses a small three-part architecture:

1. **React client:** handles authentication screens, onboarding, dashboards, data entry, visualization, and calls to Supabase and Express.
2. **Express server:** owns all AI provider calls, composes prompts, validates inputs and model output, and returns local fallback responses when needed.
3. **Supabase:** manages user authentication, persistent PostgreSQL data, sessions, and row-level authorization.

The browser reads and writes user-owned profile, plan, and check-in data through Supabase's public client with RLS enforcement. It never receives the Gemini API key. The Express server does not act as a general database proxy; its responsibility is focused on AI generation, adaptation, and coaching.

## 7. Application routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Product landing page |
| `/login` | Public-only | Existing-user authentication |
| `/register` | Public-only | New-user registration |
| `/onboarding` | Authenticated | Multi-step profile and preference setup |
| `/dashboard` | Protected | Today's readiness, workout, meals, weekly consistency, and daily insight |
| `/plan` | Protected | Generate and view weekly workout and meal plans |
| `/check-in` | Protected | Record recovery/adherence and adapt the active plan |
| `/progress` | Protected | View saved recovery and adherence trends |
| `/coach` | Protected | Ask questions grounded in current user data |
| `/profile` | Protected | Edit preferences, regenerate a plan, and sign out |

Protected routes redirect unauthenticated users. Users who have not completed onboarding are routed through onboarding before using the main application.

## 8. Backend API

| Method and path | Responsibility |
|---|---|
| `GET /api/health` | Confirms that the Express service is running |
| `POST /api/ai/generate-plan` | Generates and validates a seven-day plan from a profile |
| `POST /api/ai/adapt-plan` | Produces a new plan version using the profile, current plan, and check-in |
| `POST /api/ai/coach` | Returns concise guidance grounded in supplied user context |

Malformed input returns a client error. AI failures, invalid JSON, or contract violations activate a valid local fallback rather than breaking the user journey.

## 9. Database design and security

The project intentionally uses only three application tables:

### `profiles`

Stores identity-linked onboarding data, biometrics, goals, training availability, equipment, preferred workout weekdays, preferred/avoided exercises, preferred/excluded foods, and onboarding completion. The primary key references `auth.users(id)` and cascades on account deletion.

### `plans`

Stores workout and meal plans as JSONB with a summary, adaptation message, adaptation reasons, version number, active status, and creation timestamp. A partial unique index ensures that each user has at most one active plan.

### `check_ins`

Stores energy, sleep duration and quality, soreness, stress, hunger, workout completion, dietary adherence, calculated readiness, notes, and creation time.

All three tables have Row Level Security enabled. Select, insert, update, and delete policies require the authenticated user's ID to match the row owner. Database checks also constrain ages, biometrics, workout schedules, ratings, sleep duration, and readiness ranges.

## 10. AI behavior and safeguards

Gemini is used only from Express. The current default model is `gemini-3.5-flash`. The AI contract requires:

- A plan summary and adaptation explanation.
- Workout and meal entries for Monday through Sunday.
- The exact requested number of active workout days.
- Exercises on every non-rest workout day.
- Sessions within the user's duration limit.
- Equipment selected only from the user's available equipment.
- Meals consistent with diet type and food exclusions.
- Two to four grounded reasons for adapted plans.

Backend validation rejects incomplete days, invalid workout counts, unavailable equipment, excessive duration, excluded foods, diet violations, missing nutrition estimates, and incomplete adaptation explanations. Medical, rehabilitation, supplement, medication, extreme-diet, and maximal-training guidance is excluded by both prompts and fallback logic.

## 11. Current implementation progress

| Work area | Status | Current evidence |
|---|---|---|
| Project foundation | Complete | npm workspaces, Vite client, Express server, Tailwind, lint/build/test scripts |
| Authentication and shell | Complete | Register/login pages, Supabase sessions, protected/public route guards, responsive application shell |
| Onboarding | Complete | Multi-step form and profile upsert to Supabase |
| AI plan generation | Complete | Gemini service, structured prompt, parser, validator, and deterministic fallback |
| Plan experience | Complete | Active plan loading, seven-day workout/meal views, metadata, constraints, loading/error/empty states |
| Check-in and adaptation | Complete | Readiness calculation, check-in persistence, plan versioning, adaptation reasons, rollback on failed plan save |
| Dashboard | Complete | Current readiness, today's workout and meals, weekly consistency, and focused daily insight |
| Progress | Complete | Recharts trends from saved check-ins |
| AI coach | Complete | Gemini-backed grounded responses plus local fallback |
| Plan personalization | Complete | Balanced default schedule, preferred weekdays, favorite/excluded foods, preferred/avoided exercises, and visible preference summary |
| Profile management | Complete | Preference editing, protected age/height confirmation, sign-out, and plan regeneration workflow |
| Daily report | Complete | Strengths, improvements, daily focus, and downloadable one-page PDF after each check-in |
| Chat continuity | Complete | Up to 10 user-scoped conversations persist and synchronize across tabs; unanswered pending messages are automatically removed |
| Release safeguards | Complete | Error boundary, health endpoint, environment preflight, fallback mode, responsive states |

The eight numbered implementation task files have corresponding working code in the current repository. The primary P0 flow and the planned P1 presentation features are present.

## 12. Weekly project status

This seven-day summary follows the natural implementation order represented by the project tasks and current codebase.

### Day 1 — Foundation and project structure

The project workspace was established with separate React client and Express server packages managed through npm workspaces. Vite, Tailwind CSS, ESLint, common development commands, the health endpoint, environment templates, and the initial responsive visual system were configured. This created a runnable base for all later vertical slices.

**End-of-day result:** Both application layers had a consistent structure, shared root commands, and a working development foundation.

### Day 2 — Authentication, navigation, and onboarding

Supabase email/password authentication was connected to the frontend. Public-only and protected route guards, session restoration, the application shell, and sign-out behavior were added. The multi-step onboarding flow was then implemented to collect biometrics, goals, experience, availability, equipment, diet, allergies, disliked foods, meal frequency, and cooking preference. Profile data was saved through a user-owned Supabase upsert.

**End-of-day result:** A user could register, sign in, complete onboarding, and enter the protected application with a persistent profile.

### Day 3 — Weekly plan generation and display

The first complete plan workflow was built. The backend gained structured prompting, JSON parsing, profile validation, plan-contract validation, and a deterministic fallback. The frontend gained plan generation states and a seven-day workout/meal experience with active-plan persistence in Supabase. Equipment, workout duration, active-day count, diet, allergies, and disliked foods were treated as hard constraints.

**End-of-day result:** A completed profile could produce, validate, save, and display a usable weekly plan even when live AI was unavailable.

### Day 4 — Daily check-ins and adaptive planning

The daily check-in captured sleep, energy, soreness, stress, hunger, workout completion, and dietary adherence. A readiness score was calculated in the client and saved with the check-in. The adaptation service used the current plan and recovery signals to create a conservative new plan version. Adaptation explanations were surfaced to the user, and failed persistence included a rollback path to keep the previous plan active.

**End-of-day result:** The core differentiator—recovery-aware plan adaptation with understandable reasons—worked end to end.

### Day 5 — Dashboard and progress reporting

The dashboard was connected to the active plan and latest check-in. It began showing current readiness, today's workout, today's meals, and direct links to common actions. The Progress page added Recharts visualizations for saved check-in trends, together with loading, error, and empty states.

**End-of-day result:** Users could understand their current day quickly and review how recovery and adherence changed over time.

### Day 6 — AI coach, profile management, and live Gemini

The Coach page was added with suggested questions and context from the profile, active plan, and most recent check-in. Profile editing and plan regeneration were completed. The server-side provider was then migrated to Google's official GenAI SDK so the project could use Gemini's available free tier. Provider configuration was kept on the server, and live Gemini behavior was verified while preserving all existing fallbacks and safety rules.

**End-of-day result:** The application had a real contextual AI coach, editable preferences, and live AI without placing provider credentials in the browser.

### Day 7 — Persistence, verification, and release polish

Coach messages were organized into up to 10 persistent conversations per signed-in user and synchronized across tabs, while unsent input and unanswered pending messages are automatically removed. Final documentation, environment preflight checks, error handling, responsive states, and release safeguards were reviewed. Lint, the backend test suite, the production build, Supabase resources, and a live Gemini response were verified.

**End-of-day result:** The capstone reached a stable demo-ready state with 15 passing tests, a successful production build, a 10/10 preflight, and a reliable fallback path.

### Weekly outcome

The week progressed from a basic full-stack foundation to a complete personalized wellness workflow. The most important result is not the number of pages, but the connected journey: user constraints become a saved plan, daily feedback changes that plan safely, the change is explained, and the dashboard and coach continue from the same data.

## 13. Verification and quality status

The latest project verification completed with:

- ESLint passing for client and server.
- **18 of 18 backend tests passing.**
- Vite production build passing.
- Release preflight passing **10 of 10 checks**.
- All three live Supabase REST resources previously verified with HTTP 200.
- A live Gemini request verified with `source: "gemini"`.
- npm dependency audit reporting no known vulnerabilities at the time of integration.

The automated test suite covers health routing, profile/plan validation, safe fallback generation, valid Gemini response handling, check-in adaptation behavior, coach grounding, and medical-guidance refusal. The client currently relies on lint, production build, and manual end-to-end verification rather than a dedicated browser test suite.

## 14. Setup and execution

From the repository root:

```powershell
npm install
npm run release:preflight
npm run dev
```

Apply these migrations in Supabase before using authenticated features:

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_plans.sql`
3. `supabase/migrations/003_check_ins.sql`
4. `supabase/migrations/004_plan_preferences.sql`

Useful quality commands:

```powershell
npm run lint
npm test
npm run build
npm run verify
```

## 15. Demonstration scenario

A suitable demonstration profile is:

- Goal: Build muscle
- Experience: Beginner
- Training: Four home workouts per week, 45 minutes each
- Equipment: Dumbbells and resistance bands
- Diet: Vegetarian
- Allergy: Peanuts

After generating the plan, submit a check-in with short sleep, low energy, and high soreness. The adapted plan should reduce training load or intensity, preserve equipment and dietary constraints, create a new plan version, and show clear reasons for the change. The coach can then answer, “Why did my plan change?” using those saved reasons.

## 16. Current limitations and risks

- Chat history is browser-local rather than stored in Supabase, so it does not transfer between devices or browsers.
- Google Gemini free-tier availability and rate limits can change; fallback mode protects the demonstration but is less open-ended than live AI.
- Email confirmation has no dedicated in-app flow. It must be disabled for a quick demo or completed through the user's email.
- Supabase can temporarily rate-limit repeated public signup attempts; demo users can be created and auto-confirmed from the Supabase dashboard.
- Progress is based on check-ins only; dedicated body-weight history is not part of the current schema.
- There is no automated browser/end-to-end test suite.
- The project is designed for a capstone demonstration, not high-scale or regulated health use.

## 17. Recommended next steps

The highest-value next actions are:

1. Perform and document one full manual browser run of the required user journey using a confirmed demo account.
2. Capture presentation screenshots of onboarding, the plan, adaptation explanation, progress charts, and coach.
3. Add a small browser-based smoke test for authentication redirects and the primary demo flow if submission time permits.
4. Prepare deployment environment variables and verify CORS/redirect URLs on the chosen hosting platform.
5. Keep optional future work—cross-device chat history, password reset, email-verification UI, notifications, exports, and wearables—outside the final capstone unless the core demo is already stable.

## 18. Conclusion

EvolveFit AI currently satisfies its main capstone objective: it delivers a coherent, personalized, recovery-aware fitness and nutrition workflow from registration through AI coaching. The architecture is intentionally small, the data model is protected by Supabase RLS, AI output is validated before use, and local fallbacks keep the demonstration reliable. Remaining work is primarily presentation, final manual end-to-end evidence, and optional deployment hardening rather than missing core functionality.
