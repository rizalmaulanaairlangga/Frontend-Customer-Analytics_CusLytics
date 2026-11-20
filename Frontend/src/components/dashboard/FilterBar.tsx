import { useState, type FormEvent } from 'react'
import type { DashboardFilters } from '../../types/analytics'
import { validateDashboardFilters } from './filterValidation'
import { Select } from '../ui/Select'
import { DatePicker } from '../ui/DatePicker'

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
          <DatePicker aria-label="Start date" value={value.startDate} onChange={(startDate) => onChange({ ...value, startDate })} max={value.endDate || undefined} />
        </label>
        <label className="field-label">
          <span>End date</span>
          <DatePicker aria-label="End date" value={value.endDate} onChange={(endDate) => onChange({ ...value, endDate })} min={value.startDate || undefined} />
        </label>
        <label className="field-label field-country">
          <span>Country</span>
          <Select aria-label="Country" value={value.country} onChange={(country) => onChange({ ...value, country })}>
            <option value="">All countries</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </Select>
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
