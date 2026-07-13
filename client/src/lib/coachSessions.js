export const MAX_COACH_CHATS = 10
export const MAX_CHAT_MESSAGES = 50

export function createConversation(messages = []) {
  const now = new Date().toISOString()
  const cleanMessages = sanitizeMessages(messages, { discardPending: false })
  return {
    id: createId(),
    title: titleFromMessages(cleanMessages),
    createdAt: now,
    updatedAt: now,
    messages: cleanMessages,
  }
}

export function createChatStore() {
  const conversation = createConversation()
  return { version: 2, activeChatId: conversation.id, chats: [conversation] }
}

export function parseChatStore(rawValue, { discardPending = true } = {}) {
  try {
    const value = JSON.parse(rawValue || 'null')

    if (Array.isArray(value)) {
      const legacyMessages = sanitizeMessages(value, { discardPending })
      const conversation = createConversation(legacyMessages)
      return { version: 2, activeChatId: conversation.id, chats: [conversation] }
    }

    if (!value || !Array.isArray(value.chats)) return createChatStore()

    const chats = value.chats
      .map((chat) => sanitizeConversation(chat, { discardPending }))
      .filter(Boolean)
      .slice(0, MAX_COACH_CHATS)

    if (chats.length === 0) return createChatStore()
    const activeChatId = chats.some((chat) => chat.id === value.activeChatId) ? value.activeChatId : chats[0].id
    return { version: 2, activeChatId, chats }
  } catch {
    return createChatStore()
  }
}

export function readChatStore(key) {
  try {
    return parseChatStore(localStorage.getItem(key))
  } catch {
    return createChatStore()
  }
}

export function updateConversation(store, chatId, updater) {
  const index = store.chats.findIndex((chat) => chat.id === chatId)
  if (index < 0) return store
  const current = store.chats[index]
  const updated = updater(current)
  if (updated === current) return store
  const next = {
    ...updated,
    updatedAt: new Date().toISOString(),
    messages: updated.messages.slice(-MAX_CHAT_MESSAGES),
  }
  const chats = [next, ...store.chats.filter((chat) => chat.id !== chatId)].slice(0, MAX_COACH_CHATS)
  return { ...store, activeChatId: store.activeChatId, chats }
}

export function titleForQuestion(question) {
  const compact = question.trim().replace(/\s+/g, ' ')
  return compact.length > 42 ? `${compact.slice(0, 42)}…` : compact || 'New chat'
}

function sanitizeConversation(chat, options) {
  if (!chat || typeof chat.id !== 'string') return null
  const messages = sanitizeMessages(chat.messages, options)
  const createdAt = validDate(chat.createdAt) ? chat.createdAt : new Date().toISOString()
  const updatedAt = validDate(chat.updatedAt) ? chat.updatedAt : createdAt
  return {
    id: chat.id,
    title: messages.length === 0 ? 'New chat' : cleanTitle(chat.title) || titleFromMessages(messages),
    createdAt,
    updatedAt,
    messages,
  }
}

function sanitizeMessages(messages, { discardPending }) {
  if (!Array.isArray(messages)) return []
  const clean = messages
    .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string' && item.content.trim() && item.content.length <= 8000)
    .filter((item) => !discardPending || !item.pending)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : createId(),
      role: item.role,
      content: item.content,
      ...(item.fallback ? { fallback: true } : {}),
      ...(item.pending ? { pending: true } : {}),
    }))
    .slice(-MAX_CHAT_MESSAGES)

  if (discardPending && clean.at(-1)?.role === 'user') clean.pop()
  return clean
}

function titleFromMessages(messages) {
  const firstQuestion = messages.find((item) => item.role === 'user' && !item.pending)?.content
  return titleForQuestion(firstQuestion || '')
}

function cleanTitle(title) {
  return typeof title === 'string' ? title.trim().slice(0, 60) : ''
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
