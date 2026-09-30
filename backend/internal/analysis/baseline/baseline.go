// Package baseline calcula el comportamiento normal de cada medidor usando
// los primeros días del dataset.
package baseline

import (
	"time"

	"energyai/internal/analysis/stats"
	"energyai/internal/data"
)

// Days es cuántos días iniciales se usan como referencia de "lo normal".
const Days = 7

// Baseline resume cómo se comporta normalmente un medidor.
type Baseline struct {
	HourlyKWh         [24]float64 `json:"hourly_kwh"`          // mediana del consumo en cada hora del día (0 a 23)
	ResidualMAD       float64     `json:"residual_mad"`        // cuánto se aleja normalmente una lectura de su baseline
	DailyKWh          float64     `json:"daily_kwh"`           // mediana del consumo diario
	MedianVoltage     float64     `json:"median_voltage"`      // voltaje normal del medidor
	MedianCurrent     float64     `json:"median_current"`      // corriente normal del medidor
	MedianPowerFactor float64     `json:"median_power_factor"` // factor de potencia normal del medidor
}

// Expected devuelve el consumo esperado para la hora de esa lectura.
func (b Baseline) Expected(r data.Reading) float64 {
	return b.HourlyKWh[r.Timestamp.Hour()]
}

// Window devuelve las lecturas de los primeros Days días.
func Window(readings []data.Reading) []data.Reading {
	window := []data.Reading{}
	if len(readings) == 0 {
		return window
	}
	end := readings[0].Timestamp.Add(Days * 24 * time.Hour)
	for _, r := range readings {
		if r.Timestamp.Before(end) {
			window = append(window, r)
		}
	}
	return window
}

// Build calcula el baseline de UN medidor.
// Las lecturas deben estar ordenadas por fecha (data.GroupByMeter ya lo hace).
func Build(readings []data.Reading) Baseline {
	window := Window(readings)
	var b Baseline

	// 1. Mediana del consumo para cada hora del día.
	var byHour [24][]float64
	for _, r := range window {
		h := r.Timestamp.Hour()
		byHour[h] = append(byHour[h], r.ConsumptionKWh)
	}
	for h, xs := range byHour {
		b.HourlyKWh[h] = stats.Median(xs)
	}

	// 2. Residuos: cuánto se aleja cada lectura del baseline de su hora.
	//    Sacamos UNA MAD con los 168 residuos (7 días x 24 h), que es mucho
	//    más estable que sacar una MAD con solo 7 valores por hora.
	residuals := make([]float64, 0, len(window))
	voltages := make([]float64, 0, len(window))
	currents := make([]float64, 0, len(window))
	powerFactors := make([]float64, 0, len(window))
	dailyTotals := map[string]float64{}
	for _, r := range window {
		residuals = append(residuals, r.ConsumptionKWh-b.Expected(r))
		voltages = append(voltages, r.VoltageV)
		currents = append(currents, r.CurrentA)
		powerFactors = append(powerFactors, r.PowerFactor)
		dailyTotals[r.Timestamp.Format("2006-01-02")] += r.ConsumptionKWh
	}
	b.ResidualMAD = stats.MAD(residuals)
	b.MedianVoltage = stats.Median(voltages)
	b.MedianCurrent = stats.Median(currents)
	b.MedianPowerFactor = stats.Median(powerFactors)

	// 3. Consumo diario normal: mediana de los totales de cada día.
	totals := make([]float64, 0, len(dailyTotals))
	for _, total := range dailyTotals {
		totals = append(totals, total)
	}
	b.DailyKWh = stats.Median(totals)

	return b
}

// ZScores calcula el z robusto de cada lectura contra el baseline de su hora.
func ZScores(readings []data.Reading, b Baseline) []float64 {
	z := make([]float64, len(readings))
	for i, r := range readings {
		z[i] = stats.RobustZ(r.ConsumptionKWh, b.Expected(r), b.ResidualMAD)
	}
	return z
}

// LastDayKWh suma el consumo de las últimas 24 lecturas.
func LastDayKWh(readings []data.Reading) float64 {
	total := 0.0
	for _, r := range readings[max(0, len(readings)-24):] {
		total += r.ConsumptionKWh
	}
	return total
}
