// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FilterBar } from './FilterBar'
import type { DashboardFilters } from '../../types/analytics'

const initial: DashboardFilters = { startDate: '', endDate: '', country: '' }

function ControlledFilterBar({ onApply, value: startingValue = initial }: { onApply: (filters: DashboardFilters) => void; value?: DashboardFilters }) {
  const [value, setValue] = useState(startingValue)
  return <FilterBar value={value} countries={['United Kingdom']} onChange={setValue} onApply={onApply} />
}

describe('FilterBar', () => {
  it('submits the draft date and country filters on Apply', () => {
    const onApply = vi.fn()
    render(<ControlledFilterBar onApply={onApply} />)

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2025-01-31' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'United Kingdom' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

    expect(onApply).toHaveBeenCalledWith({ startDate: '2025-01-01', endDate: '2025-01-31', country: 'United Kingdom' })
  })

  it('resets draft filters through an explicit reset action', () => {
    const onApply = vi.fn()
    render(<ControlledFilterBar value={{ startDate: '2025-01-01', endDate: '2025-01-31', country: 'United Kingdom' }} onApply={onApply} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(onApply).toHaveBeenCalledWith(initial)
  })
})
