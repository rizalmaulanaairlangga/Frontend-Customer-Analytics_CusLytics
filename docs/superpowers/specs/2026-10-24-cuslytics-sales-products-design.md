# CusLytics Sales & Products Design

## Scope and audit findings

Sales & Products is currently a placeholder route. The Overview already provides shared date/country filters, interval controls, four sales KPIs, sales trend, and product ranking through the existing `AnalyticsService`. The API path is already configurable but its contract is unconfirmed. The global `ThemeProvider` and semantic CSS tokens are in place. The current snapshot has no country aggregates, per-product invoice counts, or invoice/unit period series.

Build this page on the existing analytics service and layout. Keep the frontend only. Extend the provisional dashboard response with optional country, product invoice-count, and invoice/unit trend values. Do not create another endpoint or calculate analytical aggregates in the browser. Demo extensions live only in the existing demo service and remain explicitly labeled.

## Design read

- Energy: 3/5. The page uses color to distinguish sales, product, volume, and geography while leaving most space in the shared neutral surfaces.
- Rhythm: 4/5. The scan order moves from controls and key figures into two separate trends, product ranking and detail, then the country view. Chart panels and row-based rankings create useful variation without a spreadsheet wall.
- Motion: 2/5. Short feedback is limited to selection and hover; charts avoid animated redraws and reduced-motion preferences disable transitions.
- The central focus is the sales trend with a clear value definition. Product and country bars use their own violet and coral/amber accents. Legends, labels, values, and the filter summary keep the page understandable without color alone. Existing system typography, spacing, chart tokens, and theme toggle maintain continuity with CusLytics.

## Page structure and behavior

1. Page heading, source badge when the service supplies it, and the existing date/country filter controls.
2. Four KPI cards for Transaction Value, Unique Invoices, Units Sold, and Identified Customers. Values use the current shared filtered snapshot and definitions; transaction value is explicitly not profit.
3. Sales trend chart using the supplied transaction-value series, with daily/weekly/monthly controls.
4. A separate invoice-or-unit trend chart. A metric switch displays only the selected supplied series; it does not combine scales.
5. Product intelligence with a horizontal ranking chart, metric switch, top-count switch, and selectable product that scopes the table. The searchable, sortable, paginated table displays stock code, description, units, transaction value, and invoice count when supplied.
6. Sales by Country horizontal ranking using optional backend country aggregates. Selecting a country applies the shared filter and reloads the full page snapshot. Values are transaction value, never profit.

All sections consume one snapshot for one applied filter/interval tuple. Pending edits remain drafts until Apply; Reset applies the empty filter set. Missing optional aggregates produce a labeled empty state. Empty values do not become zero. There is no comparison visualization without an explicit supplied comparison series.

Loading, success, empty results, backend unavailable/configuration, and request error are distinct. Demo source is labeled and explained as an illustrative fixture, not dataset results. API mode never falls back to demo.

## Visual and responsive direction

Use existing navy, blue, neutral tokens and semantic light/dark theme. Give sales charts blue/cyan accents, product charts violet/teal, and geography coral/amber. Use a two-column analytical rhythm on desktop, a single column at tablet/mobile, compact KPI grids, independently scrollable data table on narrow screens, and chart containers with readable axis labels. Keep motion to short hover, selection, and disclosure transitions while respecting reduced motion.

## Backend decisions

Confirm actual response fields and nullability for invoice/unit trend series, product unique-invoice counts, country aggregates and currency. Confirm source, date/timezone, filter semantics, and inclusion/exclusion rules. No frontend endpoint or business rule is to be treated as agreed.
