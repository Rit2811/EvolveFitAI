create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  age integer not null check (age between 16 and 100),
  gender text not null,
  height_cm numeric not null check (height_cm between 100 and 250),
  weight_kg numeric not null check (weight_kg between 30 and 350),
  goal text not null,
  experience text not null,
  workout_days integer not null check (workout_days between 1 and 7),
  workout_duration integer not null check (workout_duration between 15 and 120),
  workout_environment text not null,
  equipment text[] not null default '{}',
  diet_type text not null,
  allergies text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  meals_per_day integer not null check (meals_per_day between 2 and 6),
  cooking_preference text not null,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can create their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can delete their profile" on public.profiles for delete using (auth.uid() = id);
