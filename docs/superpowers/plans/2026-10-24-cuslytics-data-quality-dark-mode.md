# CusLytics Data Quality and Dark Mode Implementation Plan

> **For agentic workers:** Implement task by task. Steps use checkbox syntax for tracking.

**Goal:** Add an honest backend-ready Data Status / Quality page and a persisted global light/dark theme without changing backend files or breaking Overview.

**Architecture:** Add a typed Data Quality model and service adapter over the existing `getJson` client. API mode requires an explicitly configured quality resource path; demo mode resolves to an unconnected state. Put theme state in one provider around existing routes and theme tokens at the document root.

**Tech Stack:** React 19, TypeScript, React Router, Recharts, Lucide React, CSS, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-data-quality-dark-mode-design.md`

## Global Constraints

- Frontend only. Do not create or modify backend files.
- Never invent actual metadata, quality findings, or processing outcomes.
- Do not add a confirmed endpoint or hard-coded resource path.
- Do not calculate quality/business results in the browser.
- Keep all non-Overview navigation destinations as placeholders except Data Status / Quality.

---

### Task 1: Data Quality types and API adapter

**Files:** `src/types/dataQuality.ts`, `src/services/dataQualityService.ts`, tests adjacent, `.env.example`, `.env` typing if needed.

- [x] Test response parsing, optional metadata, invalid payload, missing path, and demo no-data result.
- [x] Implement typed DTO validation and configurable API service using existing `getJson`.
- [x] Verify focused service tests.

### Task 2: Global theme state

**Files:** `src/contexts/ThemeContext.tsx`, `src/app/App.tsx`, `src/layouts/Header.tsx`, `index.html`, context/App tests.

- [x] Test accessible theme toggle, root attribute, preference persistence, and initial theme.
- [x] Add one provider and pre-React preference bootstrap.
- [x] Verify theme tests and existing app tests.

### Task 3: Data Status / Quality page

**Files:** `src/pages/DataQualityPage.tsx`, components under `src/components/data-quality/`, tests, `src/app/routes.tsx`.

- [x] Test loading, disconnected, populated, empty results, error, search, disclosures, and chart category selection.
- [x] Implement dataset identity, honest summary, conceptual structure, eight quality indicators, findings chart, cleaning audit, and validation/warnings.
- [x] Replace only the Data Status / Quality placeholder route.
- [x] Verify page tests and existing Overview tests.

### Task 4: Theme tokens and responsive styles

**Files:** `src/styles/tokens.css`, `global.css`, `layout.css`, `dashboard.css`, new data-quality CSS, `src/main.tsx`.

- [x] Add semantic light/dark token sets and convert existing hard-coded theme-dependent styles.
- [x] Theme chart grid, axis, cursor, and tooltip through shared tokens.
- [x] Check contrast, responsive reflow, keyboard focus, and reduced motion.

### Task 5: Whole-app verification and documentation

**Files:** `Frontend/README.md` and design gate report.

- [x] Run tests, lint, typecheck, and production build.
- [x] Exercise routes, theme toggle, tables, chart, disclosure, and filters in Playwright at desktop/tablet/portrait/landscape viewports.
- [x] Confirm there are no fabricated data claims, horizontal overflow, or backend changes.
- [x] Document the backend contract items still awaiting confirmation.
