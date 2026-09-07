import { Activity, Bot, CheckCircle2, Dumbbell, Home, LogOut, Menu, TrendingUp, User, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

const items = [['/dashboard', 'Dashboard', Home], ['/plan', 'Weekly plan', Dumbbell], ['/check-in', 'Weekly check-in', CheckCircle2], ['/progress', 'Progress', TrendingUp], ['/coach', 'AI coach', Bot], ['/profile', 'Profile', User]]

function Navigation({ close }) {
  return <nav className="space-y-1" aria-label="Application navigation">{items.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={close} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-wellness-primary text-white shadow-sm' : 'text-wellness-muted hover:bg-wellness-background hover:text-wellness-text'}`}><Icon size={18} />{label}</NavLink>)}</nav>
}

function Brand() { return <NavLink to="/dashboard" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-wellness-primary text-white"><Activity size={20} /></span>EvolveFit <span className="-ml-1.5 text-wellness-primary">AI</span></NavLink> }

export default function AppShell() {
  const [open, setOpen] = useState(false)
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const displayName = profile?.full_name || user?.email || 'Account'
  async function leave() { await signOut(); navigate('/', { replace: true }) }

  return <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]"><aside className="hidden border-r bg-white p-5 lg:flex lg:flex-col"><Brand /><div className="mt-9 flex-1"><Navigation /></div><div className="border-t pt-4"><div className="flex items-center gap-3 px-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-50 font-bold text-wellness-primary">{displayName.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{displayName}</p></div><button type="button" onClick={leave} className="rounded-lg p-2 text-wellness-muted hover:bg-wellness-background" aria-label="Sign out"><LogOut size={18} /></button></div></div></aside>
    <div className="min-w-0"><header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 p-4 backdrop-blur lg:hidden"><Brand /><button className="rounded-xl border p-2" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button></header>{open && <div className="fixed inset-0 z-10 bg-black/20 lg:hidden" onClick={() => setOpen(false)}><div className="absolute right-0 top-[73px] w-full max-w-sm border-l bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}><Navigation close={() => setOpen(false)} /><button type="button" onClick={leave} className="mt-4 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold text-wellness-muted"><LogOut size={18} />Sign out</button></div></div>}<main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8"><Outlet /></main></div>
  </div>
}
