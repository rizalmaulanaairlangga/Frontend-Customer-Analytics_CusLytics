import { useMemo, useState } from 'react'
import type { ProductRank } from '../../types/analytics'
import { formatCurrency, formatNumber } from '../../utils/format'

interface ProductPerformanceProps { products: ProductRank[]; currencyCode?: string }
type RankMetric = 'salesValue' | 'unitsSold'

export function ProductPerformance({ products, currencyCode }: ProductPerformanceProps) {
  const [metric, setMetric] = useState<RankMetric>('salesValue')
  const ranked = useMemo(() => [...products].sort((a, b) => b[metric] - a[metric]), [products, metric])
  const max = Math.max(1, ...ranked.map((item) => item[metric]))
  const formatted = (value: number) => currencyCode && metric === 'salesValue'
    ? formatCurrency(value, currencyCode, 0)
    : formatNumber(value, { maximumFractionDigits: 0 })

  return (
    <section className="panel product-panel" aria-labelledby="product-title">
      <div className="panel-heading">
        <div><p className="eyebrow">Merchandising</p><h2 id="product-title">Product performance</h2></div>
        <label className="compact-select"><span className="sr-only">Rank products by</span>
          <select value={metric} onChange={(event) => setMetric(event.target.value as RankMetric)}>
            <option value="salesValue">Transaction value</option>
            <option value="unitsSold">Units sold</option>
          </select>
        </label>
      </div>
      {ranked.length === 0 ? <p className="inline-empty">No products are available for these filters.</p> : (
        <ol className="product-ranks">
          {ranked.slice(0, 5).map((product, index) => {
            const value = product[metric]
            return (
              <li className="product-rank" key={product.productId}>
                <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                <div className="rank-content">
                  <div className="rank-label"><span title={product.description}>{product.description}</span><strong>{formatted(value)}</strong></div>
                  <div className="rank-track" role="meter" aria-label={`${product.description} ${metric === 'salesValue' ? 'transaction value' : 'units sold'}`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
                    <span style={{ width: `${Math.max(3, value / max * 100)}%`, animationDelay: `${index * 40}ms` }} />
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
