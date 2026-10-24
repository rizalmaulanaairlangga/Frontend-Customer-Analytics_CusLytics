# CusLytics Sales & Products Implementation Plan

**Goal:** Replace the Sales & Products placeholder with a truthful, responsive analytics page using the existing dashboard service and global theme.

**Constraints:** Frontend only. No endpoint guesses, data processing, ML, fabricated API values, or unrelated redesign.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-sales-products-design.md`

## Tasks

### 1. Optional service model and isolated demo fixture

- [x] Write parser tests for optional series/country/product data and malformed values.
- [x] Add optional response fields and validation without changing configured resource path.
- [x] Extend isolated demo fixture and definitions for the page controls.

### 2. Sales & Products page

- [x] Test loading, unavailable, API error, empty aggregates, synchronized filters, and interactions.
- [x] Add shared filter summary, KPI cards, sales and selected invoice/unit trends.
- [x] Add ranking controls, searchable/sortable/paginated table, and product selection.
- [x] Add country ranking that applies the shared country filter.
- [x] Replace only the existing Sales & Products route placeholder.

### 3. Styling and responsive behavior

- [x] Use global semantic light/dark tokens and deliberate section accents.
- [x] Verify desktop, laptop, tablet portrait/landscape, mobile portrait/landscape, and keyboard states.
- [x] Keep charts and table usable without page-level horizontal overflow.

### 4. Verification and documentation

- [x] Run tests, lint, typecheck, and production build.
- [x] Exercise routes, both themes, filters, interval/metric switches, search, sorting, pagination, country and product selection in Playwright.
- [x] Document remaining backend contract decisions and report review outcomes.
