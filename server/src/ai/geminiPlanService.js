import { generateGeminiText, hasGeminiKey } from './geminiClient.js'
import { createFallbackPlan } from './fallbackPlan.js'
import { planResponseSchema } from './planSchema.js'
import { validatePlan, validateProfile } from './planValidator.js'

export async function generatePlan(profile, options = {}) {
  const profileIssue = validateProfile(profile)
  if (profileIssue) return { status: 400, body: { error: profileIssue } }
  const fallback = () => ({ status: 200, body: { ...createFallbackPlan(profile), source: 'fallback' } })
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY
  if (!hasGeminiKey(apiKey)) return fallback()

  try {
    const content = await generateGeminiText({
      systemInstruction: systemPrompt,
      contents: `Create the plan for this profile:\n${JSON.stringify(profile)}`,
      json: true,
      schema: planResponseSchema,
      maxOutputTokens: 16000,
    }, { ...options, apiKey })
    const plan = sanitizePlanExplanations(parsePlan(content), profile)
    const validation = validatePlan(plan, profile)
    if (!validation.valid) { options.onValidationFailure?.(validation.errors); return fallback() }
    return { status: 200, body: { ...plan, source: 'gemini' } }
  } catch (error) {
    options.onError?.(error)
    return fallback()
  }
}

export function parsePlan(content) {
  if (typeof content !== 'string' || !content.trim()) throw new Error('Model returned no content.')
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

export function sanitizePlanExplanations(plan, profile) {
  const excluded = [...(profile.allergies || []), ...(profile.disliked_foods || [])].map((item) => String(item).trim()).filter(Boolean)
  const aliases = excluded.flatMap((item) => [item, /s$/i.test(item) && !/(ss|us|is|sh)$/i.test(item) ? item.slice(0, -1) : null]).filter(Boolean).sort((left, right) => right.length - left.length)
  const clean = (value) => aliases.reduce((text, item) => text.replace(new RegExp(escapeRegExp(item), 'gi'), 'excluded food'), String(value || ''))
  return { ...plan, summary: clean(plan.summary), adaptationMessage: clean(plan.adaptationMessage), adaptationReasons: Array.isArray(plan.adaptationReasons) ? plan.adaptationReasons.map(clean) : plan.adaptationReasons }
}

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

const systemPrompt = `You create conservative general-wellness workout and meal plans. Return JSON only.
Required keys: summary, workoutPlan, mealPlan, adaptationMessage, adaptationReasons.
workoutPlan and mealPlan must each contain Monday through Sunday exactly once.
The number of non-rest days must exactly equal workout_days. Each non-rest day needs title, type, duration, intensity, isRestDay=false, and exercises.
Each exercise needs name, equipment, sets, reps, restSeconds, instruction. equipment must exactly match one string from the profile equipment array. Never exceed workout_duration.
Each rest day has isRestDay=true and an empty exercises array.
Each meal day needs a meals array plus estimatedCalories and estimatedProtein. Match profile.meal_schedule exactly: preserve every slot name and time in order, and provide one practical food string for each slot.
Strictly respect diet_type. Never mention or include any allergy or disliked_food, even in warnings or substitutions.
Treat avoided_exercises as hard exclusions. workout_day_preferences is optional: if it contains at least workout_days entries, place active workouts only on those preferred days; if it contains fewer, use every preferred day and distribute the remaining sessions across the week for recovery.
Favor preferred_foods and preferred_exercises when they are compatible with the diet, allergies, equipment, experience, and safety constraints; they are preferences, not permission to violate a hard constraint.
Keep guidance appropriate to experience and environment. Do not prescribe supplements, medication, extreme dieting, diagnosis, or rehabilitation.
adaptationMessage should say the initial plan was created from the profile. adaptationReasons must be an empty array.`
