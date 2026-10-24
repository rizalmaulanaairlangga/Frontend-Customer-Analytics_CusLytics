import { describe, expect, it, vi } from 'vitest'
import { ReportExportUnavailableError, reportsExportService } from './reportsService'

describe('Reports export service', () => {
  it('reports backend unavailability instead of inventing an export path or file', async () => {
    await expect(reportsExportService.exportReport({ reportType: 'sales-summary', format: 'csv', filters: {} })).rejects.toBeInstanceOf(ReportExportUnavailableError)
  })

  it('does not claim a completed export when a source is not connected', async () => {
    const exportAttempt = vi.spyOn(reportsExportService, 'exportReport')
    await expect(reportsExportService.exportReport({ reportType: 'model-evaluation', format: 'xlsx', filters: {}, experimentId: 'run-4' })).rejects.toThrow(/backend/i)
    expect(exportAttempt).toHaveBeenCalledOnce()
  })
})
