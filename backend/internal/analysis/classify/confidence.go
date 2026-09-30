package classify

import (
	"math"

	"energyai/internal/analysis/model"
	"energyai/internal/analysis/variables"
)

// confidence convierte las señales en un número entre 0,5 y 0,95.
// Nunca llega a 1: siempre queda la validación en campo.
func confidence(checks []model.Check, trust float64) float64 {
	score := 0.0
	for _, c := range checks {
		score += c.Weight * c.Strength
	}
	return math.Round((0.5+0.45*score)*trust*100) / 100
}

// corroboration: 1 si la corriente cambió en la misma dirección y proporción que el consumo.
func corroboration(cur, cons variables.Change) float64 {
	if cons.ChangePct == 0 {
		return 0
	}
	return math.Max(0, math.Min(cur.ChangePct/cons.ChangePct, 1))
}

func boolStrength(ok bool) float64 {
	if ok {
		return 1
	}
	return 0
}

func ratio(n, target int) float64 {
	return math.Min(float64(n)/float64(target), 1)
}
