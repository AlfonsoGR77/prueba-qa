package classify

import (
	"testing"
	"time"

	"energyai/internal/analysis/changes"
	"energyai/internal/data"
	"energyai/internal/testutil"
)

// ---------- Lógica de eventos con datos inventados ----------

func TestExplainingEvent(t *testing.T) {
	start := testutil.MustParse(t, "2026-09-12 14:00")

	tests := []struct {
		name      string
		eventType data.EventType
		eventAt   time.Time
		direction changes.Direction
		explains  bool
	}{
		{"parada programada explica una caída", data.EventScheduledOutage, start, changes.Down, true},
		{"parada programada NO explica un aumento", data.EventScheduledOutage, start, changes.Up, false},
		{"cambio operativo explica un aumento", data.EventOperationalChange, start, changes.Up, true},
		{"evento UNKNOWN no explica nada", data.EventUnknown, start, changes.Up, false},
		{"evento de 3 días antes no explica", data.EventOperationalChange, start.Add(-72 * time.Hour), changes.Up, false},
		{"evento 6 h después todavía explica", data.EventOperationalChange, start.Add(6 * time.Hour), changes.Up, true},
		{"evento 7 h después ya no explica", data.EventOperationalChange, start.Add(7 * time.Hour), changes.Up, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			events := []data.Event{{MeterID: "X", Timestamp: tt.eventAt, Type: tt.eventType}}
			got := explainingEvent(changes.Change{Start: start, Direction: tt.direction}, events) != nil
			if got != tt.explains {
				t.Errorf("explica = %v, esperaba %v", got, tt.explains)
			}
		})
	}
}
