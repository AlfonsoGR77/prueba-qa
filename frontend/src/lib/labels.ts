import type { AnomalyType, EventType, MeterStatus, Severity, VariableName } from '@/types/api.entities'

/**
 * Vocabulario del producto en español. Un solo lugar para que "Crítica" o
 * "Anomalía real" se escriban igual en todas las pantallas.
 */

export const statusLabel: Record<MeterStatus, string> = {
  NORMAL: 'Normal',
  ALERT: 'Alerta',
  CRITICAL: 'Crítica',
}

export const severityLabel: Record<Severity, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
}

export const severityRank: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }

export const anomalyTypeLabel: Record<AnomalyType, string> = {
  REAL_ANOMALY: 'Anomalía real',
  EXPLAINABLE_ANOMALY: 'Anomalía explicable',
  FALSE_POSITIVE: 'Falso positivo',
  DATA_QUALITY: 'Calidad de datos',
}

/** Qué significa cada tipo, en una frase, para el operador. */
export const anomalyTypeHint: Record<AnomalyType, string> = {
  REAL_ANOMALY: 'Cambio sostenido que ningún evento explica.',
  EXPLAINABLE_ANOMALY: 'Cambio sostenido que coincide con un evento operativo.',
  FALSE_POSITIVE: 'El cambio lo explica un evento y el consumo ya volvió a lo normal.',
  DATA_QUALITY: 'Las variables eléctricas no cuadran: el medidor está reportando mal.',
}

/** La acción corta de la pantalla de Anomalías IA. */
export const anomalyTypeAction: Record<AnomalyType, string> = {
  REAL_ANOMALY: 'Investigar',
  EXPLAINABLE_ANOMALY: 'Validar operación',
  FALSE_POSITIVE: 'No escalar',
  DATA_QUALITY: 'Validar medidor',
}

export const eventTypeLabel: Record<EventType, string> = {
  OPERATIONAL_CHANGE: 'Cambio operativo',
  SCHEDULED_OUTAGE: 'Parada programada',
  DATA_QUALITY: 'Reporte de calidad de datos',
  UNKNOWN: 'Evento sin causa conocida',
}

export const variableLabel: Record<VariableName, { name: string; unit: string; decimals: number }> = {
  consumption_kwh: { name: 'Consumo', unit: 'kWh', decimals: 1 },
  current_a: { name: 'Corriente', unit: 'A', decimals: 1 },
  voltage_v: { name: 'Voltaje', unit: 'V', decimals: 1 },
  power_factor: { name: 'Factor de potencia', unit: '', decimals: 2 },
}

/** Confianza en palabras, como en el enunciado: Alta / Media. */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Alta'
  if (confidence >= 0.7) return 'Media'
  return 'Baja'
}

/** "engine" → "Motor" · "openai:gpt-4o-mini" → "OpenAI · gpt-4o-mini" */
export function narratorLabel(narrator: string): string {
  if (narrator.startsWith('openai:')) return `OpenAI · ${narrator.slice('openai:'.length)}`
  return 'Motor (plantilla)'
}
