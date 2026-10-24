# CusLytics Model Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an accurate Model Evaluation UI for backend-reported K-Means results and comparisons.

**Architecture:** Reuse ML Studio history for successful experiment discovery and add an injectable evaluation adapter for experiment results. Render only returned values; use Recharts for actual distributions and optional individual points.

**Tech Stack:** React, TypeScript, React Router, Recharts, plain CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-24-cuslytics-model-evaluation-design.md`

## Global Constraints

- Frontend only. Do not create or edit backend files.
- No K-Means, RFM, silhouette, inertia, or synthetic point calculations.
- No endpoint/resource path is presumed; keep evaluation path blank until agreed.
- Silhouette is shown only when the backend marks it valid.
- Keep Model Evaluation focused on interpreting/ comparing results; ML Studio owns execution.
- All page colors use global theme-aware design tokens.

## Files

- `Frontend/src/types/modelEvaluation.ts`: provisional evaluation payload and service contracts.
- `Frontend/src/services/modelEvaluationService.ts`: adapter using successful ML Studio history and configured evaluation resource.
- `Frontend/src/services/modelEvaluationService.test.ts`: parser, data consistency, service configuration tests.
- `Frontend/src/pages/ModelEvaluationPage.tsx`: experiment selection, summary, status, history-derived comparison controls, and interpretation.
- `Frontend/src/pages/ModelEvaluationPage.test.tsx`: selection/query, metrics, axes, comparison and state behavior.
- `Frontend/src/components/model-evaluation/ModelEvaluationCharts.tsx`: distribution/scatter/inertia charts from supplied data.
- `Frontend/src/styles/model-evaluation.css`: responsive token-based visual system.
- `Frontend/src/app/routes.tsx`, `Frontend/src/main.tsx`, `Frontend/src/app/App.test.tsx`: lazy route/style/navigation.
- `Frontend/src/styles/tokens.css`, `Frontend/.env.example`, `Frontend/README.md`: cluster palette and adapter documentation.

## Tasks

1. [x] Write failing service parser/configuration tests and page tests for empty state, selected evaluation, axes, and comparison controls.
2. [x] Implement provisional types and service adapter with no assumed endpoints; validate supplied evaluation consistency.
3. [x] Implement page selection, metric disclosures, cluster distribution/profile, conditional scatter and comparison, and evidence-limited interpretation.
4. [x] Add responsive token-based charts/table styling and cluster palette for both themes.
5. [x] Document the blank evaluation resource and payload details needing backend approval.
6. [x] Run all tests, lint, typecheck, build, and browser checks for theme and target screen sizes.
