//go:build defects

package classify

import (
	"testing"

	"energyai/internal/analysis/changes"
	"energyai/internal/analysis/model"
)

// DEF-06 · Valores límite de la severidad de REAL_ANOMALY (backend/README.md §8):
// "HIGH si la variación SUPERA 50% y sigue activa; MEDIUM si SUPERA 20%; si no, LOW".
// "Supera" es estricto (>), el código usa >=.
func TestQA_RealSeverityBoundaries(t *testing.T) {
	tests := []struct {
		pct     float64
		ongoing bool
		want    model.Severity
	}{
		{50.01, true, model.SeverityHigh},
		{50, true, model.SeverityMedium}, // límite exacto: no supera 50
		{-50, true, model.SeverityMedium},
		{80, false, model.SeverityMedium}, // no activa → no puede ser HIGH
		{20.01, false, model.SeverityMedium},
		{20, false, model.SeverityLow}, // límite exacto: no supera 20
		{19.99, true, model.SeverityLow},
	}
	for _, tt := range tests {
		got := realSeverity(changes.Change{ChangePct: tt.pct, Ongoing: tt.ongoing})
		if got != tt.want {
			t.Errorf("realSeverity(%.2f%%, ongoing=%v) = %s, esperaba %s", tt.pct, tt.ongoing, got, tt.want)
		}
	}
}
