// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './useTheme'

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme()
  return <button type="button" onClick={toggleTheme}>Current theme: {theme}</button>
}

describe('global theme state', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dataset.theme = 'light'
  })

  it('switches the root theme and saves the preference', () => {
    render(<ThemeProvider><ThemeProbe /></ThemeProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Current theme: light' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('cuslytics-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Current theme: dark' })).toBeTruthy()
  })

  it('restores a saved preference on mount', () => {
    localStorage.setItem('cuslytics-theme', 'dark')
    render(<ThemeProvider><ThemeProbe /></ThemeProvider>)
    expect(screen.getByRole('button', { name: 'Current theme: dark' })).toBeTruthy()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
