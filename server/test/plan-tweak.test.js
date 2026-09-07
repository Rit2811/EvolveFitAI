import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFallbackPlan } from '../src/ai/fallbackPlan.js'
import { fallbackTweak, tweakPlan } from '../src/ai/planTweakService.js'
import { validatePlan } from '../src/ai/planValidator.js'

const profile = { full_name: 'Demo Person', age: 31, gender: 'Prefer not to say', height_cm: 175, weight_kg: 75, goal: 'Improve fitness', experience: 'Intermediate', workout_days: 4, workout_duration: 45, workout_environment: 'Mixed', equipment: ['Bodyweight', 'Dumbbells'], diet_type: 'No dietary restrictions', allergies: [], disliked_foods: [], preferred_foods: ['Rice'], preferred_exercises: ['Dumbbell row'], avoided_exercises: ['Burpee'], meal_schedule: [{ name: 'Brunch', time: '10:00' }, { name: 'Pre-workout meal', time: '16:00' }, { name: 'Dinner', time: '20:00' }] }

test('explicit easier tweak reduces workload and preserves constraints', () => {
  const current = createFallbackPlan(profile)
  const adjusted = fallbackTweak(profile, current, 'Make workouts easier')
  assert.equal(validatePlan(adjusted, profile).valid, true)
  assert.ok(adjusted.workoutPlan.find((day) => !day.isRestDay).duration < current.workoutPlan.find((day) => !day.isRestDay).duration)
  assert.deepEqual(adjusted.mealPlan, current.mealPlan)
})

test('a day-specific tweak changes only the requested day', () => {
  const current = createFallbackPlan(profile)
  const adjusted = fallbackTweak(profile, current, "Make only Monday's workout easier")
  const mondayBefore = current.workoutPlan.find((day) => day.day === 'Monday')
  const mondayAfter = adjusted.workoutPlan.find((day) => day.day === 'Monday')
  assert.ok(mondayAfter.duration < mondayBefore.duration)
  assert.deepEqual(
    adjusted.workoutPlan.filter((day) => day.day !== 'Monday'),
    current.workoutPlan.filter((day) => day.day !== 'Monday'),
  )
  assert.equal(validatePlan(adjusted, profile).valid, true)
})

test('tweak service works without AI and rejects empty requests', async () => {
  const current = createFallbackPlan(profile)
  const adjusted = await tweakPlan(profile, current, 'Shorter sessions please', { apiKey: '' })
  assert.equal(adjusted.status, 200)
  assert.equal(adjusted.body.source, 'fallback')
  assert.equal(validatePlan(adjusted.body, profile).valid, true)
  assert.equal((await tweakPlan(profile, current, '', { apiKey: '' })).status, 400)
})
