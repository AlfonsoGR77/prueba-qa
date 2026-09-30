package stats

import (
	"math"
	"testing"

	"energyai/internal/testutil"
)

func TestMedian(t *testing.T) {
	tests := []struct {
		name string
		in   []float64
		want float64
	}{
		{"impar con un pico", []float64{10, 11, 10, 12, 11, 10, 90}, 11},
		{"par", []float64{1, 2, 3, 4}, 2.5},
		{"un solo valor", []float64{7}, 7},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Median(tt.in); !testutil.AlmostEqual(got, tt.want) {
				t.Errorf("Median(%v) = %v, esperaba %v", tt.in, got, tt.want)
			}
		})
	}
}

func TestMedianEmpty(t *testing.T) {
	if !math.IsNaN(Median(nil)) {
		t.Error("la mediana de una lista vacía debería ser NaN")
	}
}

func TestMedianDoesNotModifyInput(t *testing.T) {
	in := []float64{3, 1, 2}
	Median(in)
	if in[0] != 3 || in[1] != 1 || in[2] != 2 {
		t.Errorf("Median desordenó la lista original: %v", in)
	}
}

// Distancias 1,0,1,1,0,1,79 -> mediana 1.
func TestMAD(t *testing.T) {
	got := MAD([]float64{10, 11, 10, 12, 11, 10, 90})
	if !testutil.AlmostEqual(got, 1) {
		t.Errorf("MAD = %v, esperaba 1", got)
	}
}

// Lectura 20, mediana 11, MAD 1 -> 0,6745 x 9 = 6,07 -> anómala (> 3,5).
func TestRobustZ(t *testing.T) {
	got := RobustZ(20, 11, 1)
	if !testutil.AlmostEqual(got, 0.6745*9) {
		t.Errorf("RobustZ = %v, esperaba %v", got, 0.6745*9)
	}
	if math.Abs(got) <= ZThreshold {
		t.Errorf("z = %v debería superar el umbral %v", got, ZThreshold)
	}
}

func TestPctChange(t *testing.T) {
	tests := []struct {
		name         string
		actual, base float64
		want         float64
	}{
		{"sube al doble", 20, 10, 100},
		{"baja a la mitad", 5, 10, -50},
		{"base cero no produce Inf", 5, 0, 0},
		{"base NaN no produce NaN", 5, math.NaN(), 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := PctChange(tt.actual, tt.base); !testutil.AlmostEqual(got, tt.want) {
				t.Errorf("PctChange(%v, %v) = %v, esperaba %v", tt.actual, tt.base, got, tt.want)
			}
		})
	}
}
