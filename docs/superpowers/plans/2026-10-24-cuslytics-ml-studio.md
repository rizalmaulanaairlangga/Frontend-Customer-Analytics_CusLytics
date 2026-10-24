# CusLytics ML Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an honest ML Studio frontend for configuring and monitoring backend-provided K-Means experiments over prepared RFM features.

**Architecture:** A dedicated ML Studio service boundary supplies optional metadata, history, and run responses. The page renders only service-reported information and keeps K/seed form state local. Shared design tokens and route theme remain global.

**Tech Stack:** React, TypeScript, React Router, plain CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-ml-studio-design.md`

## Global Constraints

- Frontend only; do not create or modify backend files.
- Do not calculate ML/RFM/data quality values or fabricate experiment outcomes.
- Keep API resource paths unconfigured until the backend contract is agreed.
- Use the existing shared light/dark theme and design tokens.
- Do not implement Model Evaluation beyond a real experiment link.

## Files

- `Frontend/src/types/mlStudio.ts`: provisional frontend-facing metadata, history, request/result, and service interfaces.
- `Frontend/src/services/mlStudioService.ts`: unconfigured service and future API adapter boundary.
- `Frontend/src/services/mlStudioService.test.ts`: configuration and payload validation checks.
- `Frontend/src/pages/MLStudioPage.tsx`: configuration form, readiness/status panels, and history states.
- `Frontend/src/pages/MLStudioPage.test.tsx`: configuration, validation, submit, and history interaction tests.
- `Frontend/src/styles/ml-studio.css`: responsive page styles using shared theme tokens.
- `Frontend/src/app/routes.tsx`, `Frontend/src/main.tsx`, `Frontend/src/app/App.test.tsx`: route/style registration and navigation coverage.
- `Frontend/src/styles/layout.css`: correct placeholder foreground/background token use in both themes.
- `Frontend/.env.example`, `Frontend/README.md`: document blank resource path and pending API contract.

## Tasks

- [x] Add service tests for unconfigured resources, valid server responses, malformed payload rejection, and submit request preservation; run them to observe expected failures.
- [x] Add page tests for K choices, integer seed validation, reactive summary, unavailable run behavior, successful response rendering only when an injected service returns one, and empty/error/loading history states.
- [x] Implement types/service boundary without default demo values, fabricated records, or confirmed endpoint assumptions; run service tests.
- [x] Implement page and route with keyboard-accessible form controls, shared RFM definitions, status truthfulness, real evaluation links, and history sorting/status filters only for supplied records; run page/route tests.
- [x] Add responsive token-based ML Studio styles; audit/fix any light-only hardcoded placeholder colors while preserving existing page design.
- [x] Document ML Studio integration variables and unresolved backend contract in `.env.example` and README.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; inspect changed files and browser layouts/themes across supported sizes.
