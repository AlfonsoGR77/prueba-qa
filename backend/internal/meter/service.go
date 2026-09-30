// Package meter expone los medidores: opciones de los filtros, lista
// filtrada y ordenada, y el detalle de cada uno.
package meter

import (
	"cmp"
	"slices"
	"strings"

	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/stats"
	"energyai/internal/data"
	"energyai/internal/httpx"
	"energyai/internal/store"
)

// Service tiene la lógica de los medidores.
type Service struct {
	store *store.Store
}

// NewService arma el servicio.
func NewService(s *store.Store) *Service {
	return &Service{store: s}
}

// Params devuelve las opciones de los desplegables del filtro.
func (s *Service) Params() ParamsResponse {
	all := s.store.Meters()
	meters := make([]httpx.Option, 0, len(all))
	for _, m := range all {
		meters = append(meters, httpx.Option{ID: m.ID, Value: m.ID})
	}
	return ParamsResponse{
		Meters:     meters,
		Statuses:   slices.Clone(statuses),
		SortFields: slices.Clone(sortFields),
		SortOrders: httpx.SortOrderOptions(),
	}
}

// Summaries devuelve el resumen de todos los medidores, ordenados por ID.
func (s *Service) Summaries() []Summary {
	meters := s.store.Meters()
	out := make([]Summary, 0, len(meters))
	for _, m := range meters {
		out = append(out, summarize(m))
	}
	return out
}

// GetAll filtra, ordena y pagina los medidores. req debe venir normalizado.
func (s *Service) GetAll(req PagedRequest) httpx.PaginatedResult[Summary] {
	f := req.Filter
	search := f.MeterID

	rows := []Summary{}
	for _, sm := range s.Summaries() {
		if search != "" && !strings.Contains(sm.MeterID, search) {
			continue
		}
		if f.Status != "" && sm.Status != f.Status {
			continue
		}
		rows = append(rows, sm)
	}

	sortSummaries(rows, f.SortBy, f.SortOrder)
	return httpx.Paginate(rows, req.Pagination)
}

// GetByID devuelve el detalle de un medidor. El ID no distingue mayúsculas.
func (s *Service) GetByID(id string) (Detail, bool) {
	m, ok := s.store.Meter(strings.ToUpper(strings.TrimSpace(id)))
	if !ok {
		return Detail{}, false
	}

	b := m.Baseline
	last := m.Readings[len(m.Readings)-1]
	return Detail{
		Summary: summarize(m),
		Electrical: Electrical{
			VoltageV:    metric(last.VoltageV, b.MedianVoltage),
			CurrentA:    metric(last.CurrentA, b.MedianCurrent),
			PowerFactor: metric(last.PowerFactor, b.MedianPowerFactor),
		},
		HourlyHistory: hourlyHistory(m.Readings, b),
		DailyHistory:  dailyHistory(m.Readings, b),
		Anomaly:       m.Anomaly,
		Events:        m.Events,
	}, true
}

// summarize arma la fila de la lista para un medidor.
func summarize(m store.Meter) Summary {
	last := baseline.LastDayKWh(m.Readings)
	sm := Summary{
		MeterID:        m.ID,
		Status:         StatusOf(m.Anomaly),
		ConsumptionKWh: stats.Round(last, 2),
		BaselineKWh:    stats.Round(m.Baseline.DailyKWh, 2),
		VariationPct:   stats.Round(stats.PctChange(last, m.Baseline.DailyKWh), 2),
		LastReadingAt:  m.Readings[len(m.Readings)-1].Timestamp,
	}
	if a := m.Anomaly; a != nil {
		sm.Severity = &a.Severity
		sm.AnomalyType = &a.Type
		sm.Priority = &a.Priority
	}
	return sm
}

// sortSummaries ordena por el campo pedido. El ID del medidor es siempre el
// último desempate (de menor a mayor), para que el orden sea estable entre páginas.
func sortSummaries(rows []Summary, by SortField, order httpx.SortOrder) {
	slices.SortFunc(rows, func(a, b Summary) int {
		var c int
		switch by {
		case SortByConsumption:
			c = cmp.Compare(a.ConsumptionKWh, b.ConsumptionKWh)
		case SortByVariation:
			c = cmp.Compare(a.VariationPct, b.VariationPct)
		case SortBySeverity:
			c = cmp.Compare(severityRank(a), severityRank(b))
		case SortByMeterID:
			c = cmp.Compare(a.MeterID, b.MeterID)
		}
		if order == httpx.Desc {
			c = -c
		}
		return cmp.Or(c, cmp.Compare(a.MeterID, b.MeterID))
	})
}

// severityRank vale 0 para un medidor sin anomalía.
func severityRank(s Summary) int {
	if s.Severity == nil {
		return 0
	}
	return s.Severity.Rank()
}

func metric(value, base float64) Metric {
	return Metric{
		Value:     stats.Round(value, 2),
		Baseline:  stats.Round(base, 2),
		ChangePct: stats.Round(stats.PctChange(value, base), 2),
	}
}

func hourlyHistory(rs []data.Reading, b baseline.Baseline) []HourlyPoint {
	out := make([]HourlyPoint, 0, len(rs))
	for _, r := range rs {
		out = append(out, HourlyPoint{
			Timestamp:      r.Timestamp,
			ConsumptionKWh: r.ConsumptionKWh,
			ExpectedKWh:    stats.Round(b.Expected(r), 2),
			VoltageV:       r.VoltageV,
			CurrentA:       r.CurrentA,
			PowerFactor:    r.PowerFactor,
		})
	}
	return out
}

// dailyHistory suma el consumo de cada día (las lecturas vienen ordenadas por fecha).
func dailyHistory(rs []data.Reading, b baseline.Baseline) []DailyPoint {
	out := []DailyPoint{}
	for _, r := range rs {
		day := r.Timestamp.Format("2006-01-02")
		if len(out) == 0 || out[len(out)-1].Date != day {
			out = append(out, DailyPoint{Date: day, BaselineKWh: stats.Round(b.DailyKWh, 2)})
		}
		out[len(out)-1].ConsumptionKWh += r.ConsumptionKWh
	}
	for i := range out {
		out[i].ConsumptionKWh = stats.Round(out[i].ConsumptionKWh, 2)
	}
	return out
}
