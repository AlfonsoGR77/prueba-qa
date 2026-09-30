// Package quality revisa si las variables eléctricas de un medidor son
// coherentes, es decir, si el medidor está diciendo la verdad.
package quality

import (
	"math"
	"time"

	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/stats"
	"energyai/internal/data"
)

const (
	// VoltageTolerance: el voltaje normal varía menos de ±3%; más de ±5% de su mediana es sospechoso.
	VoltageTolerance = 0.05
	// PowerFactorTolerance: cuánto puede alejarse el FP de su mediana cuando el consumo está normal.
	PowerFactorTolerance = 0.15
	// minHours: horas con problemas necesarias para declarar un problema de calidad.
	minHours = 3
)

// Report resume los problemas de calidad de datos de UN medidor.
type Report struct {
	FlaggedHours        int       `json:"flagged_hours"`         // horas con al menos un problema
	VoltageOutOfRange   int       `json:"voltage_out_of_range"`  // voltaje a más de ±5% de lo normal
	PowerFactorMismatch int       `json:"power_factor_mismatch"` // FP disparado con consumo normal
	InvalidValues       int       `json:"invalid_values"`        // valores imposibles (FP > 1, negativos...)
	MissingHours        int       `json:"missing_hours"`         // horas sin lectura
	DuplicateReadings   int       `json:"duplicate_readings"`    // dos lecturas con la misma hora
	FirstFlagged        time.Time `json:"first_flagged"`
	LastFlagged         time.Time `json:"last_flagged"`
} //	@name	Report

// HasIssue dice si hay suficientes problemas como para reportarlo.
func (q Report) HasIssue() bool {
	return q.FlaggedHours >= minHours || q.MissingHours > 0 || q.DuplicateReadings > 0
}

// Check revisa si las variables eléctricas son coherentes.
// La idea: si el consumo está normal pero el voltaje o el factor de potencia
// se disparan, el medidor está reportando mal. No es un cambio real de energía.
func Check(readings []data.Reading, b baseline.Baseline) Report {
	var q Report
	z := baseline.ZScores(readings, b)

	for i, r := range readings {
		consumptionNormal := math.Abs(z[i]) <= stats.ZThreshold

		voltageOff := math.Abs(r.VoltageV-b.MedianVoltage)/b.MedianVoltage > VoltageTolerance
		// El FP solo cuenta como problema si el consumo está normal: en M-109 el FP
		// cae porque el consumo real cambió, y eso NO es un problema de datos.
		powerFactorOff := consumptionNormal && math.Abs(r.PowerFactor-b.MedianPowerFactor) > PowerFactorTolerance
		invalid := isInvalid(r)

		if voltageOff {
			q.VoltageOutOfRange++
		}
		if powerFactorOff {
			q.PowerFactorMismatch++
		}
		if invalid {
			q.InvalidValues++
		}
		if voltageOff || powerFactorOff || invalid {
			q.FlaggedHours++
			if q.FirstFlagged.IsZero() {
				q.FirstFlagged = r.Timestamp
			}
			q.LastFlagged = r.Timestamp
		}

		// Entre dos lecturas seguidas debería haber exactamente 1 hora.
		if i > 0 {
			gap := r.Timestamp.Sub(readings[i-1].Timestamp)
			switch {
			case gap <= 0:
				q.DuplicateReadings++
			case gap > time.Hour:
				q.MissingHours += int(gap/time.Hour) - 1
			}
		}
	}
	return q
}

// isInvalid dice si la lectura tiene valores físicamente imposibles.
func isInvalid(r data.Reading) bool {
	negative := r.ConsumptionKWh < 0 || r.CurrentA < 0
	noVoltage := r.VoltageV <= 0
	badPowerFactor := r.PowerFactor < 0 || r.PowerFactor > 1
	return negative || noVoltage || badPowerFactor
}
