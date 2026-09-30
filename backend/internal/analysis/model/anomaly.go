// Package model tiene los tipos del resultado del motor: la anomalía de un
// medidor y la evidencia que la respalda. Es lo que devuelve la API.
package model

import (
	"time"

	"energyai/internal/analysis/changes"
	"energyai/internal/analysis/quality"
	"energyai/internal/analysis/variables"
	"energyai/internal/data"
)

// AnomalyType es la conclusión del motor sobre un medidor.
type AnomalyType string //	@name	AnomalyType

// Tipos de anomalía.
const (
	TypeReal          AnomalyType = "REAL_ANOMALY"
	TypeExplainable   AnomalyType = "EXPLAINABLE_ANOMALY"
	TypeFalsePositive AnomalyType = "FALSE_POSITIVE"
	TypeDataQuality   AnomalyType = "DATA_QUALITY"
)

// Severity indica qué tan urgente es revisar una anomalía.
type Severity string //	@name	Severity

// Severidades.
const (
	SeverityHigh   Severity = "HIGH"
	SeverityMedium Severity = "MEDIUM"
	SeverityLow    Severity = "LOW"
)

// Rank convierte la severidad en un número para poder ordenar.
// Una severidad vacía (medidor sin anomalía) vale 0.
func (s Severity) Rank() int {
	switch s {
	case SeverityHigh:
		return 3
	case SeverityMedium:
		return 2
	case SeverityLow:
		return 1
	default:
		return 0
	}
}

// NarratorEngine indica que el texto lo redactó la plantilla determinística del motor.
const NarratorEngine = "engine"

// Check es una señal que apoya la conclusión. La confianza sale de estas señales,
// y la pantalla de Investigación las muestra como evidencia.
type Check struct {
	Description string  `json:"description"`
	Weight      float64 `json:"weight"`   // cuánto pesa esta señal (los pesos suman 1)
	Strength    float64 `json:"strength"` // de 0 a 1: qué tanto se cumple
} //	@name	Check

// Evidence es todo lo que respalda una conclusión.
// Los campos puntero son nil cuando no aplican.
type Evidence struct {
	BaselineDailyKWh float64            `json:"baseline_daily_kwh"`
	LastDayKWh       float64            `json:"last_day_kwh"`
	DailyChangePct   float64            `json:"daily_change_pct"`
	WindowStart      time.Time          `json:"window_start"`
	WindowEnd        time.Time          `json:"window_end"`
	ImpactKWh        float64            `json:"impact_kwh"` // energía de más (+) o de menos (-) frente a lo esperado
	Change           *changes.Change    `json:"change,omitempty"`
	Quality          *quality.Report    `json:"quality,omitempty"`
	Variables        []variables.Change `json:"variables"`
	RelatedEvents    []data.Event       `json:"related_events"`
	Checks           []Check            `json:"checks"`
} //	@name	Evidence

// Anomaly es el resultado final del motor para un medidor.
type Anomaly struct {
	MeterID           string      `json:"meter_id"`
	Anomaly           bool        `json:"anomaly"`
	Type              AnomalyType `json:"type"`
	Severity          Severity    `json:"severity"`
	Confidence        float64     `json:"confidence"`
	Priority          int         `json:"priority"` // 1 = revisar primero
	DetectedAt        time.Time   `json:"detected_at"`
	Reason            string      `json:"reason"`
	RecommendedAction string      `json:"recommended_action"`
	NarratedBy        string      `json:"narrated_by" example:"engine"` // quién redactó reason y recommended_action: "engine" u "openai:<modelo>"
	Evidence          Evidence    `json:"evidence"`
} //	@name	Anomaly
