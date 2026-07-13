import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.js'

let server
let baseUrl
before(() => new Promise((resolve) => {
  server = createApp().listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`
    resolve()
  })
}))
after(() => new Promise((resolve) => server.close(resolve)))
test('GET /api/health returns ok', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})
