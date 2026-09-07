import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

const dataFile = join(tmpdir(), `evolvefit-account-test-${randomUUID()}.json`)
process.env.DATA_FILE = dataFile
process.env.AUTH_SECRET = 'test-only-auth-secret-with-sufficient-length'
process.env.DEMO_USER_EMAIL = 'admin@test.local'
process.env.DEMO_USER_PASSWORD = 'TestAdmin!2026'
process.env.DEMO_USER_NAME = 'Admin'
await writeFile(dataFile, JSON.stringify({
  users: [{ id: 'legacy-admin', email: 'admin@test.local', full_name: 'Admin', password_hash: 'legacy:invalid' }],
  profiles: [], plans: [], checkIns: [],
}))
const store = await import('../src/accountStore.js')

test('seeded Admin account is migrated for an existing store and remains an ordinary user', async () => {
  const session = await store.loginAccount({ email: 'admin@test.local', password: 'TestAdmin!2026' })
  assert.equal(session.user.user_metadata.full_name, 'Admin')
  assert.equal('role' in session.user, false)
  assert.ok(session.token)
})

test('registration hashes passwords and keeps profile data isolated', async () => {
  const first = await store.registerAccount({ email: 'first@example.com', password: 'Password!123', fullName: 'First User' })
  const second = await store.registerAccount({ email: 'second@example.com', password: 'Password!456', fullName: 'Second User' })
  await store.saveProfile(first.user.id, { full_name: 'First User', onboarding_completed: true })
  assert.equal((await store.getProfile(first.user.id)).full_name, 'First User')
  assert.equal(await store.getProfile(second.user.id), null)
  const persisted = await readFile(dataFile, 'utf8')
  assert.equal(persisted.includes('Password!123'), false)
  assert.match(persisted, /password_hash/)
})

test('login rejects an incorrect password', async () => {
  await assert.rejects(
    store.loginAccount({ email: 'admin@test.local', password: 'wrong-password' }),
    /incorrect/i,
  )
})

test('AI endpoints reject anonymous requests and accept a signed account session', async (context) => {
  const { createApp } = await import('../src/app.js')
  const server = createApp({ planGenerator: async () => ({ status: 200, body: { source: 'test' } }) }).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  context.after(() => server.close())
  const url = `http://127.0.0.1:${server.address().port}/api/ai/generate-plan`
  const anonymous = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  assert.equal(anonymous.status, 401)
  const session = await store.loginAccount({ email: 'admin@test.local', password: 'TestAdmin!2026' })
  const authenticated = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` }, body: '{}' })
  assert.equal(authenticated.status, 200)
})

test('a completed check-in is immutable', async () => {
  const session = await store.registerAccount({ email: 'weekly@example.com', password: 'Password!789', fullName: 'Weekly User' })
  await store.saveCheckIn(session.user.id, { check_in_date: '2026-09-01', energy: 2 })
  await assert.rejects(
    store.saveCheckIn(session.user.id, { check_in_date: '2026-09-01', energy: 5 }),
    (error) => error.status === 409 && /already been checked in/i.test(error.message),
  )
  await store.saveCheckIn(session.user.id, { check_in_date: '2026-09-02', energy: 4 })
  const data = await store.getWellnessData(session.user.id)
  assert.equal(data.checkIns.length, 2)
  assert.equal(data.checkIns.find((item) => item.check_in_date === '2026-09-01').energy, 2)
})
