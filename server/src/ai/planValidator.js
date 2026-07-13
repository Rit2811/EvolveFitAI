export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function validateProfile(profile) {
  const required = ['goal', 'experience', 'workout_environment', 'diet_type', 'cooking_preference']
  if (!profile || required.some((key) => typeof profile[key] !== 'string' || !profile[key].trim())) return 'Profile is incomplete.'
  if (!Number.isInteger(Number(profile.workout_days)) || Number(profile.workout_days) < 1 || Number(profile.workout_days) > 7) return 'Workout days must be between 1 and 7.'
  if (!Number.isFinite(Number(profile.workout_duration)) || Number(profile.workout_duration) < 15 || Number(profile.workout_duration) > 120) return 'Workout duration must be between 15 and 120 minutes.'
  if (!Array.isArray(profile.equipment) || profile.equipment.length === 0) return 'At least one equipment option is required.'
  const selectedDays = profile.workout_day_preferences || []
  if (!Array.isArray(selectedDays) || selectedDays.some((day) => !DAYS.includes(day)) || new Set(selectedDays).size !== selectedDays.length) return 'Preferred workout days are invalid.'
  if (selectedDays.length && selectedDays.length !== Number(profile.workout_days)) return 'Preferred workout days must match the selected days per week.'
  return ''
}

export function validatePlan(plan, profile) {
  const errors = []
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['Plan must be an object.'] }
  if (!nonEmpty(plan.summary)) errors.push('Summary is required.')
  if (!nonEmpty(plan.adaptationMessage)) errors.push('Adaptation message is required.')
  validateDays(plan.workoutPlan, 'workout', errors)
  validateDays(plan.mealPlan, 'meal', errors)

  if (Array.isArray(plan.workoutPlan)) {
    const active = plan.workoutPlan.filter((day) => !day.isRestDay)
    if (active.length !== Number(profile.workout_days)) errors.push('Workout-day count does not match the profile.')
    const selectedDays = profile.workout_day_preferences || []
    if (selectedDays.length && (active.some((day) => !selectedDays.includes(day.day)) || selectedDays.some((day) => !active.find((item) => item.day === day)))) errors.push('Workout schedule does not match the preferred weekdays.')
    for (const day of active) {
      if (!Array.isArray(day.exercises) || day.exercises.length === 0) errors.push(`${day.day || 'Workout day'} needs exercises.`)
      if (!Number.isFinite(Number(day.duration)) || Number(day.duration) > Number(profile.workout_duration)) errors.push(`${day.day || 'Workout day'} exceeds available duration.`)
      for (const exercise of day.exercises || []) {
        if (!nonEmpty(exercise.name) || !nonEmpty(exercise.instruction) || !nonEmpty(String(exercise.reps ?? ''))) errors.push(`${day.day || 'Workout day'} has an incomplete exercise.`)
        if (!equipmentAllowed(exercise.equipment, profile.equipment)) errors.push(`${exercise.name || 'Exercise'} uses unavailable equipment.`)
        for (const avoided of profile.avoided_exercises || []) {
          if (containsPreference(exercise.name, avoided)) errors.push(`Plan contains avoided exercise: ${avoided}.`)
        }
      }
    }
  }

  if (Array.isArray(plan.mealPlan)) {
    for (const meal of plan.mealPlan) {
      for (const field of ['breakfast', 'lunch', 'dinner', 'snack']) if (!nonEmpty(meal[field])) errors.push(`${meal.day || 'Meal day'} is missing ${field}.`)
      if (!Number.isFinite(Number(meal.estimatedCalories)) || !Number.isFinite(Number(meal.estimatedProtein))) errors.push(`${meal.day || 'Meal day'} needs nutrition estimates.`)
    }
  }

  const text = JSON.stringify(plan.mealPlan || []).toLowerCase()
  for (const food of [...(profile.allergies || []), ...(profile.disliked_foods || [])]) {
    const normalized = String(food).trim().toLowerCase()
    if (normalized && text.includes(normalized)) errors.push(`Plan contains excluded food: ${food}.`)
  }
  if (!dietAllowed(text, profile.diet_type)) errors.push('Meal plan does not match the selected diet type.')
  return { valid: errors.length === 0, errors }
}

function validateDays(items, label, errors) {
  if (!Array.isArray(items) || items.length !== 7) { errors.push(`${label} plan must contain seven days.`); return }
  const names = items.map((item) => item?.day)
  if (DAYS.some((day) => names.filter((name) => name === day).length !== 1)) errors.push(`${label} plan must contain every weekday exactly once.`)
}
function equipmentAllowed(value, available) { if (!nonEmpty(value)) return false; const allowed = available.map(normalize); return allowed.includes(normalize(value)) }
function normalize(value) { return String(value).trim().toLowerCase() }
function containsPreference(value, preference) { const needle = normalize(preference); return Boolean(needle && normalize(value).includes(needle)) }
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0 }
function dietAllowed(text, diet) {
  const type = normalize(diet)
  const meat = ['chicken', 'turkey', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'prawn', 'shrimp']
  const animal = [...meat, 'egg', 'eggs', 'milk', 'yogurt', 'paneer', 'cheese', 'dairy', 'honey']
  if (type === 'vegan') return !animal.some((word) => text.includes(word))
  if (type === 'vegetarian') return !meat.some((word) => text.includes(word))
  if (type === 'pescatarian') return !['chicken', 'turkey', 'beef', 'pork', 'lamb'].some((word) => text.includes(word))
  return true
}
