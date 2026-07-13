import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createChatStore, parseChatStore, titleForQuestion } from '../../client/src/lib/coachSessions.js'

test('legacy coach history migrates into the first conversation', () => {
  const legacy = [
    { role: 'user', content: 'How should I recover today?' },
    { role: 'assistant', content: 'Use your readiness score and active plan.' },
  ]
  const store = parseChatStore(JSON.stringify(legacy))
  assert.equal(store.version, 2)
  assert.equal(store.chats.length, 1)
  assert.equal(store.chats[0].messages.length, 2)
  assert.match(store.chats[0].title, /recover/i)
})

test('an unanswered pending message is removed when history is restored', () => {
  const store = createChatStore()
  store.chats[0].title = 'Unanswered question'
  store.chats[0].messages.push({ id: 'pending-1', role: 'user', content: 'Will this remain?', pending: true })
  const restored = parseChatStore(JSON.stringify(store))
  assert.equal(restored.chats[0].messages.length, 0)
  assert.equal(restored.chats[0].title, 'New chat')
})

test('a trailing unanswered message from older history is also removed', () => {
  const legacy = [
    { role: 'user', content: 'Completed question' },
    { role: 'assistant', content: 'Completed answer' },
    { role: 'user', content: 'Question interrupted by an exit' },
  ]
  const restored = parseChatStore(JSON.stringify(legacy))
  assert.deepEqual(restored.chats[0].messages.map((item) => item.content), ['Completed question', 'Completed answer'])
})

test('conversation titles are concise', () => {
  const title = titleForQuestion('Explain this very long workout and nutrition question with all of the available context')
  assert.ok(title.length <= 43)
  assert.match(title, /…$/)
})
