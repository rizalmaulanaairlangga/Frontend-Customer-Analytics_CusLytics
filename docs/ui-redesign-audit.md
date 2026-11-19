# CusLytics Frontend Redesign Audit

Audit baseline: `Frontend/src/`, before visual redesign edits. The error handling work already present in the working tree is treated as prior application work.

## Current theme setup

- Theme is set on `<html data-theme="light|dark">` and stored under `cuslytics-theme` in localStorage.
- `index.html` bootstraps the saved theme before React mounts, but its fallback is always light and does not use `prefers-color-scheme`.
- `ThemeProvider` mirrors the selection into the document and storage. Its `theme-color` meta values are hardcoded (`#0d1524`, `#f5f7fa`).
- Current light palette is cool gray and dark palette is navy. Sidebar, header, cards, controls, and charts use CSS custom properties, but several named accents are still directly tied to the old blue/navy palette.

## Existing CSS variables in `tokens.css`

`--action-bg`, `--action-hover`, `--blue-100`, `--blue-500`, `--blue-600`, `--border`, `--border-strong`, `--canvas`, `--chart-cursor`, `--chart-grid`, `--cluster-1` through `--cluster-8`, `--control-bg`, `--customer-cluster`, `--customer-profile`, `--danger`, `--danger-bg`, `--demo`, `--demo-bg`, `--demo-mark-border`, `--demo-notice-border`, `--demo-notice-strong`, `--demo-notice-text`, `--drawer-scrim`, `--drawer-shadow`, `--geo-coral`, `--indigo-500`, `--navy-700`, `--navy-900`, `--navy-950`, `--on-action`, `--positive`, `--positive-bg`, `--quality-amber`, `--quality-amber-bg`, `--quality-red`, `--quality-red-bg`, `--quality-teal`, `--quality-teal-bg`, `--quality-violet`, `--quality-violet-bg`, `--radius-lg`, `--radius-md`, `--radius-sm`, `--rfm-frequency`, `--rfm-monetary`, `--rfm-recency`, `--shadow-panel`, `--sidebar-accent`, `--sidebar-active`, `--sidebar-bg`, `--sidebar-border`, `--sidebar-brand-border`, `--sidebar-caption`, `--sidebar-control`, `--sidebar-control-hover`, `--sidebar-focus`, `--sidebar-fg`, `--sidebar-hover`, `--sidebar-muted`, `--sidebar-strong`, `--surface`, `--surface-muted`, `--text`, `--text-muted`, `--text-secondary`, `--warning`, `--warning-bg`.

## Direct color values outside `tokens.css`

- `src/contexts/ThemeContext.tsx`: static light/dark browser theme-color values.
- `index.html`: static light theme-color value and `data-theme="light"` initial attribute.
- The source CSS files otherwise refer to variables. The principal token file has direct hex and RGB color definitions for both themes.
- JSX chart tick labels include hardcoded 9–10px font sizes. `DataQualitySections.tsx` maps quality categories to semantic quality variables; `clusterPalette.ts` maps cluster series to cluster variables. Charts use a mixture of shared variables and older named accent variables.

## Recharts and data visualizations

- Dashboard: `SalesTrendChart.tsx`, `ProductPerformance.tsx`, `CustomerSummary.tsx`, and `SystemStatus.tsx`.
- Sales: `SalesProductsCharts.tsx` and `ProductTable.tsx`.
- Customer Analytics: `CustomerAnalyticsCharts.tsx`, `CustomerDetailDrawer.tsx`, and `CustomerDirectory.tsx`.
- Data Status / Quality: `DataQualitySections.tsx`.
- Model Evaluation: `ModelEvaluationCharts.tsx` and `clusterPalette.ts`.
- Existing axes, grids, areas, tooltip backgrounds, ranking fills, and cluster colors mostly read CSS variables. Recharts animations are currently disabled in several plots; ranking bars have striped tracks in `sales-products.css`.

## Component and page structure

- Shared shell: `layouts/AppShell.tsx`, `Sidebar.tsx`, `Header.tsx`, and `navigation.ts`.
- Theme: `contexts/ThemeContext.tsx`, `theme-context.ts`, and `useTheme.ts`.
- Shared components include `StatusBadge`, `StateMessage`, `LoadingState`, and dashboard KPI/chart components. There is no shared banner, InfoTip, StateBlock, or Skeleton primitive.
- Page routes are Overview, Data Quality, Sales & Products, Customer Analytics, ML Studio, Model Evaluation, Action Center, and Reports. Existing page and component tests use stable labels and roles; retain those where practical.

## Layout and visual findings

- Sidebar is currently navy in both themes, with only token shades changing. It has a footer dot and “Reference analytics workspace”; the sticky top bar has a center product context label.
- KPI cards use separate styles across Dashboard, Sales, Customer Analytics, and Data Quality. Sales cards have top color bars; Customer Analytics cards have colored top borders. KPI definitions are visible below the values.
- Several page and component CSS rules use type below 12px (notably 8–11px labels, table headers, tooltips, and captions); chart tick JSX uses 9–10px.
- Tables already have horizontal-scroll wrappers in the dense pages. Existing mobile breakpoints reflow most KPI and chart grids; redesign must preserve these wrappers and breakpoints.
- Status, empty, loading, demo, and error messages use page-specific banners and empty-state boxes. Reports has a header-adjacent status area and a separate export feedback block.
- Filter summaries include “all filters” indicators even when no filter is active. Demo labels and demo notices may be repeated across a page.

## Contrast baseline

The current palette does not have a recorded contrast audit. The requested Paper & Ink / Night Teal semantic pairs will be checked before finalizing Phase 1 tokens; final measured ratios will be added here during that phase.
