import { ArrowRight, HeartPulse } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHealth } from '../lib/api'

export default function HomePage() {
  const [status, setStatus] = useState('checking')
  useEffect(() => {
    const controller = new AbortController()
    getHealth(controller.signal).then(() => setStatus('connected')).catch((error) => {
      if (error.name !== 'AbortError') setStatus('offline')
    })
    return () => controller.abort()
  }, [])
  return <section className="grid min-h-[75vh] items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
    <div><p className="font-semibold text-wellness-primary">Personalized wellness, evolved</p><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">A fitness and nutrition plan that adapts with you.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-wellness-muted">Build a practical weekly routine around your goals, schedule, equipment, food preferences, and daily recovery.</p><div className="mt-8 flex gap-3"><Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-wellness-primary px-5 py-3 font-semibold text-white">Get started <ArrowRight size={18} /></Link><Link to="/login" className="rounded-xl border bg-white px-5 py-3 font-semibold">Sign in</Link></div></div>
    <div className="rounded-2xl border bg-white p-6 shadow-card"><HeartPulse className="text-wellness-primary" size={32} /><h2 className="mt-5 text-xl font-semibold">Foundation status</h2><p className="mt-2 text-wellness-muted">The client is checking its connection to the EvolveFit API.</p><div className="mt-6 flex items-center gap-3 rounded-xl bg-wellness-background p-4"><span className={`h-3 w-3 rounded-full ${status === 'connected' ? 'bg-lime-500' : status === 'offline' ? 'bg-red-500' : 'animate-pulse bg-amber-500'}`} /><span className="font-medium">API {status}</span></div></div>
  </section>
}
