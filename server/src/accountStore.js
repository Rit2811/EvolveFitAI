import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { dirname, resolve } from 'node:path'

const dataPath = process.env.DATA_FILE || resolve(import.meta.dirname, '../data/evolvefit.json')
const authSecret = process.env.AUTH_SECRET || 'evolvefit-local-development-secret-change-before-deployment'
const seedEmail = (process.env.DEMO_USER_EMAIL || 'admin@evolvefit.local').trim().toLowerCase()
const seedPassword = process.env.DEMO_USER_PASSWORD || 'admin123'
const seedName = (process.env.DEMO_USER_NAME || 'Admin').trim()
const seedVersion = 2
let queue = Promise.resolve()

export function registerAccount({ email, password, fullName }) {
  return transact(async (data) => {
    const normalizedEmail = normalizeEmail(email)
    validateCredentials(normalizedEmail, password, fullName)
    if (data.users.some((user) => user.email === normalizedEmail)) throw accountError(409, 'An account already exists for this email.')
    const user = newUser(normalizedEmail, password, fullName.trim())
    data.users.push(user)
    return sessionFor(user)
  })
}

export function loginAccount({ email, password }) {
  return transact(async (data) => {
    const user = data.users.find((candidate) => candidate.email === normalizeEmail(email))
    if (!user || !verifyPassword(password, user.password_hash)) throw accountError(401, 'The email or password is incorrect.')
    return sessionFor(user)
  })
}

export function getProfile(userId) {
  return transact(async (data) => data.profiles.find((profile) => profile.id === userId) || null)
}

export function getAccount(userId) {
  return transact(async (data) => {
    const user = data.users.find((candidate) => candidate.id === userId)
    if (!user) throw accountError(401, 'Your account no longer exists.')
    return { id: user.id, email: user.email, user_metadata: { full_name: user.full_name } }
  })
}

export function saveProfile(userId, profile) {
  return transact(async (data) => {
    const now = new Date().toISOString()
    const existing = data.profiles.findIndex((item) => item.id === userId)
    const row = { ...profile, id: userId, created_at: existing >= 0 ? data.profiles[existing].created_at : now, updated_at: now }
    if (existing >= 0) data.profiles[existing] = row
    else data.profiles.push(row)
    return row
  })
}

export function getWellnessData(userId) {
  return transact(async (data) => ({
    plan: [...data.plans].reverse().find((plan) => plan.user_id === userId && plan.is_active) || null,
    checkIns: data.checkIns.filter((checkIn) => checkIn.user_id === userId),
  }))
}

export function savePlan(userId, plan) {
  return transact(async (data) => {
    for (const current of data.plans) if (current.user_id === userId) current.is_active = false
    const row = { ...plan, id: nextId(data.plans), user_id: userId, is_active: true, created_at: plan.created_at || new Date().toISOString() }
    data.plans.push(row)
    return row
  })
}

export function clearPlan(userId) {
  return transact(async (data) => {
    for (const current of data.plans) if (current.user_id === userId) current.is_active = false
    return null
  })
}

export function saveCheckIn(userId, checkIn) {
  return transact(async (data) => {
    const existing = data.checkIns.findIndex((item) => item.user_id === userId && item.check_in_date && item.check_in_date === checkIn.check_in_date)
    if (existing >= 0) throw accountError(409, 'This day has already been checked in and is now locked.')
    const row = { ...checkIn, id: nextId(data.checkIns), user_id: userId, created_at: new Date().toISOString() }
    data.checkIns.push(row)
    return row
  })
}

export function authenticateRequest(request) {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) throw accountError(401, 'Sign in is required.')
  const [body, signature] = token.split('.')
  if (!body || !signature) throw accountError(401, 'Your session is invalid.')
  const expected = sign(body)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw accountError(401, 'Your session is invalid.')
  let payload
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) } catch { throw accountError(401, 'Your session is invalid.') }
  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) throw accountError(401, 'Your session has expired.')
  return payload.sub
}

function transact(operation) {
  const result = queue.then(async () => {
    const data = await readData()
    const value = await operation(data)
    await persist(data)
    return value
  })
  queue = result.catch(() => undefined)
  return result
}

async function readData() {
  try {
    const parsed = JSON.parse(await readFile(dataPath, 'utf8'))
    return ensureSeedAccount(normalizeData(parsed))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return ensureSeedAccount(normalizeData({}))
  }
}

async function persist(data) {
  await mkdir(dirname(dataPath), { recursive: true })
  const temporary = `${dataPath}.${process.pid}.tmp`
  await writeFile(temporary, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, dataPath)
}

function normalizeData(data) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    profiles: Array.isArray(data.profiles) ? data.profiles : [],
    plans: Array.isArray(data.plans) ? data.plans : [],
    checkIns: Array.isArray(data.checkIns) ? data.checkIns : [],
  }
}

function ensureSeedAccount(data) {
  const user = data.users.find((candidate) => normalizeEmail(candidate.email) === seedEmail)
  if (!user) data.users.push({ ...newUser(seedEmail, seedPassword, seedName), is_seed_account: true, seed_version: seedVersion })
  else if (user.is_seed_account !== false && Number(user.seed_version || 1) < seedVersion) {
    user.full_name = seedName
    user.password_hash = hashPassword(seedPassword)
    user.is_seed_account = true
    user.seed_version = seedVersion
  }
  return data
}

function newUser(email, password, fullName) {
  return { id: randomUUID(), email, full_name: fullName, password_hash: hashPassword(password), created_at: new Date().toISOString() }
}
function hashPassword(password) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}` }
function verifyPassword(password = '', stored = '') { const [salt, hash] = stored.split(':'); if (!salt || !hash) return false; const actual = scryptSync(password, salt, 64); const expected = Buffer.from(hash, 'hex'); return actual.length === expected.length && timingSafeEqual(actual, expected) }
function sessionFor(user) { const publicUser = { id: user.id, email: user.email, user_metadata: { full_name: user.full_name } }; const body = Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })).toString('base64url'); return { token: `${body}.${sign(body)}`, user: publicUser } }
function sign(value) { return createHmac('sha256', authSecret).update(value).digest('base64url') }
function normalizeEmail(email = '') { return String(email).trim().toLowerCase() }
function validateCredentials(email, password = '', fullName = '') { if (!/^\S+@\S+\.\S+$/.test(email)) throw accountError(400, 'Enter a valid email address.'); if (password.length < 8) throw accountError(400, 'Password must be at least 8 characters.'); if (fullName.trim().length < 2) throw accountError(400, 'Enter your full name.') }
function nextId(items) { return items.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0) + 1 }
function accountError(status, message) { return Object.assign(new Error(message), { status }) }
