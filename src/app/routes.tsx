import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'

const OverviewPage = lazy(() => import('../pages/OverviewPage').then((module) => ({ default: module.OverviewPage })))
const DataQualityPage = lazy(() => import('../pages/DataQualityPage').then((module) => ({ default: module.DataQualityPage })))
const SalesProductsPage = lazy(() => import('../pages/SalesProductsPage').then((module) => ({ default: module.SalesProductsPage })))
const CustomerAnalyticsPage = lazy(() => import('../pages/CustomerAnalyticsPage').then((module) => ({ default: module.CustomerAnalyticsPage })))
const MLStudioPage = lazy(() => import('../pages/MLStudioPage').then((module) => ({ default: module.MLStudioPage })))
const ModelEvaluationPage = lazy(() => import('../pages/ModelEvaluationPage').then((module) => ({ default: module.ModelEvaluationPage })))
const ActionCenterPage = lazy(() => import('../pages/ActionCenterPage').then((module) => ({ default: module.ActionCenterPage })))
const ReportsPage = lazy(() => import('../pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading dashboard</div>}><OverviewPage /></Suspense>} />
        <Route path="/data-quality" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading data quality profile</div>}><DataQualityPage /></Suspense>} />
        <Route path="/sales-products" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading sales and product analytics</div>}><SalesProductsPage /></Suspense>} />
        <Route path="/customers" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading customer analytics</div>}><CustomerAnalyticsPage /></Suspense>} />
        <Route path="/ml-studio" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading ML Studio</div>}><MLStudioPage /></Suspense>} />
        <Route path="/model-evaluation" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading model evaluation</div>}><ModelEvaluationPage /></Suspense>} />
        <Route path="/action-center" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading Action Center</div>}><ActionCenterPage /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<div className="skeleton skeleton-chart" role="status">Loading reports workspace</div>}><ReportsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
