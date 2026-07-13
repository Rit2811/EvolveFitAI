import cors from 'cors'
import express from 'express'
import { generatePlan } from './ai/geminiPlanService.js'
import { adaptPlan } from './ai/adaptPlanService.js'
import { answerCoach } from './ai/coachService.js'

export function createApp({ planGenerator = generatePlan, planAdapter = adaptPlan, coach = answerCoach } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
  app.use(express.json({ limit: '1mb' }))
  app.get('/api/health', (_request, response) => response.status(200).json({ status: 'ok' }))
  app.post('/api/ai/generate-plan', async (request, response) => {
    const result = await planGenerator(request.body?.profile)
    response.status(result.status).json(result.body)
  })
  app.post('/api/ai/adapt-plan', async (request, response) => {
    const result = await planAdapter(request.body?.profile, request.body?.currentPlan, request.body?.checkIn)
    response.status(result.status).json(result.body)
  })
  app.post('/api/ai/coach', async (request, response) => {
    const result = await coach(request.body?.message, request.body?.profile, request.body?.activePlan, request.body?.latestCheckIn, { history: request.body?.history })
    response.status(result.status).json(result.body)
  })
  app.use((_request, response) => response.status(404).json({ error: 'Route not found' }))
  return app
}
