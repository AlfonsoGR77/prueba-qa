/** Colores del tema (paleta BIA) para Recharts: pinta SVG y no lee clases de Tailwind. */
export const chartColors = {
  ink: '#fafafa',
  muted: '#a1a1aa',
  form: '#08ddbc',
  formMuted: '#0b7d6c',
  rule: '#27272a',
  critical: '#f87171',
  criticalWash: '#2c1717',
}

/** Tooltip de Recharts con la superficie del tema (por defecto es blanco). */
export const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid #3f3f46',
  borderRadius: 10,
  color: chartColors.ink,
  fontSize: 12,
  padding: '6px 10px',
}
