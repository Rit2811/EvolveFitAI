import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

export default function AuthPage({ mode }) {
  const register = mode === 'register'
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function submit(event) {
    event.preventDefault()
    setError(''); setMessage('')
    if (register && form.fullName.trim().length < 2) { setError('Please enter your full name.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true)
    const credentials = register
      ? { email: form.email.trim(), password: form.password, options: { data: { full_name: form.fullName.trim() } } }
      : { email: form.email.trim(), password: form.password }
    const { data, error: authError } = register ? await signUp(credentials) : await signIn(credentials)
    setSubmitting(false)
    if (authError) { setError(friendlyError(authError.message)); return }
    if (register && !data.session) { setMessage('Account created. Check your email to confirm it, then sign in.'); return }
    const requestedPath = location.state?.from?.pathname
    navigate(register ? '/onboarding' : requestedPath || '/dashboard', { replace: true })
  }

  return <section className="grid min-h-[calc(100vh-74px)] items-center gap-10 py-10 lg:grid-cols-2 lg:py-16"><div className="hidden lg:block"><p className="font-semibold text-wellness-primary">A plan built around real life</p><h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight">Small adjustments. Sustainable progress.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-wellness-muted">Your profile, plans, and check-ins stay attached to your account across sessions and devices.</p><div className="mt-8 space-y-4">{['Personalized weekly workouts', 'Practical meal guidance', 'Recovery-aware plan changes'].map((item) => <div key={item} className="flex items-center gap-3 font-medium"><CheckCircle2 className="text-wellness-primary" size={20} />{item}</div>)}</div></div>
    <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-6 shadow-card sm:p-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-wellness-primary"><LockKeyhole /></div><h2 className="mt-5 text-3xl font-bold">{register ? 'Create your account' : 'Welcome back'}</h2><p className="mt-2 text-wellness-muted">{register ? 'Create one account for your profile and progress.' : 'Sign in to continue with your saved wellness plan.'}</p>
      <form className="mt-7 space-y-5" onSubmit={submit}>{register && <Field icon={UserRound} label="Full name"><input name="fullName" value={form.fullName} onChange={update} autoComplete="name" required placeholder="Aarav Sharma" className="w-full bg-transparent outline-none" /></Field>}<Field icon={Mail} label="Email"><input name="email" value={form.email} onChange={update} type="email" autoComplete="email" required placeholder="you@example.com" className="w-full bg-transparent outline-none" /></Field><Field icon={LockKeyhole} label="Password"><input name="password" value={form.password} onChange={update} type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} placeholder="At least 8 characters" className="w-full bg-transparent outline-none" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="text-wellness-muted" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></Field>
        {error && <Notice tone="error">{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
        <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-wellness-primary px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <><LoaderCircle className="animate-spin" size={19} />Please wait</> : <>{register ? 'Create account' : 'Sign in'}<ArrowRight size={18} /></>}</button>
      </form><p className="mt-6 text-center text-sm text-wellness-muted">{register ? 'Already have an account?' : 'New to VitalTrack?'} <Link className="font-semibold text-wellness-primary" to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create account'}</Link></p></div></section>
}

function Field({ icon: Icon, label, children }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><span className="flex h-12 items-center gap-3 rounded-xl border bg-wellness-background px-3 focus-within:border-wellness-primary focus-within:ring-1 focus-within:ring-wellness-primary"><Icon size={18} className="shrink-0 text-wellness-muted" />{children}</span></label> }
function Notice({ tone, children }) { const success = tone === 'success'; const Icon = success ? CheckCircle2 : AlertCircle; return <div role={success ? 'status' : 'alert'} className={`flex gap-2 rounded-xl p-3 text-sm ${success ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-700'}`}><Icon className="mt-0.5 shrink-0" size={17} /><span>{children}</span></div> }
function friendlyError(message) { if (/invalid login credentials/i.test(message)) return 'The email or password is incorrect.'; if (/already registered/i.test(message)) return 'An account already exists for this email.'; if (/email rate limit/i.test(message)) return 'Too many attempts. Please wait a moment and try again.'; return message || 'Authentication failed. Please try again.' }
