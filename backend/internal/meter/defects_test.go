//go:build defects

// Tests de QA que evidencian defectos abiertos (ver qa/05-defectos.md).
// Hoy FALLAN a propósito. Van detrás del build tag "defects" para no romper
// `go test ./...`. Correrlos con:  go test -tags defects ./internal/...
// Cuando se corrija el defecto, el test pasa y se puede quitar el tag.
package meter

import (
	"slices"
	"testing"

	"energyai/internal/analysis/model"
	"energyai/internal/httpx"
)

// DEF-03 · Regla de negocio (backend/README.md, tabla "Estado de alerta"):
// "Sin anomalía, o FALSE_POSITIVE → NORMAL". Tabla de decisión completa.
func TestQA_StatusOf_DecisionTable(t *testing.T) {
	tests := []struct {
		name string
		typ  model.AnomalyType
		sev  model.Severity
		want Status
	}{
		{"FALSE_POSITIVE + LOW → NORMAL", model.TypeFalsePositive, model.SeverityLow, StatusNormal},
		{"FALSE_POSITIVE + HIGH → NORMAL (el tipo manda)", model.TypeFalsePositive, model.SeverityHigh, StatusNormal},
		{"REAL + HIGH → CRITICAL", model.TypeReal, model.SeverityHigh, StatusCritical},
		{"REAL + MEDIUM → ALERT", model.TypeReal, model.SeverityMedium, StatusAlert},
		{"REAL + LOW → ALERT", model.TypeReal, model.SeverityLow, StatusAlert},
		{"DATA_QUALITY + HIGH → CRITICAL", model.TypeDataQuality, model.SeverityHigh, StatusCritical},
		{"DATA_QUALITY + MEDIUM → ALERT", model.TypeDataQuality, model.SeverityMedium, StatusAlert},
		{"EXPLAINABLE + MEDIUM → ALERT", model.TypeExplainable, model.SeverityMedium, StatusAlert},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := &model.Anomaly{Type: tt.typ, Severity: tt.sev, Anomaly: tt.typ != model.TypeFalsePositive}
			if got := StatusOf(a); got != tt.want {
				t.Errorf("StatusOf(%s,%s) = %s, esperaba %s", tt.typ, tt.sev, got, tt.want)
			}
		})
	}
}

// DEF-03 con los datos reales: M-106 es FALSE_POSITIVE y debe salir como NORMAL.
func TestQA_M106_IsNormal(t *testing.T) {
	svc := newTestService(t)
	d, ok := svc.GetByID("M-106")
	if !ok {
		t.Fatal("M-106 debería existir")
	}
	if d.Status != StatusNormal {
		t.Errorf("M-106 (FALSE_POSITIVE) tiene estado %s, la regla dice NORMAL", d.Status)
	}
	got := getAll(t, svc, PagedRequest{Pagination: httpx.Pagination{Size: 100}, Filter: Filter{Status: StatusAlert}})
	if !slices.Equal(got, []string{"M-104"}) {
		t.Errorf("filtro ALERT devolvió %v, esperaba [M-104]", got)
	}
}

// DEF-04 · Contrato (backend/README.md y comentario de Filter.MeterID):
// "Búsqueda parcial, sin importar mayúsculas".
func TestQA_SearchIsCaseInsensitive(t *testing.T) {
	svc := newTestService(t)
	big := httpx.Pagination{Size: httpx.MaxPageSize}
	for _, q := range []string{"m-109", "M-109", "m-10"} {
		got := getAll(t, svc, PagedRequest{Pagination: big, Filter: Filter{MeterID: q}})
		if !slices.Contains(got, "M-109") {
			t.Errorf("buscar %q no encontró M-109 (obtuve %v)", q, got)
		}
	}
}

// DEF-05 · Valores límite de pagination.page: un page negativo debe ser un 400
// (error de validación), nunca un panic / 500.
func TestQA_NegativePageIsValidationError(t *testing.T) {
	for _, page := range []int{-1, -100} {
		req := PagedRequest{Pagination: httpx.Pagination{Page: page, Size: 5}}
		if errs := req.Normalize(); len(errs) == 0 {
			t.Errorf("page=%d debería devolver un error de validación", page)
		}
	}
}
