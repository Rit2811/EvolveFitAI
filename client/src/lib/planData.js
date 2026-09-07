const PROFILE_PLAN_FIELDS = [
  'age', 'gender', 'height_cm', 'weight_kg', 'goal', 'experience', 'workout_days', 'workout_duration',
  'workout_environment', 'equipment', 'workout_day_preferences', 'preferred_exercises', 'avoided_exercises',
  'diet_type', 'allergies', 'disliked_foods', 'preferred_foods', 'meal_schedule',
]

export function planProfileSnapshot(profile = {}) {
  return Object.fromEntries(PROFILE_PLAN_FIELDS.map((key) => [key, normalize(profile[key])]))
}

export function planMatchesProfile(planRow, profile) {
  if (!planRow?.profile_snapshot) return false
  return JSON.stringify(planRow.profile_snapshot) === JSON.stringify(planProfileSnapshot(profile))
}

export function generatedPlanRow(generated, profile, version = 1) {
  return {
    workout_plan: generated.workoutPlan,
    meal_plan: generated.mealPlan,
    summary: generated.summary,
    adaptation_message: generated.adaptationMessage,
    adaptation_reasons: generated.adaptationReasons || [],
    profile_snapshot: planProfileSnapshot(profile),
    version,
    created_at: new Date().toISOString(),
  }
}

export function planFromRow(row) {
  return {
    summary: row.summary,
    workoutPlan: row.workout_plan,
    mealPlan: (row.meal_plan || []).map(normalizeMealDay),
    adaptationMessage: row.adaptation_message,
    adaptationReasons: row.adaptation_reasons,
    version: row.version,
    createdAt: row.created_at,
  }
}

function normalizeMealDay(day) {
  if (Array.isArray(day.meals)) return day
  const legacy = [
    ['Breakfast', '08:00', day.breakfast],
    ['Lunch', '13:00', day.lunch],
    ['Afternoon snack', '16:30', day.snack],
    ['Dinner', '19:30', day.dinner],
  ].filter(([, , food]) => food && food !== 'No planned snack').map(([label, time, food]) => ({ label, time, food }))
  return { day: day.day, meals: legacy, estimatedCalories: day.estimatedCalories, estimatedProtein: day.estimatedProtein }
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]))
  return value ?? null
}
