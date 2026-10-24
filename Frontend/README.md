# CusLytics Frontend

React + Vite + TypeScript dashboard, rooted directly in this `Frontend` directory. Overview Dashboard, Data Status / Quality, Sales & Products, Customer Analytics, ML Studio, Model Evaluation, Action Center, and the Reports builder are implemented.

## Run locally

```sh
npm install
npm run dev
```

Vite development mode uses the explicitly labeled demo service when `VITE_DATA_MODE` is unset. Set `VITE_DATA_MODE=api` to request backend data. The production build requires an explicit data mode; otherwise the dashboard reports a configuration error rather than presenting demo values as live results.

The Overview page uses its existing isolated demo fixture in demo mode. Data Status / Quality has no fabricated profile fixtures: in demo mode it displays `Belum terhubung` and waits for backend data. Set `VITE_DATA_MODE=api` to disable Overview demo values and request backend data. API mode never falls back to demo.

## Environment

Copy `.env.example` to `.env.local` for local configuration.

| Variable | Purpose |
| --- | --- |
| `VITE_DATA_MODE` | `demo` or `api`. API failures never fall back to demo. |
| `VITE_API_BASE_URL` | Backend origin/base path, supplied by the team. No address is assumed here. |
| `VITE_ANALYTICS_RESOURCE_PATH` | Dashboard resource path, required in API mode after the backend team confirms it. No endpoint is assumed here. |
| `VITE_DATA_QUALITY_RESOURCE_PATH` | Data quality profile resource path, required in API mode after the backend team confirms it. No endpoint is assumed here. |
| `VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH` | Customer RFM resource path, required in API mode after the backend team confirms it. No endpoint is assumed here. |
| `VITE_ML_STUDIO_RESOURCE_PATH` | ML Studio metadata and experiment-history resource, kept blank until its backend contract is agreed. |
| `VITE_ML_STUDIO_RUN_RESOURCE_PATH` | K-Means experiment submission resource, kept blank until its backend contract is agreed. |
| `VITE_MODEL_EVALUATION_RESOURCE_PATH` | Evaluation snapshot resource, kept blank until its backend contract is agreed. |
| `VITE_ACTION_CENTER_RESOURCE_PATH` | Recommendation snapshot resource, kept blank until the backend contract is agreed. |

For API mode, the service sends `startDate`, `endDate`, `country`, and `interval` as query parameters. It expects a dashboard response containing `filters`, `interval`, `countryOptions`, optional ISO 4217 `currencyCode`, `metrics` (`salesValue`, `uniqueInvoices`, `unitsSold`, `identifiedCustomers`), `trend`, `products`, `customerSummary`, and `status`. The adapter marks accepted responses as API data. Confirm the final field names, nullability, date/timezone semantics, currency, status values, and error format with the backend team before connecting it.

The Data Status / Quality adapter uses the same API base URL with its separately configured resource path and a GET request. Its provisional response model is represented in `src/types/dataQuality.ts`: `dataset` metadata, mapped `columns`, all eight `indicators`, backend-provided `findingCategories`, `cleaningAudit` row counts/reasons/rules, and `warnings`. The frontend validates the response and only displays counts, types, statuses, metadata, and processing outcomes supplied by the API. Confirm the endpoint and payload with the backend team before connecting it; this provisional frontend type is not an agreed API contract.

Sales & Products reuses the configured analytics resource and shared filter parameters. The existing required dashboard response fields remain unchanged. Optional fields now accepted by the frontend are `trend[].uniqueInvoices`, `trend[].unitsSold`, `products[].uniqueInvoices`, and `countries[]` with `country`, `transactionValue`, and optional `uniqueInvoices`. Optional counts may be omitted or `null` when unavailable. These fields power separate volume trends, invoice counts by product, and the country ranking. If they are absent, the corresponding view shows an unavailable empty state. Field names, aliases such as product ID to StockCode, currency, and meanings are provisional and require backend-team agreement; no new endpoint or frontend aggregation has been added.

## Demo behavior

The demo adapter contains illustrative fixture values and is isolated from the API client. Overview and Sales & Products mark the source as `Demo Data` and explain that the fixture does not recalculate values for selected filters. It is for exercising dashboard layout and filter request flow, not a statement about the UCI dataset.

The Data Status / Quality page intentionally has no mock quality values. Its conceptual column list and rule topics are labeled as awaiting source mapping or team confirmation; they do not claim a scan or cleaning run. Dynamic file identity, row counts, date ranges, findings, warning impacts, and rule execution status stay unavailable until provided by the backend.

## Theme

The header theme button switches light/dark mode for every route. The preference is stored in `localStorage` under `cuslytics-theme`, with system preference used when no saved preference exists. The initial document reads this choice before React loads to avoid a flash of the wrong theme.

## Chart and checks

The sales chart uses Recharts: React chart components provide responsive SVG rendering, axes, interval controls, and data tooltips while accepting trend points from the service layer. Lucide React supplies tree-shaken SVG line icons matched to dashboard concepts. No chart values are generated in the chart component.

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

## Product and backend details still to confirm

The modified SRS is marked as a proposed revision that needs team review. The backend contract is not defined yet. Confirm transaction cancellation/return, duplicate, invalid value/date, and missing-data rules; customer eligibility and RFM observation date; country/date limits; currency and timezone; API path, payload, status/error fields, and timeout needs; processing metadata; and the reference dataset file/sheet version. The frontend does not calculate these business rules, create ML results, or claim a dataset processing/experiment status.

For Data Status / Quality also confirm actual source-column aliases and detected types, indicator definitions and category aggregates, the distinction between planned/configured/executed cleaning rules, exclusion reasons and counts, warning text/impact/affected-row fields, read status/error details, and last-checked timestamp format/timezone. Set `VITE_DATA_QUALITY_RESOURCE_PATH` only after that contract is agreed.

For Sales & Products also confirm availability and definitions for invoice/unit trend series, per-product unique invoice counts, country transaction-value aggregates, currency, and whether all sections use identical inclusion/exclusion rules for each applied filter and interval.

## Customer Analytics

Customer Analytics uses an isolated `CustomerAnalyticsService`; it does not reuse Overview/Sales demo values. Demo mode returns no customer snapshot and clearly reports that customer analytics is not connected. API mode requires `VITE_API_BASE_URL` and `VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH`, and does not fall back to demo data. The resource path is deliberately blank in `.env.example` until the backend team confirms it.

The provisional response shape is represented in `src/types/customerAnalytics.ts` and validated in `src/services/customerAnalyticsService.ts`. It accepts source-reported eligible/profile counts, observation date, analysis period, segmentation status/message, optional currency, per-metric distribution bins, customer RFM values, and optional transaction history/cluster/profile fields. Customer identifiers remain strings. Summary metadata and distributions may be omitted and are shown as unavailable; the directory and customer list are required arrays. Histogram bins and customer observations must come from the service. The UI does not derive RFM, bins, customer eligibility, cluster labels, or profile labels.

The SRS at `../Kel-7_SRS_CusLytics.docx` specifies Recency from the fixed observation date to a customer's last qualifying purchase, Frequency as qualifying unique invoices in the selected period, Monetary as qualifying transaction value in that period (not profit), and one RFM row per eligible customer. The page copy follows those definitions. The SRS also makes K-Means user-triggered; routine page visits and chart filtering do not imply that a clustering experiment ran.

Before connecting, agree with the backend team on the endpoint and query parameters; exact customer/purchase qualification rules; unique-invoice and Monetary inclusion rules; observation date/timezone and selected period behavior; distribution bin/count schema; currency/locale; customer detail/history fields; segmentation status and cluster/profile provenance; nullable fields and errors. The SRS establishes the RFM meanings but not this API contract. Until those are confirmed, the response model is provisional and the API resource remains unconfigured.

## ML Studio

ML Studio is a frontend-only experiment workspace. It never calculates RFM or runs K-Means in the browser. The page uses the shared global theme and reports `Backend Unavailable` until metadata is supplied by an explicitly configured resource. It has no demo experiment records, generated progress, synthetic metrics, or fabricated timestamps. K and random seed remain editable while unavailable; a run request is only sent when both resource paths are configured and backend metadata reports every RFM feature and preprocessing as available. The backend remains responsible for final data-specific K and metric validation.

The service uses a provisional metadata response with `rfm.status`, per-feature status/statistics, `preprocessing.status/name/version`, and an experiment `history` array. The configured run resource receives `{ "k": number, "randomSeed": number }`; its returned experiment metadata is validated before it is shown. These environment variable names, methods, request/response fields, and lifecycle values are frontend adapter assumptions, not an agreed server contract. Confirm resource paths, request method and schema, readiness rules, preprocessing/scaling and version, supported K values, seed constraints, lifecycle and error semantics, timestamp timezone, primary metric validity, execution/progress metadata, and evaluation navigation with the backend team before setting them. No backend files were changed.

## Model Evaluation

Model Evaluation reads successful experiment metadata from the configured ML Studio resource and requests a selected evaluation snapshot through `VITE_MODEL_EVALUATION_RESOURCE_PATH`. That variable is blank in `.env.example`; no concrete endpoint is assumed. The page has no demonstration experiment or result fixtures. It displays only values returned by the service, checks that cluster populations add up to the evaluated customer count, and omits scatter points unless individual customer feature records are supplied. Cluster percentages may be derived from the supplied cluster counts and total only.

The evaluation response shape in `src/types/modelEvaluation.ts` and validation in `src/services/modelEvaluationService.ts` are provisional adapter assumptions, not a backend agreement. Confirm the resource path and method; selected experiment query key; successful-history metadata; timestamp and random seed fields; actual cluster count and evaluated population; inertia feature space; silhouette validity/status and reason; profile statistic and nullable RFM fields; monetary unit; cluster counts/percentages; individual point availability and customer identifier handling; error format; and comparison retention policy. The page does not calculate K-Means, profile RFM, model scores, or synthetic observations. Comparison table configuration and result values always stay tied to each experiment ID. No backend files were changed.

## Action Center

Action Center is a review workspace for recommendations supplied by a configured backend resource. It has no demo records and no recommendation generation or business calculations. The service uses `VITE_API_BASE_URL` plus `VITE_ACTION_CENTER_RESOURCE_PATH` for a GET request; both must be supplied after the backend team agrees the resource and payload. When either is missing, the page reports that integration is pending. Request failures, empty responses, and unavailable evidence have separate states. Filters, category/source summaries, and sorting operate only on returned records. Sorting by newest is enabled only when every supplied recommendation has a valid timestamp.

The provisional response shape is defined in `src/types/actionCenter.ts` and validated by `src/services/actionCenterService.ts`. Each recommendation carries an ID, title, category, analytics source, finding, reasoning, suggested action, and optional interpretation, rule reference, limitations, evidence, segment/customer IDs, and creation time. Evidence may include source-reported RFM values, cluster and experiment IDs, analysis population, and period. These fields and enum values are an adapter proposal, not an agreed API contract. Context links use known frontend routes; Model Evaluation is linked only when the recommendation includes an experiment ID.

The SRS requires explainable, rule-based recommendations that can be traced to their rule and observed source metrics, and says rules and thresholds must be documented and calibrated after profiling the reference dataset. The frontend therefore displays an optional rule reference supplied by the backend, but defines or executes no rules itself. Before connection, agree on recommendation eligibility and provenance; rule identifier/reference and explanation fields; whether categories are supplied by the backend and their exact values; evidence definitions/units and analysis periods; customer ID privacy and search permissions; behavior for partial or missing evidence; timestamp semantics/timezone; response pagination and filter/sort needs; and error/status fields. Category labels in the UI are conceptual identifiers and do not define business rules. The frontend does not calculate retention risk, priority, profitability, impact, or campaign eligibility, and does not send outreach or retrain models.

## Reports

Reports provides five report configurations: Sales Summary, Product Performance, Customer RFM, K-Means Segmentation, and Model Evaluation. Sales reports read the existing analytics service and retain shared date/country filters; product ranking orders only source-returned rows. Customer and experiment previews read existing customer analytics, ML Studio, and evaluation services. Every preview shows source, returned row counts or metadata, and loading, empty, unavailable, or error states. The existing sales demo fixture is labeled `Demo Data` and explicitly is not a processed dataset result.

CSV and Excel are currently format selections only. No report export endpoint, method, response schema, or supported format contract has been agreed, so the default export service reports unavailable and preserves configuration. A browser download and success state happen only if an injected export service returns an actual Blob and filename. No new resource path or backend file was added for Reports. Confirm report schemas and source/filter semantics, export endpoint and request/response/file behavior, supported formats, and customer-data permissions with the backend team before enabling exports.
