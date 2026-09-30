# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite + TypeScript, Tailwind CSS 4, React Router, TanStack Query and Recharts. No component kit (no antd), so the interface has its own identity. It matches the user's other frontends (toolscol-purchasing-portal, toolscol-talent-pool-front-admin). The backend is the Go API in `../backend` (`/api/v1`, JWT Bearer, JSON in snake_case).

## Users

- **Operator / energy analyst** of a plant or site with electrical meters. Opens the platform to learn which meters need attention today, why, and what to do. Works at a desk in short, focused sessions.
- **Technical evaluator** of the MVP. Has 5 to 10 minutes of demo and needs to understand what the AI adds: Login → Dashboard → M-109 → Run AI Analysis → Anomaly → Explanation → Action.

## Product Purpose

EnergIA turns hourly meter readings into operational decisions: it detects anomalies, classifies them (real, explainable, false positive, data quality), explains them with evidence, prioritizes them, and recommends an action. Success means a person can spot what needs attention at a glance and understand why without reading raw data.

## Positioning

The engine is deterministic and explainable. Every conclusion traces back to concrete numbers: robust baseline by hour of day, robust z-score, sustained changes of 6 h or more, corroboration by current, and operational events. Each confidence score breaks down into weighted evidence signals. The engine does not ask to be trusted; it shows its evidence.

## Operating Context

- Dataset: 12 meters (M-101 to M-112), 14 days, 4,032 hourly readings (1 to 14 Sep 2026), plus 4 operational events.
- Expected cases: M-109 real anomaly (HIGH, priority 1), M-112 data quality (HIGH), M-104 explainable (MEDIUM), M-106 false positive (LOW, do not escalate). The other 8 meters are normal.
- Flow: Dashboard → Meters → Detail → AI Anomalies → Investigation → Action.
- Timestamps have no time zone (plant time). Show them exactly as received; never convert them to the browser's time zone.

## Capabilities and Constraints

- Available API: login/me, meter getParams/getAll (filter by status and meter_id, sort by consumption, variation or severity, paginated)/getById (hourly and daily history, electrical variables, anomaly, events), anomaly getAll (with full evidence), dashboard getSummary, and AI analysis (POST /ai/analyze with steps and result).
- Alert status per meter: NORMAL, ALERT, CRITICAL. Severity: HIGH, MEDIUM, LOW. Types: REAL_ANOMALY, EXPLAINABLE_ANOMALY, FALSE_POSITIVE, DATA_QUALITY.
- A single user (demo login). No roles.
- Spanish interface with decimal commas (es-CO). The engine already writes `reason` and `recommended_action` in Spanish.
- `expected_results.csv` must never reach the product or the user.

## Brand Commitments

Product name: "EnergIA" (inferred from the backend and the brief; no logo or visual assets exist). The brief requires it to "feel like an Energy Management SaaS product, not a collection of test screens."

## Evidence on Hand

- Real data: `../backend/data/readings.csv`, `../backend/data/events.csv`.
- Requirements: `../docs/requisitos.md` (summary of the PDF).
- No customers, testimonials, or metrics beyond the dataset. Do not make any up.

## Product Principles

1. **Priority first:** the first thing the user sees is what needs attention and in what order.
2. **Evidence over assertion:** every conclusion shows its numbers, compared variables, signals, and related events.
3. **Clear action:** every anomaly ends in one concrete recommendation.
4. **Honesty about uncertainty:** confidence is an evidence score, never certainty. Data-quality problems are shown as such, never as energy anomalies.
5. **Quiet when things are fine:** normal meters stay in the background; the interface only raises its voice for what matters.

## Accessibility & Inclusion

WCAG 2.1 AA as the working floor: status is never communicated by color alone (always text or an icon), contrast is sufficient, keyboard navigation works across tables and filters, and `prefers-reduced-motion` is respected.
