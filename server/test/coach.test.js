import assert from 'node:assert/strict'
import { test } from 'node:test'
import { answerCoach, fallbackAnswer } from '../src/ai/coachService.js'

const profile = { goal: 'Build muscle', diet_type: 'Vegetarian' }
const plan = { adaptationMessage: 'The plan was lightened.', adaptationReasons: ['Sleep was short.', 'Soreness was high.'], workoutPlan: [], mealPlan: [] }
const checkIn = { readiness_score: 35, energy: 2, sleep_hours: 5, soreness: 4 }

test('coach explains plan changes from grounded reasons', () => {
  const answer = fallbackAnswer('Why did my plan change?', profile, plan, checkIn)
  assert.match(answer, /lightened/i)
  assert.match(answer, /sleep was short/i)
})
test('coach refuses medical and injury guidance', () => assert.match(fallbackAnswer('How do I rehab knee pain?', profile, plan, checkIn), /healthcare professional/i))
test('fallback uses the previous question to answer a short follow-up', () => {
  const history = [{ role: 'user', content: 'How is my recovery?' }, { role: 'assistant', content: 'Your readiness is low.' }]
  assert.match(fallbackAnswer('Why?', profile, plan, checkIn, history), /35\/100/)
})
test('coach service falls back without an API key', async () => { const result = await answerCoach('How is my recovery?', profile, plan, checkIn, { apiKey: '' }); assert.equal(result.status, 200); assert.equal(result.body.source, 'fallback'); assert.match(result.body.answer, /35\/100/) })
test('coach returns a Gemini response when configured', async () => {
  const client = { models: { generateContent: async () => ({ text: 'Your recovery is trending low, so follow the lighter session in your active plan.' }) } }
  const result = await answerCoach('How is my recovery?', profile, plan, checkIn, { apiKey: 'test-key', client })
  assert.equal(result.body.source, 'gemini')
  assert.match(result.body.answer, /lighter session/i)
})
test('coach includes recent conversation context and the latest question in Gemini input', async () => {
  let request
  const client = { models: { generateContent: async (input) => { request = input; return { text: 'Keep the lighter session and prioritize sleep tonight.' } } } }
  const history = [{ role: 'user', content: 'Should I use the lighter workout?' }, { role: 'assistant', content: 'Yes, based on your readiness.' }]
  await answerCoach('Why?', profile, plan, checkIn, { apiKey: 'test-key', client, history })
  const context = JSON.parse(request.contents)
  assert.equal(context.question, 'Why?')
  assert.deepEqual(context.conversationHistory, history)
})
test('coach accepts a complete response longer than the previous limit', async () => {
  const completeAnswer = `A complete grounded response. ${'Useful detail. '.repeat(120)}`
  const client = { models: { generateContent: async () => ({ text: completeAnswer }) } }
  const result = await answerCoach('Explain my plan in detail.', profile, plan, checkIn, { apiKey: 'test-key', client })
  assert.equal(result.body.source, 'gemini')
  assert.equal(result.body.answer, completeAnswer.trim())
})
test('coach rejects empty questions', async () => { const result = await answerCoach('', profile, plan, checkIn, { apiKey: '' }); assert.equal(result.status, 400) })
