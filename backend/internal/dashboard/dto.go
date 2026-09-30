package dashboard

import (
	"time"

	"energyai/internal/ai"
	"energyai/internal/analysis/model"
)

// StatusCounts cuenta los medidores por estado de alerta.
type StatusCounts struct {
	Normal   int `json:"normal" example:"9"`
	Alert    int `json:"alert" example:"1"`
	Critical int `json:"critical" example:"2"`
} //	@name	StatusCounts

// Consumption es el consumo total de todos los medidores.
type Consumption struct {
	PeriodKWh        float64 `json:"period_kwh" example:"167420.5"`        // total de los 14 días
	LastDayKWh       float64 `json:"last_day_kwh" example:"14210.5"`       // últimas 24 h
	BaselineDailyKWh float64 `json:"baseline_daily_kwh" example:"12980.3"` // suma de los baselines diarios
	VariationPct     float64 `json:"variation_pct" example:"9.48"`
} //	@name	Consumption

// DataRange es el periodo que cubren las lecturas.
type DataRange struct {
	From time.Time `json:"from"`
	To   time.Time `json:"to"`
} //	@name	DataRange

// AnomalyBrief es una anomalía resumida para la lista de prioridades.
type AnomalyBrief struct {
	Priority          int               `json:"priority" example:"1"`
	MeterID           string            `json:"meter_id" example:"M-109"`
	Anomaly           bool              `json:"anomaly" example:"true"` // false en los falsos positivos
	Type              model.AnomalyType `json:"type" enums:"REAL_ANOMALY,EXPLAINABLE_ANOMALY,FALSE_POSITIVE,DATA_QUALITY"`
	Severity          model.Severity    `json:"severity" enums:"HIGH,MEDIUM,LOW"`
	Confidence        float64           `json:"confidence" example:"0.95"`
	DetectedAt        time.Time         `json:"detected_at"`
	Reason            string            `json:"reason"`
	RecommendedAction string            `json:"recommended_action"`
} //	@name	AnomalyBrief

// LastAnalysis es el último análisis de IA (KPI "Último análisis").
type LastAnalysis struct {
	ID         string       `json:"id" example:"AN-0002"`
	Status     ai.RunStatus `json:"status" enums:"RUNNING,COMPLETED,FAILED"`
	Trigger    ai.Trigger   `json:"trigger" enums:"STARTUP,MANUAL"`
	Narrator   string       `json:"narrator" example:"engine"`
	StartedAt  time.Time    `json:"started_at"`
	FinishedAt *time.Time   `json:"finished_at"`
} //	@name	LastAnalysis

// Summary es el resumen del dashboard.
type Summary struct {
	TotalMeters        int                       `json:"total_meters" example:"12"`
	StatusCounts       StatusCounts              `json:"status_counts"`
	AnomaliesDetected  int                       `json:"anomalies_detected" example:"4"`  // incluye falsos positivos
	RequiringAttention int                       `json:"requiring_attention" example:"2"` // severidad HIGH
	AIConfidence       float64                   `json:"ai_confidence" example:"0.9"`     // confianza promedio de las anomalías
	AnomaliesByType    map[model.AnomalyType]int `json:"anomalies_by_type"`
	Consumption        Consumption               `json:"consumption"`
	DataRange          DataRange                 `json:"data_range"`
	Priorities         []AnomalyBrief            `json:"priorities"` // ordenadas por prioridad
	LastAnalysis       LastAnalysis              `json:"last_analysis"`
} //	@name	DashboardSummary
