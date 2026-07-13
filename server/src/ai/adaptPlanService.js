import { generateGeminiText, hasGeminiKey } from './geminiClient.js'
import { parsePlan, sanitizePlanExplanations } from './geminiPlanService.js'
import { planResponseSchema } from './planSchema.js'
import { validatePlan, validateProfile } from './planValidator.js'

export async function adaptPlan(profile, currentPlan, checkIn, options = {}) {
  const inputError = validateInputs(profile, currentPlan, checkIn)
  if (inputError) return { status: 400, body: { error: inputError } }
  const fallback = () => ({ status: 200, body: { ...createFallbackAdaptation(currentPlan, checkIn), source: 'fallback' } })
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY
  if (!hasGeminiKey(apiKey)) return fallback()
  try {
    const content = await generateGeminiText({ systemInstruction: adaptationPrompt, contents: JSON.stringify({ profile, currentPlan, checkIn }), json: true, schema: planResponseSchema, temperature: 0.25, maxOutputTokens: 16000 }, { ...options, apiKey })
    const plan = sanitizePlanExplanations(parsePlan(content), profile)
    const validation = validatePlan(plan, profile)
    if (!validation.valid || !validReasons(plan.adaptationReasons)) { options.onValidationFailure?.(validation.errors); return fallback() }
    return { status: 200, body: { ...plan, source: 'gemini' } }
  } catch (error) { options.onError?.(error); return fallback() }
}

export function createFallbackAdaptation(currentPlan, checkIn) {
  const plan = structuredClone(currentPlan)
  const lowRecovery = checkIn.sleep_hours < 6 || checkIn.energy <= 2 || checkIn.soreness >= 4 || checkIn.stress >= 4
  const reasons = []
  if (checkIn.sleep_hours < 6 || checkIn.sleep_quality <= 2) reasons.push('Short or low-quality sleep called for a lighter training load.')
  if (checkIn.soreness >= 4) reasons.push('High soreness led to fewer sets and lower intensity.')
  if (checkIn.energy <= 2) reasons.push('Low energy shifted the week toward manageable sessions.')
  if (checkIn.stress >= 4) reasons.push('Higher stress means avoiding maximal effort this week.')
  if (checkIn.diet_adherence <= 2) reasons.push('Meals remain familiar and simple to support consistency.')
  if (!reasons.length) reasons.push('Recovery and adherence support a small, conservative progression.', 'Your schedule and hard preferences remain unchanged.')
  if (reasons.length === 1) reasons.push('Equipment and dietary constraints remain unchanged.')

  plan.workoutPlan = plan.workoutPlan.map((day) => {
    if (day.isRestDay) return day
    if (lowRecovery) return { ...day, duration: Math.max(15, Math.round(Number(day.duration) * 0.75)), intensity: 'Easy', title: `${day.title} — reduced load`, exercises: day.exercises.map((exercise) => ({ ...exercise, sets: Math.max(1, Number(exercise.sets) - 1), instruction: 'Use a comfortable pace and stop well before fatigue changes your form.' })) }
    return { ...day, exercises: day.exercises.map((exercise, index) => index === 0 ? { ...exercise, sets: Math.min(Number(exercise.sets) + 1, 5) } : exercise) }
  })
  plan.summary = lowRecovery ? 'A lower-load week that protects consistency while recovery catches up.' : 'A small progression that keeps the established weekly structure and constraints.'
  plan.adaptationMessage = lowRecovery ? 'Your plan was lightened to match today’s recovery signals.' : 'Your plan received a small progression based on steady recovery.'
  plan.adaptationReasons = reasons.slice(0, 4)
  return plan
}

function validateInputs(profile, currentPlan, checkIn) {
  const profileError = validateProfile(profile)
  if (profileError) return profileError
  if (!validatePlan(currentPlan, profile).valid) return 'Current plan is invalid.'
  const fields = ['energy', 'sleep_hours', 'sleep_quality', 'soreness', 'stress', 'hunger', 'diet_adherence', 'readiness_score']
  if (!checkIn || fields.some((field) => !Number.isFinite(Number(checkIn[field])))) return 'Check-in is incomplete.'
  if (['energy', 'sleep_quality', 'soreness', 'stress', 'hunger', 'diet_adherence'].some((field) => Number(checkIn[field]) < 1 || Number(checkIn[field]) > 5)) return 'Check-in ratings must be between 1 and 5.'
  return ''
}
function validReasons(reasons) { return Array.isArray(reasons) && reasons.length >= 2 && reasons.length <= 4 && reasons.every((reason) => typeof reason === 'string' && reason.trim()) }

const adaptationPrompt = `Adapt a seven-day general wellness plan using the profile, currentPlan, and checkIn. Return JSON only with summary, workoutPlan, mealPlan, adaptationMessage, adaptationReasons.
Preserve exactly seven named days and the same number of active workout days. Every exercise equipment value must exactly match the profile equipment array. Never exceed workout_duration.
Diet type, allergies, disliked foods, avoided exercises, equipment, selected workout weekdays, and availability are hard constraints. Never mention excluded foods. Preserve preferred foods and exercises where compatible.
High soreness, low sleep/energy, or high stress must reduce sets, duration, intensity, impact, or emphasize recovery. Strong recovery allows only a small progression. Low diet adherence should simplify meals.
Provide 2-4 concise adaptationReasons grounded in the check-in. Do not diagnose, prescribe treatment, recommend supplements, or provide rehabilitation advice.`
