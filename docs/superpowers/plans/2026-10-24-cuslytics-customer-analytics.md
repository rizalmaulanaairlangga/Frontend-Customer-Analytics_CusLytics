# CusLytics Customer Analytics Implementation Plan

> **For agentic workers:** Execute inline in this session; keep each task independently verifiable.

**Goal:** Replace the `/customers` placeholder with a responsive, data-honest customer analytics explorer for source-provided RFM data.

**Architecture:** Add a validated customer analytics service and provisional DTO, with an empty demo-mode source and a separately configured API resource path. Render only supplied metadata and observations through a page, charts, directory, and accessible detail drawer; use global theme tokens.

**Tech Stack:** React 19, Vite, TypeScript, React Router, Recharts, Lucide React, plain CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-customer-analytics-design.md`

## Global Constraints

- Do not modify backend files or create backend endpoints.
- Do not derive RFM, histogram data, customer eligibility, clusters, or profiles in the frontend.
- Never coerce customer IDs to numbers or show demo values as API results.
- Keep API resource path unconfigured until the backend contract is confirmed.
- Preserve global navigation/theme behavior and all existing pages.

---

### Task 1: Customer snapshot contract and service

**Files:** Create `Frontend/src/types/customerAnalytics.ts`, `Frontend/src/services/customerAnalyticsService.ts`, and service tests; modify `Frontend/.env.example`.

- [x] Write tests for demo mode returning `null`, API mode rejecting missing config, validating response and preserving string IDs/optional fields, and request errors passing through.
- [x] Run targeted test to confirm failure.
- [x] Implement source-provided snapshot types, runtime parser, configured adapter, and environment service. Keep `VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH` empty.
- [x] Run targeted tests to confirm pass.

### Task 2: Customer charts and summary

**Files:** Create `Frontend/src/components/customer-analytics/CustomerAnalyticsCharts.tsx` and tests; modify `Frontend/src/styles/tokens.css`.

- [x] Test metric switching, distinct scatter axes, empty inputs, and customer ID tooltip labels.
- [x] Confirm tests fail before implementation.
- [x] Implement Recharts views using source bins and source observations only; add light/dark RFM accent tokens.
- [x] Run targeted tests.

### Task 3: Directory and accessible detail drawer

**Files:** Create `Frontend/src/components/customer-analytics/CustomerDirectory.tsx`, `CustomerDetailDrawer.tsx`, and component tests.

- [x] Test string-ID search, sorting, pagination, reset, empty result, unavailable clusters, and drawer Escape/close/focus restoration.
- [x] Confirm tests fail before implementation.
- [x] Implement accessible table and responsive drawer; omit unsupported filters and hide unavailable history values.
- [x] Run targeted tests.

### Task 4: Route, page, theme styling, and integration notes

**Files:** Create `Frontend/src/pages/CustomerAnalyticsPage.tsx`, page test, and `Frontend/src/styles/customer-analytics.css`; modify `Frontend/src/app/routes.tsx`, `Frontend/src/main.tsx`, `Frontend/.env.example`, and `Frontend/README.md`.

- [x] Test loading/unavailable/error/success states, summary values, RFM/cluster separation, and navigation link.
- [x] Confirm tests fail before implementation.
- [x] Implement page data lifecycle, retry, route, themed responsive styling, API config docs, and backend questions.
- [x] Run targeted tests.

### Task 5: Full verification

**Files:** Review existing route/page tests; no unrelated behavior changes.

- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` from `Frontend`.
- [x] Run the local app and check Customer Analytics plus existing pages/placeholders in both themes at desktop, laptop, tablet portrait/landscape, and mobile portrait/landscape; verify no page-level overflow and test directory/drawer controls.
- [x] Fix the Data Quality table overflow regression and repeat browser checks.
- [x] Confirm only frontend files and shared docs were changed; report the exact backend contract items still pending.
