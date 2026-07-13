import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidCatch(error, details) {
    if (import.meta.env.DEV) console.error('EvolveFit render error', error, details)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="grid min-h-screen place-items-center bg-wellness-background p-4"><section className="w-full max-w-lg rounded-2xl border bg-white p-6 text-center shadow-card sm:p-8"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><AlertTriangle size={28} /></span><h1 className="mt-5 text-2xl font-bold">Something interrupted this screen</h1><p className="mt-3 leading-7 text-wellness-muted">Your saved account data is safe. Reload the application to restore the latest profile, plan, and check-in state.</p><button type="button" onClick={() => window.location.reload()} className="mx-auto mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-wellness-primary px-5 font-semibold text-white"><RefreshCw size={18} />Reload application</button></section></main>
  }
}
