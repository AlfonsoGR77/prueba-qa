// Package classify decide qué tipo de anomalía tiene un medidor, con qué
// severidad y confianza, y redacta la explicación y la acción recomendada.
package classify

import (
	"fmt"
	"math"
	"slices"

	"energyai/internal/analysis/changes"
	"energyai/internal/analysis/model"
	"energyai/internal/analysis/quality"
	"energyai/internal/analysis/variables"
	"energyai/internal/data"
)

// Meter agrupa lo que el motor sabe de UN medidor.
type Meter struct {
	ID       string
	Readings []data.Reading // ordenadas por fecha
	Events   []data.Event
}

// DataQuality arma la anomalía de un medidor que reporta mal.
func DataQuality(m Meter, q quality.Report, consumptionStable bool, ev model.Evidence) model.Anomaly {
	ev.WindowStart, ev.WindowEnd = q.FirstFlagged, q.LastFlagged
	ev.Quality = &q
	ev.Variables = variables.Compare(m.Readings, ev.WindowStart, ev.WindowEnd)
	ev.RelatedEvents = relatedEvents(m.Events, ev.WindowStart, ev.WindowEnd)

	hasReport := slices.ContainsFunc(ev.RelatedEvents, func(e data.Event) bool {
		return e.Type == data.EventDataQuality
	})

	ev.Checks = []model.Check{
		{
			Description: "El consumo se mantiene estable",
			Weight:      0.3,
			Strength:    boolStrength(consumptionStable),
		},
		{
			Description: fmt.Sprintf("Voltaje fuera de ±5%% de lo normal en %d h", q.VoltageOutOfRange),
			Weight:      0.3,
			Strength:    ratio(q.VoltageOutOfRange, 6),
		},
		{
			Description: fmt.Sprintf("Factor de potencia incoherente con el consumo en %d h", q.PowerFactorMismatch),
			Weight:      0.2,
			Strength:    ratio(q.PowerFactorMismatch, 6),
		},
		{
			Description: "Existe un reporte de calidad de datos para el medidor",
			Weight:      0.2,
			Strength:    boolStrength(hasReport),
		},
	}

	severity := model.SeverityMedium
	if q.FlaggedHours >= 12 {
		severity = model.SeverityHigh
	}

	v := variables.Find(ev.Variables, variables.Voltage)
	pf := variables.Find(ev.Variables, variables.PowerFactor)
	prefix := "Hay"
	if consumptionStable {
		prefix = "El consumo se mantiene estable, pero hay"
	}
	reason := fmt.Sprintf(
		"%s %d h con lecturas eléctricas incoherentes desde %s: "+
			"voltaje entre %s y %s V (normal %s V) y factor de potencia hasta %s.",
		prefix,
		q.FlaggedHours,
		fmtTime(q.FirstFlagged),
		num(v.Min, 1),
		num(v.Max, 1),
		num(v.Baseline, 1),
		num(pf.Min, 2),
	)

	return model.Anomaly{
		MeterID:    m.ID,
		Anomaly:    true,
		Type:       model.TypeDataQuality,
		Severity:   severity,
		Confidence: confidence(ev.Checks, 1),
		DetectedAt: q.FirstFlagged,
		Reason:     reason,
		RecommendedAction: fmt.Sprintf("Validar el medidor %s en sitio (conexión, sensores y calibración) "+
			"antes de usar sus lecturas para tomar decisiones.", m.ID),
		Evidence: ev,
	}
}

// Change decide si un cambio de consumo es real, explicable o falso positivo.
func Change(m Meter, c changes.Change, ev model.Evidence) model.Anomaly {
	ev.WindowStart, ev.WindowEnd = c.Start, c.End
	ev.Change = &c
	ev.ImpactKWh = c.ImpactKWh()
	ev.Variables = variables.Compare(m.Readings, c.Start, c.End)
	ev.RelatedEvents = relatedEvents(m.Events, c.Start, c.End)

	cons := variables.Find(ev.Variables, variables.Consumption)
	cur := variables.Find(ev.Variables, variables.Current)
	pf := variables.Find(ev.Variables, variables.PowerFactor)
	currentCheck := model.Check{
		Description: fmt.Sprintf("La corriente confirma el cambio (%s)", pct(cur.ChangePct)),
		Strength:    corroboration(cur, cons), // ¿la corriente se movió igual que el consumo?
	}
	sustained := math.Min(float64(c.Hours)/24, 1)

	var a model.Anomaly
	explaining := explainingEvent(c, m.Events)

	switch {
	case explaining == nil:
		// Pregunta 4: cambio real y nadie sabe por qué.
		currentCheck.Weight = 0.25
		ev.Checks = []model.Check{
			{
				Description: fmt.Sprintf("Desviación fuerte respecto al baseline (z máx %s)", num(c.MaxAbsZ, 1)),
				Weight:      0.3,
				Strength:    math.Min(c.MaxAbsZ/10, 1),
			},
			{
				Description: fmt.Sprintf("Cambio sostenido durante %d h", c.Hours),
				Weight:      0.25,
				Strength:    sustained,
			},
			currentCheck,
			{
				Description: "Ningún evento operativo registrado lo explica",
				Weight:      0.2,
				Strength:    1,
			},
		}
		a.Type = model.TypeReal
		a.Severity = realSeverity(c)
		a.Confidence = confidence(ev.Checks, 1)
		a.Reason = fmt.Sprintf("Consumo %s frente al baseline durante %d h (desde %s) sin evento operativo que lo explique.",
			pct(c.ChangePct), c.Hours, fmtTime(c.Start))
		if cur.Changed {
			a.Reason += fmt.Sprintf(" La corriente cambió %s en la misma ventana.", pct(cur.ChangePct))
		}
		if pf.Changed {
			a.Reason += fmt.Sprintf(" El factor de potencia pasó de %s a %s.", num(pf.Baseline, 2), num(pf.Observed, 2))
		}
		a.RecommendedAction = realAction(m.ID, c, pf.Changed)

	case !c.Ongoing:
		// Pregunta 3a: un evento lo explica y el consumo ya volvió a lo normal.
		currentCheck.Weight = 0.15
		ev.Checks = append(eventChecks(*explaining, c),
			model.Check{Description: "El consumo volvió a lo normal", Weight: 0.25, Strength: 1},
			currentCheck,
		)
		a.Type = model.TypeFalsePositive
		a.Severity = model.SeverityLow
		a.Confidence = confidence(ev.Checks, eventTrust)
		a.Reason = fmt.Sprintf(
			"Consumo %s durante %d h desde %s, coincide con el evento %s (%s) y luego volvió a lo normal.",
			pct(c.ChangePct),
			c.Hours,
			fmtTime(c.Start),
			explaining.Type,
			explaining.Description,
		)
		a.RecommendedAction = "No escalar: el cambio corresponde al evento registrado y el consumo ya se normalizó."

	default:
		// Pregunta 3b: un evento lo explica y el nuevo nivel se queda.
		currentCheck.Weight = 0.2
		ev.Checks = append(eventChecks(*explaining, c),
			model.Check{
				Description: fmt.Sprintf("El nuevo nivel se mantiene (%d h)", c.Hours),
				Weight:      0.2,
				Strength:    sustained,
			},
			currentCheck,
		)
		a.Type = model.TypeExplainable
		a.Severity = model.SeverityMedium
		a.Confidence = confidence(ev.Checks, eventTrust)
		a.Reason = fmt.Sprintf(
			"Consumo %s frente al baseline desde %s, coincide con el evento %s (%s).",
			pct(c.ChangePct),
			fmtTime(c.Start),
			explaining.Type,
			explaining.Description,
		)
		a.RecommendedAction = fmt.Sprintf("Validar con operación que el cambio corresponde al evento registrado "+
			"y actualizar el baseline de %s.", m.ID)
	}

	a.MeterID = m.ID
	a.Anomaly = a.Type != model.TypeFalsePositive
	a.DetectedAt = c.Start
	a.Evidence = ev
	return a
}

// eventChecks son las dos señales comunes cuando un evento explica el cambio.
func eventChecks(e data.Event, c changes.Change) []model.Check {
	return []model.Check{
		{
			Description: fmt.Sprintf("Evento %s registrado al inicio del cambio", e.Type),
			Weight:      0.35,
			Strength:    1,
		},
		{
			Description: fmt.Sprintf("Un evento %s explica un cambio %s", e.Type, dirWord(c.Direction)),
			Weight:      0.25,
			Strength:    1,
		},
	}
}

// realSeverity: más de 50% y todavía activo es alta; más de 20% es media.
func realSeverity(c changes.Change) model.Severity {
	p := math.Abs(c.ChangePct)
	switch {
	case p >= 50 && c.Ongoing:
		return model.SeverityHigh
	case p >= 20:
		return model.SeverityMedium
	default:
		return model.SeverityLow
	}
}

// realAction arma la recomendación para una anomalía real.
func realAction(id string, c changes.Change, pfChanged bool) string {
	if c.Direction == changes.Down {
		return fmt.Sprintf("Verificar en sitio si en %s hay equipos detenidos o fallas de suministro desde %s.",
			id, fmtTime(c.Start))
	}
	action := fmt.Sprintf("Investigar en sitio la instalación de %s: "+
		"identificar qué equipo empezó a consumir más desde %s.", id, fmtTime(c.Start))
	if pfChanged {
		action += " El cambio del factor de potencia apunta a motores o cargas inductivas con falla o sobrecarga."
	}
	return action
}
