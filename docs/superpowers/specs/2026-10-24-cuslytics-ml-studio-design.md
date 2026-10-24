# CusLytics ML Studio Design

## Goal

Provide an honest, responsive workspace for configuring a backend-run K-Means experiment over prepared RFM features, with experiment lifecycle and history surfaces that never imply a run occurred without backend evidence.

## Context and design direction

ML Studio replaces its current placeholder while preserving CusLytics navigation, shared theme, CSS token palette, and existing page layouts. The interface uses the current navy/blue system, indigo for configuration, cyan for RFM, amber for unavailable or pending states, teal for success, red for failures, and violet for experiment history. Status always includes text and iconography.

## Page structure

1. Header and concise experiment overview: purpose, RFM feature source, K-Means, RFM connection status, and last experiment metadata only when supplied.
2. Configuration workspace: selectable K (2–8), deterministic seed default 42, preprocessing shown as pending until backend metadata confirms it, and three RFM definition cards.
3. Live configuration summary and prerequisite validation; RFM feature statistics appear only when returned by the service.
4. Run action: validate K and integer seed; if service is unavailable, keep the chosen configuration and display an unavailable message. Only a configured service may submit a request; only actual responses may set lifecycle, timestamps, progress, or experiment IDs.
5. Current lifecycle panel and experiment history: loading/error/unavailable/empty/data states. History selection is read-only. Evaluation links require an actual successful experiment ID.

## Architecture

Add a dedicated ML Studio type and service boundary with injectable service dependencies. API resource paths remain blank/configurable until the backend team confirms them; no route or request is assumed to exist. The initial implementation reports an unavailable service and does not generate model results. The page owns form state and rendering; the service owns network access and payload validation. The existing Model Evaluation route remains its current placeholder and receives an experiment ID only through a real successful result link.

## Theme and responsive behavior

Continue using `data-theme` and centralized CSS variables; no local theme state. Audit page and placeholder styles for hardcoded light-only foreground/background colors and replace them with semantic tokens where found. Configuration becomes one column on narrow screens, history table scroll stays contained, controls remain keyboard reachable, and global reduced-motion support applies.

## Boundaries and assumptions to confirm

- Backend resource paths and methods for metadata, history, and experiment submission.
- Exact request/response schema and lifecycle status values.
- Dataset/RFM readiness criteria and supported K limits for each dataset.
- Preprocessing/scaling name and version; random initialization details.
- Which metrics are returned and when each metric is valid.
- Timestamp timezone/format, progress fields, and evaluation deep-link contract.

No frontend ML, RFM calculation, data processing, synthetic history, fake progress, or backend files are in scope.

## Verification

Test config validation, dynamic summary, honest backend-unavailable handling, response-driven status/history, route/navigation, and theme behavior. Run existing test, lint, typecheck, build checks and responsive light/dark browser review.
