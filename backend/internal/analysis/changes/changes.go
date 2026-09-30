// Package changes busca cambios sostenidos del consumo frente al baseline.
package changes

import (
	"math"
	"time"

	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/stats"
	"energyai/internal/data"
)

// minChangeHours: un cambio debe durar al menos estas horas seguidas.
// Así un pico aislado de una hora no dispara una alerta.
const minChangeHours = 6

// Direction indica si el consumo subió o bajó frente al baseline.
type Direction string //	@name	Direction

// Direcciones posibles de un cambio. El valor vacío "" significa "sin cambio".
const (
	Up   Direction = "UP"
	Down Direction = "DOWN"
)

// Change es un cambio sostenido del consumo respecto al baseline.
type Change struct {
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	Hours       int       `json:"hours"`
	Direction   Direction `json:"direction"`
	ExpectedKWh float64   `json:"expected_kwh"` // lo que debería haber consumido en ese tramo
	ActualKWh   float64   `json:"actual_kwh"`   // lo que consumió de verdad
	ChangePct   float64   `json:"change_pct"`   // variación porcentual
	MaxAbsZ     float64   `json:"max_abs_z"`    // la lectura más extrema del tramo
	Ongoing     bool      `json:"ongoing"`      // true si sigue activo al final de los datos
} //	@name	ConsumptionChange

// ImpactKWh es la energía de más (+) o de menos (-) frente a lo esperado.
func (c Change) ImpactKWh() float64 {
	return c.ActualKWh - c.ExpectedKWh
}

// run es un tramo de lecturas seguidas que se salen del baseline en la misma dirección.
type run struct {
	start, end int // posiciones en la lista, ambas incluidas
	direction  Direction
}

// directionOf dice hacia dónde se sale z del umbral, o "" si no se sale.
func directionOf(z float64) Direction {
	switch {
	case z > stats.ZThreshold:
		return Up
	case z < -stats.ZThreshold:
		return Down
	default:
		return ""
	}
}

// findRuns busca tramos de al menos minLen valores seguidos en la misma dirección.
func findRuns(z []float64, minLen int) []run {
	runs := []run{}
	start, dir := -1, Direction("") // start = -1 significa "no hay tramo abierto"

	for i, v := range z {
		d := directionOf(v)

		// Si hay un tramo abierto y se corta (vuelve a lo normal o cambia de dirección), lo cerramos.
		if start >= 0 && d != dir {
			if i-start >= minLen {
				runs = append(runs, run{start: start, end: i - 1, direction: dir})
			}
			start = -1
		}

		// Si no hay tramo abierto y esta lectura es anómala, abrimos uno.
		if start < 0 && d != "" {
			start, dir = i, d
		}
	}

	// Un tramo que sigue abierto cuando se acaban los datos.
	if start >= 0 && len(z)-start >= minLen {
		runs = append(runs, run{start: start, end: len(z) - 1, direction: dir})
	}
	return runs
}

// Detect encuentra los cambios sostenidos de consumo de UN medidor.
func Detect(readings []data.Reading, b baseline.Baseline) []Change {
	z := baseline.ZScores(readings, b)
	changes := []Change{}

	for _, rn := range findRuns(z, minChangeHours) {
		c := Change{
			Start:     readings[rn.start].Timestamp,
			End:       readings[rn.end].Timestamp,
			Hours:     rn.end - rn.start + 1,
			Direction: rn.direction,
			Ongoing:   rn.end == len(readings)-1,
		}

		for i := rn.start; i <= rn.end; i++ {
			c.ExpectedKWh += b.Expected(readings[i])
			c.ActualKWh += readings[i].ConsumptionKWh
			c.MaxAbsZ = math.Max(c.MaxAbsZ, math.Abs(z[i]))
		}
		c.ChangePct = stats.PctChange(c.ActualKWh, c.ExpectedKWh)

		changes = append(changes, c)
	}
	return changes
}

// Biggest elige el cambio que más energía movió (normalmente hay uno solo).
func Biggest(changes []Change) Change {
	best := changes[0]
	for _, c := range changes[1:] {
		if math.Abs(c.ImpactKWh()) > math.Abs(best.ImpactKWh()) {
			best = c
		}
	}
	return best
}
