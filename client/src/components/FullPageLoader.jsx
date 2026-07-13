import { LoaderCircle } from 'lucide-react'

export default function FullPageLoader({ label = 'Loading your account' }) {
  return <div className="grid min-h-screen place-items-center bg-wellness-background"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-wellness-primary" size={34} /><p className="mt-3 text-sm font-medium text-wellness-muted">{label}…</p></div></div>
}
