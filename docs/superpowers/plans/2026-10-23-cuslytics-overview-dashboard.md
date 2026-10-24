# CusLytics Overview Dashboard Implementation Plan

> **For agentic workers:** execute tasks in order in this session. Steps use checkbox syntax to track progress.

**Goal:** Build a responsive React + Vite + TypeScript Overview Dashboard in the `Frontend` directory with an explicit demo/API boundary and honest data states.

**Architecture:** React Router hosts the reusable app shell and Overview/placeholder routes. Dashboard UI consumes a typed analytics service that selects an isolated demo adapter or a configurable API adapter; all business calculations remain in the backend.

**Tech Stack:** React, Vite, TypeScript, React Router, Recharts, Lucide React, plain CSS, Vitest, React Testing Library, jsdom.

**Spec:** `docs/superpowers/specs/2026-10-23-cuslytics-overview-dashboard-design.md`

## Global Constraints

- The Vite project root is `Frontend`; do not nest another project inside it.
- Do not create or modify files in `Backend`.
- Use `VITE_API_BASE_URL` for the API base URL; never hardcode a backend host in UI components.
- Demo data is visibly labeled and never substituted after an API error.
- The frontend does not calculate sales, invoice counts, units, customer qualification, RFM, or ML outputs.
- Do not display unavailable metadata as if it exists.
- Navigation destinations outside Overview are explicit placeholder pages.
- Preserve responsive desktop, tablet, mobile portrait, and landscape behavior with keyboard access and visible focus.

---

## File map

- `Frontend/package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`: Vite/TypeScript app and commands.
- `Frontend/.env.example`: documented mode and base URL settings without secrets.
- `Frontend/src/main.tsx`, `src/app/App.tsx`, `src/app/routes.tsx`: bootstrap and route tree.
- `Frontend/src/types/analytics.ts`: service and snapshot contracts.
- `Frontend/src/services/apiClient.ts`: URL/query, timeout, HTTP and JSON failures.
- `Frontend/src/services/analyticsService.ts`: mode selection and service interface.
- `Frontend/src/services/demoAnalyticsService.ts`: isolated, labeled, internally consistent demo fixture/source.
- `Frontend/src/services/apiAnalyticsService.ts`: configurable conceptual resource path and API mapping.
- `Frontend/src/components/*`: status, state, KPI, filters, and chart panels.
- `Frontend/src/layouts/*`: reusable responsive shell, sidebar, header.
- `Frontend/src/pages/*`: dashboard and module placeholders.
- `Frontend/src/styles/*`: design tokens, global styles, and responsive rules.
- Colocated `*.test.ts(x)` files: service, validation, UI-state, navigation, and interaction tests.
- `Frontend/README.md`: run instructions, chart choice, mode, endpoint/schema handoff.

## Task 1: Scaffold the app at the required root

**Files:** Create Vite files and configuration inside `Frontend`; do not alter Backend.

- [x] Confirm `Frontend` contents and preserve all existing files.
- [x] Scaffold React + TypeScript in-place (or create the minimal Vite configuration without overwriting any existing content).
- [x] Add React Router, Recharts, Lucide React, Vitest, Testing Library, and jsdom only; avoid a CSS framework.
- [x] Configure `dev`, `build`, `preview`, `lint`, `typecheck`, and `test` scripts.
- [x] Add `.env.example` with `VITE_DATA_MODE=demo`, `VITE_API_BASE_URL=`, and a conceptual dashboard resource path setting.
- [x] Run the initial build and test runner to establish that the scaffold is valid.

## Task 2: Define API/view types and test filter validation

**Files:** `src/types/analytics.ts`, `src/components/dashboard/filterValidation.ts`, `src/components/dashboard/filterValidation.test.ts`.

**Interface:** `DashboardFilters`, `DashboardSnapshot`, `AnalyticsService`, `validateDashboardFilters(filters): FilterValidationResult`.

- [x] Write tests for valid dates, unset boundaries, malformed dates, and start date after end date.
- [x] Run the filter validation tests and confirm they fail because the module is absent.
- [x] Define the minimal types and validator; enforce only date parseability and `startDate <= endDate`.
- [x] Run the same tests and confirm they pass.

## Task 3: Build the isolated service boundary with tests

**Files:** `src/services/apiClient.ts`, `apiClient.test.ts`, `analyticsService.ts`, `analyticsService.test.ts`, `apiAnalyticsService.ts`, `demoAnalyticsService.ts`.

**Interface:** `getJson<T>(path, baseUrl, query, options): Promise<T>`; `AnalyticsService.getDashboard(filters, interval, signal?): Promise<DashboardSnapshot>`; `createAnalyticsService(config): AnalyticsService`.

- [x] Test URL resolution and query encoding, request timeout/abort, non-2xx errors, invalid JSON, and required-field validation.
- [x] Test API/demo selection and ensure API failure never invokes demo service.
- [x] Run tests to observe the missing behavior failures.
- [x] Implement the smallest typed service/client and a mockable fetch dependency for tests.
- [x] Keep the API resource path configurable and identify it as unconfirmed in README.
- [x] Add one coherent demo fixture whose KPI and panel values are all explicitly demo output; keep calculation rules outside UI.
- [x] Run service tests and typecheck.

## Task 4: Create shared design system and application shell

**Files:** `src/styles/tokens.css`, `global.css`, `layout.css`; `src/layouts/AppShell.tsx`, `Sidebar.tsx`, `Header.tsx`; `src/components/StatusBadge.tsx`.

- [x] Add focused tests for navigation labels, active route semantics, collapse and drawer toggles, Escape close, and focusable controls.
- [x] Implement navy sidebar, light-neutral canvas, blue active/action accent, system sans typography, visible focus, and restrained borders.
- [x] Wire desktop collapse and mobile drawer with accessible button state and routes.
- [x] Run shell tests and typecheck.

## Task 5: Implement the Overview dashboard components and test interactions

**Files:** `src/pages/OverviewPage.tsx`; `src/components/dashboard/FilterBar.tsx`, `KpiCard.tsx`, `SalesTrendChart.tsx`, `ProductPerformance.tsx`, `CustomerSummary.tsx`, `SystemStatus.tsx`, `DataState.tsx`; tests alongside each behavior.

- [x] Write component tests for draft/apply/reset, consistent applied filters, KPI definitions, rank metric switching, interval selection, source labeling, and loading/empty/error/success rendering.
- [x] Run tests first and confirm the expected failures.
- [x] Implement page state with one service snapshot request per applied filter/interval; retry reuses that request.
- [x] Render Recharts line/area data from service-provided points with axes, tooltip, interval labels, responsive sizing, and no frontend aggregation.
- [x] Keep unavailable values and timestamps explicitly unavailable/omitted; RFM shows the API/demo-provided status.
- [x] Run component tests and typecheck.

## Task 6: Add all routes and explanatory placeholders

**Files:** `src/app/routes.tsx`, `src/pages/ModulePlaceholderPage.tsx`, `routes.test.tsx`.

- [x] Test every sidebar link resolves to a page and non-Overview pages identify themselves as not implemented.
- [x] Implement routes for Data Status / Quality, Sales & Products, Customer Analytics, ML Studio, Model Evaluation, Action Center, and Reports as labeled placeholders.
- [x] Ensure no UI suggests an incomplete module is already working.
- [x] Run routing tests.

## Task 7: Responsive/accessibility and visual verification

**Files:** responsive CSS and focused test fixes only.

- [x] Run the app locally and verify desktop (1440x900), tablet (768x1024), mobile portrait (390x844), and mobile landscape (844x390).
- [x] Click/keyboard-test filters, reset/apply, rank selector, interval selector, retry, sidebar collapse/drawer, Escape, and route links.
- [x] Confirm chart tooltip, source label, date validation, empty/error states, and no horizontal overflow.
- [x] Fix only issues found in scope and record any unavailable backend-only state that cannot be represented without a fixture.

## Task 8: Documentation and final checks

**Files:** `Frontend/README.md`, `.env.example`, final affected source.

- [x] Document chart choice (Recharts: responsive React chart components with tooltip/axes and service-provided series), run commands, environment variables, demo behavior, and pending backend fields/resource path.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` from `Frontend`.
- [x] Inspect changed files and confirm Backend remains untouched and no nested frontend project was created.
- [x] Report exact commands/results and remaining contract decisions; do not claim backend integration.
