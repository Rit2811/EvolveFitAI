import { DAYS, resolveMealSchedule } from './planValidator.js'

const exercises = {
  Bodyweight: [['Bodyweight squat', '10-12'], ['Incline push-up', '8-12'], ['Glute bridge', '12-15'], ['Dead bug', '8 each side']],
  Dumbbells: [['Dumbbell goblet squat', '10-12'], ['Dumbbell floor press', '10-12'], ['Dumbbell row', '10 each side'], ['Dumbbell Romanian deadlift', '10-12']],
  'Resistance bands': [['Resistance band squat', '12-15'], ['Resistance band row', '12-15'], ['Resistance band press', '10-12'], ['Resistance band pull-apart', '15']],
  Barbell: [['Barbell squat', '6-8'], ['Barbell bench press', '6-8'], ['Barbell row', '8-10'], ['Barbell Romanian deadlift', '8-10']],
  Bench: [['Bench step-up', '10 each side'], ['Bench push-up', '10-12'], ['Bench split squat', '8 each side'], ['Bench hip thrust', '12']],
  'Pull-up bar': [['Assisted pull-up', '5-8'], ['Active hang', '20-30 sec'], ['Scapular pull-up', '8-10'], ['Hanging knee raise', '8-10']],
  'Cardio machine': [['Cardio machine steady effort', '12 minutes'], ['Cardio machine intervals', '6 rounds'], ['Cardio machine easy pace', '10 minutes']],
  Kettlebell: [['Kettlebell goblet squat', '10-12'], ['Kettlebell deadlift', '10-12'], ['Kettlebell row', '10 each side'], ['Kettlebell carry', '30 sec']],
}

export function createFallbackPlan(profile) {
  const equipment = profile.equipment.find((item) => exercises[item]) || 'Bodyweight'
  const movementList = personalizeExercises(exercises[equipment] || exercises.Bodyweight, profile)
  const activeDays = Number(profile.workout_days)
  const scheduledDays = new Set(resolveWorkoutDays(profile.workout_day_preferences, activeDays))
  const workoutPlan = DAYS.map((day, index) => {
    const isRestDay = !scheduledDays.has(day)
    return isRestDay
      ? { day, title: 'Recovery day', type: 'Recovery', duration: 0, intensity: 'Easy', isRestDay: true, exercises: [] }
      : { day, title: index % 2 ? 'Full-body foundations' : 'Strength and movement', type: 'Strength', duration: Number(profile.workout_duration), intensity: profile.experience === 'Beginner' ? 'Easy to moderate' : 'Moderate', isRestDay: false, exercises: movementList.slice(0, 4).map(([name, reps]) => ({ name, equipment, sets: profile.experience === 'Beginner' ? 2 : 3, reps, restSeconds: 60, instruction: 'Move with control and stop the set if form starts to change.' })) }
  })
  const meals = chooseMeals(profile)
  const mealSchedule = resolveMealSchedule(profile)
  return {
    summary: `${activeDays} achievable training days with ${profile.diet_type.toLowerCase()} meals matched to your real daily schedule.`,
    workoutPlan,
    mealPlan: DAYS.map((day, index) => ({ day, meals: mealSchedule.map((slot, slotIndex) => ({ label: slot.name, time: slot.time, food: mealForSlot(slot, meals[index % meals.length], slotIndex) })), estimatedCalories: 2000 + (index % 3) * 100, estimatedProtein: 90 + (index % 3) * 10 })),
    adaptationMessage: 'Initial plan created from your profile and preferences.',
    adaptationReasons: [],
  }
}

function chooseMeals(profile) {
  const excluded = [...(profile.allergies || []), ...(profile.disliked_foods || [])].map((item) => String(item).toLowerCase())
  const type = String(profile.diet_type).toLowerCase()
  const baseSets = type === 'vegan' ? veganMeals : type === 'vegetarian' ? vegetarianMeals : type === 'pescatarian' ? pescatarianMeals : mixedMeals
  const sets = baseSets
  const preferred = (profile.preferred_foods || []).map((item) => String(item).toLowerCase()).filter(Boolean)
  const safe = sets.filter((set) => !excluded.some((food) => JSON.stringify(set).toLowerCase().includes(food))).sort((a, b) => preferenceScore(b, preferred) - preferenceScore(a, preferred))
  if (safe.length) return safe
  return [{ breakfast: 'Seasonal fruit with plain oats', lunch: 'Rice with mixed vegetables', dinner: 'Potato and vegetable stew with flatbread', snack: 'Fresh cucumber and carrot slices' }]
}

function mealForSlot(slot, template, index) {
  const name = String(slot.name).toLowerCase()
  if (name.includes('breakfast') || name === 'brunch') return template.breakfast
  if (name.includes('lunch')) return template.lunch
  if (name.includes('dinner')) return template.dinner
  if (name.includes('workout')) return index % 2 ? template.lunch : template.snack
  if (name.includes('snack')) return template.snack
  return [template.breakfast, template.lunch, template.dinner, template.snack][index % 4]
}

function personalizeExercises(movements, profile) {
  const avoided = (profile.avoided_exercises || []).map(normalize).filter(Boolean)
  const preferred = (profile.preferred_exercises || []).map(normalize).filter(Boolean)
  const safe = movements.filter(([name]) => !avoided.some((item) => normalize(name).includes(item)))
  const available = safe.length ? safe : movements
  return [...available].sort(([left], [right]) => preferenceMatch(right, preferred) - preferenceMatch(left, preferred))
}

function defaultWorkoutDays(count) {
  const schedules = {
    1: ['Wednesday'],
    2: ['Tuesday', 'Friday'],
    3: ['Monday', 'Wednesday', 'Saturday'],
    4: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    5: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
    6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    7: DAYS,
  }
  return schedules[count] || DAYS.slice(0, count)
}

function resolveWorkoutDays(values, count) {
  const preferred = Array.isArray(values) ? DAYS.filter((day) => values.includes(day)) : []
  const balanced = defaultWorkoutDays(count)
  const candidates = [
    ...balanced.filter((day) => preferred.includes(day)),
    ...preferred,
    ...balanced,
    ...DAYS,
  ]
  return [...new Set(candidates)].slice(0, count)
}

function preferenceScore(meal, preferred) { const text = JSON.stringify(meal).toLowerCase(); return preferred.filter((item) => text.includes(item)).length }
function preferenceMatch(name, preferred) { const value = normalize(name); return preferred.some((item) => value.includes(item) || item.includes(value)) ? 1 : 0 }
function normalize(value) { return String(value).trim().toLowerCase() }

const veganMeals = [
  { breakfast: 'Cinnamon oats with banana and pumpkin seeds', lunch: 'Chickpea rice bowl with roasted vegetables', dinner: 'Lentil dal with rice and spinach', snack: 'Apple with roasted chickpeas' },
  { breakfast: 'Vegetable poha with lime', lunch: 'Kidney bean wrap with crunchy salad', dinner: 'Tofu vegetable stir-fry with rice', snack: 'Fresh fruit with sunflower seeds' },
]
const vegetarianMeals = [
  { breakfast: 'Oats with banana and yogurt', lunch: 'Paneer rice bowl with vegetables', dinner: 'Dal with roti and mixed vegetables', snack: 'Yogurt with seasonal fruit' },
  { breakfast: 'Vegetable poha with a glass of milk', lunch: 'Chickpea wrap with cucumber salad', dinner: 'Kidney bean curry with rice', snack: 'Cottage cheese with fruit' },
]
const pescatarianMeals = [
  { breakfast: 'Oats with berries and yogurt', lunch: 'Grilled fish rice bowl with vegetables', dinner: 'Lentil soup with flatbread and salad', snack: 'Fruit with pumpkin seeds' },
  { breakfast: 'Vegetable omelette with toast', lunch: 'Tuna and potato salad bowl', dinner: 'Chickpea curry with rice', snack: 'Yogurt with fruit' },
]
const mixedMeals = [
  { breakfast: 'Oats with banana and yogurt', lunch: 'Chicken rice bowl with vegetables', dinner: 'Dal with roti and mixed vegetables', snack: 'Fruit with pumpkin seeds' },
  { breakfast: 'Vegetable omelette with toast', lunch: 'Turkey wrap with cucumber salad', dinner: 'Kidney bean curry with rice', snack: 'Yogurt with fruit' },
]
