# EvolveFit AI - Codex Project Instructions

## Mission
Build a polished, demo-ready capstone named **EvolveFit AI**: a personalized AI fitness and nutrition coach that generates a weekly workout and meal plan, collects daily check-ins, adapts the plan, and explains what changed.

The target quality is an **8/10 to 9/10 capstone**, not a production SaaS platform. Prefer a reliable, attractive vertical slice over extra features.

## Fixed stack
- Frontend: React + Vite + JavaScript
- Styling: Tailwind CSS
- Routing: React Router
- Icons: Lucide React
- Charts: Recharts
- Auth and database: Supabase Auth + PostgreSQL
- Backend: Node.js + Express
- AI: OpenAI Node SDK, called only from the backend

Do not introduce NestJS, TypeScript migrations, Redis, queues, Docker, LangChain, vector databases, microservices, payments, wearables, or multi-agent architecture.

## Product routes
- `/`
- `/login`
- `/register`
- `/onboarding`
- `/dashboard`
- `/plan`
- `/check-in`
- `/progress`
- `/coach`
- `/profile`

## Priority order
### P0 - must work
1. Authentication
2. Onboarding profile
3. AI plan generation
4. Workout and meal plan display
5. Daily check-in
6. AI plan adaptation
7. Adaptation explanation
8. Dashboard

### P1 - implement after P0
- Progress charts
- AI coach
- Profile editing
- Responsive layout
- Loading, empty, and error states

### P2 - omit when time is tight
- Persisted chat history
- Password reset
- Email verification flow
- Export features
- Notifications
- Advanced charts
- Dark mode
- Complex animations

## Engineering rules
1. Inspect existing files before editing.
2. Preserve working code and avoid replacing the whole repository.
3. Work in small vertical slices and keep the app runnable after each slice.
4. Run available lint, build, and test commands after meaningful changes.
5. Fix errors before starting another phase.
6. Do not expose `OPENAI_API_KEY` or Supabase service-role credentials in the frontend.
7. Keep the OpenAI call in Express routes/services.
8. Validate AI output before saving or rendering it.
9. Maintain a local fallback plan so the demo still works when AI generation fails.
10. Use realistic content; never use lorem ipsum.
11. Avoid broken buttons. Hide unfinished controls rather than leaving them nonfunctional.
12. Do not make medical claims or prescribe medication, supplements, rehabilitation, or extreme diets.

## UI direction
Create a premium wellness interface, not a neon AI dashboard.

- Background: `#F5F7F2`
- Surface: `#FFFFFF`
- Primary: `#166534`
- Accent: `#84CC16`
- Text: `#18201B`
- Muted text: `#6B746D`
- Border: `#E4E8E2`
- Radius: 12-16px
- Use subtle borders and light shadows.
- Use generous spacing and clear hierarchy.
- Avoid excessive purple, blue, glassmorphism, and giant empty hero sections.

## Core data tables
Use only:
- `profiles`
- `plans`
- `check_ins`

Generated workout and meal plans may be stored as JSONB for speed.

## Required Express endpoints
- `GET /api/health`
- `POST /api/ai/generate-plan`
- `POST /api/ai/adapt-plan`
- `POST /api/ai/coach`

## AI contract
A generated plan must contain:
- `summary`
- `workoutPlan` with all seven days
- `mealPlan` with all seven days
- `adaptationMessage`

A non-rest workout day must include exercises. Meals must respect diet type, allergies, disliked foods, and user preferences. Workouts must respect experience, available equipment, days per week, and duration.

## Definition of done
The project is demo-ready when this sequence works without manual database editing:

`Register -> Onboard -> Generate Plan -> View Workout/Meals -> Submit Check-in -> Adapt Plan -> See Explanation -> View Dashboard/Progress`

## Task workflow
Read `CODEX_START_HERE.md`, then complete task files in `/tasks` in numeric order. Before each task, inspect the repository and skip work already completed. At the end of each task, report:
- files changed
- commands run
- what works
- remaining issues
- next recommended task
