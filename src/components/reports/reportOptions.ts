import { BarChart3, Layers3, Package, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReportType } from '../../services/reportsService'

export interface ReportOption {
  id: ReportType
  title: string
  description: string
  requirements: string
  icon: LucideIcon
  accent: string
}

export const reportTypeOptions: ReportOption[] = [
  { id: 'sales-summary', title: 'Sales Summary', description: 'Transaction value, invoices, units, and supplied sales trends.', requirements: 'Analytics source · date and country filters when available', icon: BarChart3, accent: 'sales' },
  { id: 'product-performance', title: 'Product Performance', description: 'Source-reported product ranking, units, value, and invoice counts.', requirements: 'Product analytics · optional ranking metric', icon: Package, accent: 'product' },
  { id: 'customer-rfm', title: 'Customer RFM', description: 'Eligible customer profiles and backend-reported observation context.', requirements: 'Customer RFM source · eligible customer records', icon: UsersRound, accent: 'customer' },
  { id: 'kmeans-segmentation', title: 'K-Means Segmentation', description: 'Cluster counts and RFM profiles from a successful experiment.', requirements: 'Successful experiment · evaluation results', icon: Layers3, accent: 'segmentation' },
  { id: 'model-evaluation', title: 'Model Evaluation', description: 'Experiment metadata, valid metrics, and returned cluster profiles.', requirements: 'Successful experiment · evaluation metadata', icon: BarChart3, accent: 'evaluation' },
]
