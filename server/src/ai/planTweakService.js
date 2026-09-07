import { createFallbackPlan } from './fallbackPlan.js'
import { generateGeminiText, hasGeminiKey } from './geminiClient.js'
import { parsePlan, sanitizePlanExplanations } from './geminiPlanService.js'
import { planResponseSchema } from './planSchema.js'
import { DAYS, validatePlan, validateProfile } from './planValidator.js'

export async function tweakPlan(profile, currentPlan, request, options = {}) {
  const profileIssue = validateProfile(profile)
  if (profileIssue) return { status: 400, body: { error: profileIssue } }
  if (!validatePlan(currentPlan, profile).valid) return { status: 400, body: { error: 'Current plan is invalid.' } }
  const instruction = String(request || '').trim()
  if (instruction.length < 3 || instruction.length > 500) return { status: 400, body: { error: 'Describe the adjustment in 3–500 characters.' } }
  const fallback = () => ({ status: 200, body: { ...fallbackTweak(profile, currentPlan, instruction), source: 'fallback' } })
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY
  if (!hasGeminiKey(apiKey)) return fallback()
  try {
    const content = await generateGeminiText({ systemInstruction: tweakPrompt, contents: JSON.stringify({ profile, currentPlan, requestedAdjustment: instruction }), json: true, schema: planResponseSchema, temperature: 0.25, maxOutputTokens: 16000 }, { ...options, apiKey })
    const plan = sanitizePlanExplanations(parsePlan(content), profile)
    const validation = validatePlan(plan, profile)
    if (!validation.valid) { options.onValidationFailure?.(validation.errors); return fallback() }
    return { status: 200, body: { ...plan, source: 'gemini' } }
  } catch (error) { options.onError?.(error); return fallback() }
}

export function fallbackTweak(profile, currentPlan, instruction) {
  const request = instruction.toLowerCase()
  const requestedDays = new Set(DAYS.filter((day) => new RegExp(`\\b${day.toLowerCase()}\\b`).test(request)))
  const appliesTo = (day) => requestedDays.size === 0 || requestedDays.has(day.day)
  const scope = requestedDays.size ? [...requestedDays].join(' and ') : 'the week'
  let plan = structuredClone(currentPlan)
  let applied = 'Refreshed the plan while preserving your schedule and safety constraints.'
  if (/easier|lighter|recovery|less intense/.test(request)) {
    plan.workoutPlan = plan.workoutPlan.map((day) => day.isRestDay || !appliesTo(day) ? day : { ...day, duration: Math.max(15, Math.round(day.duration * 0.8)), intensity: 'Easy to moderate', exercises: day.exercises.map((exercise) => ({ ...exercise, sets: Math.max(1, Number(exercise.sets) - 1) })) })
    applied = `Reduced workout duration and sets for ${scope}.`
  } else if (/shorter|less time|quick/.test(request)) {
    plan.workoutPlan = plan.workoutPlan.map((day) => day.isRestDay || !appliesTo(day) ? day : { ...day, duration: Math.max(15, Math.round(day.duration * 0.7)), exercises: day.exercises.slice(0, Math.max(2, day.exercises.length - 1)) })
    applied = `Shortened the active workout for ${scope} and kept the most useful movements.`
  } else if (/harder|challenge|progress/.test(request)) {
    plan.workoutPlan = plan.workoutPlan.map((day) => day.isRestDay || !appliesTo(day) ? day : { ...day, intensity: 'Moderate to challenging', exercises: day.exercises.map((exercise, index) => index < 2 ? { ...exercise, sets: Math.min(5, Number(exercise.sets) + 1) } : exercise) })
    applied = `Added one controlled set to the first two movements for ${scope}.`
  } else if (/exercise|movement/.test(request) && /refresh|replace|swap|favorite/.test(request)) {
    const refreshed = createFallbackPlan(profile)
    plan.workoutPlan = plan.workoutPlan.map((day) => appliesTo(day) ? refreshed.workoutPlan.find((candidate) => candidate.day === day.day) : day)
    applied = `Refreshed the exercises for ${scope} from your saved profile.`
  } else if (/meal|food/.test(request) && /refresh|replace|swap|favorite/.test(request)) {
    const refreshed = createFallbackPlan(profile)
    plan.mealPlan = plan.mealPlan.map((day) => appliesTo(day) ? refreshed.mealPlan.find((candidate) => candidate.day === day.day) : day)
    applied = `Refreshed the meals for ${scope} from your saved profile.`
  } else {
    plan = createFallbackPlan(profile)
    applied = 'Rebuilt the week from your latest favorites, exclusions, schedule, and equipment.'
  }
  plan.summary = applied
  plan.adaptationMessage = applied
  plan.adaptationReasons = ['You requested this change directly.', 'Your workout availability, meal schedule, equipment, diet, and exclusions remain protected.']
  return plan
}

const tweakPrompt = `Adjust a seven-day general-wellness plan only because the user explicitly requested a change. Return JSON only with summary, workoutPlan, mealPlan, adaptationMessage, adaptationReasons.
Preserve Monday through Sunday, exactly workout_days active days, the profile meal_schedule labels and times, and every hard profile constraint. Never exceed workout_duration. Exercise equipment must exactly match an available equipment string.
Never include allergies, disliked_foods, or avoided_exercises. Favor preferred_foods and preferred_exercises. Make the smallest useful change that addresses requestedAdjustment and keeps the plan practical.
Provide 2–4 concise adaptationReasons. Do not diagnose, prescribe treatment, recommend supplements, or provide rehabilitation advice.`
