// Package anomaly expone las anomalías que detectó el motor.
package anomaly

import (
	"energyai/internal/analysis/model"
	"energyai/internal/store"
)

// Service tiene la lógica de las anomalías.
type Service struct {
	store *store.Store
}

// NewService arma el servicio.
func NewService(s *store.Store) *Service {
	return &Service{store: s}
}

// GetAll devuelve todas las anomalías, ordenadas por prioridad.
func (s *Service) GetAll() []model.Anomaly {
	return s.store.Anomalies()
}
