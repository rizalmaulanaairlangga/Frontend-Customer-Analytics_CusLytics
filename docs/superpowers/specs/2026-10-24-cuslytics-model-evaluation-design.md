# CusLytics Model Evaluation Design

## Goal

Interpret and compare backend-reported successful K-Means experiments without calculating model outputs or inventing evaluations in the browser.

## Page structure

- Header with shared theme styling, availability, experiment selector, and navigation back to ML Studio.
- Evaluation summary with experiment configuration, inertia, valid silhouette score, actual cluster count, and evaluated customer count.
- Backend-provided cluster distribution and RFM profile table; individual scatter points only when supplied.
- Multi-experiment comparison from backend-reported successful experiment history, including an inertia-versus-K chart only when applicable data exists.
- Interpretation limited to comparable, supplied RFM profile values, plus fixed caveats about metric and clustering limitations.
- Empty, loading, error, and backend-unavailable states; no model calculations, fabricated history, or demo results.

## Architecture

Reuse the ML Studio metadata service to discover successful experiment IDs. Add a separate Model Evaluation service adapter with a blank configurable evaluation resource path. Its provisional response parser validates experiment identity, counts, cluster profiles, optional point data, and silhouette validity. The page receives an injectable service and derives no result beyond formatting and simple cluster percentages from source-reported counts.

The `experimentId` query parameter selects a real experiment and is used by navigation from ML Studio. Comparison selection uses actual available experiment history, and each selected evaluation is fetched through the same service boundary. An unavailable API or an absent evaluation path remains explicit.

## Visual and accessibility direction

Use CusLytics tokens with blue/violet for experiment metrics, cyan/teal for RFM, distinct theme-aware cluster colors, and amber/coral for caveats. Recharts provides responsive bars and scatter points; axes, grids, labels, and tooltips use semantic tokens. Tables scroll within their panels on small screens; native controls and focus-visible states remain keyboard accessible.

## Backend details to confirm

Confirm evaluation resource path/method, query semantics, experiment metadata fields, cluster counts and profiles, statistic method, monetary unit, point-level customer privacy/availability, silhouette validity/reason, metric nullability, timestamp timezone, preprocessing comparability, evaluation retention, and any deep-link behavior. The response model and env variable are frontend adapter assumptions until approved.

## Verification

Test payload validation and count consistency, experiment selection/query navigation, unavailable and empty states, scatter axis selection and tooltip values, comparison selection, interpretation constraints, theme behavior, responsive layouts, lint, typecheck, and production build.
