# CusLytics Overview Dashboard Design

## Status and scope

Approved implementation direction for the first CusLytics frontend. The modified SRS, `Kel-7_SRS_CusLytics.docx` version 1.1, is the product reference. The SRS labels itself a proposed revision that still requires team review; this frontend does not make that approval claim.

The deliverable is a React + Vite + TypeScript app rooted directly in `Frontend`. It implements the Overview Dashboard, reusable shell, initial routing, integration boundary, and honest placeholder routes for the remaining modules. It does not implement the backend, dataset processing, analytics calculations, RFM construction, machine learning, or reporting exports.

## Product requirements

- Overview displays Sales Value, Unique Invoices, Units Sold, and Identified Customers, with definitions and no unsupported period comparisons.
- One committed filter state (start date, end date, country) drives the displayed KPI, trend, product, and customer results. Apply validates dates and applies a draft filter together; Reset clears it.
- Sales trend uses a responsive rendered chart, a selected daily/weekly/monthly interval, readable axes, and tooltips. Missing periods are represented consistently by the API or demo adapter; frontend does not infer business aggregates.
- Product ranking switches between transaction value and units. It shows backend/demo-provided product descriptions and values. As the product module is a placeholder, ranking is not a deceptive link.
- Customer panel shows identified-customer count, RFM availability, and a clear route to the Customer Analytics placeholder.
- Dataset/system status only reflects metadata actually returned. No fabricated updated/processed timestamps, successful experiments, or live-sales claims.
- Every data view supports loading, empty, success, and error states. Retry repeats the same source request; API failure never falls back silently to demo data.
- Sidebar navigation includes all eight requested modules. Unimplemented module routes explain their placeholder status.
- Demo mode is explicit, separately sourced, internally consistent, and disabled by configuration when API mode is selected.

## Design Read and visual system

Reading this as: an operational analytics dashboard for an academic demo administrator, in a restrained editorial business-analytics style, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

- **Palette:** navy anchors the navigation and product identity; clear blue marks active controls and chart focus; cool light neutrals preserve chart and table readability. This follows the approved direction and reserves blue for interaction rather than decoration.
- **Typography:** system sans-serif keeps numbers and labels readable without adding a font dependency or remote font request.
- **Section labels:** small uppercase blue labels distinguish section context from metric values; the same treatment repeats consistently and uses checked contrast.
- **Composition:** fixed desktop sidebar plus a compact header frame the dashboard; KPI row precedes the prominent sales trend; product/customer panels use a secondary split; status sits below the analytical content. This follows the dashboard's information hierarchy.
- **Cards and spacing:** thin neutral borders and restrained corner radii separate distinct data groups; a subtle shadow marks the dashboard's main data panels. KPI cards share scale so users can compare four peer metrics directly, while chart and summary panels vary in composition to match their content.
- **Spacing:** larger gaps divide filters, metrics, trend, summaries, and system status; smaller repeated gaps group labels with their controls so the page stays scannable.
- **Iconography:** tree-shaken Lucide React stroke icons match the KPI and navigation concepts; text labels remain authoritative, and decorative symbols are avoided.
- **Gradient:** the sales-area fill fades toward the baseline so the series stays prominent while the area remains a secondary cue.
- **Link cue:** one diagonal arrow beside the Customer Analytics link signals navigation into a separate module.
- **Brand mark:** the outlined C is a temporary typographic monogram from the product name, not a final logo asset.
- **Motion:** restrained transitions support sidebar opening/collapse and hover/focus feedback; reduced-motion preference is respected. Loading skeletons and chart values stay static so movement is never needed to understand a value or state.
- **Responsive behavior:** permanent collapsible sidebar on wide screens, accessible drawer on narrow screens, KPI grid of four/two/one as space allows, and chart containers that shrink without horizontal page overflow.
- **Dark mode:** not added; the approved product direction specifies a light neutral canvas and navy navigation and does not request a theme toggle.

## Architecture and boundaries

```text
Frontend/
  src/
    app/                 router and application entry
    components/          shared UI states, badges, KPI, filters, chart panels
    layouts/             responsive app shell, sidebar, header
    pages/               Overview and placeholder module pages
    services/            API client, analytics adapter, isolated demo source
    styles/              tokens and global/layout/component styles
    types/               frontend API/view contracts
```

The analytics page consumes one `AnalyticsService` interface. `createAnalyticsService` selects either the API adapter or demo adapter from explicit configuration. The API adapter owns URL construction, timeout, HTTP/JSON validation, and maps the conceptual analytics resource to frontend view types. No endpoint is declared confirmed. The initial API resource path remains an environment-configurable integration setting until the backend team provides the contract. Date and country filters are serialized as request parameters by the adapter; the backend owns filtering semantics and all business calculations.

The API client reads `VITE_API_BASE_URL`; no credentials are stored in frontend configuration. Demo mode is explicit through `VITE_DATA_MODE=demo`; API mode is selected through `VITE_DATA_MODE=api` and never silently uses demo data. Development defaults to the clearly labeled demo adapter when the mode is unset. Production needs an explicit mode. API mode also requires `VITE_ANALYTICS_RESOURCE_PATH`, which remains blank until the backend team confirms its resource path; no endpoint is assumed.

## View contract

- `DashboardFilters`: ISO date-only `startDate`, `endDate`, and `country` (empty country means all countries).
- `DashboardSnapshot`: the active filters, KPI values with display-ready values and backend-owned definitions, trend points with interval keys/labels, product ranks containing both rank metrics, country options for the country filter, customer count/RFM availability, optional ISO 4217 currency code, and optional dataset/process/experiment status metadata.
- Counts and transaction values are received from the backend or demo fixture. The frontend only formats numbers and currencies; it does not derive invoices, units, customer eligibility, revenue, or RFM.
- Required KPI values may be unavailable. They render as unavailable rather than zero. The API adapter rejects malformed required response data with an actionable error.
- Status metadata and timestamps are optional and are omitted when unavailable.
- Exact response field names, currency, timezone, transaction exclusions, and allowed date boundaries require backend confirmation. A confirmed API response includes country options so the frontend can render valid filter choices.

## Interaction and state

Draft filter form state is separate from applied dashboard query state. Apply rejects malformed dates, future dates if the service contract disallows them, or a start date later than the end date. Since date boundaries are not finalized in the SRS, initial client validation only enforces a valid date and start <= end. Reset restores empty values. The success panel labels the source (Demo Data or Backend Data) and the applied filter summary. Demo mode contains precompiled day/week/month series; its displayed values do not recalculate for selected date/country filters, and this limitation appears beside the dashboard.

The dashboard uses explicit request states. First load renders fixed-size skeletons; no-result responses show a useful empty state; request/contract errors show a message and Retry; success renders the snapshot. While refetching, the previous result remains visibly tied to its previous applied filter until success, and is not relabeled as current.

Responsive drawer and desktop collapse are stateful controls with keyboard support, Escape close, focus visibility, and accurate `aria-expanded`/`aria-current`. Product rank selection changes the displayed series from fields already present in the same snapshot. Trend interval selection requests a new snapshot through the service.

## Test and acceptance strategy

- Unit tests cover date validation, configuration-based service selection, request URL/query serialization, timeout/HTTP/malformed response errors, and formatting edge cases.
- Component tests cover filter draft/apply/reset behavior, product metric switch, all four data states, visible data-source labeling, navigation placeholders, and responsive navigation interactions.
- Build and lint/typecheck scripts must pass.
- Browser verification at desktop, tablet, mobile portrait, and mobile landscape checks navigation, filters, chart rendering, empty/error states where controllable, and horizontal overflow.
- No success claim is made for live backend integration before a confirmed endpoint/schema exists.

## Open contract decisions

The SRS itself lists these as not final: exact reference dataset sheet/version; cancellation/return, duplicate, invalid price/date/product and missing-value treatment; RFM observation date and periods; backend endpoint and payload/error schema; currency/timezone; date range bounds; processing and persistence metadata; admin access; and experiment history. The frontend documents these for the backend team and does not make them up.
