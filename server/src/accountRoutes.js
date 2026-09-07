import { Router } from 'express'
import { authenticateRequest, clearPlan, getAccount, getProfile, getWellnessData, loginAccount, registerAccount, saveCheckIn, savePlan, saveProfile } from './accountStore.js'

export function accountRoutes() {
  const router = Router()
  router.post('/auth/register', handle(async (request, response) => response.status(201).json(await registerAccount(request.body || {}))))
  router.post('/auth/login', handle(async (request, response) => response.json(await loginAccount(request.body || {}))))
  router.get('/auth/me', authenticated(async (request, response) => response.json({ user: await getAccount(request.userId) })))
  router.get('/profile', authenticated(async (request, response) => response.json({ profile: await getProfile(request.userId) })))
  router.put('/profile', authenticated(async (request, response) => response.json({ profile: await saveProfile(request.userId, request.body || {}) })))
  router.get('/wellness', authenticated(async (request, response) => response.json(await getWellnessData(request.userId))))
  router.post('/plans', authenticated(async (request, response) => response.status(201).json({ plan: await savePlan(request.userId, request.body || {}) })))
  router.delete('/plans/active', authenticated(async (request, response) => { await clearPlan(request.userId); response.status(204).end() }))
  router.post('/check-ins', authenticated(async (request, response) => response.status(201).json({ checkIn: await saveCheckIn(request.userId, request.body || {}) })))
  return router
}

function authenticated(handler) {
  return handle(async (request, response) => { request.userId = authenticateRequest(request); await handler(request, response) })
}
function handle(handler) {
  return async (request, response) => {
    try { await handler(request, response) }
    catch (error) { response.status(error.status || 500).json({ error: error.status ? error.message : 'The account service could not complete the request.' }) }
  }
}
