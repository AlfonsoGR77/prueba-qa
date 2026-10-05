package httpx

import "testing"

// Tests de QA (siempre verdes): valores límite de la paginación.
func TestQA_PaginationBoundaries(t *testing.T) {
	items := make([]int, 12)
	tests := []struct {
		name      string
		page, sz  int
		wantRows  int
		wantPage  int
		wantSize  int
		wantError bool
	}{
		{"defaults (0,0) → página 1 de 10", 0, 0, 10, 1, 10, false},
		{"size mínimo 1", 1, 1, 1, 1, 1, false},
		{"size máximo 100", 1, 100, 12, 1, 100, false},
		{"size 101 fuera de rango", 1, 101, 0, 0, 0, true},
		{"size -1 fuera de rango", 1, -1, 0, 0, 0, true},
		{"última página parcial (2 de 10)", 2, 10, 2, 2, 10, false},
		{"página justo después del final", 3, 5, 2, 3, 5, false},
		{"página fuera de rango → []", 4, 5, 0, 4, 5, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := Pagination{Page: tt.page, Size: tt.sz}
			errs := p.Normalize()
			if tt.wantError {
				if len(errs) == 0 {
					t.Fatalf("esperaba error de validación")
				}
				return
			}
			if len(errs) > 0 {
				t.Fatalf("errores inesperados: %v", errs)
			}
			res := Paginate(items, p)
			if len(res.Rows) != tt.wantRows || res.Page != tt.wantPage || res.Size != tt.wantSize || res.Count != 12 {
				t.Errorf("obtuve page=%d size=%d rows=%d count=%d", res.Page, res.Size, len(res.Rows), res.Count)
			}
			if res.Rows == nil {
				t.Error("Rows debe ser [] y no nil")
			}
		})
	}
}
