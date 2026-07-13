import { AlertCircle, Bot, LoaderCircle, MessageSquare, Plus, Send, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/auth'
import { useWellnessData } from '../hooks/useWellnessData'
import { askCoach } from '../lib/api'
import { createConversation, MAX_COACH_CHATS, parseChatStore, readChatStore, titleForQuestion, updateConversation } from '../lib/coachSessions'

const COACH_TIMEOUT_MS = 60_000
const suggestions = ['Why did my plan change?', 'What is my workout today?', 'How should I approach recovery?', 'Summarize today’s meals']

export default function CoachPage() {
  const { user, profile } = useAuth()
  const { plan, checkIns, loading, error: dataError } = useWellnessData(user.id)
  const storageKey = useMemo(() => `evolvefit:coach:${user.id}`, [user.id])
  const [message, setMessage] = useState('')
  const [chatStore, setChatStore] = useState(() => readChatStore(storageKey))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const requestController = useRef(null)
  const activeChat = chatStore.chats.find((chat) => chat.id === chatStore.activeChatId) || chatStore.chats[0]
  const messages = activeChat?.messages || []

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(chatStore))
    } catch {
      setError('Chat history could not be saved because browser storage is unavailable or full.')
    }
  }, [chatStore, storageKey])

  useEffect(() => {
    localStorage.removeItem(`${storageKey}:draft`)
  }, [storageKey])

  useEffect(() => {
    function syncHistory(event) {
      if (event.key === storageKey && event.newValue) {
        setChatStore(parseChatStore(event.newValue, { discardPending: false }))
      }
    }
    window.addEventListener('storage', syncHistory)
    return () => window.removeEventListener('storage', syncHistory)
  }, [storageKey])

  useEffect(() => () => requestController.current?.abort(), [])

  function startNewChat() {
    if (sending) return
    setMessage('')
    setError('')
    setChatStore((current) => {
      const currentChat = current.chats.find((chat) => chat.id === current.activeChatId)
      if (currentChat?.messages.length === 0) return current
      const conversation = createConversation()
      return { ...current, activeChatId: conversation.id, chats: [conversation, ...current.chats].slice(0, MAX_COACH_CHATS) }
    })
  }

  function selectChat(chatId) {
    if (sending || chatId === chatStore.activeChatId) return
    setMessage('')
    setError('')
    setChatStore((current) => ({ ...current, activeChatId: chatId }))
  }

  async function send(text = message) {
    const question = text.trim()
    if (!question || sending || !activeChat) return

    const chatId = activeChat.id
    const pendingId = createMessageId()
    const conversationHistory = activeChat.messages
      .filter((item) => !item.pending)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }))
    const controller = new AbortController()
    let timedOut = false
    requestController.current = controller
    const timeout = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, COACH_TIMEOUT_MS)

    setMessage('')
    setError('')
    setSending(true)
    setChatStore((current) => updateConversation(current, chatId, (chat) => ({
      ...chat,
      title: chat.messages.some((item) => item.role === 'user' && !item.pending) ? chat.title : titleForQuestion(question),
      messages: [...chat.messages, { id: pendingId, role: 'user', content: question, pending: true }],
    })))

    try {
      const response = await askCoach(
        question,
        profile,
        plan ? normalizePlan(plan) : null,
        checkIns.at(-1) || null,
        conversationHistory,
        controller.signal,
      )
      setChatStore((current) => updateConversation(current, chatId, (chat) => {
        if (!chat.messages.some((item) => item.id === pendingId)) return chat
        return {
          ...chat,
          messages: [
            ...chat.messages.map((item) => item.id === pendingId ? { id: item.id, role: 'user', content: item.content } : item),
            { id: createMessageId(), role: 'assistant', content: response.answer, fallback: response.source === 'fallback' },
          ],
        }
      }))
    } catch (coachError) {
      setChatStore((current) => updateConversation(current, chatId, (chat) => ({
        ...chat,
        title: chat.messages.filter((item) => item.id !== pendingId).some((item) => item.role === 'user') ? chat.title : 'New chat',
        messages: chat.messages.filter((item) => item.id !== pendingId),
      })))
      if (timedOut) setError('The coach took longer than one minute, so the unanswered message was removed. Please try again.')
      else if (coachError.name !== 'AbortError') setError(coachError.message || 'The coach could not respond. The unanswered message was removed.')
    } finally {
      window.clearTimeout(timeout)
      if (requestController.current === controller) requestController.current = null
      setSending(false)
    }
  }

  if (loading) {
    return <div className="grid min-h-96 place-items-center"><LoaderCircle className="animate-spin text-wellness-primary" /></div>
  }

  return (
    <section className="mx-auto max-w-5xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-wellness-primary">AI coach</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Ask about your active plan</h1>
        <p className="mt-2 max-w-2xl text-wellness-muted">Guidance grounded in your profile, latest plan, recent conversation, and most recent check-in.</p>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="rounded-2xl border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-wellness-primary"><MessageSquare size={20} /></span>
              <div><h2 className="font-semibold">Conversations</h2><p className="text-xs text-wellness-muted">Up to {MAX_COACH_CHATS} recent chats</p></div>
            </div>
            <button type="button" onClick={startNewChat} disabled={sending} aria-label="Start a new chat" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-wellness-primary text-white disabled:opacity-50"><Plus size={19} /></button>
          </div>

          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
            {chatStore.chats.map((chat) => (
              <button
                type="button"
                key={chat.id}
                disabled={sending}
                aria-current={chat.id === activeChat?.id ? 'true' : undefined}
                onClick={() => selectChat(chat.id)}
                className={`w-full truncate rounded-xl border px-3 py-2.5 text-left text-sm font-semibold disabled:opacity-50 ${chat.id === activeChat?.id ? 'border-green-300 bg-green-50 text-wellness-primary' : 'bg-wellness-background hover:border-green-300'}`}
              >
                {chat.title}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-wellness-primary"><Sparkles size={21} /></span>
            <div><h2 className="font-semibold">Suggested questions</h2><p className="text-xs text-wellness-muted">Start with one tap</p></div>
          </div>
          <div className="mt-4 space-y-2">
            {suggestions.map((item) => (
              <button type="button" key={item} disabled={sending} onClick={() => send(item)} className="w-full rounded-xl border bg-wellness-background p-3 text-left text-sm font-semibold hover:border-green-300 disabled:opacity-50">
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            General fitness and nutrition guidance only. The coach cannot diagnose injuries, prescribe treatment, or replace qualified professional care.
          </div>
        </aside>

        <div className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-card">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-wellness-primary text-white"><Bot size={18} /></span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{activeChat?.title || 'New chat'}</p><p className="text-xs text-wellness-muted">EvolveFit Coach · grounded in your current data</p></div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-wellness-background/50 p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="mx-auto mt-16 max-w-sm text-center">
                <Bot className="mx-auto text-wellness-primary" size={34} />
                <h2 className="mt-4 font-semibold">What would help today?</h2>
                <p className="mt-2 text-sm leading-6 text-wellness-muted">Ask about a workout, meals, readiness, or why the plan changed.</p>
              </div>
            )}
            {messages.map((item) => <Message key={item.id} {...item} />)}
            {sending && <div className="flex items-center gap-2 text-sm text-wellness-muted"><LoaderCircle className="animate-spin" size={17} />Preparing a grounded response…</div>}
            {(error || dataError) && <div role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="shrink-0" size={17} />{error || dataError}</div>}
          </div>

          <form autoComplete="off" onSubmit={(event) => { event.preventDefault(); send() }} className="flex items-end gap-2 border-t p-3 sm:p-4">
            <label className="sr-only" htmlFor="coach-message">Message the coach</label>
            <textarea
              id="coach-message"
              name="evolvefit-coach-query"
              rows="2"
              autoComplete="off"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 500))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
              placeholder="Ask about your plan…"
              className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border bg-wellness-background px-4 py-3 outline-none focus:border-wellness-primary"
            />
            <button disabled={sending || !message.trim()} aria-label="Send message" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-wellness-primary text-white disabled:opacity-50"><Send size={19} /></button>
          </form>
        </div>
      </div>
    </section>
  )
}

function Message({ role, content, fallback, pending }) {
  const assistant = role === 'assistant'
  const Icon = assistant ? Bot : UserRound
  return (
    <div className={`flex gap-3 ${assistant ? '' : 'flex-row-reverse'} ${pending ? 'opacity-70' : ''}`}>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${assistant ? 'bg-green-50 text-wellness-primary' : 'bg-wellness-primary text-white'}`}><Icon size={16} /></span>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${assistant ? 'border bg-white text-wellness-text' : 'bg-wellness-primary text-white'}`}>
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {fallback && <p className="mt-2 text-[11px] font-semibold text-wellness-muted">Local demo guidance</p>}
      </div>
    </div>
  )
}

function normalizePlan(row) {
  return { summary: row.summary, workoutPlan: row.workout_plan, mealPlan: row.meal_plan, adaptationMessage: row.adaptation_message, adaptationReasons: row.adaptation_reasons || [] }
}

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
