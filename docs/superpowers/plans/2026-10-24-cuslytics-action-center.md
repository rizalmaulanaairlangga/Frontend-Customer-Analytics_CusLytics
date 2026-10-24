# CusLytics Action Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a transparent, backend-driven Action Center without inventing recommendations or business rules.

**Architecture:** Add a typed, injectable read-only service for a configurable recommendation snapshot. Build a responsive list/filter/sort workspace and accessible evidence drawer that render only validated source records. Keep the service path blank until the backend team confirms its contract.

**Tech Stack:** React, TypeScript, React Router, plain CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-action-center-design.md`

## Global Constraints

- Frontend only; do not create or modify backend files.
- Do not calculate, classify, or synthesize recommendations in the frontend.
- Do not define RFM thresholds or imply an action causes business outcomes.
- Do not add an assumed endpoint; keep `VITE_ACTION_CENTER_RESOURCE_PATH` blank.
- Do not include recommendation demo fixtures.
- Use shared theme tokens, shared global theme preference, and established responsive layout.

---

### Task 1: Service and model

**Files:** Create `Frontend/src/types/actionCenter.ts`, service and service tests; update `Frontend/.env.example`.

- [x] Write tests first for a valid snapshot, malformed recommendation rejection, missing API configuration, and GET-only call to the configured path.
- [x] Verify expected red tests.
- [x] Add typed recommendation, evidence, snapshot, and injectable service interfaces. Parse all optional evidence as nullable; require the six textual recommendation fields and stable ID/category/source.
- [x] Configure only `VITE_API_BASE_URL` and `VITE_ACTION_CENTER_RESOURCE_PATH`; issue GET via existing `getJson` and never fall back to demo data.
- [x] Run focused service tests and typecheck.

### Task 2: Page state and controls

**Files:** Create `Frontend/src/pages/ActionCenterPage.tsx` and tests; update route in `Frontend/src/app/routes.tsx`.

- [x] Write failing UI tests for loading/unavailable/error/empty states, success cards, filter/source/search changes, title/newest sorting, reset, and summary updates.
- [x] Verify expected red tests.
- [x] Implement API request lifecycle with AbortController and retry; derive list filtering and summary counts only from received recommendation records.
- [x] Disable controls when there are no records; distinguish a backend empty result from no filter matches and backend unavailable.
- [x] Add accessible native filters and labels; newest sort is available only if every returned item has a real timestamp.
- [x] Run focused page tests.

### Task 3: Cards, evidence, and navigation

**Files:** Create `Frontend/src/components/action-center/RecommendationCard.tsx`, evidence drawer component, and `Frontend/src/styles/action-center.css`; update `Frontend/src/main.tsx`.

- [x] Add tests for six card sections, optional evidence placeholders, RFM and cluster contextual links, absent experiment ID behavior, Escape/backdrop/close control, and focus return.
- [x] Verify expected red tests.
- [x] Render observations, evidence, reasoning, suggested actions, and limitations from the selected record only; never derive classifications or outcomes.
- [x] Link RFM records to `/customers`, cluster records to `/model-evaluation?experimentId=<supplied-id>` only when supplied, and all records to `/reports`.
- [x] Add category token colors and responsive drawer/list styles in light/dark using existing tokens; honor reduced-motion preference.
- [x] Run focused tests.

### Task 4: Documentation and verification

**Files:** Update `Frontend/README.md`; update plan progress.

- [x] Document the blank resource variable, no-demo behavior, provisional response assumptions, and backend decisions listed in the spec.
- [x] Run `npm test -- --run`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Browser-check all application routes in both themes at desktop, laptop, tablet portrait/landscape, and mobile portrait/landscape; UI tests cover filter/detail interactions and browser checks cover page overflow.
- [x] Review the final files to confirm no backend changes and no recommendation fixtures were introduced.
