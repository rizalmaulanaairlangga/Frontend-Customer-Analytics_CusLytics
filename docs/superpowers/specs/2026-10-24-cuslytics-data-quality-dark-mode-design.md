# CusLytics Data Quality and Global Theme Design

## Scope and facts

Implement Data Status / Quality in the existing React/Vite frontend and add a global light/dark theme. Keep the existing overview, navigation, API client, and component patterns. No backend, dataset processing, ML, or fabricated endpoint is added. The backend contract is still unknown.

## Design read

- Energy: 2/5. This is an operational data review tool; it should feel calm and trustworthy, with restrained category color reserved for findings and status.
- Rhythm: 3/5. The page moves from connection and dataset identity to summary, columns, indicators, category distribution, warnings, and cleaning audit. Varied section shapes keep the dense information scannable.
- Motion: 1/5. Motion is limited to brief loading feedback and small hover/focus changes; reduced-motion preferences remain respected.
- The main focal point is observability: clear data provenance and a compact view of source metadata before interpretation. Semantic navy, blue, and neutral tokens carry through both themes. Purposeful Lucide icons, a system font stack, and consistent panel spacing support hierarchy without visual decoration competing with dataset status.

## Page behavior

- The UCI Online Retail II title and official source link are static identity. File identity, read result, counts, date range, check time, validation results, findings, and preprocessing impact are dynamic and are shown only when supplied by the configured service.
- Existing `VITE_DATA_MODE` chooses API or demo behavior. In demo mode the Quality service returns no snapshot and the page says the dataset is not connected. It does not use mock audit values. In API mode, a separately configurable `VITE_DATA_QUALITY_RESOURCE_PATH` is required; its path and response shape remain an adapter contract to confirm with the backend team.
- The adapter accepts typed dataset metadata, mapped columns, eight finding identifiers, backend-provided chart category counts, cleaning summary/rules, validation status, and warnings. It validates responses before presentation. Presentation may filter and expand values but performs no quality or business calculations.
- Without a snapshot, cards show em-dash placeholders, conceptual columns show no detected type and pending validation, the chart displays an empty state, and cleaning topics say they are awaiting confirmation. Static explanations never claim that rules ran.
- Search filters the displayed column list. Indicator and cleaning-rule disclosure controls show definitions/details. Selecting an available chart category reveals its backend-provided detail.
- Loading, connected snapshot, no data/connection, and failed request are distinct accessible states. No fake retry action is shown.

## Theme behavior

A single ThemeProvider owns `light | dark`, writes the root `data-theme` attribute and local storage, and exposes a keyboard-operable header toggle. A small pre-React head script reads that preference (then system preference) to prevent a wrong-theme flash. Shared semantic tokens cover surfaces, text, borders, inputs, overlays, status colors, focus, and charts; the sidebar retains its navy identity. Reduced-motion behavior remains respected.

## Responsive and accessible behavior

The page uses responsive summary cards, a scrollable labeled table with an accessible small-screen fallback, semantic disclosure controls, visible text labels alongside category colors, keyboard focus, and a chart empty state. Existing sidebar/header and Overview remain intact in both themes.

## Verification

Test service parsing and error behavior, page states and interactions, theme persistence and attribute updates, then run project tests, lint, typecheck, production build, and Playwright checks in light/dark mode at desktop, tablet, portrait, and landscape sizes.

## Open backend decisions

Confirm endpoint path, response schema and nullability, actual source-column mapping/types, validation definitions and severity, rule configuration versus execution states, counts and category aggregates, warning content, read-error format, and metadata timestamp/timezone. Configure only the agreed path and payload when those decisions are available.
