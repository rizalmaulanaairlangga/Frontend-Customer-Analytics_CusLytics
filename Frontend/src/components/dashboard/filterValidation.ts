import type { DashboardFilters } from '../../types/analytics'

export type FilterValidationResult = { valid: true } | { valid: false; message: string }

function isIsoDate(value: string): boolean {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateDashboardFilters(filters: DashboardFilters): FilterValidationResult {
  if (!isIsoDate(filters.startDate) || !isIsoDate(filters.endDate)) {
    return { valid: false, message: 'Enter valid start and end dates.' }
  }
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    return { valid: false, message: 'Start date must be on or before end date.' }
  }
  return { valid: true }
}
