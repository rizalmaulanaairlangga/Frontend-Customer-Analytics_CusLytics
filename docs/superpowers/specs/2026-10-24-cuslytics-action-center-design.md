# CusLytics Action Center Design

## Purpose and scope

Action Center is a review workspace for recommendations that an approved backend rule or analytics process has actually supplied. The audience is a business analyst deciding whether to investigate a suggested action. It must make observations, supporting evidence, reasoning, proposed action, and limitations visibly distinct.

This feature is frontend only. It does not classify customers, define RFM thresholds, create campaign recommendations, send messages, retrain models, or claim business outcomes. The five requested categories are supported as category identifiers and filter options, not as active recommendations or rules. With no backend connection, the page shows a clear unavailable state and no recommendation cards.

## Visual direction

- Continue the existing CusLytics navy, blue, violet, teal, and neutral token system.
- Use a compact category accent rail and category badge as the page's visual signature; use the same category color in the summary and card.
- Keep cards scan-friendly: title and category first, then observation, evidence, reasoning, suggested action, and limitations.
- Use amber for caveats. Do not use success green or a ranking score to imply that a recommendation will work.
- Use shared theme tokens for light and dark mode. Keep the existing global theme toggle and typography.
- On wide screens use a two-column recommendation grid; collapse to a single column on tablet/mobile. Render evidence detail in a responsive side drawer that becomes full width on small screens.

## Data and service boundaries

Create a provisional `ActionCenterSnapshot` and `ActionRecommendation` model under `Frontend/src/types/actionCenter.ts`. Each recommendation contains a stable ID, title, one of the five categories, a source (`rfm`, `cluster`, or `product`), observed finding, reasoning, suggested action, explicit limitations, optional segment/customer IDs, and optional supplied evidence (RFM values with units/source, cluster and experiment identity, observation period, analyzed population). Nullable or absent fields remain unavailable in the UI.

Add an injectable GET-only `ActionCenterService` in `Frontend/src/services/actionCenterService.ts`. Read `VITE_API_BASE_URL` and blank `VITE_ACTION_CENTER_RESOURCE_PATH`. Do not add endpoint strings or requests beyond the path supplied by configuration. Validate responses before display; malformed responses become errors rather than partial or fabricated results. There is no demo fixture.

The data shape and environment variable are frontend adapter assumptions until confirmed with the backend team. No request parameters are assumed. Counts may be summarized from the returned recommendation records because they are records already supplied by the source; the frontend never creates or classifies recommendation records.

## Interaction and page structure

1. Header and source/availability state.
2. Recommendation summary based on the currently visible result set: visible total, category counts, source counts, and support-data availability.
3. Filters for category, source, and search across title, segment, and supplied customer IDs. Sorting is alphabetical by title or newest only when all records have a supplied timestamp. Reset clears filters; active filters are visible.
4. Reusable cards with the six required content sections. `View Evidence` opens a detail drawer. All text is from the service response; absent evidence is labeled unavailable.
5. Drawer links to Customer Analytics for RFM, Model Evaluation only when an experiment ID exists, and Reports.
6. Empty, no-match, loading, error, backend-unavailable, and evidence-unavailable states are distinct. Retry reloads the service. Drawer closes by close button, Escape, and backdrop; focus returns to the triggering button.

## Accessibility and responsive behavior

Use labelled native controls, visible focus, keyboard-operable buttons, dialog semantics, reduced-motion support, and state text not conveyed by color alone. Keep long content readable and do not create page-level horizontal overflow. At phone sizes use stacked controls/cards and a full-width detail drawer; preserve internally scrollable evidence when needed.

## Verification

Test response validation, unavailable/error/empty/success states, filtering, search, sorting, reset, summary updates, evidence drawer open/close/Escape, and contextual links. Run the project's test, lint, typecheck, and build scripts. Use browser checks for light/dark themes and six representative desktop/tablet/mobile orientations across all routes. Confirm no backend files changed.

## Backend decisions still required

Confirm the endpoint path and response schema; recommendation ID lifecycle; authoritative category/source identifiers; whether each statement is observation or interpretation; evidence units and provenance; segment/customer identifier policy; cluster ID plus experiment ID linkage; observation period and analyzed population; recommendation timestamps; unavailable/missing field semantics; refresh cadence; and error/status behavior. Confirm rule thresholds and category qualification with the product/data team before any backend publishes active recommendations.
