import { AlertCircle, ArrowRight, BatteryMedium, BedDouble, Brain, CheckCircle2, Download, Dumbbell, HeartPulse, LoaderCircle, Salad, Sparkles, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { adaptPlan, isCompletePlan } from '../lib/api'
import { buildDailyReport, downloadDailyReportPdf } from '../lib/dailyReport'
import { calculateReadiness, readinessLabel } from '../lib/readiness'
import { supabase } from '../lib/supabase'

const initial = { energy: 3, sleepHours: 7, sleepQuality: 3, soreness: 2, stress: 3, hunger: 3, workoutCompleted: false, dietAdherence: 3, notes: '' }

export default function CheckInPage() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState(initial)
  const [activePlan, setActivePlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const score = useMemo(() => calculateReadiness(form), [form])

  useEffect(() => {
    let active = true
    supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle().then(({ data, error: loadError }) => {
      if (!active) return
      if (loadError) setError(dbError(loadError))
      else if (data) setActivePlan(data)
      setLoading(false)
    })
    return () => { active = false }
  }, [user.id])

  function set(name, value) { setForm((current) => ({ ...current, [name]: value })) }
  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setError('')
    const checkIn = toCheckIn(form, score)
    const { error: checkInError } = await supabase.from('check_ins').insert({ user_id: user.id, ...checkIn })
    if (checkInError) { setSubmitting(false); setError(dbError(checkInError)); return }
    try {
      const currentPlan = fromRow(activePlan)
      if (!isCompletePlan(currentPlan)) throw new Error('Your active plan is incomplete and cannot be adapted safely.')
      const adapted = await adaptPlan(profile, currentPlan, checkIn)
      const { source, ...content } = adapted
      const { error: deactivateError } = await supabase.from('plans').update({ is_active: false }).eq('id', activePlan.id).eq('user_id', user.id)
      if (deactivateError) throw new Error(dbError(deactivateError))
      const nextRow = { user_id: user.id, workout_plan: content.workoutPlan, meal_plan: content.mealPlan, summary: content.summary, adaptation_message: content.adaptationMessage, adaptation_reasons: content.adaptationReasons, version: activePlan.version + 1, is_active: true }
      const { data: saved, error: planError } = await supabase.from('plans').insert(nextRow).select().single()
      if (planError) { await supabase.from('plans').update({ is_active: true }).eq('id', activePlan.id).eq('user_id', user.id); throw new Error(dbError(planError)) }
      setActivePlan(saved); setResult({ score, message: content.adaptationMessage, reasons: content.adaptationReasons, version: saved.version, fallback: source === 'fallback', checkIn, report: buildDailyReport(checkIn) })
    } catch (adaptationError) { setError(`Your check-in was saved, but the plan could not be adapted: ${adaptationError.message}`) }
    finally { setSubmitting(false) }
  }

  if (loading) return <Loading />
  if (!activePlan) return <NoPlan error={error} />
  if (result) return <Success result={result} fullName={profile.full_name} />
  const readiness = readinessLabel(score)
  return <section className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-wellness-primary">Daily check-in</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">How are you feeling today?</h1><p className="mt-2 text-wellness-muted">A quick snapshot helps keep your plan practical and recovery-aware.</p></div><div className={`rounded-2xl px-5 py-3 text-right ${readiness.tone}`}><p className="text-xs font-semibold uppercase tracking-wide">Readiness</p><p className="text-2xl font-bold">{score}<span className="text-sm">/100</span></p><p className="text-xs font-semibold">{readiness.label}</p></div></div>
    <form onSubmit={submit} className="mt-7 space-y-5"><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-5 shadow-card sm:p-6"><SectionTitle icon={HeartPulse} title="Recovery signals" text="Rate each signal from 1 (low) to 5 (high)." /><div className="mt-6 space-y-6"><Rating label="Energy" icon={BatteryMedium} value={form.energy} onChange={(v) => set('energy', v)} low="Drained" high="Energized" /><Rating label="Sleep quality" icon={BedDouble} value={form.sleepQuality} onChange={(v) => set('sleepQuality', v)} low="Poor" high="Excellent" /><Rating label="Soreness" icon={Dumbbell} value={form.soreness} onChange={(v) => set('soreness', v)} low="None" high="Very sore" /><Rating label="Stress" icon={Brain} value={form.stress} onChange={(v) => set('stress', v)} low="Calm" high="Very high" /></div></section>
      <section className="rounded-2xl border bg-white p-5 shadow-card sm:p-6"><SectionTitle icon={Salad} title="Sleep and adherence" text="Add context from the last day." /><div className="mt-6 space-y-6"><Slider label="Hours of sleep" value={form.sleepHours} onChange={(v) => set('sleepHours', v)} min="0" max="12" step="0.5" suffix="hours" /><Rating label="Hunger" icon={Utensils} value={form.hunger} onChange={(v) => set('hunger', v)} low="Low" high="Very high" /><Rating label="Diet adherence" icon={Salad} value={form.dietAdherence} onChange={(v) => set('dietAdherence', v)} low="Off plan" high="On track" /><Segmented label="Did you complete the planned workout?" value={form.workoutCompleted} onChange={(v) => set('workoutCompleted', v)} /></div></section></div>
      <section className="rounded-2xl border bg-white p-5 shadow-card sm:p-6"><label><span className="text-sm font-semibold">Anything else to consider? <span className="font-normal text-wellness-muted">(optional)</span></span><textarea value={form.notes} onChange={(e) => set('notes', e.target.value.slice(0, 500))} rows="3" placeholder="For example: a long workday or travel changed my routine." className="mt-3 w-full resize-none rounded-xl border bg-wellness-background p-4 outline-none focus:border-wellness-primary" /><span className="mt-1 block text-right text-xs text-wellness-muted">{form.notes.length}/500</span></label>{error && <ErrorNotice message={error} />}<div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-xs leading-5 text-wellness-muted">This check-in adjusts general wellness guidance only and is not a medical assessment.</p><button disabled={submitting} className="inline-flex h-12 items-center gap-2 rounded-xl bg-wellness-primary px-6 font-semibold text-white disabled:opacity-60">{submitting ? <><LoaderCircle className="animate-spin" size={18} />Saving and adapting…</> : <><Sparkles size={18} />Save and adapt plan</>}</button></div></section></form>
  </section>
}

function Rating({ label, icon: Icon, value, onChange, low, high }) { return <fieldset><legend className="flex items-center gap-2 text-sm font-semibold"><Icon size={17} className="text-wellness-primary" />{label}</legend><div className="mt-3 grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((number) => <button type="button" key={number} onClick={() => onChange(number)} aria-pressed={value === number} className={`h-10 rounded-xl border text-sm font-bold ${value === number ? 'border-wellness-primary bg-wellness-primary text-white' : 'bg-wellness-background text-wellness-muted'}`}>{number}</button>)}</div><div className="mt-1.5 flex justify-between text-xs text-wellness-muted"><span>{low}</span><span>{high}</span></div></fieldset> }
function Slider({ label, value, onChange, suffix, ...props }) { return <label><span className="flex justify-between text-sm font-semibold"><span>{label}</span><span className="text-wellness-primary">{value} {suffix}</span></span><input type="range" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-3 w-full accent-wellness-primary" {...props} /></label> }
function Segmented({ label, value, onChange }) { return <fieldset><legend className="text-sm font-semibold">{label}</legend><div className="mt-3 grid grid-cols-2 rounded-xl border bg-wellness-background p-1">{[[true, 'Yes, completed'], [false, 'Not today']].map(([option, text]) => <button type="button" key={text} onClick={() => onChange(option)} className={`h-10 rounded-lg text-sm font-semibold ${value === option ? 'bg-white text-wellness-primary shadow-sm' : 'text-wellness-muted'}`}>{text}</button>)}</div></fieldset> }
function SectionTitle({ icon: Icon, title, text }) { return <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-wellness-primary"><Icon size={20} /></span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-wellness-muted">{text}</p></div></div> }
function Success({ result, fullName }) {
  return <section className="mx-auto max-w-4xl"><div className="rounded-2xl border bg-white p-6 shadow-card sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="grid h-14 w-14 place-items-center rounded-2xl bg-green-50 text-wellness-primary"><CheckCircle2 size={28} /></span><p className="mt-6 text-sm font-semibold uppercase tracking-wide text-wellness-primary">Check-in saved · Readiness {result.score}/100</p><h1 className="mt-2 text-3xl font-bold">{result.report.title}</h1><p className="mt-3 max-w-2xl leading-7 text-wellness-muted">{result.report.summary}</p></div><button type="button" onClick={() => downloadDailyReportPdf(result.report, result.checkIn, fullName)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-semibold text-wellness-primary"><Download size={17} />Download daily PDF</button></div>
    <div className="mt-7 grid gap-5 md:grid-cols-2"><InsightList title="What you are doing well" items={result.report.positives} tone="positive" /><InsightList title="What to improve" items={result.report.improvements} tone="improve" /></div>
    <div className="mt-5 rounded-xl border border-lime-200 bg-lime-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-wellness-primary">Today’s focus</p><p className="mt-2 font-semibold">{result.report.focus}</p></div>
    <div className="mt-5 rounded-xl bg-wellness-background p-5"><h2 className="font-semibold">Plan update · Version {result.version}</h2><p className="mt-2 text-sm leading-6 text-wellness-muted">{result.message}</p><ul className="mt-3 space-y-2">{result.reasons.map((reason) => <li key={reason} className="flex gap-2 text-sm text-wellness-muted"><CheckCircle2 className="mt-0.5 shrink-0 text-wellness-primary" size={16} />{reason}</li>)}</ul></div>
    {result.fallback && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">A safe local adaptation was used for this update.</p>}
    <Link to="/plan" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-wellness-primary px-6 font-semibold text-white">View adapted plan<ArrowRight size={18} /></Link></div></section>
}
function InsightList({ title, items, tone }) { return <div className={`rounded-xl border p-5 ${tone === 'positive' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}><h2 className="font-semibold">{title}</h2><ul className="mt-3 space-y-3">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-wellness-muted"><CheckCircle2 className={`mt-1 shrink-0 ${tone === 'positive' ? 'text-wellness-primary' : 'text-amber-700'}`} size={16} />{item}</li>)}</ul></div> }
function NoPlan({ error }) { return <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-card"><Dumbbell className="mx-auto text-wellness-primary" size={34} /><h1 className="mt-4 text-2xl font-bold">Create a plan before checking in</h1><p className="mt-2 text-wellness-muted">Your check-in needs an active weekly plan to adapt.</p>{error && <ErrorNotice message={error} />}<Link to="/plan" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-wellness-primary px-5 font-semibold text-white">Go to weekly plan<ArrowRight size={17} /></Link></section> }
function Loading() { return <div className="grid min-h-96 place-items-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-wellness-primary" /><p className="mt-3 text-sm text-wellness-muted">Loading your active plan…</p></div></div> }
function ErrorNotice({ message }) { return <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="shrink-0" size={18} />{message}</div> }
function toCheckIn(form, readinessScore) { return { energy: form.energy, sleep_hours: form.sleepHours, sleep_quality: form.sleepQuality, soreness: form.soreness, stress: form.stress, hunger: form.hunger, workout_completed: form.workoutCompleted, diet_adherence: form.dietAdherence, readiness_score: readinessScore, notes: form.notes.trim() } }
function fromRow(row) { return { summary: row.summary, workoutPlan: row.workout_plan, mealPlan: row.meal_plan, adaptationMessage: row.adaptation_message, adaptationReasons: row.adaptation_reasons || [] } }
function dbError(error) { if (/relation .*check_ins.* does not exist/i.test(error.message)) return 'The check-ins table is not ready. Apply the latest Supabase migration.'; return error.message || 'The data could not be saved.' }
