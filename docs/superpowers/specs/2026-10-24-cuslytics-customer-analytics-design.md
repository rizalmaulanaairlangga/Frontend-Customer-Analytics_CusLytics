# CusLytics Customer Analytics Design

## Purpose

Implement the `/customers` page as a customer-history explorer for backend-provided RFM data. Preserve the existing application shell, navigation, design tokens, and theme. Do not calculate RFM, segment customers, infer eligibility, or create demo customer observations in the browser.

## Data boundary

Add an isolated `CustomerAnalyticsService` configured through `VITE_API_BASE_URL`, `VITE_DATA_MODE`, and a new `VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH`. The resource path remains empty until agreed with the backend team. API responses are runtime-validated and tagged as API-sourced. Demo mode returns no snapshot and clearly reports that customer data is not connected. It never borrows or transforms Overview/Sales fixtures.

The provisional snapshot carries source-provided summary metadata, histogram bins/counts, customer observations, optional currency, and optional customer history, cluster/profile labels, and observation period. RFM definitions are static descriptions aligned with the SRS; calculations and values are supplied by the service. It does not define a route or claim a confirmed backend contract. Missing fields remain unavailable. Histogram counts/bins and RFM values must be supplied; frontend presentation does not calculate them. `Customer ID` remains a string.

## Page and interactions

- Indonesian page heading and description, optional analysis period and observation date, four summary cards, and clearly separate RFM availability from K-Means segmentation availability.
- RFM definition cards explain Recency (days since last valid purchase), Frequency (eligible unique invoices in the analysis period), and Monetary (eligible transaction value, not profit). The observation date and period appear only when supplied.
- Metric selector switches the supplied histogram. Two axis selectors switch a customer-level scatter plot and cannot select the same dimension. Empty chart states explain missing source data.
- Customer directory searches string IDs, sorts supported columns, paginates, and resets its presentation filters. No unsupported date/RFM/cluster filters are exposed. All table values come from the snapshot; absent cluster/profile values read `Belum tersedia`.
- Selecting a row opens a keyboard-accessible responsive drawer. It shows supplied RFM values, optional period/date/history/cluster/profile, and states clearly that this is transaction-history information rather than demographic profiling. Escape and close button dismiss it and focus returns to the selected row.
- Until a cluster label is actually supplied, explain that RFM is not a K-Means result and link to the existing ML Studio route.
- Loading, unavailable, empty, request/configuration error, and successful-data states are explicit. Theme follows global tokens in both modes; the page adds accessible RFM accent tokens and honors reduced motion.

## Responsive and visual direction

Keep the navy/blue/light-neutral CusLytics shell. Use cyan, violet, and amber accents for Recency, Frequency, and Monetary. Teal is reserved for profile information and cluster identity gets a distinct neutral/blue treatment. Cards, charts, table, forms, tooltips, and drawer use theme variables; color is not the only status cue. Reflow summary/chart controls at tablet/mobile widths and constrain table scrolling to its wrapper.

## Scope and open integration questions

Frontend only; no backend edits, ML, preprocessing, or business calculations. The SRS supplies RFM definitions and the user-triggered K-Means requirement. Confirm with the backend team: exact eligibility/inclusion rules for qualifying transactions; observation/period and timezone behavior; numeric precision; histogram binning/count payload; currency and locale; customer detail/history shape; filter/query support; cluster/profile schema and provenance; endpoint, errors, and nullability. Until confirmed, these remain optional or unconfigured.
