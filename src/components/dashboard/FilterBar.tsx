import { useState, type FormEvent } from 'react'
import type { DashboardFilters } from '../../types/analytics'
import { validateDashboardFilters } from './filterValidation'

interface FilterBarProps {
  value: DashboardFilters
  countries: string[]
  onChange: (filters: DashboardFilters) => void
  onApply: (filters: DashboardFilters) => void
}

export function FilterBar({ value, countries, onChange, onApply }: FilterBarProps) {
  const [validationMessage, setValidationMessage] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateDashboardFilters(value)
    if (!validation.valid) {
      setValidationMessage(validation.message)
      return
    }
    setValidationMessage('')
    onApply(value)
  }

  function reset() {
    const emptyFilters = { startDate: '', endDate: '', country: '' }
    setValidationMessage('')
    onChange(emptyFilters)
    onApply(emptyFilters)
  }

  return (
    <form className="filter-bar" onSubmit={submit} aria-label="Dashboard filters">
      <div className="filter-fields">
        <label className="field-label">
          <span>Start date</span>
          <input type="date" value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} />
        </label>
        <label className="field-label">
          <span>End date</span>
          <input type="date" value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} />
        </label>
        <label className="field-label field-country">
          <span>Country</span>
          <select value={value.country} onChange={(event) => onChange({ ...value, country: event.target.value })}>
            <option value="">All countries</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </label>
      </div>
      <div className="filter-actions">
        <button className="button button-primary" type="submit">Apply filters</button>
        <button className="button button-quiet" type="button" onClick={reset}>Reset filters</button>
      </div>
      {validationMessage && <p className="form-error" role="alert">{validationMessage}</p>}
    </form>
  )
}
