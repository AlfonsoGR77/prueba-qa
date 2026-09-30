package analysis

import (
	"cmp"
	"math"
	"slices"

	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/changes"
	"energyai/internal/analysis/classify"
	"energyai/internal/analysis/model"
	"energyai/internal/analysis/quality"
	"energyai/internal/analysis/stats"
	"energyai/internal/data"
)

// Analyze corre el motor completo y devuelve las anomalías ordenadas por prioridad.
func Analyze(readings []data.Reading, events []data.Event) []model.Anomaly {
	eventsByMeter := data.GroupEventsByMeter(events)

	anomalies := []model.Anomaly{} // vacío en vez de nil, para que el JSON muestre [] y no null
	for id, rs := range data.GroupByMeter(readings) {
		m := classify.Meter{ID: id, Readings: rs, Events: eventsByMeter[id]}
		if a, ok := analyzeMeter(m); ok {
			a.NarratedBy = model.NarratorEngine
			anomalies = append(anomalies, a)
		}
	}

	prioritize(anomalies)
	return anomalies
}

// analyzeMeter aplica las 4 preguntas a UN medidor.
// Devuelve false si el medidor está normal.
func analyzeMeter(m classify.Meter) (model.Anomaly, bool) {
	b := baseline.Build(m.Readings)
	q := quality.Check(m.Readings, b)
	cs := changes.Detect(m.Readings, b)

	if !q.HasIssue() && len(cs) == 0 {
		return model.Anomaly{}, false
	}

	last := baseline.LastDayKWh(m.Readings)
	ev := model.Evidence{
		BaselineDailyKWh: b.DailyKWh,
		LastDayKWh:       last,
		DailyChangePct:   stats.PctChange(last, b.DailyKWh),
	}

	// Pregunta 1: ¿las variables eléctricas cuadran con el consumo?
	if q.HasIssue() {
		return classify.DataQuality(m, q, len(cs) == 0, ev), true
	}

	// Preguntas 2 a 4: hay un cambio de consumo; ¿qué lo explica?
	return classify.Change(m, changes.Biggest(cs), ev), true
}

// prioritize ordena las anomalías y les asigna prioridad: primero la severidad;
// a igual severidad, la que más energía está moviendo; si empatan, la de mayor
// confianza. El medidor es el último desempate, para que el orden sea siempre el mismo.
func prioritize(anomalies []model.Anomaly) {
	slices.SortFunc(anomalies, func(a, b model.Anomaly) int {
		return cmp.Or(
			cmp.Compare(b.Severity.Rank(), a.Severity.Rank()),
			cmp.Compare(math.Abs(b.Evidence.ImpactKWh), math.Abs(a.Evidence.ImpactKWh)),
			cmp.Compare(b.Confidence, a.Confidence),
			cmp.Compare(a.MeterID, b.MeterID),
		)
	})
	for i := range anomalies {
		anomalies[i].Priority = i + 1
	}
}
