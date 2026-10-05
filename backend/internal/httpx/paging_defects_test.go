//go:build defects

package httpx

import "testing"

// DEF-05 · Paginate con page negativo hace panic (slice bounds out of range).
// Debe devolver una página vacía o Normalize debe rechazarlo antes.
func TestQA_PaginateNegativePageDoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("Paginate con page=-1 hizo panic: %v", r)
		}
	}()
	p := Pagination{Page: -1, Size: 5}
	p.Normalize()
	_ = Paginate([]int{1, 2, 3}, p)
}
