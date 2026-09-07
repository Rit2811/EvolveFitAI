import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createFallbackPlan } from '../src/ai/fallbackPlan.js'
import { generatePlan, parsePlan, sanitizePlanExplanations } from '../src/ai/geminiPlanService.js'
import { validatePlan, validateProfile } from '../src/ai/planValidator.js'
import { createApp } from '../src/app.js'

const profile = { full_name: 'Demo Person', age: 28, gender: 'Prefer not to say', height_cm: 172, weight_kg: 70, goal: 'Build muscle', experience: 'Beginner', workout_days: 4, workout_duration: 45, workout_environment: 'Home', equipment: ['Dumbbells', 'Resistance bands'], diet_type: 'Vegetarian', allergies: ['Peanuts'], disliked_foods: ['Mushrooms'], meal_schedule: [{ name: 'Breakfast', time: '08:00' }, { name: 'Lunch', time: '13:00' }, { name: 'Afternoon snack', time: '16:30' }, { name: 'Dinner', time: '20:00' }] }

test('fallback plan satisfies the complete profile contract', () => {
  const plan = createFallbackPlan(profile)
  const result = validatePlan(plan, profile)
  assert.deepEqual(result.errors, [])
  assert.equal(plan.workoutPlan.length, 7)
  assert.equal(plan.mealPlan.length, 7)
  assert.equal(plan.workoutPlan.filter((day) => !day.isRestDay).length, 4)
})

test('validator rejects incomplete plans', () => {
  const plan = createFallbackPlan(profile)
  plan.mealPlan.pop()
  assert.equal(validatePlan(plan, profile).valid, false)
})

test('fallback respects selected weekdays and avoided exercises', () => {
  const personalized = { ...profile, workout_days: 3, workout_day_preferences: ['Tuesday', 'Thursday', 'Sunday'], preferred_exercises: ['Dumbbell row'], avoided_exercises: ['Goblet squat'], preferred_foods: ['Rice'] }
  const plan = createFallbackPlan(personalized)
  assert.deepEqual(plan.workoutPlan.filter((day) => !day.isRestDay).map((day) => day.day), personalized.workout_day_preferences)
  assert.equal(plan.workoutPlan.flatMap((day) => day.exercises).some((exercise) => /goblet squat/i.test(exercise.name)), false)
  assert.equal(validatePlan(plan, personalized).valid, true)
})

test('profile accepts fewer preferred weekdays than the weekly target', () => {
  const personalized = { ...profile, workout_day_preferences: ['Monday', 'Friday'] }
  assert.equal(validateProfile(personalized), '')
  const plan = createFallbackPlan(personalized)
  const activeDays = plan.workoutPlan.filter((day) => !day.isRestDay).map((day) => day.day)
  assert.equal(personalized.workout_day_preferences.every((day) => activeDays.includes(day)), true)
  assert.equal(validatePlan(plan, personalized).valid, true)
})

test('meal plan matches custom slot names and times', () => {
  const customSchedule = { ...profile, meal_schedule: [{ name: 'Brunch', time: '10:30' }, { name: 'Pre-workout meal', time: '16:00' }, { name: 'Dinner', time: '20:30' }] }
  const plan = createFallbackPlan(customSchedule)
  assert.deepEqual(plan.mealPlan[0].meals.map(({ label, time }) => ({ label, time })), customSchedule.meal_schedule.map(({ name: label, time }) => ({ label, time })))
  assert.equal(validatePlan(plan, customSchedule).valid, true)
})

test('fallback supports every bounded profile option', () => {
  const diets = ['No dietary restrictions', 'Vegetarian', 'Vegan', 'Pescatarian']
  const schedules = Array.from({ length: 5 }, (_, scheduleIndex) => Array.from({ length: scheduleIndex + 2 }, (_, slotIndex) => ({ name: `Meal ${slotIndex + 1}`, time: `${String(7 + slotIndex * 3).padStart(2, '0')}:00` })))
  for (const workoutDays of [1, 2, 3, 4, 5, 6]) {
    for (const mealSchedule of schedules) {
      for (const dietType of diets) {
        const optionProfile = { ...profile, workout_days: workoutDays, meal_schedule: mealSchedule, diet_type: dietType, workout_day_preferences: ['Monday', 'Wednesday', 'Friday', 'Sunday'] }
        const plan = createFallbackPlan(optionProfile)
        assert.equal(validateProfile(optionProfile), '')
        assert.equal(validatePlan(plan, optionProfile).valid, true, `${workoutDays}/${mealSchedule.length}/${dietType}`)
      }
    }
  }
})

test('parser accepts fenced JSON', () => assert.deepEqual(parsePlan('```json\n{"summary":"ok"}\n```'), { summary: 'ok' }))

test('explanations do not repeat excluded foods while meal safety remains validated', () => {
  const plan = createFallbackPlan(profile)
  plan.summary = 'A peanut-free week without mushrooms.'
  const sanitized = sanitizePlanExplanations(plan, profile)
  assert.doesNotMatch(sanitized.summary, /peanut|mushroom/i)
  assert.equal(validatePlan(sanitized, profile).valid, true)
})

test('generation accepts a valid Gemini response', async () => {
  const expected = createFallbackPlan(profile)
  const client = { models: { generateContent: async () => ({ text: JSON.stringify(expected) }) } }
  const result = await generatePlan(profile, { apiKey: 'test-key', client })
  assert.equal(result.body.source, 'gemini')
  assert.equal(validatePlan(result.body, profile).valid, true)
})

test('generate endpoint returns fallback without an API key', async (context) => {
  const previousKey = process.env.GEMINI_API_KEY
  delete process.env.GEMINI_API_KEY
  const server = createApp({ requireAiAuth: false }).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  context.after(() => { process.env.GEMINI_API_KEY = previousKey; server.close() })
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ai/generate-plan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile }) })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.source, 'fallback')
  assert.equal(validatePlan(body, profile).valid, true)
})

let injectedServer
let injectedUrl
before(() => new Promise((resolve) => { injectedServer = createApp({ planGenerator: async () => ({ status: 400, body: { error: 'Profile is incomplete.' } }), requireAiAuth: false }).listen(0, '127.0.0.1', () => { injectedUrl = `http://127.0.0.1:${injectedServer.address().port}`; resolve() }) }))
after(() => new Promise((resolve) => injectedServer.close(resolve)))
test('generate endpoint forwards validation errors', async () => { const response = await fetch(`${injectedUrl}/api/ai/generate-plan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); assert.equal(response.status, 400) })
