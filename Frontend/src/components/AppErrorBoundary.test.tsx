// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

describe('AppErrorBoundary', () => {
  it('shows a safe fallback when a child throws at runtime', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function BrokenView(): never { throw new Error('private source path and stack') }

    render(<AppErrorBoundary><BrokenView /></AppErrorBoundary>)

    expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeTruthy()
    expect(screen.queryByText(/private source path|stack/i)).toBeNull()
    vi.restoreAllMocks()
  })
})
