package quality

import (
	"testing"

	"energyai/internal/analysis/baseline"
	"energyai/internal/data"
	"energyai/internal/testutil"
)

func TestIsInvalid(t *testing.T) {
	valid := data.Reading{ConsumptionKWh: 20, VoltageV: 220, CurrentA: 100, PowerFactor: 0.95}

	tests := []struct {
		name string
		edit func(*data.Reading)
		want bool
	}{
		{"lectura normal", func(*data.Reading) {}, false},
		{"consumo negativo", func(r *data.Reading) { r.ConsumptionKWh = -1 }, true},
		{"sin voltaje", func(r *data.Reading) { r.VoltageV = 0 }, true},
		{"corriente negativa", func(r *data.Reading) { r.CurrentA = -1 }, true},
		{"factor de potencia mayor a 1", func(r *data.Reading) { r.PowerFactor = 1.2 }, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := valid // copia: cada caso parte de la lectura válida
			tt.edit(&r)
			if got := isInvalid(r); got != tt.want {
				t.Errorf("isInvalid(%+v) = %v, esperaba %v", r, got, tt.want)
			}
		})
	}
}

func TestCheckQualityRealData(t *testing.T) {
	for id, rs := range testutil.LoadMeters(t) {
		q := Check(rs, baseline.Build(rs))

		if id == "M-112" {
			if !q.HasIssue() {
				t.Errorf("M-112 debería tener problemas de calidad: %+v", q)
			}
			if !q.FirstFlagged.Equal(testutil.MustParse(t, "2026-09-13 00:00")) {
				t.Errorf("M-112: primer problema en %v, esperaba 2026-09-13 00:00", q.FirstFlagged)
			}
			continue
		}

		if q.HasIssue() {
			t.Errorf("%s no debería tener problemas de calidad: %+v", id, q)
		}
	}
}
