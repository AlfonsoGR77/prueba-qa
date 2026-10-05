/**
 * Datos de prueba / oráculo. Salen de la documentación, NO de la API:
 *  - README.md y backend/README.md ("Resultado sobre el dataset", "Ejemplo completo: M-109")
 *  - backend/README.md tabla "Estado de alerta"
 * Si la API y este archivo no coinciden, el test falla: esa es la idea.
 */

export type Status = 'NORMAL' | 'ALERT' | 'CRITICAL'

export interface ExpectedAnomaly {
  meterId: string
  priority: number
  type: 'REAL_ANOMALY' | 'DATA_QUALITY' | 'EXPLAINABLE_ANOMALY' | 'FALSE_POSITIVE'
  typeLabel: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  severityLabel: string
  confidence: number
  /** Estado de alerta según la tabla de backend/README.md */
  status: Status
  statusLabel: string
  /** Inicio del cambio en hora de planta, como lo escribe el motor en `reason` */
  detectedAtPlant: string
}

export const anomalies: ExpectedAnomaly[] = [
  { meterId: 'M-109', priority: 1, type: 'REAL_ANOMALY', typeLabel: 'Anomalía real', severity: 'HIGH', severityLabel: 'Alta', confidence: 0.95, status: 'CRITICAL', statusLabel: 'Crítica', detectedAtPlant: '12/09 14:00' },
  { meterId: 'M-112', priority: 2, type: 'DATA_QUALITY', typeLabel: 'Calidad de datos', severity: 'HIGH', severityLabel: 'Alta', confidence: 0.95, status: 'CRITICAL', statusLabel: 'Crítica', detectedAtPlant: '13/09 00:00' },
  { meterId: 'M-104', priority: 3, type: 'EXPLAINABLE_ANOMALY', typeLabel: 'Anomalía explicable', severity: 'MEDIUM', severityLabel: 'Media', confidence: 0.86, status: 'ALERT', statusLabel: 'Alerta', detectedAtPlant: '11/09 00:00' },
  { meterId: 'M-106', priority: 4, type: 'FALSE_POSITIVE', typeLabel: 'Falso positivo', severity: 'LOW', severityLabel: 'Baja', confidence: 0.86, status: 'NORMAL', statusLabel: 'Normal', detectedAtPlant: '08/09 00:00' },
]

export const allMeterIds = Array.from({ length: 12 }, (_, i) => `M-${101 + i}`)
export const normalMeterIds = allMeterIds.filter((id) => !['M-109', 'M-112', 'M-104'].includes(id)) // M-106 incluido: FALSE_POSITIVE → NORMAL

/** "Ejemplo completo: M-109" (backend/README.md) y fila de la tabla de la lista. */
export const m109 = {
  id: 'M-109',
  consumption: '2.207,6 kWh', // 2207,6 kWh últimas 24 h
  baseline: '1.052,2 kWh', // 1052,15 → 1 decimal
  variation: '+109,8 %',
  status: 'Crítica',
  severity: 'Alta',
  type: 'Anomalía real',
  lastReadingPlant: '14/09 23:00',
  confidence: '0,95',
  /** Última lectura de corriente (402,8 A) contra su mediana: +105,6 % → la corriente confirma el cambio. */
  current: { value: '402,8 A', change: '+105,6 %' },
  powerFactorNormal: 'Normal 0,94',
  reasonFragment: 'Consumo +110,5% frente al baseline durante 58 h (desde 12/09 14:00)',
  actionFragment: 'Investigar en sitio la instalación de M-109',
  api: { consumption_kwh: 2207.6, baseline_kwh: 1052.15, variation_pct: 109.82, hourly: 336, daily: 14 },
}

export const PAGE_SIZE = 10
export const TOTAL_METERS = 12
