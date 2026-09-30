package meter

import (
	"slices"
	"testing"

	"energyai/internal/analysis/model"
	"energyai/internal/httpx"
	"energyai/internal/store"
	"energyai/internal/testutil"
)

func newTestService(t *testing.T) *Service {
	t.Helper()
	return NewService(store.New(testutil.LoadData(t)))
}

// getAll normaliza el request (como hace el handler) y devuelve los IDs del resultado.
func getAll(t *testing.T, svc *Service, req PagedRequest) []string {
	t.Helper()
	if errs := req.Normalize(); len(errs) > 0 {
		t.Fatalf("request inválido: %v", errs)
	}
	ids := []string{}
	for _, row := range svc.GetAll(req).Rows {
		ids = append(ids, row.MeterID)
	}
	return ids
}

func TestStatusOf(t *testing.T) {
	tests := []struct {
		name    string
		anomaly *model.Anomaly
		want    Status
	}{
		{"sin anomalía", nil, StatusNormal},
		{"severidad alta", &model.Anomaly{Anomaly: true, Severity: model.SeverityHigh}, StatusCritical},
		{"severidad media", &model.Anomaly{Anomaly: true, Severity: model.SeverityMedium}, StatusAlert},
		{"severidad baja", &model.Anomaly{Anomaly: true, Severity: model.SeverityLow}, StatusAlert},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := StatusOf(tt.anomaly); got != tt.want {
				t.Errorf("StatusOf = %s, esperaba %s", got, tt.want)
			}
		})
	}
}

func TestGetAllFilters(t *testing.T) {
	svc := newTestService(t)
	big := httpx.Pagination{Size: httpx.MaxPageSize}

	tests := []struct {
		name   string
		filter Filter
		want   []string
	}{
		{"estado crítico", Filter{Status: StatusCritical}, []string{"M-109", "M-112"}},
		{"estado en minúscula", Filter{Status: "critical"}, []string{"M-109", "M-112"}},
		{"búsqueda parcial por medidor", Filter{MeterID: "109"}, []string{"M-109"}},
		{"búsqueda por prefijo", Filter{MeterID: "M-11"}, []string{"M-110", "M-111", "M-112"}},
		{"crítico y medidor que no es crítico", Filter{Status: StatusCritical, MeterID: "M-104"}, []string{}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getAll(t, svc, PagedRequest{Pagination: big, Filter: tt.filter})
			if !slices.Equal(got, tt.want) {
				t.Errorf("obtuve %v, esperaba %v", got, tt.want)
			}
		})
	}
}

func TestGetAllSorting(t *testing.T) {
	svc := newTestService(t)
	top := httpx.Pagination{Size: 4}

	tests := []struct {
		name   string
		filter Filter
		want   []string
	}{
		{"por defecto, por medidor", Filter{}, []string{"M-101", "M-102", "M-103", "M-104"}},
		{"consumo de mayor a menor", Filter{SortBy: SortByConsumption, SortOrder: httpx.Desc}, []string{"M-109", "M-104", "M-106", "M-108"}},
		{"consumo de menor a mayor", Filter{SortBy: SortByConsumption, SortOrder: "asc"}, []string{"M-107", "M-103", "M-112", "M-110"}},
		{"variación de mayor a menor", Filter{SortBy: SortByVariation, SortOrder: httpx.Desc}, []string{"M-109", "M-104", "M-103", "M-106"}},
		{"severidad de mayor a menor", Filter{SortBy: SortBySeverity, SortOrder: httpx.Desc}, []string{"M-109", "M-112", "M-104", "M-106"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getAll(t, svc, PagedRequest{Pagination: top, Filter: tt.filter})
			if !slices.Equal(got, tt.want) {
				t.Errorf("obtuve %v, esperaba %v", got, tt.want)
			}
		})
	}
}

func TestGetAllPagination(t *testing.T) {
	svc := newTestService(t)

	req := PagedRequest{Pagination: httpx.Pagination{Page: 3, Size: 5}}
	req.Normalize()
	res := svc.GetAll(req)
	if res.Count != 12 || len(res.Rows) != 2 {
		t.Errorf("página 3 de 5: esperaba count 12 y 2 filas, obtuve count %d y %d filas", res.Count, len(res.Rows))
	}

	req.Pagination.Page = 10
	if rows := svc.GetAll(req).Rows; rows == nil || len(rows) != 0 {
		t.Errorf("una página fuera de rango debe devolver [] (no null), obtuve %v", rows)
	}
}

func TestNormalizeRejectsInvalid(t *testing.T) {
	req := PagedRequest{
		Pagination: httpx.Pagination{Size: 500},
		Filter:     Filter{Status: "ROJO", SortBy: "precio", SortOrder: "arriba"},
	}
	if errs := req.Normalize(); len(errs) != 4 {
		t.Errorf("esperaba 4 errores, obtuve %d: %v", len(errs), errs)
	}
}

func TestGetByID(t *testing.T) {
	svc := newTestService(t)

	d, ok := svc.GetByID("m-109")
	if !ok {
		t.Fatal("M-109 debería existir (el ID no distingue mayúsculas)")
	}
	if d.Status != StatusCritical || d.Anomaly == nil || d.Anomaly.Type != model.TypeReal {
		t.Errorf("M-109 debería ser crítico con anomalía real: %+v", d.Summary)
	}
	// Ejemplo del enunciado: ~2.200 kWh contra un baseline de ~1.050 kWh, más del doble.
	if d.VariationPct < 100 {
		t.Errorf("M-109: variación %.1f%%, esperaba más de +100%%", d.VariationPct)
	}
	if len(d.HourlyHistory) != 336 || len(d.DailyHistory) != 14 {
		t.Errorf("esperaba 336 horas y 14 días, obtuve %d y %d", len(d.HourlyHistory), len(d.DailyHistory))
	}
	if d.Electrical.CurrentA.ChangePct < 50 {
		t.Errorf("la corriente de M-109 debería estar muy por encima de lo normal: %+v", d.Electrical.CurrentA)
	}

	if _, ok := svc.GetByID("M-999"); ok {
		t.Error("M-999 no debería existir")
	}
}
