# CusLytics Reports Implementation Plan

**Goal:** Replace the Reports placeholder with a data-honest, responsive report builder and an export workflow that clearly reports backend unavailability.

**Architecture:** Use existing analytics, customer analytics, ML Studio, and Model Evaluation services for source previews. Add a small injectable export service that returns a real Blob only when an implementation is supplied; the default reports backend-unavailable. No endpoint or backend files are assumed.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-reports-design.md`

## Task 1: Report types and export service

- [x] Define report type, output format, export config/result and injectable service types.
- [x] Test default unavailable service and preserves no fake endpoint assumption.
- [x] Implement a default unavailable service and update environment/docs as needed (no resource path until contract confirmation).

## Task 2: Dynamic builder and source states

- [x] Test type selection, config switching/retention, date validation, format state and reset.
- [x] Implement five selectable report types and source integration with existing service abstractions.
- [x] Keep demo sales preview visibly labeled; do not use demo records as actual results.
- [x] Add proper loading, success, empty/data unavailable, backend unavailable, and request error states.

## Task 3: Preview and export workflow

- [x] Test preview summaries, missing data behavior, experiment choice, export validation/error, and form preservation.
- [x] Render only service-supplied data/metadata in each preview type.
- [x] Enable download only after an injected exporter returns Blob+filename; default export remains unavailable.

## Task 4: Route, responsive styling, and verification

- [x] Replace `/reports` placeholder with the lazy Reports page; keep global theme and navigation intact.
- [x] Add responsive/theme token CSS with reduced-motion and keyboard/focus support.
- [x] Document provisional source/export assumptions and backend decisions.
- [x] Run focused tests, full test suite, lint, typecheck, and production build.
- [x] Browser-check the Reports route across six viewport orientations in both global themes; test report controls and no page overflow.
- [x] Confirm only frontend and docs files changed.
