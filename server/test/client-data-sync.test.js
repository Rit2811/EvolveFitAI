import assert from 'node:assert/strict'
import { test } from 'node:test'
import { planMatchesProfile, planProfileSnapshot } from '../../client/src/lib/planData.js'
import { currentWeekCheckIns, latestCheckIn } from '../../client/src/lib/wellnessData.js'

test('dashboard-style selectors use the check-in day instead of submission time', () => {
  const checkIns = [
    { check_in_date: '2026-09-01', created_at: '2026-10-01T10:00:00.000Z', readiness_score: 70 },
    { check_in_date: '2026-09-02', created_at: '2026-09-02T10:00:00.000Z', readiness_score: 80 },
  ]
  const reference = new Date(2026, 8, 2, 12)
  assert.deepEqual(currentWeekCheckIns(checkIns, reference).map((item) => item.check_in_date), ['2026-09-01', '2026-09-02'])
  assert.equal(latestCheckIn(checkIns).check_in_date, '2026-09-02')
})

test('saved plans detect profile fields that require synchronization', () => {
  const profile = { goal: 'Improve fitness', workout_days: 3, equipment: ['Bodyweight'], meal_schedule: [{ name: 'Lunch', time: '13:00' }] }
  const plan = { profile_snapshot: planProfileSnapshot(profile) }
  assert.equal(planMatchesProfile(plan, profile), true)
  assert.equal(planMatchesProfile(plan, { ...profile, workout_days: 4 }), false)
})
