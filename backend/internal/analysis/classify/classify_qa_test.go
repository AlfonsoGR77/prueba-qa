package classify

import (
	"testing"
	"time"

	"energyai/internal/analysis/changes"
	"energyai/internal/analysis/model"
	"energyai/internal/data"
)

// Tests de QA (siempre verdes) que cubren la tabla de decisión de Change():
// evento que explica × consumo normalizado → tipo, severidad, anomaly, confianza.
func TestQA_ChangeDecisionTable(t *testing.T) {
	start := time.Date(2026, 9, 10, 0, 0, 0, 0, time.UTC)
	readings := make([]data.Reading, 0, 48)
	for i := range 48 {
		readings = append(readings, data.Reading{MeterID: "X", Timestamp: start.Add(time.Duration(i-12) * time.Hour),
			ConsumptionKWh: 10, VoltageV: 220, CurrentA: 50, PowerFactor: 0.9})
	}
	ev := func(t data.EventType) []data.Event { return []data.Event{{MeterID: "X", Timestamp: start, Type: t}} }

	tests := []struct {
		name        string
		events      []data.Event
		dir         changes.Direction
		ongoing     bool
		pct         float64
		wantType    model.AnomalyType
		wantSev     model.Severity
		wantAnomaly bool
		maxConf     float64
	}{
		{"sin evento, +80% activo → REAL/HIGH", nil, changes.Up, true, 80, model.TypeReal, model.SeverityHigh, true, 0.95},
		{"evento UNKNOWN no explica → REAL", ev(data.EventUnknown), changes.Up, true, 30, model.TypeReal, model.SeverityMedium, true, 0.95},
		{"parada programada + caída que volvió → FALSE_POSITIVE/LOW", ev(data.EventScheduledOutage), changes.Down, false, -80, model.TypeFalsePositive, model.SeverityLow, false, 0.86},
		{"parada programada NO explica aumento → REAL", ev(data.EventScheduledOutage), changes.Up, true, 60, model.TypeReal, model.SeverityHigh, true, 0.95},
		{"cambio operativo + nivel se mantiene → EXPLAINABLE/MEDIUM", ev(data.EventOperationalChange), changes.Up, true, 47, model.TypeExplainable, model.SeverityMedium, true, 0.86},
		{"DATA_QUALITY no explica consumo → REAL", ev(data.EventDataQuality), changes.Up, true, 25, model.TypeReal, model.SeverityMedium, true, 0.95},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := changes.Change{Start: start, End: start.Add(11 * time.Hour), Hours: 12, Direction: tt.dir,
				Ongoing: tt.ongoing, ChangePct: tt.pct, MaxAbsZ: 20, ExpectedKWh: 100, ActualKWh: 100 * (1 + tt.pct/100)}
			a := Change(Meter{ID: "X", Readings: readings, Events: tt.events}, c, model.Evidence{})
			if a.Type != tt.wantType || a.Severity != tt.wantSev || a.Anomaly != tt.wantAnomaly {
				t.Errorf("obtuve %s/%s anomaly=%v", a.Type, a.Severity, a.Anomaly)
			}
			if a.Confidence < 0.5*0.9 || a.Confidence > tt.maxConf {
				t.Errorf("confianza %.2f fuera de [0,45 ; %.2f]", a.Confidence, tt.maxConf)
			}
		})
	}
}
