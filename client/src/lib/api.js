const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function getHealth(signal) {
  const response = await fetch(`${API_URL}/api/health`, { signal })
  if (!response.ok) throw new Error('Health check failed')
  return response.json()
}

export async function generatePlan(profile, signal) {
  const response = await fetch(`${API_URL}/api/ai/generate-plan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profile }),
    signal,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Plan generation failed.')
  if (!isCompletePlan(body)) throw new Error('The server returned an incomplete plan. Please try again.')
  return body
}

export async function adaptPlan(profile, currentPlan, checkIn, signal) {
  const response = await fetch(`${API_URL}/api/ai/adapt-plan`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profile, currentPlan, checkIn }), signal,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Plan adaptation failed.')
  if (!isCompletePlan(body) || !Array.isArray(body.adaptationReasons) || body.adaptationReasons.length < 2 || body.adaptationReasons.length > 4) throw new Error('The server returned an incomplete adaptation.')
  return body
}

export async function askCoach(message, profile, activePlan, latestCheckIn, history = [], signal) {
  const response = await fetch(`${API_URL}/api/ai/coach`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, profile, activePlan, latestCheckIn, history }), signal,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'The coach could not respond.')
  if (typeof body.answer !== 'string' || !body.answer.trim() || body.answer.length > 8000) throw new Error('The coach returned an invalid response.')
  return body
}

export function isCompletePlan(plan) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return Boolean(typeof plan?.summary === 'string' && plan.summary.trim() && typeof plan?.adaptationMessage === 'string' && plan.adaptationMessage.trim()
    && [plan.workoutPlan, plan.mealPlan].every((items) => Array.isArray(items) && items.length === 7 && days.every((day) => items.filter((item) => item?.day === day).length === 1))
  )
}
