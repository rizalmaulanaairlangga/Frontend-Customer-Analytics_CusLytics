import { useState } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import type { CustomerRfmRecord, RfmMetric } from '../../types/customerAnalytics'
import { CustomerDetailDrawer } from './CustomerDetailDrawer'

type SortKey = 'customerId' | RfmMetric

function number(value: number | null, currencyCode?: string, currency = false): string {
  if (value === null) return '—'
  try {
    return new Intl.NumberFormat('id-ID', currency && currencyCode ? { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }).format(value)
  } catch {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)
  }
}

export function CustomerDirectory({ customers, currencyCode, observationDate, analysisPeriod, onSelect }: { customers: CustomerRfmRecord[]; currencyCode?: string; observationDate?: string; analysisPeriod?: { start: string; end: string }; onSelect?: (customer: CustomerRfmRecord) => void }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('customerId')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<CustomerRfmRecord | null>(null)
  const filtered = customers.filter((customer) => customer.customerId.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'customerId') return a.customerId.localeCompare(b.customerId, undefined, { numeric: true })
    return (b[sort] ?? Number.NEGATIVE_INFINITY) - (a[sort] ?? Number.NEGATIVE_INFINITY)
  })
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = sorted.length ? (currentPage - 1) * pageSize + 1 : 0
  const end = Math.min(currentPage * pageSize, sorted.length)
  const visible = sorted.slice(start - 1, end)
  const reset = () => { setQuery(''); setSort('customerId'); setPageSize(10); setPage(1) }

  return (
    <section className="panel customer-directory" aria-labelledby="customer-directory-title">
      <div className="panel-heading">
        <div><p className="eyebrow">Customer records</p><h2 id="customer-directory-title">Customer Directory</h2></div>
        <button className="button button-secondary" type="button" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset filters</button>
      </div>
      <p className="panel-subtitle">Satu baris mewakili satu pelanggan yang disediakan oleh sumber data.</p>
      <div className="customer-table-tools">
        <label className="customer-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search customers</span><input type="search" role="searchbox" aria-label="Search customers" placeholder="Cari Customer ID" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label>
        <label className="compact-select customer-table-select"><span>Urutkan</span><select aria-label="Sort customers by" value={sort} onChange={(event) => { setSort(event.target.value as SortKey); setPage(1) }}><option value="customerId">Customer ID</option><option value="recency">Recency</option><option value="frequency">Frequency</option><option value="monetary">Monetary</option></select></label>
        <label className="compact-select customer-table-select customer-page-size"><span>Baris</span><select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label>
      </div>
      <div className="customer-table-scroll">
        {!currencyCode && <p className="customer-currency-note">Satuan mata uang Monetary belum dilaporkan oleh sumber data.</p>}
        <table className="customer-table">
          <thead><tr><th scope="col">Customer ID</th><th scope="col">Recency <span>(hari)</span></th><th scope="col">Frequency <span>(faktur)</span></th><th scope="col">Monetary{currencyCode && <span> ({currencyCode})</span>}</th><th scope="col">Cluster</th><th scope="col">Profile</th></tr></thead>
          <tbody>
            {visible.map((customer) => <tr key={customer.customerId}>
              <th scope="row" data-label="Customer ID"><button className="customer-row-link" type="button" aria-label={`View customer ${customer.customerId} details`} onClick={() => { onSelect?.(customer); setSelected(customer) }}>{customer.customerId}</button></th>
              <td data-label="Recency">{number(customer.recency)}</td><td data-label="Frequency">{number(customer.frequency)}</td><td data-label="Monetary">{number(customer.monetary, currencyCode, true)}</td>
              <td data-label="Cluster">{customer.clusterLabel || <span className="unavailable-value">Belum tersedia</span>}</td><td data-label="Profile">{customer.profile || <span className="unavailable-value">Belum tersedia</span>}</td>
            </tr>)}
            {!visible.length && <tr><td className="customer-table-empty" colSpan={6}>{customers.length && query ? 'Tidak ada pelanggan yang cocok dengan pencarian ini.' : 'Customer records are not available from the connected source.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="customer-table-footer"><span aria-live="polite">Showing {start} to {end} of {filtered.length} customers</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous page</button><span>Page {currentPage} of {pageCount}</span><button className="button button-secondary" type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next page</button></div></div>
      {selected && <CustomerDetailDrawer customer={selected} currencyCode={currencyCode} observationDate={observationDate} analysisPeriod={analysisPeriod} onClose={() => setSelected(null)} />}
    </section>
  )
}
