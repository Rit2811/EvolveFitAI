import { generateGeminiText, hasGeminiKey } from './geminiClient.js'

export async function answerCoach(message, profile, activePlan, latestCheckIn, options = {}) {
  if (typeof message !== 'string' || message.trim().length < 2 || message.length > 500) return { status: 400, body: { error: 'Ask a question between 2 and 500 characters.' } }
  if (!profile || !profile.goal) return { status: 400, body: { error: 'A completed profile is required.' } }
  const history = sanitizeHistory(options.history)
  const fallback = () => ({ status: 200, body: { answer: fallbackAnswer(message, profile, activePlan, latestCheckIn, history), source: 'fallback' } })
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY
  if (!hasGeminiKey(apiKey)) return fallback()
  try {
    const answer = await generateGeminiText({ systemInstruction: coachPrompt, contents: JSON.stringify({ question: message, conversationHistory: history, profile, activePlan, latestCheckIn }), maxOutputTokens: 1200 }, { ...options, apiKey })
    if (!answer || answer.length > 8000) return fallback()
    return { status: 200, body: { answer, source: 'gemini' } }
  } catch { return fallback() }
}

export function fallbackAnswer(message, profile, plan, checkIn, history = []) {
  const previousQuestion = [...history].reverse().find((item) => item.role === 'user')?.content || ''
  const needsContext = /^(and|but|why|how|what about|explain|tell me more|can you expand)\b/i.test(message.trim())
  const question = `${needsContext ? previousQuestion : ''} ${message}`.toLowerCase()
  if (/injur|pain|medical|diagnos|medication|rehab/.test(question)) return 'I can only help with general wellness guidance. For pain, injury, diagnosis, treatment, or rehabilitation, pause the activity and speak with a qualified healthcare professional.'
  if (/changed|adapt|plan change/.test(question)) {
    if (!plan) return 'There is no active plan to explain yet. Generate your weekly plan first, then I can explain how it reflects your profile.'
    const reasons = plan.adaptationReasons?.length ? ` The main reasons were: ${plan.adaptationReasons.join(' ')}` : ''
    return `${plan.adaptationMessage || 'Your plan reflects your current profile and preferences.'}${reasons}`
  }
  if (/today|workout|train/.test(question)) {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date())
    const workout = plan?.workoutPlan?.find((item) => item.day === day)
    if (!workout) return 'Your active plan does not include a workout for today. Open the weekly plan to choose the most suitable scheduled session.'
    if (workout.isRestDay) return 'Today is an intentional recovery day. Comfortable everyday movement is optional; the priority is arriving fresh for the next planned session.'
    return `Today’s plan is ${workout.title}, about ${workout.duration} minutes at ${workout.intensity.toLowerCase()} intensity. Use only your listed equipment and keep the technique cues from the plan.`
  }
  if (/meal|eat|food|nutrition/.test(question)) {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date())
    const meals = plan?.mealPlan?.find((item) => item.day === day)
    if (!meals) return `Your ${profile.diet_type.toLowerCase()} preferences are saved, but there is no active meal plan to summarize yet.`
    const slots = Array.isArray(meals.meals) ? meals.meals : [{ label: 'Breakfast', food: meals.breakfast }, { label: 'Lunch', food: meals.lunch }, { label: 'Dinner', food: meals.dinner }]
    return `Today’s schedule is ${slots.map((slot) => `${slot.time ? `${slot.time} ` : ''}${slot.label}: ${slot.food}`).join('; ')}. These choices follow your saved diet, meal rhythm, and food exclusions.`
  }
  if (/recover|readiness|sleep|sore|stress|energy/.test(question)) {
    if (!checkIn) return 'Complete a weekly check-in entry first so I can ground recovery guidance in your sleep, energy, soreness, and stress.'
    return `Your latest readiness score is ${checkIn.readiness_score}/100. Energy was ${checkIn.energy}/5, sleep was ${checkIn.sleep_hours} hours, and soreness was ${checkIn.soreness}/5. Follow the active plan’s intensity and avoid adding extra maximal work.`
  }
  return `For your ${profile.goal.toLowerCase()} goal, the best next step is to follow today’s active plan and log the day in your weekly check-in. If the plan needs work, use Tune this plan so changes happen only when you ask. I’ll keep guidance within your saved equipment and ${profile.diet_type.toLowerCase()} preferences.`
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string' && item.content.trim())
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 1600) }))
    .slice(-8)
}

const coachPrompt = `You are EvolveFit AI, a clear general wellness coach. Directly answer the latest question in the supplied question field. Use conversationHistory only to understand follow-up references; never repeat an earlier answer or switch to a different topic unless the latest question asks you to. Give a complete answer, normally in 3-8 concise sentences, using only the supplied profile, activePlan, and latestCheckIn. Use readable paragraphs or short bullets when helpful. Do not invent data. Enforce diet, allergy, disliked-food, equipment, avoided-exercise, duration, and safety limits. Treat preferred foods, exercises, and weekdays as preferences rather than guarantees. Do not diagnose, treat, prescribe medication or supplements, provide rehabilitation instructions, or make medical claims. For pain, injury, or medical questions, recommend pausing and consulting a qualified healthcare professional. Never recommend extreme diets or maximal training. Explain plan changes using adaptationMessage and adaptationReasons when available.`
