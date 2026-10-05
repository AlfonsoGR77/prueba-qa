//go:build defects

package analysis

import (
	"testing"
	"time"

	"energyai/internal/data"
)

// RIESGO-01 (caja blanca): quality.HasIssue() se activa con UNA hora faltante
// (MissingHours > 0) aunque no haya ninguna hora "sospechosa". En ese caso
// FirstFlagged queda en cero y la anomalía DATA_QUALITY sale con
// detected_at = 0001-01-01 y una ventana vacía. La doc (§4) pide 3 horas sospechosas.
func TestQA_SingleMissingHourDoesNotProduceZeroDate(t *testing.T) {
	start := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	var rs []data.Reading
	for i := range 14 * 24 {
		if i == 200 { // falta una sola hora, en la segunda semana
			continue
		}
		rs = append(rs, data.Reading{MeterID: "X", Timestamp: start.Add(time.Duration(i) * time.Hour),
			ConsumptionKWh: 10 + float64(i%3), VoltageV: 220 + float64(i%2), CurrentA: 50, PowerFactor: 0.92})
	}
	got := Analyze(rs, nil)
	if len(got) == 0 {
		return // el medidor queda normal: comportamiento aceptable
	}
	a := got[0]
	if a.DetectedAt.IsZero() || a.DetectedAt.Year() < 2026 {
		t.Errorf("anomalía %s con detected_at=%s (fecha cero) por una sola hora faltante", a.Type, a.DetectedAt)
	}
}
