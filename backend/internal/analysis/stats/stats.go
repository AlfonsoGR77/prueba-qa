// Package stats tiene las estadísticas robustas que usa el motor: mediana,
// MAD y z robusto.
package stats

import (
	"math"
	"slices"
)

const (
	// ZThreshold es el umbral recomendado por Iglewicz y Hoaglin para el z robusto.
	ZThreshold = 3.5
	// minMAD evita dividir por cero si los datos casi no varían.
	minMAD = 1e-6
)

// Median devuelve la mediana de xs, o NaN si xs está vacío.
func Median(xs []float64) float64 {
	if len(xs) == 0 {
		return math.NaN()
	}
	s := slices.Clone(xs) // copia, para no desordenar la lista original
	slices.Sort(s)
	m := len(s) / 2
	if len(s)%2 == 1 {
		return s[m]
	}
	return (s[m-1] + s[m]) / 2
}

// MAD (median absolute deviation) mide cuánto se mueven normalmente los datos:
// es la mediana de las distancias de cada valor a la mediana.
func MAD(xs []float64) float64 {
	med := Median(xs)
	dist := make([]float64, len(xs))
	for i, x := range xs {
		dist[i] = math.Abs(x - med)
	}
	return Median(dist)
}

// RobustZ dice a cuántas "variaciones normales" está x de center (la mediana).
// spread es la MAD; el 0,6745 la convierte a la escala de la desviación estándar.
func RobustZ(x, center, spread float64) float64 {
	return 0.6745 * (x - center) / math.Max(spread, minMAD)
}

// PctChange devuelve la variación porcentual de base a actual.
// Si base es 0 o NaN devuelve 0: dividir daría Inf o NaN, y encoding/json
// no sabe convertir esos valores (la API respondería con error).
func PctChange(actual, base float64) float64 {
	if base == 0 || math.IsNaN(base) {
		return 0
	}
	return (actual - base) / base * 100
}

// Round redondea x a la cantidad de decimales indicada (para mostrar en la API).
func Round(x float64, decimals int) float64 {
	p := math.Pow(10, float64(decimals))
	return math.Round(x*p) / p
}
