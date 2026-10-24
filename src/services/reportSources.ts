import { analyticsService } from './analyticsService'
import { customerAnalyticsService } from './customerAnalyticsService'
import { mlStudioService } from './mlStudioService'
import { modelEvaluationService } from './modelEvaluationService'
import type { AnalyticsService } from '../types/analytics'
import type { CustomerAnalyticsService } from '../types/customerAnalytics'
import type { MLStudioService } from '../types/mlStudio'
import type { ModelEvaluationService } from '../types/modelEvaluation'

export interface ReportSources {
  analytics: AnalyticsService
  customers: CustomerAnalyticsService
  mlStudio: Pick<MLStudioService, 'getWorkspace'>
  evaluation: Pick<ModelEvaluationService, 'getEvaluation'>
}

export const reportSources: ReportSources = {
  analytics: analyticsService,
  customers: customerAnalyticsService,
  mlStudio: mlStudioService,
  evaluation: modelEvaluationService,
}
