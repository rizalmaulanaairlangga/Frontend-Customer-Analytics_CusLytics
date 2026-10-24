import { useId, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, Check, ChevronDown, ChevronUp, CircleHelp, FileWarning, Info, Rows3, Search, ShieldAlert, ShieldCheck, Tags } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ConceptualColumn, DataQualitySnapshot, QualityCategory, QualityColumn, QualityIndicatorId, RuleStatus, ValidationStatus } from '../../types/dataQuality'

interface DataQualitySectionsProps { snapshot: DataQualitySnapshot | null }

const indicatorDefinitions: Array<{ id: QualityIndicatorId; label: string; category: QualityCategory; description: string }> = [
  { id: 'missing_values', label: 'Missing values', category: 'missing', description: 'Field cells reported as missing by the connected profile.' },
  { id: 'duplicate_rows', label: 'Kandidat baris duplikat', category: 'duplicate', description: 'Rows the connected profile identified as duplicate candidates.' },
  { id: 'cancellation_invoices', label: 'Faktur pembatalan', category: 'anomaly', description: 'Invoices reported as cancellations. Their treatment must follow an agreed rule.' },
  { id: 'negative_quantity', label: 'Kuantitas negatif', category: 'anomaly', description: 'Negative quantities; this count alone does not classify returns.' },
  { id: 'nonpositive_price', label: 'Harga nol atau negatif', category: 'anomaly', description: 'Rows reported with zero or negative unit prices.' },
  { id: 'invalid_dates', label: 'Tanggal tidak valid', category: 'anomaly', description: 'Dates the connected profile could not validate.' },
  { id: 'missing_customer_id', label: 'Customer ID hilang', category: 'identity', description: 'Rows without a customer identifier under the backend profile.' },
  { id: 'missing_product_id', label: 'Pengenal produk hilang', category: 'identity', description: 'Rows without a product identifier under the backend profile.' },
]

const categoryNames: Record<QualityCategory, string> = {
  missing: 'Missing values', duplicate: 'Kandidat duplikat', anomaly: 'Anomali atau nilai tidak valid', identity: 'Identitas pelanggan/produk',
}

const categoryColors: Record<QualityCategory, string> = {
  missing: 'var(--quality-amber)', duplicate: 'var(--quality-violet)', anomaly: 'var(--quality-red)', identity: 'var(--quality-teal)',
}

const conceptualColumns: Array<{ name: ConceptualColumn; role: string }> = [
  { name: 'Invoice', role: 'Identitas faktur atau transaksi.' },
  { name: 'StockCode', role: 'Identitas produk.' },
  { name: 'Description', role: 'Deskripsi produk.' },
  { name: 'Quantity', role: 'Jumlah unit pada baris transaksi.' },
  { name: 'InvoiceDate', role: 'Waktu transaksi.' },
  { name: 'Price', role: 'Harga satuan.' },
  { name: 'Customer ID', role: 'Identitas pelanggan.' },
  { name: 'Country', role: 'Negara yang terkait dengan transaksi.' },
]

const pendingRules = [
  { id: 'cancellations', topic: 'Pembatalan', description: 'Status faktur pembatalan dan perlakuannya perlu dikonfirmasi bersama tim backend.' },
  { id: 'returns', topic: 'Retur dan kuantitas negatif', description: 'Kuantitas negatif tidak otomatis diklasifikasikan sebagai retur.' },
  { id: 'prices', topic: 'Harga', description: 'Aturan untuk harga nol atau negatif belum dilaporkan.' },
  { id: 'dates', topic: 'Tanggal', description: 'Batas dan penanganan tanggal tidak valid belum dilaporkan.' },
  { id: 'duplicates', topic: 'Kandidat duplikat', description: 'Kunci dan tindakan untuk kandidat duplikat belum dilaporkan.' },
]

function numberText(value: number | null | undefined): string {
  return value === null || value === undefined ? 'Belum tersedia' : new Intl.NumberFormat('id-ID').format(value)
}

function validationText(status?: ValidationStatus): string {
  if (!status || status === 'pending') return 'Belum diperiksa'
  if (status === 'passed') return 'Valid'
  if (status === 'warning') return 'Perlu ditinjau'
  return 'Tidak valid'
}

function ruleText(status?: RuleStatus): string {
  if (!status || status === 'pending') return 'Menunggu kesepakatan'
  if (status === 'planned') return 'Direncanakan'
  if (status === 'configured') return 'Dikonfigurasi'
  return 'Dijalankan'
}

function ColumnDetails({ column }: { column: QualityColumn }) {
  const idNote = column.conceptualName === 'Invoice' || column.conceptualName === 'StockCode'
    ? 'Pertahankan pengenal ini sebagai string setelah pemetaan sumber dikonfirmasi.'
    : undefined
  return <div className="quality-disclosure-body"><p>{column.details ?? column.note ?? 'Belum ada rincian validasi yang dilaporkan backend.'}</p>{idNote && <p>{idNote}</p>}</div>
}

export function DataQualitySections({ snapshot }: DataQualitySectionsProps) {
  const [columnSearch, setColumnSearch] = useState('')
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null)
  const [expandedIndicator, setExpandedIndicator] = useState<QualityIndicatorId | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<QualityCategory | null>(null)

  const columns = useMemo<QualityColumn[]>(() => snapshot?.columns ?? conceptualColumns.map((column) => ({
    sourceName: null,
    conceptualName: column.name,
    role: column.role,
    validationStatus: 'pending',
  })), [snapshot])
  const visibleColumns = useMemo(() => {
    const query = columnSearch.trim().toLocaleLowerCase('id-ID')
    return columns.filter((column) => `${column.conceptualName ?? ''} ${column.sourceName ?? ''} ${column.role}`.toLocaleLowerCase('id-ID').includes(query))
  }, [columnSearch, columns])
  const rules = snapshot?.cleaningAudit.rules ?? pendingRules.map((rule) => ({
    ...rule, impact: 'Belum ada konfigurasi atau eksekusi yang dilaporkan.', affectedRows: null, status: 'pending' as const,
  }))
  const categories = snapshot?.findingCategories ?? []
  const selectedFinding = categories.find((item) => item.category === selectedCategory)

  function toggle<T extends string>(current: T | null, value: T, set: (next: T | null) => void) {
    set(current === value ? null : value)
  }

  return (
    <>
      <section className="quality-section" aria-labelledby="columns-title">
        <div className="quality-section-heading">
          <div><p className="eyebrow">Schema profile</p><h2 id="columns-title">Struktur dan validasi kolom</h2><p>Nama sumber dan tipe terdeteksi hanya muncul jika disediakan oleh backend.</p></div>
          <label className="column-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search columns</span><input type="search" aria-label="Search columns" placeholder="Cari kolom" value={columnSearch} onChange={(event) => setColumnSearch(event.target.value)} /></label>
        </div>
        {!snapshot && <p className="quality-inline-note"><Info size={15} aria-hidden="true" /> Daftar ini konseptual, belum dicocokkan dengan nama kolom aktual.</p>}
        <div className="quality-table-wrap" role="region" aria-label="Scrollable column validation table" tabIndex={0}>
          <table className="quality-table">
            <thead><tr><th scope="col">Kolom konseptual</th><th scope="col">Nama sumber</th><th scope="col">Tipe terdeteksi</th><th scope="col">Fungsi kolom</th><th scope="col">Status validasi</th><th scope="col"><span className="sr-only">Detail</span></th></tr></thead>
            <tbody>
              {visibleColumns.map((column) => {
                const key = `${column.conceptualName ?? 'unmapped'}:${column.sourceName ?? 'no-source-name'}`
                const expanded = expandedColumn === key
                return <FragmentRow key={key} column={column} expanded={expanded} onToggle={() => toggle(expandedColumn, key, setExpandedColumn)} />
              })}
              {visibleColumns.length === 0 && <tr><td className="quality-table-empty" colSpan={6}>Tidak ada kolom yang cocok dengan pencarian.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="quality-section" aria-labelledby="insights-title">
        <div className="quality-section-heading">
          <div><p className="eyebrow">Profile findings</p><h2 id="insights-title">Quality insights</h2><p>Warna menunjukkan kategori temuan, bukan tingkat keparahan.</p></div>
          <span className="quality-section-tag"><CircleHelp size={14} aria-hidden="true" /> Detail tersedia saat backend terhubung</span>
        </div>
        <div className="quality-insight-grid">
          {indicatorDefinitions.map((indicator) => {
            const item = snapshot?.indicators[indicator.id]
            const expanded = expandedIndicator === indicator.id
            const Icon = indicator.category === 'missing' ? FileWarning : indicator.category === 'duplicate' ? Rows3 : indicator.category === 'anomaly' ? AlertTriangle : Tags
            return <article key={indicator.id} className={`quality-insight-card quality-category-${indicator.category}`}>
              <div className="quality-insight-top"><span className="quality-insight-icon"><Icon size={17} aria-hidden="true" /></span><span className="quality-category-name">{categoryNames[indicator.category]}</span></div>
              <h3>{indicator.label}</h3>
              <strong className="quality-insight-value">{numberText(item?.count)}</strong>
              <p>{indicator.description}</p>
              <button className="quality-text-action" type="button" aria-label={`${expanded ? 'Tutup' : 'Lihat'} rincian: ${indicator.label}`} aria-expanded={expanded} aria-controls={`indicator-${indicator.id}`} onClick={() => toggle(expandedIndicator, indicator.id, setExpandedIndicator)}>
                {expanded ? 'Tutup rincian' : 'Lihat rincian'}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              <div className="quality-disclosure-body" id={`indicator-${indicator.id}`} hidden={!expanded}><p>{item?.details ?? 'Rincian temuan menunggu profil dari backend.'}</p></div>
            </article>
          })}
        </div>
      </section>

      <section className="quality-section" aria-labelledby="findings-chart-title">
        <div className="quality-section-heading"><div><p className="eyebrow">Finding distribution</p><h2 id="findings-chart-title">Temuan menurut kategori</h2><p>Grafik hanya memakai agregat kategori yang dikirim backend.</p></div></div>
        {categories.length === 0 ? <div className="quality-chart-empty"><BarChart3 size={19} aria-hidden="true" /><p>Belum ada temuan kualitas data yang tersedia.</p><span>Grafik menunggu jumlah temuan aktual dari backend.</span></div> : <>
          <div className="quality-chart" aria-label="Quality findings by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ top: 6, right: 24, left: 12, bottom: 4 }}>
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis type="category" dataKey="label" width={170} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => {
                  const entry = payload?.[0]?.payload as (typeof categories)[number] | undefined
                  return active && entry ? <div className="quality-chart-tooltip"><strong>{entry.label}</strong><span>{numberText(entry.count)} temuan</span><small>{entry.detail ?? 'Agregat sebagaimana dilaporkan backend.'}</small></div> : null
                }} />
                <Bar dataKey="count" name="Jumlah temuan" radius={[0, 5, 5, 0]} isAnimationActive={false} onClick={(entry) => {
                  if (entry && typeof entry === 'object' && 'category' in entry) setSelectedCategory(entry.category as QualityCategory)
                }}>
                  {categories.map((item) => <Cell key={item.category} fill={categoryColors[item.category]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="quality-chart-categories" aria-label="Select a finding category">
            {categories.map((item) => <button key={item.category} className="quality-chart-category" type="button" aria-pressed={selectedCategory === item.category} onClick={() => toggle(selectedCategory, item.category, setSelectedCategory)}>
              <span style={{ background: categoryColors[item.category] }} aria-hidden="true" />{item.label}, {numberText(item.count)} findings
            </button>)}
          </div>
          {selectedFinding && <div className="quality-chart-selected" role="status"><strong>{selectedFinding.label}</strong><span>{selectedFinding.detail ?? 'Agregat kategori dari profil backend.'}</span></div>}
        </>}
      </section>

      <section className="quality-section" aria-labelledby="audit-title">
        <div className="quality-section-heading"><div><p className="eyebrow">Processing trace</p><h2 id="audit-title">Preprocessing &amp; cleaning audit</h2><p>Baris dan aturan hanya ditampilkan sebagai sudah diterapkan jika backend menyatakannya.</p></div></div>
        <div className="audit-summary-grid">
          <AuditSummary icon={Rows3} label="Baris sebelum pemrosesan" value={snapshot?.cleaningAudit.rowCounts.before} />
          <AuditSummary icon={Check} label="Baris dipertahankan" value={snapshot?.cleaningAudit.rowCounts.retained} />
          <AuditSummary icon={ShieldAlert} label="Baris dikecualikan" value={snapshot?.cleaningAudit.rowCounts.excluded} />
        </div>
        {snapshot?.cleaningAudit.exclusionReasons.length ? <ul className="exclusion-reasons">{snapshot.cleaningAudit.exclusionReasons.map((item) => <li key={item.reason}><span>{item.reason}</span><strong>{numberText(item.affectedRows)} baris</strong></li>)}</ul> : <p className="quality-inline-note"><Info size={15} aria-hidden="true" /> Alasan pengecualian belum dilaporkan.</p>}
        <div className="rule-list">
          {rules.map((rule) => {
            const expanded = expandedRule === rule.id
            return <article className="cleaning-rule" key={rule.id}>
              <button className="cleaning-rule-toggle" type="button" aria-label={`${expanded ? 'Tutup' : 'Lihat'} aturan ${rule.topic}`} aria-expanded={expanded} aria-controls={`rule-${rule.id}`} onClick={() => toggle(expandedRule, rule.id, setExpandedRule)}>
                <span className="cleaning-rule-icon"><ShieldCheck size={17} aria-hidden="true" /></span><span className="cleaning-rule-title"><strong>{rule.topic}</strong><small>{ruleText(rule.status)}</small></span><span className="cleaning-rule-impact">{numberText(rule.affectedRows)} baris terdampak</span>{expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              <div className="quality-disclosure-body" id={`rule-${rule.id}`} hidden={!expanded}><p>{rule.description}</p><p>{rule.impact}</p><span className={`rule-status rule-status-${rule.status}`}>{ruleText(rule.status)}</span></div>
            </article>
          })}
        </div>
      </section>

      <section className="quality-section validation-section" aria-labelledby="validation-title">
        <div className="quality-section-heading"><div><p className="eyebrow">Review before analysis</p><h2 id="validation-title">Validation &amp; warnings</h2><p>Potensi dampak dan tindakan mengikuti pesan yang tersedia dari backend.</p></div></div>
        {!snapshot ? <div className="validation-empty"><Info size={17} aria-hidden="true" /><div><strong>Menunggu hasil pemeriksaan</strong><p>Peringatan dan dampak analitik belum dapat ditentukan tanpa hasil backend.</p></div></div>
          : snapshot.warnings.length === 0 ? <div className="validation-empty"><Check size={17} aria-hidden="true" /><div><strong>Backend tidak melaporkan peringatan</strong><p>Status ini hanya berlaku untuk profil yang diterima.</p></div></div>
            : <div className="warning-list">{snapshot.warnings.map((warning, index) => <article className="quality-warning" key={`${warning.title}-${index}`}>
              <span className="warning-mark"><AlertTriangle size={17} aria-hidden="true" /></span><div><h3>{warning.title}</h3><p><strong>Potensi dampak:</strong> {warning.impact}</p><p><strong>Aturan atau tindakan:</strong> {warning.action}</p>{warning.affectedRows !== undefined && <span className="warning-row-count">{numberText(warning.affectedRows)} baris terdampak</span>}</div>
            </article>)}</div>}
      </section>
    </>
  )
}

function FragmentRow({ column, expanded, onToggle }: { column: QualityColumn; expanded: boolean; onToggle: () => void }) {
  const detailId = `column-${useId().replace(/:/g, '')}`
  const displayName = column.conceptualName ?? 'Belum dicocokkan'
  return <>
    <tr>
      <th scope="row">{displayName}</th><td>{column.sourceName ?? 'Belum dipetakan'}</td><td>{column.detectedType ?? 'Belum terdeteksi'}</td><td>{column.role}</td><td><span className={`validation-pill validation-${column.validationStatus}`}><span aria-hidden="true">{column.validationStatus === 'passed' ? '✓' : column.validationStatus === 'failed' ? '!' : column.validationStatus === 'warning' ? '!' : '·'}</span>{validationText(column.validationStatus)}</span></td>
      <td><button className="table-detail-button" type="button" aria-label={`View ${displayName} details`} aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></td>
    </tr>
    <tr className="quality-table-detail" hidden={!expanded}><td colSpan={6}><div id={detailId}><ColumnDetails column={column} /></div></td></tr>
  </>
}

function AuditSummary({ icon: Icon, label, value }: { icon: typeof Rows3; label: string; value?: number | null }) {
  return <article className="audit-summary-card"><span><Icon size={17} aria-hidden="true" /></span><div><small>{label}</small><strong>{numberText(value)}</strong></div></article>
}
