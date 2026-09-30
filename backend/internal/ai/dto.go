package ai

import (
	"time"

	"energyai/internal/analysis/model"
)

// RunStatus es el estado de un análisis.
type RunStatus string //	@name	RunStatus

// Estados de un análisis.
const (
	RunRunning   RunStatus = "RUNNING"
	RunCompleted RunStatus = "COMPLETED"
	RunFailed    RunStatus = "FAILED"
)

// StepStatus es el estado de un paso del análisis.
type StepStatus string //	@name	StepStatus

// Estados de un paso.
const (
	StepPending StepStatus = "PENDING"
	StepRunning StepStatus = "RUNNING"
	StepDone    StepStatus = "DONE"
	StepFailed  StepStatus = "FAILED"
)

// Trigger dice qué inició el análisis.
type Trigger string //	@name	Trigger

// Orígenes de un análisis.
const (
	TriggerStartup Trigger = "STARTUP" // al arrancar la API
	TriggerManual  Trigger = "MANUAL"  // botón Run AI Analysis
)

// Step es un paso del pipeline: Lecturas → Baseline → Detección → Correlación →
// Eventos → Explicación → Recomendación.
type Step struct {
	Key    string     `json:"key" example:"detection"`
	Label  string     `json:"label" example:"Detección"`
	Status StepStatus `json:"status" enums:"PENDING,RUNNING,DONE,FAILED"`
	Detail string     `json:"detail" example:"3 cambios sostenidos · 1 medidor con lecturas incoherentes"`
} //	@name	AnalysisStep

// Summary es el resultado de un análisis terminado.
type Summary struct {
	AnomaliesDetected  int                       `json:"anomalies_detected" example:"4"`
	RequiringAttention int                       `json:"requiring_attention" example:"2"` // severidad HIGH
	AvgConfidence      float64                   `json:"avg_confidence" example:"0.9"`
	ByType             map[model.AnomalyType]int `json:"by_type"`
} //	@name	AnalysisSummary

// Run es una ejecución del análisis.
type Run struct {
	ID         string     `json:"id" example:"AN-0002"`
	Status     RunStatus  `json:"status" enums:"RUNNING,COMPLETED,FAILED"`
	Trigger    Trigger    `json:"trigger" enums:"STARTUP,MANUAL"`
	Narrator   string     `json:"narrator" example:"openai:gpt-4o-mini"` // quién redacta las explicaciones
	StartedAt  time.Time  `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"` // null mientras corre
	DurationMs int64      `json:"duration_ms" example:"38"`
	Steps      []Step     `json:"steps"`
	Summary    *Summary   `json:"summary"` // null mientras corre o si falló
	Error      string     `json:"error,omitempty"`
} //	@name	AnalysisRun

// clone devuelve una copia que se puede entregar sin compartir memoria con el servicio.
func (r *Run) clone() Run {
	c := *r
	c.Steps = append([]Step{}, r.Steps...)
	if r.FinishedAt != nil {
		t := *r.FinishedAt
		c.FinishedAt = &t
	}
	if r.Summary != nil {
		s := *r.Summary
		s.ByType = make(map[model.AnomalyType]int, len(r.Summary.ByType))
		for k, v := range r.Summary.ByType {
			s.ByType[k] = v
		}
		c.Summary = &s
	}
	return c
}
