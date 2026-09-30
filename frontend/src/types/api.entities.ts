/**
 * Tipos de la API en Go (espejo de los schemas de /docs/openapi.json).
 * Viven aquí, fuera de las features, porque varias features los comparten:
 * por ejemplo, una Anomaly aparece en el dashboard, en el detalle y en la investigación.
 *
 * Las fechas llegan como string ISO. Las del dataset son hora de planta
 * (ver formatPlantTime en lib/format.ts); las de los análisis son hora real.
 */

// ---------- Comunes ----------

export interface Option {
  id: string
  value: string
}

export interface Pagination {
  page: number
  size: number
}

export interface PaginatedResult<T> {
  page: number
  size: number
  count: number
  rows: T[]
}

export interface ApiErrorBody {
  status_code: number
  message: string
  errors?: string[]
  timestamp: string
  path: string
}

export type SortOrder = 'ASC' | 'DESC'

// ---------- Auth ----------

export interface User {
  email: string
  name: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  user: User
}

// ---------- Motor de anomalías ----------

export type MeterStatus = 'NORMAL' | 'ALERT' | 'CRITICAL'
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW'
export type AnomalyType = 'REAL_ANOMALY' | 'EXPLAINABLE_ANOMALY' | 'FALSE_POSITIVE' | 'DATA_QUALITY'
export type EventType = 'OPERATIONAL_CHANGE' | 'SCHEDULED_OUTAGE' | 'DATA_QUALITY' | 'UNKNOWN'
export type Direction = 'UP' | 'DOWN'

export interface MeterEvent {
  meter_id: string
  timestamp: string
  type: EventType
  description: string
}

export interface ConsumptionChange {
  start: string
  end: string
  hours: number
  direction: Direction
  expected_kwh: number
  actual_kwh: number
  change_pct: number
  max_abs_z: number
  ongoing: boolean
}

export interface QualityReport {
  flagged_hours: number
  voltage_out_of_range: number
  power_factor_mismatch: number
  invalid_values: number
  missing_hours: number
  duplicate_readings: number
  first_flagged: string
  last_flagged: string
}

export type VariableName = 'consumption_kwh' | 'current_a' | 'voltage_v' | 'power_factor'

export interface VariableChange {
  variable: VariableName
  baseline: number
  observed: number
  min: number
  max: number
  change_pct: number
  changed: boolean
}

export interface Check {
  description: string
  weight: number
  strength: number
}

export interface Evidence {
  baseline_daily_kwh: number
  last_day_kwh: number
  daily_change_pct: number
  window_start: string
  window_end: string
  impact_kwh: number
  change?: ConsumptionChange
  quality?: QualityReport
  variables: VariableChange[]
  related_events: MeterEvent[]
  checks: Check[]
}

export interface Anomaly {
  meter_id: string
  anomaly: boolean
  type: AnomalyType
  severity: Severity
  confidence: number
  priority: number
  detected_at: string
  reason: string
  recommended_action: string
  narrated_by: string
  evidence: Evidence
}

// ---------- Medidores ----------

export type MeterSortField = 'meter_id' | 'consumption' | 'variation' | 'severity'

export interface MeterParams {
  meters: Option[]
  statuses: Option[]
  sort_fields: Option[]
  sort_orders: Option[]
}

export interface MeterFilter {
  meter_id?: string
  status?: MeterStatus
  sort_by?: MeterSortField
  sort_order?: SortOrder
}

export interface MeterPagedRequest {
  pagination: Pagination
  filter: MeterFilter
}

export interface MeterSummary {
  meter_id: string
  status: MeterStatus
  severity: Severity | null
  anomaly_type: AnomalyType | null
  priority: number | null
  consumption_kwh: number
  baseline_kwh: number
  variation_pct: number
  last_reading_at: string
}

export interface Metric {
  value: number
  baseline: number
  change_pct: number
}

export interface HourlyPoint {
  timestamp: string
  consumption_kwh: number
  expected_kwh: number
  voltage_v: number
  current_a: number
  power_factor: number
}

export interface DailyPoint {
  date: string
  consumption_kwh: number
  baseline_kwh: number
}

export interface MeterDetail extends MeterSummary {
  electrical: {
    voltage_v: Metric
    current_a: Metric
    power_factor: Metric
  }
  hourly_history: HourlyPoint[]
  daily_history: DailyPoint[]
  anomaly: Anomaly | null
  events: MeterEvent[]
}

// ---------- Análisis de IA ----------

export type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'
export type StepStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'

export interface AnalysisStep {
  key: string
  label: string
  status: StepStatus
  detail: string
}

export interface AnalysisSummary {
  anomalies_detected: number
  requiring_attention: number
  avg_confidence: number
  by_type: Record<AnomalyType, number>
}

export interface AnalysisRun {
  id: string
  status: RunStatus
  trigger: 'STARTUP' | 'MANUAL'
  narrator: string
  started_at: string
  finished_at: string | null
  duration_ms: number
  steps: AnalysisStep[]
  summary: AnalysisSummary | null
  error?: string
}

// ---------- Dashboard ----------

export interface AnomalyBrief {
  priority: number
  meter_id: string
  anomaly: boolean
  type: AnomalyType
  severity: Severity
  confidence: number
  detected_at: string
  reason: string
  recommended_action: string
}

export interface DashboardSummary {
  total_meters: number
  status_counts: { normal: number; alert: number; critical: number }
  anomalies_detected: number
  requiring_attention: number
  ai_confidence: number
  anomalies_by_type: Record<AnomalyType, number>
  consumption: {
    period_kwh: number
    last_day_kwh: number
    baseline_daily_kwh: number
    variation_pct: number
  }
  data_range: { from: string; to: string }
  priorities: AnomalyBrief[]
  last_analysis: {
    id: string
    status: RunStatus
    trigger: 'STARTUP' | 'MANUAL'
    narrator: string
    started_at: string
    finished_at: string | null
  }
}
