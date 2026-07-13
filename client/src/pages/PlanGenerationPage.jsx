import { AlertCircle, Apple, CalendarDays, CheckCircle2, ChefHat, Clock3, Dumbbell, Flame, Gauge, Leaf, LoaderCircle, MoonStar, Sparkles, Utensils } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { generatePlan, isCompletePlan } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function PlanGenerationPage() {
  const { user, profile } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [fallback, setFallback] = useState(false)
  const [generationBlocked, setGenerationBlocked] = useState(false)

  useEffect(() => {
    let active = true
    supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data, error: loadError }) => {
      if (!active) return
      if (loadError) { setError(planError(loadError)); setGenerationBlocked(true) }
      else if (data) {
        const savedPlan = fromRow(data)
        if (isCompletePlan(savedPlan)) setPlan(savedPlan)
        else { setError('Your saved plan is incomplete. Please contact support before generating another plan.'); setGenerationBlocked(true) }
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [user.id])

  async function createPlan() {
    setGenerating(true); setError(''); setFallback(false)
    try {
      const generated = await generatePlan(profile)
      const { source, ...content } = generated
      const row = { user_id: user.id, workout_plan: content.workoutPlan, meal_plan: content.mealPlan, summary: content.summary, adaptation_message: content.adaptationMessage, adaptation_reasons: content.adaptationReasons || [], version: 1, is_active: true }
      const { data, error: saveError } = await supabase.from('plans').insert(row).select().single()
      if (saveError) throw new Error(planError(saveError))
      setPlan(fromRow(data)); setFallback(source === 'fallback')
    } catch (generationError) { setError(generationError.message || 'We could not generate your plan. Please try again.') }
    finally { setGenerating(false) }
  }

  if (loading) return <GenerationSkeleton label="Loading your active plan" />
  if (generating) return <GenerationSkeleton label="Building your personalized week" generating />
  if (plan) return <PlanExperience plan={plan} profile={profile} fallback={fallback} />
  return <EmptyPlan profile={profile} error={error} onGenerate={createPlan} generationBlocked={generationBlocked} />
}

function EmptyPlan({ profile, error, onGenerate, generationBlocked }) {
  return <section className="mx-auto max-w-4xl"><p className="text-sm font-semibold uppercase tracking-wider text-wellness-primary">Your weekly plan</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Ready when you are, {profile.full_name?.split(' ')[0]}.</h1><p className="mt-3 max-w-2xl leading-7 text-wellness-muted">We will build seven days of workouts and meals around your availability and preferences.</p><div className="mt-8 rounded-2xl border bg-white p-6 shadow-card sm:p-8"><div className="grid gap-4 sm:grid-cols-3"><Constraint icon={Dumbbell} label="Training" value={`${profile.workout_days} days · ${profile.workout_duration} min`} /><Constraint icon={CalendarDays} label="Goal" value={profile.goal} /><Constraint icon={Utensils} label="Nutrition" value={profile.diet_type} /></div><div className="mt-7 rounded-xl bg-wellness-background p-4 text-sm leading-6 text-wellness-muted">Your equipment, allergies, disliked foods, experience level, and cooking preference are treated as fixed constraints.</div>{error && <ErrorNotice message={error} />}{!generationBlocked && <button onClick={onGenerate} className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-wellness-primary px-6 font-semibold text-white"><Sparkles size={19} />Generate my plan</button>}</div></section>
}

function PlanExperience({ plan, profile, fallback }) {
  const [tab, setTab] = useState('workouts')
  const activeDays = plan.workoutPlan.filter((day) => !day.isRestDay).length
  return <section className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-wellness-primary">Active weekly plan</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your personalized week</h1><p className="mt-2 text-wellness-muted">Built for {profile.goal?.toLowerCase()} with your schedule and preferences in mind.</p></div><div className="flex flex-wrap gap-2"><MetaPill label={`Version ${plan.version}`} /><MetaPill label={formatDate(plan.createdAt)} /><MetaPill label={profile.goal} /></div></div>
    {fallback && <div className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="shrink-0" size={19} />Demo plan generated using the local fallback.</div>}
    <PreferenceSummary profile={profile} />
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><div className="rounded-2xl border bg-white p-6 shadow-card"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-wellness-primary"><Sparkles size={21} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-wellness-muted">Weekly strategy</p><h2 className="font-semibold">A practical path toward {profile.goal?.toLowerCase()}</h2></div></div><p className="mt-4 leading-7 text-wellness-muted">{plan.summary}</p></div><div className="grid grid-cols-2 gap-3"><Constraint icon={Dumbbell} label="Training" value={`${activeDays} days`} /><Constraint icon={Utensils} label="Meals" value="7 days" /></div></div>
    <AdaptationCard message={plan.adaptationMessage} reasons={plan.adaptationReasons} />
    <div className="mt-8 flex w-full max-w-md rounded-xl border bg-white p-1" role="tablist" aria-label="Plan type"><Tab active={tab === 'workouts'} onClick={() => setTab('workouts')} icon={Dumbbell}>Workouts</Tab><Tab active={tab === 'meals'} onClick={() => setTab('meals')} icon={Utensils}>Meals</Tab></div>
    <div className="mt-5"><div className="mb-4"><h2 className="text-2xl font-bold">{tab === 'workouts' ? 'Workout schedule' : 'Meal schedule'}</h2><p className="mt-1 text-sm text-wellness-muted">All seven days, planned around your {tab === 'workouts' ? `${profile.workout_duration}-minute availability` : `${profile.diet_type?.toLowerCase()} preferences`}.</p></div>{tab === 'workouts' ? <WorkoutGrid days={plan.workoutPlan} /> : <MealGrid days={plan.mealPlan} />}</div>
  </section>
}

function WorkoutGrid({ days }) { return <div className="grid min-w-0 gap-4 xl:grid-cols-2">{days.map((day) => <WorkoutCard key={day.day} day={day} />)}</div> }
function WorkoutCard({ day }) {
  if (day.isRestDay) return <article className="flex min-h-52 flex-col justify-between rounded-2xl border border-dashed bg-white p-5"><div><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-wellness-primary">{day.day}</span><span className="rounded-full bg-wellness-background px-3 py-1 text-xs font-semibold text-wellness-muted">Rest day</span></div><div className="mt-6 flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-wellness-primary"><MoonStar size={22} /></span><div><h3 className="text-lg font-semibold">{day.title || 'Recovery day'}</h3><p className="mt-2 text-sm leading-6 text-wellness-muted">Let your body recover. Easy walking and comfortable mobility are optional, not requirements.</p></div></div></div><p className="mt-5 text-xs font-medium text-wellness-muted">Recovery supports consistency across the rest of your week.</p></article>
  return <article className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b bg-wellness-background p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-wellness-primary">{day.day}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-wellness-muted">{day.type}</span></div><h3 className="mt-3 text-xl font-semibold">{day.title}</h3><div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-wellness-muted"><span className="flex items-center gap-1.5"><Clock3 size={15} />{day.duration} min</span><span className="flex items-center gap-1.5"><Gauge size={15} />{day.intensity}</span><span className="flex items-center gap-1.5"><Dumbbell size={15} />{day.exercises.length} exercises</span></div></div><div className="divide-y px-5">{day.exercises.map((exercise, index) => <ExerciseRow key={`${exercise.name}-${index}`} exercise={exercise} />)}</div></article>
}
function ExerciseRow({ exercise }) { return <div className="min-w-0 py-4"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h4 className="break-words text-sm font-semibold">{exercise.name}</h4><p className="mt-1 text-xs text-wellness-muted">{exercise.equipment}</p></div><span className="shrink-0 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-wellness-primary">{exercise.sets} × {exercise.reps}</span></div><p className="mt-2 break-words text-sm leading-6 text-wellness-muted">{exercise.instruction}</p><p className="mt-2 text-xs font-medium text-wellness-muted">Rest {exercise.restSeconds} seconds</p></div> }

function MealGrid({ days }) { return <div className="grid min-w-0 gap-4 xl:grid-cols-2">{days.map((day) => <MealCard key={day.day} day={day} />)}</div> }
function MealCard({ day }) { const meals = [[Apple, 'Breakfast', day.breakfast], [Leaf, 'Lunch', day.lunch], [ChefHat, 'Dinner', day.dinner], [Utensils, 'Snack', day.snack]]; return <article className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b bg-wellness-background p-5"><div><span className="text-sm font-bold text-wellness-primary">{day.day}</span><h3 className="mt-1 text-lg font-semibold">Daily meals</h3></div><div className="text-right text-xs font-semibold text-wellness-muted"><p className="flex items-center justify-end gap-1"><Flame size={14} />~{day.estimatedCalories} kcal</p><p className="mt-1">~{day.estimatedProtein}g protein</p></div></div><div className="divide-y px-5">{meals.map(([Icon, label, meal]) => <div key={label} className="flex min-w-0 gap-3 py-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-50 text-wellness-primary"><Icon size={17} /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-wellness-muted">{label}</p><p className="mt-1 break-words text-sm font-medium leading-6">{meal}</p></div></div>)}</div></article> }

function AdaptationCard({ message, reasons }) { return <div className="mt-5 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-lime-50 p-5 sm:p-6"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-wellness-primary shadow-sm"><Sparkles size={21} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-wellness-primary">Why this plan fits</p><h2 className="mt-1 text-lg font-semibold">{message}</h2>{Array.isArray(reasons) && reasons.length > 0 && <ul className="mt-3 space-y-2 text-sm text-wellness-muted">{reasons.map((reason) => <li key={reason} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-wellness-primary" size={16} />{reason}</li>)}</ul>}</div></div></div> }
function Tab({ active, onClick, icon: Icon, children }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${active ? 'bg-wellness-primary text-white shadow-sm' : 'text-wellness-muted hover:text-wellness-text'}`}><Icon size={18} />{children}</button> }
function MetaPill({ label }) { return <span className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-wellness-muted">{label}</span> }
function PreferenceSummary({ profile }) { const days = profile.workout_day_preferences?.length ? profile.workout_day_preferences.map((day) => day.slice(0, 3)).join(', ') : 'Balanced automatically'; const foods = profile.preferred_foods?.length ? profile.preferred_foods.join(', ') : 'No favorites selected'; const excluded = [...(profile.disliked_foods || []), ...(profile.allergies || [])].join(', ') || 'None'; return <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-card"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-wellness-primary">Your personalization</p><p className="mt-2 text-sm text-wellness-muted"><span className="font-semibold text-wellness-text">Workout days:</span> {days} <span className="mx-1">·</span> <span className="font-semibold text-wellness-text">Food favorites:</span> {foods}</p><p className="mt-1 text-sm text-wellness-muted"><span className="font-semibold text-wellness-text">Food exclusions:</span> {excluded}</p></div><Link to="/profile" className="shrink-0 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-wellness-primary">Personalize and regenerate</Link></div> }
function Constraint({ icon: Icon, label, value }) { return <div className="min-w-0 rounded-xl border bg-white p-4"><Icon className="text-wellness-primary" size={20} /><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-wellness-muted">{label}</p><p className="mt-1 truncate font-semibold">{value}</p></div> }
function ErrorNotice({ message }) { return <div role="alert" className="mt-6 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="shrink-0" size={19} />{message}</div> }
function GenerationSkeleton({ label, generating }) { return <section className="mx-auto max-w-4xl" aria-live="polite"><div className="rounded-2xl border bg-white p-8 text-center shadow-card"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-50 text-wellness-primary">{generating ? <Sparkles className="animate-pulse" /> : <LoaderCircle className="animate-spin" />}</span><h1 className="mt-5 text-2xl font-bold">{label}…</h1><p className="mt-2 text-wellness-muted">{generating ? 'Checking training constraints, meal preferences, and recovery-friendly pacing.' : 'This should only take a moment.'}</p><div className="mx-auto mt-8 max-w-xl space-y-3"><div className="h-4 animate-pulse rounded bg-wellness-border" /><div className="h-20 animate-pulse rounded-xl bg-wellness-background" /><div className="h-20 animate-pulse rounded-xl bg-wellness-background" /></div></div></section> }
function fromRow(row) { return { summary: row.summary, workoutPlan: row.workout_plan, mealPlan: row.meal_plan, adaptationMessage: row.adaptation_message, adaptationReasons: row.adaptation_reasons, version: row.version, createdAt: row.created_at } }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
function planError(error) { if (/relation .*plans.* does not exist/i.test(error.message)) return 'The plans table is not ready. Apply the latest Supabase migration, then try again.'; if (/duplicate key/i.test(error.message)) return 'An active plan already exists. Refresh the page to load it.'; return error.message || 'The plan could not be saved.' }
