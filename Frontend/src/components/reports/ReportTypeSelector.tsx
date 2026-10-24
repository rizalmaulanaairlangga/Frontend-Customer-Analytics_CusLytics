import { reportTypeOptions, type ReportOption } from './reportOptions'
import type { ReportType } from '../../services/reportsService'

export function ReportTypeSelector({ reportType, onSelect, options = reportTypeOptions, selectedStatus, selectedSource }: { reportType: ReportType | null; onSelect: (type: ReportType) => void; options?: ReportOption[]; selectedStatus: string; selectedSource: string }) {
  return <fieldset className="reports-type-selector" aria-label="Report type">
    <legend><span className="eyebrow">CHOOSE A REPORT</span><strong>Report type</strong><span>Select a report to load its available source and configuration.</span></legend>
    <div className="reports-type-grid">
      {options.map(({ id, title, description, requirements, icon: Icon, accent }) => {
        const selected = reportType === id
        return <label className={`report-type-card report-type-${accent}${selected ? ' is-selected' : ''}`} key={id}>
          <input type="radio" name="report-type" aria-label={`${title}: ${description}`} value={id} checked={selected} onChange={() => onSelect(id)}/>
          <span className="report-type-card-content"><span className="report-type-icon"><Icon size={18} aria-hidden="true"/></span><span className="report-type-title">{title}</span><span className="report-type-description">{description}</span><span className="report-type-requirements">{requirements}</span>{selected && <span className="report-type-selected-status"><b>{selectedStatus}</b><small>{selectedSource}</small></span>}</span>
        </label>
      })}
    </div>
  </fieldset>
}
