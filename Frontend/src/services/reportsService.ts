export type ReportType = 'sales-summary' | 'product-performance' | 'customer-rfm' | 'kmeans-segmentation' | 'model-evaluation'
export type ReportFormat = 'csv' | 'xlsx'

export interface ReportExportRequest {
  reportType: ReportType
  format: ReportFormat
  filters: Record<string, string>
  experimentId?: string
}

export interface ReportExportResult {
  blob: Blob
  filename: string
}

export interface ReportsExportService {
  exportReport(request: ReportExportRequest, signal?: AbortSignal): Promise<ReportExportResult>
}

export class ReportExportUnavailableError extends Error {
  constructor(message = 'Ekspor hasil analitik belum tersedia karena backend belum terhubung.') {
    super(message)
    this.name = 'ReportExportUnavailableError'
  }
}

export const reportsExportService: ReportsExportService = {
  async exportReport() {
    throw new ReportExportUnavailableError()
  },
}
