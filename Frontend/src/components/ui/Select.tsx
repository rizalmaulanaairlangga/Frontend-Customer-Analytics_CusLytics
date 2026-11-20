import { Children, isValidElement, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { useAnchoredPopup } from './useAnchoredPopup'

function optionText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(optionText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return optionText(node.props.children)
  return ''
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
  children?: ReactNode
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function Select({ value, onChange, options: providedOptions, children, id, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, disabled, className = '', placeholder = 'Select an option' }: SelectProps) {
  const generatedId = useId()
  const listId = `${id ?? generatedId}-listbox`
  const options = providedOptions ?? Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return []
    return [{ value: String(child.props.value ?? ''), label: optionText(child.props.children), disabled: child.props.disabled }]
  })
  const [open, setOpen] = useState(false)
  const enabled = options.filter((option) => !option.disabled)
  const selected = options.find((option) => option.value === value)
  const [activeValue, setActiveValue] = useState(value || enabled[0]?.value || '')
  const typeahead = useRef('')
  const typeaheadTimer = useRef<number | undefined>(undefined)
  const triggerElement = useRef<HTMLButtonElement>(null)
  const close = () => setOpen(false)
  const { triggerRef, popupRef, popupStyle } = useAnchoredPopup(open, close)
  useEffect(() => {
    if (!open || !activeValue) return
    document.getElementById(`${listId}-${encodeURIComponent(activeValue)}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeValue, listId, open])
  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerElement.current = node
    triggerRef.current = node
  }
  const currentIndex = enabled.findIndex((option) => option.value === (open ? activeValue : value))
  const optionId = (optionValue: string) => `${listId}-${encodeURIComponent(optionValue)}`

  const show = (move: number = 0) => {
    const current = enabled.findIndex((option) => option.value === value)
    const index = move ? (current + move + enabled.length) % enabled.length : Math.max(0, current)
    setActiveValue(enabled[index]?.value ?? '')
    setOpen(true)
  }
  const choose = (option: SelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setActiveValue(option.value)
    close()
    triggerElement.current?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = Math.max(0, currentIndex)
    if (event.key === 'Tab') { close(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) show(event.key === 'ArrowDown' ? 1 : -1)
      else setActiveValue(enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]?.value ?? '')
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActiveValue((event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1])?.value ?? '')
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) { const option = options.find((item) => item.value === activeValue); if (option) choose(option) }
      else show()
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeahead.current += event.key.toLocaleLowerCase()
      window.clearTimeout(typeaheadTimer.current)
      typeaheadTimer.current = window.setTimeout(() => { typeahead.current = '' }, 700)
      const match = enabled.find((option) => option.label.toLocaleLowerCase().startsWith(typeahead.current))
      if (match) { setActiveValue(match.value); setOpen(true) }
    }
  }

  return <div className={`ui-select ${className}`.trim()}>
    <button ref={setTriggerRef} id={id} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeValue ? optionId(activeValue) : undefined} aria-label={ariaLabel} aria-labelledby={labelledBy} disabled={disabled} className="ui-select-trigger" onClick={() => open ? close() : show()} onKeyDown={onKeyDown}>
      <span className="ui-select-value">{selected?.label ?? placeholder}</span><ChevronDown className={`ui-select-chevron${open ? ' is-open' : ''}`} size={16} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={popupRef} data-modal-portal="true" id={listId} role="listbox" aria-labelledby={labelledBy} className="ui-select-popup" style={popupStyle}>
      {options.map((option) => <button key={option.value} id={optionId(option.value)} type="button" role="option" aria-selected={option.value === value} aria-disabled={option.disabled || undefined} disabled={option.disabled} className={`ui-select-option${option.value === activeValue ? ' is-active' : ''}${option.value === value ? ' is-selected' : ''}`} onMouseEnter={() => setActiveValue(option.value)} onClick={() => choose(option)}><span>{option.label}</span>{option.value === value && <Check size={15} aria-hidden="true" />}</button>)}
    </div>, document.body)}
  </div>
}
