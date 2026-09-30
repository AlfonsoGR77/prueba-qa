// Package store guarda en memoria los datos y el resultado del motor.
//
// Cumple el papel de un repositorio: los servicios le piden datos a él y no
// saben de dónde salen. Hoy salen de los CSV; si mañana hay una base de
// datos, solo cambia este paquete.
//
// Las lecturas y los eventos no cambian nunca. Las anomalías sí: cada vez que
// se corre un análisis (POST /ai/analyze) se reemplazan completas. Un RWMutex
// deja que muchas peticiones lean a la vez y que el reemplazo sea atómico.
package store

import (
	"fmt"
	"slices"
	"sync"
	"time"

	"energyai/internal/analysis"
	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/model"
	"energyai/internal/data"
)

// Meter es todo lo que el sistema sabe de un medidor. Es una copia: modificarla
// no cambia el store. Readings y Events se comparten y no se deben modificar.
type Meter struct {
	ID       string
	Readings []data.Reading // ordenadas por fecha
	Events   []data.Event
	Baseline baseline.Baseline
	Anomaly  *model.Anomaly // nil si el motor no encontró nada
}

// Store tiene los medidores y las anomalías.
type Store struct {
	readings []data.Reading
	events   []data.Event
	meters   map[string]Meter
	ids      []string  // IDs ordenados, para devolver siempre el mismo orden
	from, to time.Time // rango de fechas de las lecturas

	mu        sync.RWMutex
	anomalies []model.Anomaly // ordenadas por prioridad; se reemplaza completo, nunca se modifica
}

// Load lee los CSV y corre el motor.
func Load(readingsPath, eventsPath string) (*Store, error) {
	readings, err := data.LoadReadings(readingsPath)
	if err != nil {
		return nil, fmt.Errorf("cargando lecturas: %w", err)
	}
	events, err := data.LoadEvents(eventsPath)
	if err != nil {
		return nil, fmt.Errorf("cargando eventos: %w", err)
	}
	return New(readings, events), nil
}

// New arma el store a partir de lecturas y eventos ya cargados y corre el motor.
func New(readings []data.Reading, events []data.Event) *Store {
	s := &Store{
		readings: readings,
		events:   events,
		meters:   map[string]Meter{},
		ids:      []string{},
	}

	eventsByMeter := data.GroupEventsByMeter(events)
	for id, rs := range data.GroupByMeter(readings) {
		evs := eventsByMeter[id]
		if evs == nil {
			evs = []data.Event{}
		}
		s.meters[id] = Meter{
			ID:       id,
			Readings: rs,
			Events:   evs,
			Baseline: baseline.Build(rs),
		}
		s.ids = append(s.ids, id)

		first, last := rs[0].Timestamp, rs[len(rs)-1].Timestamp
		if s.from.IsZero() || first.Before(s.from) {
			s.from = first
		}
		if last.After(s.to) {
			s.to = last
		}
	}
	slices.Sort(s.ids)

	s.anomalies = analysis.Analyze(readings, events)
	return s
}

// Readings devuelve todas las lecturas. No se deben modificar.
func (s *Store) Readings() []data.Reading {
	return s.readings
}

// Events devuelve todos los eventos. No se deben modificar.
func (s *Store) Events() []data.Event {
	return s.events
}

// Meters devuelve todos los medidores ordenados por ID.
func (s *Store) Meters() []Meter {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]Meter, 0, len(s.ids))
	for _, id := range s.ids {
		out = append(out, s.withAnomaly(s.meters[id]))
	}
	return out
}

// Meter busca un medidor por ID.
func (s *Store) Meter(id string) (Meter, bool) {
	m, ok := s.meters[id]
	if !ok {
		return Meter{}, false
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.withAnomaly(m), true
}

// Anomalies devuelve una copia de las anomalías, ordenadas por prioridad.
func (s *Store) Anomalies() []model.Anomaly {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return slices.Clone(s.anomalies)
}

// SetAnomalies reemplaza las anomalías (lo usa cada análisis nuevo).
func (s *Store) SetAnomalies(anomalies []model.Anomaly) {
	next := slices.Clone(anomalies) // copia propia: nadie de afuera la puede modificar
	s.mu.Lock()
	defer s.mu.Unlock()
	s.anomalies = next
}

// DataRange devuelve la fecha de la primera y la última lectura.
func (s *Store) DataRange() (from, to time.Time) {
	return s.from, s.to
}

// withAnomaly completa el medidor con su anomalía actual. Se llama con el lock tomado.
// El puntero apunta al slice actual, que nunca se modifica (SetAnomalies lo reemplaza),
// así que sigue siendo válido después de soltar el lock.
func (s *Store) withAnomaly(m Meter) Meter {
	m.Anomaly = nil
	for i := range s.anomalies {
		if s.anomalies[i].MeterID == m.ID {
			m.Anomaly = &s.anomalies[i]
			break
		}
	}
	return m
}
