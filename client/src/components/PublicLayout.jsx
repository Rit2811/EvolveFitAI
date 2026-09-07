import { Activity } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return <div className="min-h-screen"><header className="border-b bg-white"><div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8"><Link to="/" className="flex items-center gap-2 text-lg font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-wellness-primary text-white"><Activity size={20} /></span>EvolveFit <span className="-ml-1.5 text-wellness-primary">AI</span></Link><div className="flex items-center gap-2"><Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-wellness-primary">Sign in</Link><Link to="/register" className="rounded-xl bg-wellness-primary px-4 py-2 text-sm font-semibold text-white">Create account</Link></div></div></header><main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"><Outlet /></main></div>
}
