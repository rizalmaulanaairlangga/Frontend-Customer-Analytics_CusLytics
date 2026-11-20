import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { PageSkeleton } from '../components/PageSkeleton'

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
        <Route path="/" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><OverviewPage /></Suspense>} />
        <Route path="/data-quality" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><DataQualityPage /></Suspense>} />
        <Route path="/sales-products" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><SalesProductsPage /></Suspense>} />
        <Route path="/customers" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><CustomerAnalyticsPage /></Suspense>} />
        <Route path="/ml-studio" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><MLStudioPage /></Suspense>} />
        <Route path="/model-evaluation" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><ModelEvaluationPage /></Suspense>} />
        <Route path="/action-center" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><ActionCenterPage /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageSkeleton variant="overview" showHeader />}><ReportsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
