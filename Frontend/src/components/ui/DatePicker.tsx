import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAnchoredPopup } from './useAnchoredPopup'

const parseIso = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : null
}
const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const displayDate = (date: Date | null) => date ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` : ''
const monthName = (date: Date, style: 'long' | 'short' = 'long') => new Intl.DateTimeFormat('en-US', { month: style }).format(date)
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const clampIso = (iso: string, min?: string, max?: string) => Boolean((!min || iso >= min) && (!max || iso <= max))

interface DatePickerProps { value: string; onChange: (iso: string) => void; min?: string; max?: string; id?: string; 'aria-label'?: string; disabled?: boolean }

export function DatePicker({ value, onChange, min, max, id, 'aria-label': ariaLabel, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(displayDate(parseIso(value)))
  const [view, setView] = useState(monthStart(parseIso(value) ?? new Date()))
  const [monthPicker, setMonthPicker] = useState(false)
  const [focusDate, setFocusDate] = useState(parseIso(value) ?? new Date())
  const inputRef = useRef<HTMLInputElement>(null)
  const focusGridOnOpen = useRef(false)
  const yearListRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  const { triggerRef, popupRef, popupStyle } = useAnchoredPopup(open, close)
  const setTriggerRef = (node: HTMLDivElement | null) => { triggerRef.current = node }
  useEffect(() => { setDraft(displayDate(parseIso(value))) }, [value])
  useEffect(() => {
    if (!open) return
    const match = draft.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    const typed = match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null
    const draftDate = typed && typed.getFullYear() === Number(match?.[3]) && typed.getMonth() === Number(match?.[2]) - 1 && typed.getDate() === Number(match?.[1]) ? typed : null
    const selectedDate = draftDate ?? parseIso(value) ?? new Date()
    setView(monthStart(selectedDate))
    setFocusDate(selectedDate)
  }, [open, value, draft])
  useEffect(() => { if (monthPicker) yearListRef.current?.querySelector('.is-current-year')?.scrollIntoView({ block: 'center' }) }, [monthPicker])
  useEffect(() => { if (!open || monthPicker || !focusGridOnOpen.current) return; focusGridOnOpen.current = false; popupRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toIso(focusDate)}"]`)?.focus() }, [focusDate, monthPicker, open])

  const days = useMemo(() => {
    const first = monthStart(view)
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
  }, [view])
  const todayIso = toIso(new Date())
  const yearMin = min ? Number(min.slice(0, 4)) : view.getFullYear() - 100
  const yearMax = max ? Number(max.slice(0, 4)) : view.getFullYear() + 20
  const years = Array.from({ length: Math.max(1, yearMax - yearMin + 1) }, (_, index) => yearMin + index)

  const commitTyped = () => {
    const match = draft.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!match) { setDraft(displayDate(parseIso(value))); return }
    const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    if (date.getFullYear() !== Number(match[3]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[1])) { setDraft(displayDate(parseIso(value))); return }
    const iso = toIso(date)
    if (clampIso(iso, min, max)) { onChange(iso); setView(monthStart(date)); setFocusDate(date) }
    else setDraft(displayDate(parseIso(value)))
  }
  const choose = (date: Date) => {
    const iso = toIso(date)
    if (!clampIso(iso, min, max)) return
    onChange(iso)
    setDraft(displayDate(date))
    close()
    inputRef.current?.focus()
  }
  const moveFocus = (delta: number, month = false) => {
    setFocusDate((current) => {
      const next = month ? new Date(current.getFullYear(), current.getMonth() + delta, current.getDate()) : new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta)
      setView(monthStart(next))
      return next
    })
  }

  return <div className="ui-date-picker">
    <div ref={setTriggerRef} className="ui-date-field">
      <input ref={inputRef} id={id} type="text" inputMode="numeric" autoComplete="off" placeholder="dd/mm/yyyy" value={draft} aria-label={ariaLabel} disabled={disabled} onClick={() => setOpen(true)} onChange={(event) => { const digits = event.target.value.replace(/\D/g, '').slice(0, 8); const nextDraft = digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits; setDraft(nextDraft); const match = nextDraft.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (match) { const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])); if (date.getFullYear() === Number(match[3]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[1])) { setView(monthStart(date)); setFocusDate(date) } } }} onBlur={commitTyped} onKeyDown={(event) => { if (event.key === 'Enter') { commitTyped(); inputRef.current?.blur() } else if (event.key === 'ArrowDown' || (event.key === 'ArrowDown' && event.altKey)) { event.preventDefault(); if (open) { focusGridOnOpen.current = true; popupRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toIso(focusDate)}"]`)?.focus() } else setOpen(true) } else if (event.key === 'Escape') close() }} />
      <button type="button" className="ui-date-trigger" aria-label="Open calendar" aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => setOpen((current) => !current)}><CalendarDays size={16} aria-hidden="true" /></button>
    </div>
    {open && createPortal(<div ref={popupRef} data-modal-portal="true" className="ui-date-popup" role="dialog" aria-label="Choose date" style={popupStyle} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); inputRef.current?.focus() } }}>
      {!monthPicker ? <>
        <div className="ui-date-header"><button type="button" className="ui-date-month-toggle" onClick={() => setMonthPicker(true)}>{monthName(view)} {view.getFullYear()} <ChevronDown size={15} aria-hidden="true" /></button><div><button type="button" aria-label="Previous month" onClick={() => moveFocus(-1, true)}><ChevronLeft size={16}/></button><button type="button" aria-label="Next month" onClick={() => moveFocus(1, true)}><ChevronRight size={16}/></button></div></div>
        <div className="ui-date-weekdays" aria-hidden="true">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="ui-date-grid" role="grid" aria-label={`${monthName(view)} ${view.getFullYear()}`} onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(1) } else if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(-1) } else if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(7) } else if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(-7) } else if (event.key === 'PageDown') { event.preventDefault(); moveFocus(1, true) } else if (event.key === 'PageUp') { event.preventDefault(); moveFocus(-1, true) } else if (event.key === 'Enter') choose(focusDate) }}>
          {days.map((day) => { const iso = toIso(day); return <button key={iso} data-date={iso} type="button" role="gridcell" aria-selected={iso === value} aria-label={new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(day)} disabled={!clampIso(iso, min, max)} tabIndex={toIso(focusDate) === iso ? 0 : -1} className={`ui-date-day${day.getMonth() !== view.getMonth() ? ' is-outside' : ''}${iso === todayIso ? ' is-today' : ''}${iso === value ? ' is-selected' : ''}`} onFocus={() => setFocusDate(day)} onClick={() => choose(day)}>{day.getDate()}</button> })}
        </div>
      </> : <div ref={yearListRef} className="ui-date-year-list" role="listbox" aria-label="Choose year and month">{years.map((year) => <div key={year} className="ui-date-year-row"><button type="button" className={year === view.getFullYear() ? 'is-selected is-current-year' : ''} onClick={() => setView(new Date(year, view.getMonth(), 1))}>{year}</button>{year === view.getFullYear() && <div className="ui-date-month-grid">{Array.from({ length: 12 }, (_, month) => <button type="button" key={month} className={month === view.getMonth() ? 'is-selected' : ''} onClick={() => { setView(new Date(year, month, 1)); setMonthPicker(false) }}>{monthName(new Date(year, month, 1), 'short')}</button>)}</div>}</div>)}</div>}
      <div className="ui-date-footer"><button type="button" onClick={() => { onChange(''); setDraft(''); close(); inputRef.current?.focus() }}>Clear</button><button type="button" disabled={!clampIso(todayIso, min, max)} onClick={() => choose(new Date())}>Today</button></div>
    </div>, document.body)}
  </div>
}
