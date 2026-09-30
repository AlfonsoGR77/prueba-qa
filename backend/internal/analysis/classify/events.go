package classify

import (
	"slices"
	"time"

	"energyai/internal/analysis/changes"
	"energyai/internal/data"
)

const (
	// Un evento se relaciona con un cambio si ocurrió entre 24 h antes y 6 h después de su inicio.
	eventWindowBefore = 24 * time.Hour
	eventWindowAfter  = 6 * time.Hour

	// eventTrust: cuando la conclusión depende de un evento que reportó una persona,
	// bajamos la confianza un 10%, porque no podemos verificar ese reporte.
	eventTrust = 0.9
)

// eventExplains dice qué direcciones de cambio puede explicar cada tipo de evento.
// Una parada programada explica una caída, nunca un aumento.
// UNKNOWN y DATA_QUALITY no están: no explican cambios de consumo.
var eventExplains = map[data.EventType][]changes.Direction{
	data.EventOperationalChange: {changes.Up, changes.Down},
	data.EventScheduledOutage:   {changes.Down},
}

// explainingEvent busca un evento cercano al inicio del cambio cuyo tipo explique
// su dirección. Devuelve nil si no hay ninguno.
func explainingEvent(c changes.Change, events []data.Event) *data.Event {
	from := c.Start.Add(-eventWindowBefore)
	to := c.Start.Add(eventWindowAfter)
	for i, e := range events {
		if between(e.Timestamp, from, to) && slices.Contains(eventExplains[e.Type], c.Direction) {
			return &events[i]
		}
	}
	return nil
}

// relatedEvents devuelve los eventos entre 24 h antes del inicio y el final de la ventana.
func relatedEvents(events []data.Event, from, to time.Time) []data.Event {
	related := []data.Event{} // vacío en vez de nil, para que el JSON muestre [] y no null
	for _, e := range events {
		if between(e.Timestamp, from.Add(-eventWindowBefore), to) {
			related = append(related, e)
		}
	}
	return related
}

// between dice si t está entre from y to, ambos incluidos.
func between(t, from, to time.Time) bool {
	return !t.Before(from) && !t.After(to)
}
