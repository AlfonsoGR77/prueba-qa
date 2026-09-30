/**
 * Formato de números y fechas en español de Colombia: 2.207,6 kWh · +109,8 %.
 * Los Intl.* se crean una sola vez (crearlos en cada render es caro).
 */

const LOCALE = 'es-CO'

const numberFormats = new Map<number, Intl.NumberFormat>()

function numberFormat(decimals: number): Intl.NumberFormat {
  let f = numberFormats.get(decimals)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    numberFormats.set(decimals, f)
  }
  return f
}

/** 2207.6 → "2.207,6" */
export function formatNumber(value: number, decimals = 0): string {
  return numberFormat(decimals).format(value)
}

/** 2207.6 → "2.207,6 kWh" */
export function formatKwh(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)} kWh`
}

/** 109.82 → "+109,8 %" · -0.03 → "−0,0 %" */
export function formatPct(value: number, decimals = 1): string {
  const rounded = Number(value.toFixed(decimals))
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${formatNumber(Math.abs(rounded), decimals)} %`
}

/** 0.95 → "0,95" */
export function formatConfidence(value: number): string {
  return formatNumber(value, 2)
}

// Las fechas se arman a mano: Intl en es-CO cambia entre navegadores
// ("12/9, 14:00" en uno, "12/09 14:00" en otro) y aquí deben verse siempre igual.
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
const pad = (n: number) => String(n).padStart(2, '0')

/** Acepta "2026-09-12" o un ISO completo. */
function toDate(isoOrDate: string): Date {
  return new Date(isoOrDate.length === 10 ? `${isoOrDate}T00:00:00Z` : isoOrDate)
}

// Hora de planta: el dataset no trae zona horaria y la API la marca como UTC.
// Se leen las partes UTC para NO convertirla a la zona del navegador.

/** "2026-09-12T14:00:00Z" → "12/09 14:00" (hora de planta) */
export function formatPlantTime(iso: string): string {
  const d = toDate(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "2026-09-12T14:00:00Z" → "12 sept" */
export function formatPlantDate(iso: string): string {
  const d = toDate(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** "2026-09-12" o ISO → "12/09" */
export function formatPlantDay(isoOrDate: string): string {
  const d = toDate(isoOrDate)
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`
}

// Hora real (por ejemplo, cuándo corrió un análisis): esta sí va en la zona del navegador.

/** "2026-09-24T17:01:05Z" → "24 sept 12:01:05" (en Colombia) */
export function formatClockTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 38 → "38 ms" · 1500 → "1,5 s" */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${formatNumber(ms)} ms` : `${formatNumber(ms / 1000, 1)} s`
}
