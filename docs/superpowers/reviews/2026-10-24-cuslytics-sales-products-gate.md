# CusLytics Sales & Products Design Gate

## Review outcome

| Check | Result | Evidence |
| --- | --- | --- |
| Data provenance | PASS | API data is identified as backend data. The demo fixture has an explicit `Demo Data` badge and notice that it is illustrative and does not recalculate filters. |
| Shared filters | PASS | One applied date/country/interval tuple drives the dashboard request and every analytical view. Country selection applies that shared filter and reloads the snapshot. |
| No fabricated aggregates | PASS | Optional invoice/unit period series, product invoice counts, and country aggregates come only from the service payload. Missing or null values remain unavailable. |
| Business claims | PASS | The page states Transaction Value is not profit. Negative/return treatment and period comparisons are not inferred. |
| API contract boundary | PASS | The existing configured analytics resource is reused. Optional field names are documented as provisional; no endpoint or server was added. |
| Interaction and accessibility | PASS | Native date/country/select controls, keyboard-operable ranking selections, metric definitions, accessible chart summaries/tooltips, search, sorting, pagination, and real retry behavior were checked. |
| Light/dark presentation | PASS | Theme tokens cover chart lines, axes, grid, controls, table, selected rows, and geography/product accents. Browser checks verified theme persistence across Sales, Overview, Data Status / Quality, and a placeholder route. |
| Responsive behavior | PASS | No page-level horizontal overflow at 1440x1000, 1280x800, 1024x900, 768x1024, 390x844, 320x640, and 844x390. Table overflow remains contained within its own scroll region. |
| Reduced motion | PASS | New interactions use brief transitions and turn them off for reduced-motion preference. |
| Backend boundary | PASS | No backend source or API server was created or modified. |

No design-gate failures remain. Exact API meanings and nullability remain backend-team decisions, documented below.

## Antislop review record

- R01: PASS. One page purpose and clear visual order from filters to sales, product, and geography.
- R02: PASS. Labels explain data and controls directly; no decorative growth claims or profit language was added.
- R03: PASS. Color is restrained to metric/category accents and every rank includes a readable label and value.
- R04: PASS. Demo provenance is explicit. Unavailable values never render as zero.
- R05: PASS. Overview's existing analytics components and service are reused where their behavior fits.
- R06: PASS. Optional backend data is validated; missing series do not get fabricated.
- R07: PASS. All theme-dependent styles use shared variables, including new violet/coral accents.
- R08: PASS. Desktop, tablet portrait/landscape, mobile portrait, and mobile landscape were exercised without page-level overflow.
- R09: PASS. No motion implies a data change; chart and selection transitions are brief and reduced-motion safe.
- R10: PASS. Backend contract, calculations, and endpoint ownership remain outside the frontend.

## Automated evidence

- Vitest: 12 test files and 52 tests passed.
- Oxlint: passed.
- TypeScript project check: passed.
- Vite production build: passed.
- Playwright: 36 browser checks passed with no page errors. Coverage includes shared filters/reset, daily interval, invoice/unit metric, chart tooltip, product metric/top count/selection, search/sorting/pagination, country selection, both themes, related routes, and seven viewport sizes.
- Contrast checker: semantic indigo, coral, and dark primary-action pairs passed at 4.94:1 or higher.
- Visual captures: `.sales-light.png`, `.sales-dark.png`, `.sales-mobile.png`.

## Backend decisions to confirm

Confirm response field names, nullability, currency, `productId` to StockCode mapping, invoice/unit time series, product invoice counts, country transaction aggregates, and whether every response section follows the same inclusion/exclusion rules. Confirm filter date/timezone semantics and supported intervals before wiring production data.

Exact browser-level 200% zoom was not automated; narrow CSS-pixel widths and landscape layouts were exercised.
