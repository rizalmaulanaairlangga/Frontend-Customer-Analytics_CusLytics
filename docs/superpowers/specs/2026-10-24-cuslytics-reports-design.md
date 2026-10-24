# CusLytics Reports Design

## Purpose and boundaries

Replace the Reports placeholder with a responsive report builder for Sales Summary, Product Performance, Customer RFM, K-Means Segmentation, and Model Evaluation. It previews only records or metadata returned by existing frontend services. It never computes analytics or ML results and never claims an export succeeded unless an export service returns a real file.

No report export backend contract exists. The export service is injectable and defaults to an explicit unavailable error; no path, endpoint, method, download record, or fake file is assumed. Reports UI offers CSV and Excel as requested format choices, but clearly explains that actual export remains unavailable until backend support is agreed.

## Sources

- Sales Summary and Product Performance use the existing `AnalyticsService` with shared date/country filters. Its source tag distinguishes `api` from `demo`; demo preview values must carry a persistent Demo Data label and are not downloadable as actual analysis.
- Customer RFM uses the existing `CustomerAnalyticsService`; a null/demo or missing backend snapshot is an unavailable state. Only service-reported metadata and customer rows may appear.
- K-Means Segmentation and Model Evaluation use the existing ML Studio workspace for successful experiment metadata and Model Evaluation for that experiment's result. Only returned successful experiment metadata and matching evaluation snapshots may be previewed.
- Missing configuration and request failure remain distinguishable. Data unavailable does not mean an empty report with zero rows.

## Interaction

Show five selectable report cards with descriptions and data requirements. Selecting a report updates its configuration and preview. Sales/Product keep their shared date/country filters when switching between each other; those filters are cleared when leaving the pair. ML report types share an experiment choice; it is cleared when leaving those report types. Customer RFM uses backend-reported observation date and period rather than invented filters.

Format selection is local configuration. The preview summarizes selected report and format, only relevant filters, source, and only real returned metadata/records. No fictional chart/table sample rows are used. Returned data may be shown in a small scrollable preview table. Export validates required inputs, calls the injected export service, and downloads only the returned Blob; default service reports backend unavailable and preserves form state.

## Accessibility and styling

Continue global CusLytics theme tokens and shared theme control. Use descriptive native radio/select/date controls, visible selected/focus/disabled states, keyboard operation, reduced motion, clear status text, and responsive cards, form, preview table, and action area. Do not add a theme toggle or global layout rewrite.

Design read: B2B analytics workspace for analysts, in the existing calm navy/blue and light-neutral dashboard language; dials ENERGY 1 / RHYTHM 2 / MOTION 1. The restrained palette preserves data readability, the five report choices form the page's main entry point, and only hover/focus transitions are used to keep configuration states clear. The equal-size report cards represent equally selectable outputs; their existing SVG icons name the report's subject (sales, products, customers, clusters, evaluation) and are paired with visible labels. Color accents distinguish those report subjects using the shared semantic tokens, while the preview remains the content focal point. The repeated source/provenance labels and explicit demo notice form the page-specific identity motif, keeping data origin visible throughout report setup and preview.

## Decisions still required

Agree export resource path/method, payload and response/file naming; supported output formats and exact schema; whether export is synchronous or job-based; report availability/permissions; analytics source/filter semantics and source currency; whether response rows are complete or paginated; customer data privacy/export permissions; experiment evaluation fields and retention; and error/status behavior. No backend files are changed.
