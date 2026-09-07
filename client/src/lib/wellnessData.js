export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function checkInDate(checkIn) {
  return checkIn?.check_in_date || localDateKey(new Date(checkIn?.created_at))
}

export function sortCheckIns(checkIns = []) {
  return [...checkIns].sort((left, right) => checkInDate(left).localeCompare(checkInDate(right)))
}

export function latestCheckIn(checkIns = []) {
  return sortCheckIns(checkIns).at(-1) || null
}

export function currentWeekDates(reference = new Date()) {
  const monday = new Date(reference)
  monday.setDate(reference.getDate() - ((reference.getDay() + 6) % 7))
  monday.setHours(12, 0, 0, 0)
  return WEEK_DAYS.map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

export function currentWeekCheckIns(checkIns = [], reference = new Date()) {
  const week = new Set(currentWeekDates(reference).map(localDateKey))
  return sortCheckIns(checkIns).filter((item) => week.has(checkInDate(item)))
}

export function dayName(date = new Date()) {
  return WEEK_DAYS[(date.getDay() + 6) % 7]
}

export function planForDay(plan, date = new Date()) {
  const day = dayName(date)
  return {
    day,
    workout: plan?.workout_plan?.find((item) => item.day === day) || null,
    meals: plan?.meal_plan?.find((item) => item.day === day) || null,
  }
}

export function weekSummary(checkIns = [], plan, reference = new Date()) {
  const entries = currentWeekCheckIns(checkIns, reference)
  const completedWorkouts = entries.filter((item) => item.workout_completed).length
  const plannedWorkouts = Array.isArray(plan?.workout_plan) ? plan.workout_plan.filter((item) => !item.isRestDay).length : 0
  return {
    entries,
    loggedDays: entries.length,
    completedWorkouts,
    plannedWorkouts,
    dietAverage: average(entries, 'diet_adherence'),
    readinessAverage: average(entries, 'readiness_score', 0),
  }
}

export function calculateStreak(checkIns = [], reference = new Date()) {
  const dates = new Set(checkIns.map(checkInDate))
  const cursor = new Date(reference)
  cursor.setHours(12, 0, 0, 0)
  if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (dates.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function average(items, key, digits = 1) {
  if (!items.length) return null
  return (items.reduce((sum, item) => sum + Number(item[key]), 0) / items.length).toFixed(digits)
}
