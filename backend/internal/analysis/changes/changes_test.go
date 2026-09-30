package changes

import (
	"testing"

	"energyai/internal/analysis/baseline"
	"energyai/internal/testutil"
)

// ---------- Tests con datos inventados (prueban la lógica pura) ----------

func TestFindRuns(t *testing.T) {
	tests := []struct {
		name string
		z    []float64
		want []run
	}{
		{
			// 3 horas altas (muy corto, se ignora), luego 6 bajas (cuenta), luego normal.
			name: "ignora tramos cortos",
			z:    []float64{0, 4, 4, 4, 0, -5, -5, -5, -5, -5, -5, 0},
			want: []run{{start: 5, end: 10, direction: Down}},
		},
		{
			// Un tramo que sigue activo cuando se acaban los datos (como M-109).
			name: "tramo abierto al final",
			z:    []float64{0, 0, 9, 9, 9, 9, 9, 9},
			want: []run{{start: 2, end: 7, direction: Up}},
		},
		{
			name: "sin anomalías",
			z:    []float64{0, 1, -1, 2, -2, 0, 0},
			want: []run{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := findRuns(tt.z, 6)
			if len(got) != len(tt.want) {
				t.Fatalf("esperaba %d tramos, obtuve %d: %+v", len(tt.want), len(got), got)
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("tramo %d: esperaba %+v, obtuve %+v", i, tt.want[i], got[i])
				}
			}
		})
	}
}

// ---------- Tests con los CSV reales ----------

func TestDetectRealData(t *testing.T) {
	expected := map[string]struct {
		start     string
		direction Direction
		hours     int
		ongoing   bool
	}{
		"M-104": {"2026-09-11 00:00", Up, 96, true},    // nueva línea productiva
		"M-106": {"2026-09-08 00:00", Down, 12, false}, // parada programada de 12 h
		"M-109": {"2026-09-12 14:00", Up, 58, true},    // aumento sin evento conocido
	}

	for id, rs := range testutil.LoadMeters(t) {
		changes := Detect(rs, baseline.Build(rs))

		exp, shouldChange := expected[id]
		if !shouldChange {
			if len(changes) != 0 {
				t.Errorf("%s: no esperaba cambios, obtuve %+v", id, changes)
			}
			continue
		}

		if len(changes) != 1 {
			t.Errorf("%s: esperaba 1 cambio, obtuve %d", id, len(changes))
			continue
		}
		c := changes[0]
		sameStart := c.Start.Equal(testutil.MustParse(t, exp.start))
		sameShape := c.Direction == exp.direction && c.Hours == exp.hours && c.Ongoing == exp.ongoing
		if !sameStart || !sameShape {
			t.Errorf("%s: cambio inesperado: %+v", id, c)
		}
	}
}

func TestM109MoreThanDoubles(t *testing.T) {
	rs := testutil.LoadMeters(t)["M-109"]
	changes := Detect(rs, baseline.Build(rs))
	if len(changes) == 0 {
		t.Fatal("M-109 debería tener un cambio")
	}
	if changes[0].ChangePct < 100 {
		t.Errorf("M-109: esperaba más de +100%%, obtuve %+.1f%%", changes[0].ChangePct)
	}
}
