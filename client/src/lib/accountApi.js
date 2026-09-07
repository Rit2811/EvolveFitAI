const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const TOKEN_KEY = 'evolvefit:account-token'

export function getStoredToken() { return localStorage.getItem(TOKEN_KEY) }
export function clearStoredToken() { localStorage.removeItem(TOKEN_KEY) }
export function storeToken(token) { localStorage.setItem(TOKEN_KEY, token) }

export const accountApi = {
  register: (details) => request('/api/auth/register', { method: 'POST', body: details, authenticated: false }),
  login: (details) => request('/api/auth/login', { method: 'POST', body: details, authenticated: false }),
  me: () => request('/api/auth/me'),
  getProfile: () => request('/api/profile'),
  saveProfile: (profile) => request('/api/profile', { method: 'PUT', body: profile }),
  getWellness: () => request('/api/wellness'),
  savePlan: (plan) => request('/api/plans', { method: 'POST', body: plan }),
  clearPlan: () => request('/api/plans/active', { method: 'DELETE' }),
  saveCheckIn: (checkIn) => request('/api/check-ins', { method: 'POST', body: checkIn }),
}

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (authenticated) {
    const token = getStoredToken()
    if (!token) throw new Error('Sign in is required.')
    headers.authorization = `Bearer ${token}`
  }
  let response
  try { response = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }) }
  catch { throw new Error('The account service is unavailable. Make sure npm run dev is running.') }
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) clearStoredToken()
    throw new Error(payload?.error || 'The account request failed.')
  }
  return payload
}
