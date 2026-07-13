import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adaptPlan, createFallbackAdaptation } from '../src/ai/adaptPlanService.js'
import { createFallbackPlan } from '../src/ai/fallbackPlan.js'
import { validatePlan } from '../src/ai/planValidator.js'

const profile = { goal: 'Build muscle', experience: 'Beginner', workout_days: 4, workout_duration: 45, workout_environment: 'Home', equipment: ['Dumbbells'], diet_type: 'Vegetarian', allergies: ['Peanuts'], disliked_foods: ['Mushrooms'], cooking_preference: 'Quick and simple' }
const checkIn = { energy: 2, sleep_hours: 5, sleep_quality: 2, soreness: 5, stress: 4, hunger: 3, diet_adherence: 3, readiness_score: 28, workout_completed: false, notes: '' }

test('low-recovery fallback adaptation reduces load and preserves constraints', () => {
  const current = createFallbackPlan(profile)
  const adapted = createFallbackAdaptation(current, checkIn)
  assert.equal(validatePlan(adapted, profile).valid, true)
  assert.equal(adapted.adaptationReasons.length >= 2, true)
  assert.equal(adapted.workoutPlan.filter((day) => !day.isRestDay).length, profile.workout_days)
  assert.equal(adapted.workoutPlan.find((day) => !day.isRestDay).intensity, 'Easy')
  assert.equal(adapted.workoutPlan.find((day) => !day.isRestDay).exercises[0].sets < current.workoutPlan.find((day) => !day.isRestDay).exercises[0].sets, true)
  assert.deepEqual(adapted.mealPlan, current.mealPlan)
})

test('adaptation service returns safe fallback without API key', async () => {
  const result = await adaptPlan(profile, createFallbackPlan(profile), checkIn, { apiKey: '' })
  assert.equal(result.status, 200)
  assert.equal(result.body.source, 'fallback')
  assert.equal(validatePlan(result.body, profile).valid, true)
})

test('adaptation service rejects an incomplete check-in', async () => {
  const result = await adaptPlan(profile, createFallbackPlan(profile), { energy: 2 }, { apiKey: '' })
  assert.equal(result.status, 400)
})
