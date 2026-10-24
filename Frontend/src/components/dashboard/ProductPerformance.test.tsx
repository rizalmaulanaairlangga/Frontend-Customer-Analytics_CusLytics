// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProductPerformance } from './ProductPerformance'

const products = [
  { productId: 'a', description: 'Tea set', salesValue: 100, unitsSold: 2 },
  { productId: 'b', description: 'Serving tray', salesValue: 30, unitsSold: 8 },
]

describe('ProductPerformance', () => {
  it('changes ranking using the selected metric values', () => {
    render(<ProductPerformance products={products} />)

    expect(screen.getAllByRole('listitem')[0].textContent).toContain('Tea set')
    fireEvent.change(screen.getByLabelText('Rank products by'), { target: { value: 'unitsSold' } })
    expect(screen.getAllByRole('listitem')[0].textContent).toContain('Serving tray')
  })
})
