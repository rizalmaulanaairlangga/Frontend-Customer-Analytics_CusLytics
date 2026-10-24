import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { ProductRank } from '../../types/analytics'

type SortKey = 'unitsSold' | 'salesValue' | 'uniqueInvoices'

function formatNumber(value?: number | null, currencyCode?: string): string {
  if (value === undefined || value === null) return 'Not available'
  return currencyCode
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(value)
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

export function ProductTable({ products, currencyCode, selectedId, onClearSelection }: {
  products: ProductRank[]; currencyCode?: string; selectedId: string | null; onClearSelection: () => void
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('salesValue')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const rows = products.filter((product) => (!selectedId || product.productId === selectedId) && (!normalized || `${product.productId} ${product.description}`.toLocaleLowerCase().includes(normalized)))
    return rows.sort((a, b) => (b[sort] ?? Number.NEGATIVE_INFINITY) - (a[sort] ?? Number.NEGATIVE_INFINITY))
  }, [products, query, selectedId, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const start = filtered.length ? (currentPage - 1) * pageSize + 1 : 0
  const end = Math.min(currentPage * pageSize, filtered.length)

  return (
    <section className="panel products-table-panel" aria-labelledby="products-table-title">
      <div className="panel-heading products-table-heading">
        <div><p className="eyebrow">Product detail</p><h2 id="products-table-title">Product table</h2></div>
        {selectedId && <button className="button button-secondary clear-product-selection" type="button" onClick={onClearSelection}><X size={14} aria-hidden="true" /> Show all products</button>}
      </div>
      {selectedId && <p className="selected-product-note" role="status">Selected product: {selectedId}</p>}
      <div className="product-table-tools">
        <label className="product-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search products</span><input type="search" role="searchbox" aria-label="Search products" placeholder="Search StockCode or description" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label>
        <label className="compact-select table-select"><span>Sort by</span><select aria-label="Sort products by" value={sort} onChange={(event) => { setSort(event.target.value as SortKey); setPage(1) }}><option value="salesValue">Transaction Value</option><option value="unitsSold">Total Units</option><option value="uniqueInvoices">Unique Invoices</option></select></label>
        <label className="compact-select table-select page-size-select"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label>
      </div>
      <div className="product-table-scroll">
        <table className="product-table">
          <thead><tr><th scope="col">StockCode</th><th scope="col">Description</th><th scope="col">Total Units</th><th scope="col">Transaction Value</th><th scope="col">Unique Invoices</th></tr></thead>
          <tbody>
            {visible.map((product) => <tr key={product.productId}>
              <th scope="row" data-label="StockCode">{product.productId}</th><td data-label="Description" className="product-description-cell">{product.description}</td>
              <td data-label="Total Units">{formatNumber(product.unitsSold)}</td><td data-label="Transaction Value">{formatNumber(product.salesValue, currencyCode)}</td><td data-label="Unique Invoices">{formatNumber(product.uniqueInvoices)}</td>
            </tr>)}
            {!visible.length && <tr><td className="product-table-empty" colSpan={5}>{filtered.length ? 'No products on this page.' : query || selectedId ? 'No products match this selection.' : 'Product rows are not available from the connected source.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="product-table-footer"><span>Showing {start} to {end} of {filtered.length} products</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous page</button><span aria-live="polite">Page {currentPage} of {pageCount}</span><button className="button button-secondary" type="button" disabled={currentPage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next page</button></div></div>
    </section>
  )
}
