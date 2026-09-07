import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

export default function SearchableMultiSelect({ label, hint, groups, values, onChange, placeholder = 'Search options…', max = 20 }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const visible = useMemo(() => groups.map(([group, items]) => [group, items.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()))]).filter(([, items]) => items.length), [groups, query])
  function toggle(item) {
    if (values.includes(item)) onChange(values.filter((value) => value !== item))
    else if (values.length < max) onChange([...values, item])
  }
  return <div className="min-w-0"><label id={`${id}-label`} className="text-sm font-semibold">{label}</label>{hint && <p className="mt-1 text-xs leading-5 text-wellness-muted">{hint}</p>}
    <button type="button" aria-labelledby={`${id}-label`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="mt-3 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-wellness-background px-4 text-left outline-none hover:border-green-300 focus:border-wellness-primary"><span className={values.length ? 'font-semibold' : 'text-wellness-muted'}>{values.length ? `${values.length} selected` : placeholder}</span><ChevronDown size={18} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} /></button>
    {open && <div className="relative z-20 mt-2 rounded-2xl border bg-white p-3 shadow-xl"><div className="flex items-center gap-2 rounded-xl border bg-wellness-background px-3"><Search size={17} className="text-wellness-muted" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="button" onClick={() => setOpen(false)} aria-label="Close options"><X size={17} /></button></div><div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">{visible.map(([group, items]) => <section key={group}><p className="sticky top-0 bg-white py-1 text-xs font-bold uppercase tracking-wide text-wellness-primary">{group}</p><div className="mt-1 grid gap-1 sm:grid-cols-2">{items.map((item) => { const selected = values.includes(item); return <button type="button" key={item} onClick={() => toggle(item)} className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected ? 'bg-green-50 font-semibold text-wellness-primary' : 'hover:bg-wellness-background'}`}><span>{item}</span>{selected && <Check size={16} />}</button> })}</div></section>)}{!visible.length && <p className="p-4 text-center text-sm text-wellness-muted">No matching option.</p>}</div><div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-wellness-muted"><span>{values.length}/{max} selected</span><button type="button" onClick={() => onChange([])} className="font-semibold text-wellness-primary">Clear all</button></div></div>}
    {values.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{values.map((item) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800">{item}<button type="button" onClick={() => toggle(item)} aria-label={`Remove ${item}`}><X size={13} /></button></span>)}</div>}
  </div>
}
