export function calculateReadiness(checkIn) {
  const normalized = [
    scale(checkIn.energy), scale(checkIn.sleepQuality), scale(6 - checkIn.soreness), scale(6 - checkIn.stress),
    clamp((Number(checkIn.sleepHours) - 4) / 4), scale(checkIn.dietAdherence),
  ]
  return Math.round(normalized.reduce((sum, value) => sum + value, 0) / normalized.length * 100)
}

export function readinessLabel(score) {
  if (score >= 75) return { label: 'Ready to progress', tone: 'text-green-700 bg-green-50' }
  if (score >= 50) return { label: 'Steady and manageable', tone: 'text-amber-700 bg-amber-50' }
  return { label: 'Recovery first', tone: 'text-orange-700 bg-orange-50' }
}
function scale(value) { return clamp((Number(value) - 1) / 4) }
function clamp(value) { return Math.min(1, Math.max(0, Number(value) || 0)) }
