# EvolveFit AI

EvolveFit AI is a capstone fitness and nutrition coach that builds a seven-day plan from a user's profile, records daily recovery and adherence, adapts the active plan, and explains each change.

## Stack

- React, Vite, JavaScript, Tailwind CSS, React Router
- Lucide React and Recharts
- Supabase Auth and PostgreSQL with row-level security
- Node.js, Express, and the Google GenAI SDK

Gemini is called only by Express. The browser receives only the public Supabase anon key.

## Project structure

```text
client/                 React application
server/                 Express API and AI validation/fallback services
supabase/migrations/    profiles, plans, and check_ins schema with RLS
evolvefit_codex_pack/   project documentation and task specifications
```

## Setup

Requirements: Node.js 20 or newer, npm, and a Supabase project.

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Copy `client/.env.example` to `client/.env` and provide:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   VITE_API_URL=http://localhost:3001
   ```

3. Copy `server/.env.example` to `server/.env` and add a Google AI Studio key as `GEMINI_API_KEY`. `GEMINI_MODEL` defaults to `gemini-3.5-flash`. The key is optional because generation, adaptation, and coaching have local demo fallbacks.

4. Apply the SQL files in `supabase/migrations` in numeric order, including `004_plan_preferences.sql`. Do not place a Supabase service-role key in the frontend.

5. In Supabase Auth, enable email/password authentication. For a quick local demo, either disable email confirmation or confirm the demo user's email before signing in.

6. Start both applications:

   ```bash
   npm run dev
   ```

The client runs at `http://localhost:5173`, the API at `http://localhost:3001`, and the health endpoint is `GET /api/health`.

## Useful commands

```bash
npm run lint
npm test
npm run build
npm run verify
npm run release:preflight
npm start
```

`npm run verify` runs lint, tests, and the production build. `npm run release:preflight` checks that the local runtime has its public Supabase configuration and required migrations before a live demo.

## Architecture and safeguards

The browser authenticates with Supabase and reads/writes `profiles`, `plans`, and `check_ins` through user-scoped RLS policies. Express composes prompts, calls Gemini, parses model JSON, validates seven-day output and hard constraints, and returns a profile-aware fallback when Gemini is unavailable or invalid. Adaptation preserves dietary and equipment constraints and uses conservative recovery rules. Coach responses are grounded in the supplied profile, active plan, latest check-in, and recent conversation. Users can keep up to 10 separate browser-local conversations; unanswered pending messages are removed after failure, a one-minute timeout, or the next load after an interrupted request.

Users can personalize preferred workout weekdays, favorite and avoided exercises, preferred foods, food exclusions, equipment, and schedule from onboarding or Profile. A balanced schedule is supplied by default. Daily check-ins produce a concise strengths/improvements report that can be downloaded as a one-page PDF.

EvolveFit AI provides general fitness and nutrition guidance and is not a substitute for medical advice, diagnosis, or professional treatment.

## Demo flow

1. Register and sign in.
2. Complete onboarding with the demo profile: Build muscle, Beginner, four 45-minute home workouts, Dumbbells and Resistance bands, Vegetarian, Peanut allergy.
3. Generate a plan and verify the workout and dietary constraints.
4. Submit a check-in with low sleep, low energy, and high soreness.
5. View the lighter versioned plan and its adaptation reasons.
6. Open Dashboard and Progress.
7. Ask the coach, “Why did my plan change?”
8. Edit Profile and use Regenerate plan to rebuild around updated preferences.

## API

- `GET /api/health`
- `POST /api/ai/generate-plan`
- `POST /api/ai/adapt-plan`
- `POST /api/ai/coach`

## Known demo constraints

- The local fallback is deliberately deterministic and conservative.
- Up to 10 coach conversations persist per user in the current browser and stay synchronized across tabs. Unsent input is not stored, and unanswered messages are removed after failure, timeout, or an interrupted page session.
- Weight history, password reset, notifications, general plan export, and email-verification UI are outside the capstone scope. Daily check-in report PDF export is included.
