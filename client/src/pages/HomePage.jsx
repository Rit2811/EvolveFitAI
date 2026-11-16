import { Activity, ArrowUpRight, Dumbbell, Leaf, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const pillars = [
  [Dumbbell, 'Move with purpose', 'Workouts shaped by your time, equipment, and preferences.'],
  [Leaf, 'Eat around your life', 'Meal choices and timings that fit your everyday routine.'],
  [Activity, 'Notice your progress', 'Daily check-ins bring sleep, energy, and consistency into view.'],
]

export default function HomePage() {
  return <section className="py-12 sm:py-20">
    <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-wellness-primary">VitalTrack AI / Everyday wellbeing</p>
        <h1 className="mt-6 max-w-3xl text-5xl font-normal leading-[1.08] sm:text-7xl">Find your rhythm.<br /><span className="italic text-wellness-primary">Build your wellbeing.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-wellness-muted">Personalized fitness coaching, practical meals, and a clearer picture of your health habits. All connected to the way you actually live.</p>
        <Link to="/dashboard" className="mt-8 inline-flex items-center gap-5 rounded-xl bg-wellness-ink px-6 py-4 font-semibold text-white transition hover:bg-wellness-primary">Open app <ArrowUpRight size={20} /></Link>
        <p className="mt-4 text-sm text-wellness-muted">Your routine. Your pace. One place to keep it together.</p>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-wellness-ink p-7 text-white shadow-card sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[36px] border-white/5" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-teal-200">A little structure. More clarity.</p>
        <h2 className="relative mt-5 text-4xl font-normal leading-tight">A routine that<br />starts with you.</h2>
        <div className="relative mt-8 space-y-6">{pillars.map(([Icon, title, description], index) => <div key={title} className="flex gap-4 border-t border-white/15 pt-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-900"><Icon size={21} /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-teal-200">0{index + 1}</p><h3 className="mt-1 font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{description}</p></div>
        </div>)}</div>
        <div className="mt-8 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-teal-100"><MessageCircle size={18} className="shrink-0" />AI coaching, with your current plan in view.</div>
      </div>
    </div>
    <footer className="mt-14 border-t pt-6 text-xs leading-6 text-wellness-muted">VitalTrack AI · Personalized Fitness Coaching and Health Tracking. General wellness guidance; not a medical assessment.</footer>
  </section>
}
