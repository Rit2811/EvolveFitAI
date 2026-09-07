export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function validateProfile(profile) {
  const required = ['full_name', 'gender', 'goal', 'experience', 'workout_environment', 'diet_type']
  if (!profile || required.some((key) => typeof profile[key] !== 'string' || !profile[key].trim())) return 'Profile is incomplete.'
  if (profile.full_name.trim().length < 2) return 'Name is too short.'
  if (!inRange(profile.age, 18, 100) || !inRange(profile.height_cm, 100, 250) || !inRange(profile.weight_kg, 30, 350)) return 'Age, height, or weight is outside the supported range.'
  if (!['Woman', 'Man', 'Non-binary', 'Prefer not to say'].includes(profile.gender)) return 'Gender selection is invalid.'
  if (!['Build muscle', 'Lose fat', 'Improve fitness', 'Maintain wellness'].includes(profile.goal)) return 'Goal is invalid.'
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(profile.experience)) return 'Training experience is invalid.'
  if (!['Home', 'Gym', 'Outdoors', 'Mixed'].includes(profile.workout_environment)) return 'Training location is invalid.'
  if (!['No dietary restrictions', 'Vegetarian', 'Vegan', 'Pescatarian'].includes(profile.diet_type)) return 'Diet pattern is invalid.'
  if (!Number.isInteger(Number(profile.workout_days)) || Number(profile.workout_days) < 1 || Number(profile.workout_days) > 6) return 'Weekly workout target must be between 1 and 6.'
  if (!Number.isFinite(Number(profile.workout_duration)) || Number(profile.workout_duration) < 15 || Number(profile.workout_duration) > 90) return 'Workout duration must be between 15 and 90 minutes.'
  const mealSchedule = resolveMealSchedule(profile)
  if (mealSchedule.length < 2 || mealSchedule.length > 6 || mealSchedule.some((slot, index) => typeof slot.name !== 'string' || !slot.name.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time) || (index > 0 && slot.time <= mealSchedule[index - 1].time))) return 'Daily meal schedule is invalid or not in chronological order.'
  if (!Array.isArray(profile.equipment) || profile.equipment.length === 0) return 'At least one equipment option is required.'
  const allowedEquipment = ['Bodyweight', 'Dumbbells', 'Resistance bands', 'Barbell', 'Bench', 'Pull-up bar', 'Cardio machine', 'Kettlebell']
  if (profile.equipment.some((item) => !allowedEquipment.includes(item)) || new Set(profile.equipment).size !== profile.equipment.length) return 'Equipment selection is invalid.'
  const selectedDays = profile.workout_day_preferences || []
  if (!Array.isArray(selectedDays) || selectedDays.some((day) => !DAYS.includes(day)) || new Set(selectedDays).size !== selectedDays.length) return 'Preferred workout days are invalid.'
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
    const activeNames = active.map((day) => day.day)
    if (selectedDays.length >= active.length && activeNames.some((day) => !selectedDays.includes(day))) errors.push('Workout schedule does not prioritize the available weekdays.')
    if (selectedDays.length < active.length && selectedDays.some((day) => !activeNames.includes(day))) errors.push('Workout schedule omitted an available weekday.')
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
      const expected = resolveMealSchedule(profile)
      if (!Array.isArray(meal.meals) || meal.meals.length !== expected.length) errors.push(`${meal.day || 'Meal day'} does not match the meal schedule.`)
      for (const [index, slot] of (meal.meals || []).entries()) {
        if (!nonEmpty(slot.label) || !nonEmpty(slot.time) || !nonEmpty(slot.food)) errors.push(`${meal.day || 'Meal day'} has an incomplete meal slot.`)
        if (expected[index] && (normalize(slot.label) !== normalize(expected[index].name) || slot.time !== expected[index].time)) errors.push(`${meal.day || 'Meal day'} changed the requested meal schedule.`)
      }
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

export function resolveMealSchedule(profile) {
  if (Array.isArray(profile?.meal_schedule) && profile.meal_schedule.length) return profile.meal_schedule
  const legacy = [{ name: 'Breakfast', time: '08:00' }, { name: 'Lunch', time: '13:00' }, { name: 'Dinner', time: '19:30' }]
  if (Number(profile?.meals_per_day) >= 4) legacy.splice(2, 0, { name: 'Afternoon snack', time: '16:30' })
  return legacy
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
function inRange(value, min, max) { const number = Number(value); return Number.isFinite(number) && number >= min && number <= max }
function dietAllowed(text, diet) {
  const type = normalize(diet)
  const meat = ['chicken', 'turkey', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'prawn', 'shrimp']
  const animal = [...meat, 'egg', 'eggs', 'milk', 'yogurt', 'paneer', 'cheese', 'dairy', 'honey']
  if (type === 'vegan') return !animal.some((word) => text.includes(word))
  if (type === 'vegetarian') return !meat.some((word) => text.includes(word))
  if (type === 'pescatarian') return !['chicken', 'turkey', 'beef', 'pork', 'lamb'].some((word) => text.includes(word))
  return true
}
