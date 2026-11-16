import { Activity } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return <div className="min-h-screen"><header className="border-b bg-white"><div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8"><Link to="/" className="flex shrink-0 items-center gap-2 text-base font-bold sm:text-lg"><span className="grid h-9 w-9 place-items-center rounded-xl bg-wellness-primary text-white"><Activity size={20} /></span>VitalTrack <span className="-ml-1 text-wellness-primary">AI</span></Link><div className="flex shrink-0 items-center gap-1"><Link to="/login" className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-wellness-primary">Sign in</Link><Link to="/register" className="whitespace-nowrap rounded-xl bg-wellness-primary px-3 py-2 text-sm font-semibold text-white">Create account</Link></div></div></header><main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"><Outlet /></main></div>
}
