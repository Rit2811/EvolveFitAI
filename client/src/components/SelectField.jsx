import { ChevronDown } from 'lucide-react'
import { useId } from 'react'

export default function SelectField({ label, value, onChange, options, placeholder = 'Choose an option', hint, className = '' }) {
  const id = useId()
  const hintId = `${id}-hint`
  return <label htmlFor={id} className={`block min-w-0 ${className}`}><span className="mb-2 block text-sm font-semibold">{label}</span><span className="relative block"><select id={id} value={value} onChange={(event) => onChange(event.target.value)} required aria-describedby={hint ? hintId : undefined} className="h-12 w-full appearance-none rounded-xl border bg-wellness-background px-4 pr-11 outline-none transition focus:border-wellness-primary focus:ring-1 focus:ring-wellness-primary"><option value="" disabled>{placeholder}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown aria-hidden="true" size={19} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-wellness-muted" /></span>{hint && <span id={hintId} className="mt-1.5 block text-xs leading-5 text-wellness-muted">{hint}</span>}</label>
}
