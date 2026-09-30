// Package variables compara las variables eléctricas (consumo, corriente,
// voltaje y factor de potencia) durante un problema contra su baseline.
package variables

import (
	"math"
	"slices"
	"time"

	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/quality"
	"energyai/internal/analysis/stats"
	"energyai/internal/data"
)

// Nombres de las variables eléctricas, tal como aparecen en el JSON.
const (
	Consumption = "consumption_kwh"
	Current     = "current_a"
	Voltage     = "voltage_v"
	PowerFactor = "power_factor"
)

// Change compara una variable durante el problema contra su baseline.
type Change struct {
	Variable  string  `json:"variable"`
	Baseline  float64 `json:"baseline"` // mediana normal, en las mismas horas del día
	Observed  float64 `json:"observed"` // mediana durante el problema
	Min       float64 `json:"min"`
	Max       float64 `json:"max"`
	ChangePct float64 `json:"change_pct"`
	Changed   bool    `json:"changed"`
} //	@name	VariableChange

// variables es la lista de variables a comparar, cada una con una función
// que saca su valor de una lectura.
var variables = []struct {
	name string
	pick func(data.Reading) float64
}{
	{name: Consumption, pick: func(r data.Reading) float64 { return r.ConsumptionKWh }},
	{name: Current, pick: func(r data.Reading) float64 { return r.CurrentA }},
	{name: Voltage, pick: func(r data.Reading) float64 { return r.VoltageV }},
	{name: PowerFactor, pick: func(r data.Reading) float64 { return r.PowerFactor }},
}

// Compare compara cada variable durante la ventana contra el baseline
// en las MISMAS horas del día (de noche se consume distinto que de día).
func Compare(rs []data.Reading, from, to time.Time) []Change {
	hours := map[int]bool{}
	window := []data.Reading{}
	for _, r := range rs {
		if !r.Timestamp.Before(from) && !r.Timestamp.After(to) {
			window = append(window, r)
			hours[r.Timestamp.Hour()] = true
		}
	}
	if len(window) == 0 {
		return []Change{}
	}

	base := []data.Reading{}
	for _, r := range baseline.Window(rs) {
		if hours[r.Timestamp.Hour()] {
			base = append(base, r)
		}
	}

	result := make([]Change, 0, len(variables))
	for _, v := range variables {
		observed := pluck(window, v.pick)
		vc := Change{
			Variable: v.name,
			Baseline: stats.Median(pluck(base, v.pick)),
			Observed: stats.Median(observed),
			Min:      slices.Min(observed),
			Max:      slices.Max(observed),
		}
		vc.ChangePct = stats.PctChange(vc.Observed, vc.Baseline)
		vc.Changed = changed(vc)
		result = append(result, vc)
	}
	return result
}

// changed decide si una variable cambió de forma relevante.
func changed(v Change) bool {
	switch v.Variable {
	case Voltage:
		return v.Min < v.Baseline*(1-quality.VoltageTolerance) || v.Max > v.Baseline*(1+quality.VoltageTolerance)
	case PowerFactor:
		medianShifted := math.Abs(v.Observed-v.Baseline) >= 0.1
		outOfRange := v.Min < v.Baseline-quality.PowerFactorTolerance ||
			v.Max > v.Baseline+quality.PowerFactorTolerance
		return medianShifted || outOfRange
	default: // consumo y corriente
		return math.Abs(v.ChangePct) >= 10
	}
}

// Find busca una variable por nombre. Si no está, devuelve una vacía.
func Find(vars []Change, name string) Change {
	i := slices.IndexFunc(vars, func(v Change) bool { return v.Variable == name })
	if i < 0 {
		return Change{}
	}
	return vars[i]
}

// pluck saca un valor de cada lectura (por ejemplo, todos los voltajes).
func pluck(rs []data.Reading, pick func(data.Reading) float64) []float64 {
	out := make([]float64, len(rs))
	for i, r := range rs {
		out[i] = pick(r)
	}
	return out
}
