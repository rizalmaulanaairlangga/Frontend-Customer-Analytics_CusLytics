import { describe, expect, it } from 'vitest'
import { validateDashboardFilters } from './filterValidation'

describe('validateDashboardFilters', () => {
  it('accepts a valid inclusive date range', () => {
    expect(validateDashboardFilters({ startDate: '2025-01-01', endDate: '2025-01-31', country: '' })).toEqual({ valid: true })
  })

  it('rejects dates that do not use a real ISO calendar date', () => {
    expect(validateDashboardFilters({ startDate: '2025-02-30', endDate: '2025-03-01', country: '' })).toEqual({ valid: false, message: 'Enter valid start and end dates.' })
  })

  it('rejects a start date after the end date', () => {
    expect(validateDashboardFilters({ startDate: '2025-04-01', endDate: '2025-03-31', country: '' })).toEqual({ valid: false, message: 'Start date must be on or before end date.' })
  })

  it('allows either boundary to be unset', () => {
    expect(validateDashboardFilters({ startDate: '', endDate: '2025-03-31', country: '' })).toEqual({ valid: true })
  })
})
