# Database and API

## Supabase tables

### profiles
- `id uuid primary key references auth.users(id)`
- `full_name text`
- `age integer`
- `gender text`
- `height_cm numeric`
- `weight_kg numeric`
- `goal text`
- `experience text`
- `workout_days integer`
- `workout_duration integer`
- `workout_environment text`
- `equipment text[]`
- `diet_type text`
- `allergies text[]`
- `disliked_foods text[]`
- `preferred_foods text[]`
- `preferred_exercises text[]`
- `avoided_exercises text[]`
- `workout_day_preferences text[]`
- `meals_per_day integer`
- `cooking_preference text`
- `onboarding_completed boolean`
- timestamps

### plans
- `id bigint identity primary key`
- `user_id uuid references auth.users(id)`
- `workout_plan jsonb`
- `meal_plan jsonb`
- `summary text`
- `adaptation_message text`
- `adaptation_reasons jsonb`
- `version integer`
- `is_active boolean`
- `created_at timestamptz`

### check_ins
- `id bigint identity primary key`
- `user_id uuid references auth.users(id)`
- `energy integer`
- `sleep_hours numeric`
- `sleep_quality integer`
- `soreness integer`
- `stress integer`
- `hunger integer`
- `workout_completed boolean`
- `diet_adherence integer`
- `readiness_score integer`
- `notes text`
- `created_at timestamptz`

## RLS rule
Every user can select, insert, update, and delete only rows where the row's user identifier equals `auth.uid()`.

## Express routes
### GET `/api/health`
Returns `{ "status": "ok" }`.

### POST `/api/ai/generate-plan`
Input: profile data.
Output: complete validated plan.

### POST `/api/ai/adapt-plan`
Input: profile, current plan, latest check-in.
Output: complete new plan with reasons.

### POST `/api/ai/coach`
Input: message, profile, active plan, latest check-in.
Output: short grounded guidance.

## Environment variables
Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

Backend:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `PORT`
- `CLIENT_URL`

Never commit real secrets. Include `.env.example` files.
