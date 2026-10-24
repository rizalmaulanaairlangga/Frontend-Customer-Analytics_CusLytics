// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('application routes', () => {
  it('provides the requested navigation and labels unimplemented modules', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Overview Dashboard' }, { timeout: 5000 })

    for (const label of ['Overview Dashboard', 'Data Status / Quality', 'Sales & Products', 'Customer Analytics', 'ML Studio', 'Model Evaluation', 'Action Center', 'Reports']) {
      expect(screen.getAllByRole('link', { name: new RegExp(label, 'i') }).length).toBeGreaterThan(0)
    }
    fireEvent.click(screen.getAllByRole('link', { name: /Customer Analytics/i })[0])
    expect(await screen.findByRole('heading', { name: 'Customer Analytics' })).toBeTruthy()
    expect(await screen.findByText(/Belum terhubung ke backend/i)).toBeTruthy()
  })

  it('supports keyboard-visible mobile navigation controls', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)

    expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('false')
    expect(await screen.findByRole('heading', { name: 'Overview Dashboard' })).toBeTruthy()
  })

  it('keeps the drawer close action inside the open drawer', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Overview Dashboard' })
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    expect(screen.getByRole('button', { name: 'Close menu' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('false')
  })

  it('opens Data Status / Quality and changes the shared theme without reloading', async () => {
    render(<MemoryRouter initialEntries={['/data-quality']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Data Status / Quality' })).toBeTruthy()
    expect((await screen.findAllByText('Belum terhubung')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Demo Data')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('heading', { name: 'Data Status / Quality' })).toBeTruthy()
  })

  it('opens Sales & Products from the existing navigation', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    fireEvent.click(screen.getByRole('link', { name: /Sales & Products/i }))
    expect(await screen.findByRole('heading', { name: 'Sales & Products' })).toBeTruthy()
    expect(await screen.findByText('Demo Data')).toBeTruthy()
  })

  it('opens ML Studio and reports that experiments are unavailable without backend metadata', async () => {
    render(<MemoryRouter initialEntries={['/ml-studio']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'ML Studio' })).toBeTruthy()
    expect(await screen.findAllByText('Belum terhubung ke backend')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Run K-Means Experiment' })).toBeTruthy()
    expect(screen.getAllByText('Backend Unavailable').length).toBeGreaterThan(0)
  })
})
