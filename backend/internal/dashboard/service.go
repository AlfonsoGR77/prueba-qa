// Package dashboard arma el resumen general: estado de los medidores,
// consumo total y anomalías por prioridad.
package dashboard

import (
	"energyai/internal/ai"
	"energyai/internal/analysis/model"
	"energyai/internal/analysis/stats"
	"energyai/internal/meter"
	"energyai/internal/store"
)

// Service arma el resumen del dashboard.
type Service struct {
	store  *store.Store
	meters *meter.Service
	ai     *ai.Service
}

// NewService arma el servicio.
func NewService(s *store.Store, meters *meter.Service, aiSvc *ai.Service) *Service {
	return &Service{store: s, meters: meters, ai: aiSvc}
}

// Summary calcula el resumen del dashboard.
func (s *Service) Summary() Summary {
	summaries := s.meters.Summaries()
	anomalies := s.store.Anomalies()
	from, to := s.store.DataRange()

	out := Summary{
		TotalMeters:       len(summaries),
		AnomaliesDetected: len(anomalies),
		AnomaliesByType: map[model.AnomalyType]int{
			model.TypeReal:          0,
			model.TypeExplainable:   0,
			model.TypeFalsePositive: 0,
			model.TypeDataQuality:   0,
		},
		DataRange:  DataRange{From: from, To: to},
		Priorities: make([]AnomalyBrief, 0, len(anomalies)),
	}

	var lastDay, baseline float64
	for _, sm := range summaries {
		switch sm.Status {
		case meter.StatusCritical:
			out.StatusCounts.Critical++
		case meter.StatusAlert:
			out.StatusCounts.Alert++
		default:
			out.StatusCounts.Normal++
		}
		lastDay += sm.ConsumptionKWh
		baseline += sm.BaselineKWh
	}
	period := 0.0
	for _, r := range s.store.Readings() {
		period += r.ConsumptionKWh
	}
	out.Consumption = Consumption{
		PeriodKWh:        stats.Round(period, 2),
		LastDayKWh:       stats.Round(lastDay, 2),
		BaselineDailyKWh: stats.Round(baseline, 2),
		VariationPct:     stats.Round(stats.PctChange(lastDay, baseline), 2),
	}

	confidence := 0.0
	for _, a := range anomalies {
		out.AnomaliesByType[a.Type]++
		confidence += a.Confidence
		if a.Severity == model.SeverityHigh {
			out.RequiringAttention++
		}
		out.Priorities = append(out.Priorities, AnomalyBrief{
			Priority:          a.Priority,
			MeterID:           a.MeterID,
			Anomaly:           a.Anomaly,
			Type:              a.Type,
			Severity:          a.Severity,
			Confidence:        a.Confidence,
			DetectedAt:        a.DetectedAt,
			Reason:            a.Reason,
			RecommendedAction: a.RecommendedAction,
		})
	}
	if len(anomalies) > 0 {
		out.AIConfidence = stats.Round(confidence/float64(len(anomalies)), 2)
	}

	run := s.ai.Latest()
	out.LastAnalysis = LastAnalysis{
		ID:         run.ID,
		Status:     run.Status,
		Trigger:    run.Trigger,
		Narrator:   run.Narrator,
		StartedAt:  run.StartedAt,
		FinishedAt: run.FinishedAt,
	}
	return out
}
