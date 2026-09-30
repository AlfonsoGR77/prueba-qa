---
version: 1
slug: "src-app-router-tsx"
primary_target: "src/app/router.tsx"
related_targets: ["src/app/routes"]
---

# Surface brief · EnergIA web app (all authenticated routes + login)

Scope: login, Despacho (dashboard), Libro de medidores, Detalle de medidor, Anomalías IA, Investigación, Run AI Analysis sheet.
Visitor mode: Operate.

Audience and job: plant operator / energy analyst deciding which meter to investigate first and why; technical evaluator following the 5–10 min demo (Login → Dashboard → M-109 → Run AI Analysis → Anomalía → Explicación → Acción).
Constraints: Spanish UI, es-CO number format, dataset timestamps shown as plant time (never converted), status never by color alone, WCAG 2.1 AA, light theme (daylight plant office).

## Direction contract

THESIS: The AI does not paint alarms; it issues work orders. Every anomaly is a numbered, prioritized, stamped order with its evidence attached. Refuses the category default of a KPI-card grid over a glowing chart.

OWN-WORLD: Utility field-form grammar on cool form paper (#F6F7F4, sheets #FFFFFF). Pre-printed layer in one spot ink, form green #1F5B48: hairline rules, boxed fields with condensed caps labels at top-left. Filled-in layer in data ink #1B1F1D, typewriter mono (Courier Prime) for values, IDs and readings; Archivo (variable width) for everything else. Green-bar banding #E3EFE6 on tables. State is a mark: vermilion rubber stamp CRÍTICA, ochre outline stamp ALERTA, no stamp when normal, check crosses on evidence. Color only on stamps and 1px edges; text achromatic. Confidence is a 10-cell segmented counter. No cards-with-icons, no gradients, no glass.

STORY: The operator sees the orders already issued, ranked; opens M-109's order; reads what the AI found, which variables moved, the evidence and confidence; understands the action; re-runs the analysis and watches the step sheet tick off.

FIRST VIEWPORT: Top dispatch strip (product mark, nav, data range, last analysis ID/time, Run AI Analysis primary button at right). Below, left 2/3: "Órdenes emitidas" — M-109 order at double scale with CRÍTICA stamp, reason and action, then orders #2–#4 in a column. Right 1/3: boxed KPI form fields (Medidores, Consumo del periodo, Anomalías IA, Alta prioridad, Confianza IA segmented, Último análisis). Below the fold: Libro de medidores in green-bar.

FORM: Orden de trabajo / field work order (candidate 6 of 7 on the ordered list); seed key 209470ff. Signature interaction: Run AI Analysis opens an inline numbered step sheet (Lecturas → … → Recomendación) that checks off each step from live polling and ends in a stamped total. Motion grammar: stamps press in (scale 1.06→1, 180ms ease-out), steps tick in sequence; reduced-motion shows the final state.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Raises (from declined challengers)
- Mesa de corte: state is a mark, not a hue.
- Borde de nube: color lives only in stamps and 1px edges; text stays achromatic.
- Liga de carreras: confidence as a 10-cell segmented counter.
- Ciclorama: Run AI Analysis as a numbered, inspectable step sheet.
- Datamatics: dense tabular figures, decimal-aligned, one data face.

## Unresolved
- No logo exists; the product mark is typographic.
