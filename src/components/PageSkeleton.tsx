import { Skeleton } from './Skeleton'

export type PageSkeletonVariant = 'overview' | 'sales' | 'customers' | 'quality' | 'ml' | 'evaluation' | 'actions' | 'reports'

const count = (length: number) => Array.from({ length }, (_, index) => index)
const barRows = (rows: number) => <div className="page-skeleton-bars">{count(rows).map((index) => <div className="page-skeleton-bar-row" key={index}><Skeleton className="ps-label"/><Skeleton className="ps-bar"/><Skeleton className="ps-value"/></div>)}</div>
const card = (className = '') => <div className={`page-skeleton-card ${className}`.trim()} aria-hidden="true"><Skeleton className="ps-heading"/><Skeleton className="ps-copy"/><Skeleton className="ps-content"/></div>

export function PageSkeleton({ variant, showHeader = false }: { variant: PageSkeletonVariant; showHeader?: boolean }) {
  return <div className={`page-skeleton page-skeleton-${variant}`} aria-busy="true" role="status" aria-label={`Loading ${variant} content`}>
    {showHeader && <><div className="page-skeleton-header"><Skeleton className="ps-title"/><Skeleton className="ps-subtitle"/></div><div className="page-skeleton-filters">{count(3).map((index) => <Skeleton className="ps-control" key={index}/>)}</div></>}
    {variant === 'overview' && <><div className="page-skeleton-kpis">{count(4).map(() => card('ps-kpi'))}</div>{card('ps-chart')}<div className="page-skeleton-columns">{card()}<div className="page-skeleton-card"><Skeleton className="ps-heading"/>{barRows(5)}</div></div></>}
    {variant === 'sales' && <><div className="page-skeleton-kpis">{count(4).map(() => card('ps-kpi'))}</div><div className="page-skeleton-columns">{card('ps-chart')}{card('ps-chart')}</div><div className="page-skeleton-columns"><div className="page-skeleton-card"><Skeleton className="ps-heading"/>{barRows(5)}</div>{card('ps-chart')}</div><div className="page-skeleton-card"><Skeleton className="ps-heading"/><div className="ps-table"><Skeleton className="ps-table-head"/>{count(8).map((index) => <Skeleton className="ps-table-row" key={index}/>)}</div></div>{card()}</>}
    {variant === 'customers' && <><div className="page-skeleton-kpis">{count(4).map(() => card('ps-kpi'))}</div><div className="page-skeleton-rfm">{count(3).map(() => card())}</div><div className="page-skeleton-columns">{card('ps-chart')}{card('ps-chart')}</div><div className="page-skeleton-card"><Skeleton className="ps-heading"/><Skeleton className="ps-table-head"/>{count(6).map((index) => <Skeleton className="ps-table-row" key={index}/>)}</div></>}
    {variant === 'quality' && <><div className="page-skeleton-kpis">{count(4).map(() => card('ps-kpi'))}</div><div className="page-skeleton-card"><Skeleton className="ps-heading"/>{count(8).map((index) => <Skeleton className="ps-table-row" key={index}/>)}</div><div className="page-skeleton-insights">{count(8).map(() => card())}</div>{card()}</>}
    {variant === 'ml' && <><div className="page-skeleton-kpis">{count(3).map(() => card('ps-kpi'))}</div><div className="page-skeleton-columns">{card()}{card()}</div><div className="page-skeleton-card"><Skeleton className="ps-heading"/><Skeleton className="ps-table-head"/>{count(6).map((index) => <Skeleton className="ps-table-row" key={index}/>)}</div></>}
    {variant === 'evaluation' && <><div className="page-skeleton-filters"><Skeleton className="ps-heading"/><Skeleton className="ps-control"/></div><div className="page-skeleton-kpis">{count(4).map(() => card('ps-kpi'))}</div><div className="page-skeleton-columns">{card('ps-chart')}{card('ps-chart')}</div><div className="page-skeleton-card"><Skeleton className="ps-heading"/><Skeleton className="ps-table-head"/>{count(5).map((index) => <Skeleton className="ps-table-row" key={index}/>)}</div></>}
    {variant === 'actions' && <><div className="page-skeleton-filters">{count(4).map((index) => <Skeleton className="ps-control" key={index}/>)}</div><div className="page-skeleton-columns">{card()}{card()}</div>{count(3).map(() => card('ps-row-card'))}</>}
    {variant === 'reports' && <><div className="page-skeleton-reports">{count(4).map(() => card())}</div><div className="page-skeleton-columns">{card()}{card('ps-chart')}</div></>}
  </div>
}
