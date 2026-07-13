alter table public.profiles
  add column if not exists preferred_foods text[] not null default '{}',
  add column if not exists preferred_exercises text[] not null default '{}',
  add column if not exists avoided_exercises text[] not null default '{}',
  add column if not exists workout_day_preferences text[] not null default '{}';

alter table public.profiles
  drop constraint if exists profiles_workout_day_preferences_check,
  add constraint profiles_workout_day_preferences_check check (
    cardinality(workout_day_preferences) = 0
    or (
      cardinality(workout_day_preferences) = workout_days
      and workout_day_preferences <@ array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']::text[]
    )
  );
