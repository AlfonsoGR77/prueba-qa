package httpx

import (
	"fmt"
	"strings"
)

// Valores por defecto de la paginación.
const (
	DefaultPage     = 1
	DefaultPageSize = 10
	MaxPageSize     = 100
)

// Pagination es la parte { page, size } del body de una consulta paginada.
// 0 significa "no enviado" y se reemplaza por el valor por defecto.
type Pagination struct {
	Page int `json:"page" example:"1" minimum:"1"`
	Size int `json:"size" example:"10" minimum:"1" maximum:"100"`
} //	@name	Pagination

// Normalize pone los valores por defecto y devuelve los errores de validación.
func (p *Pagination) Normalize() []string {
	if p.Page == 0 {
		p.Page = DefaultPage
	}
	if p.Size == 0 {
		p.Size = DefaultPageSize
	}

	errs := []string{}
	if p.Size < 1 || p.Size > MaxPageSize {
		errs = append(errs, fmt.Sprintf("pagination.size debe estar entre 1 y %d", MaxPageSize))
	}
	return errs
}

// PaginatedResult es la respuesta de una consulta paginada.
type PaginatedResult[T any] struct {
	Page  int `json:"page" example:"1"`
	Size  int `json:"size" example:"10"`
	Count int `json:"count" example:"12"` // total de resultados, sin paginar
	Rows  []T `json:"rows"`
} //	@name	PaginatedResult

// Paginate corta items según la paginación (que ya debe venir normalizada).
func Paginate[T any](items []T, p Pagination) PaginatedResult[T] {
	start := min((p.Page-1)*p.Size, len(items))
	end := min(start+p.Size, len(items))
	return PaginatedResult[T]{
		Page:  p.Page,
		Size:  p.Size,
		Count: len(items),
		Rows:  append([]T{}, items[start:end]...), // [] en vez de null si la página está vacía
	}
}

// SortOrder es la dirección del ordenamiento.
type SortOrder string //	@name	SortOrder

// Direcciones de ordenamiento.
const (
	Asc  SortOrder = "ASC"
	Desc SortOrder = "DESC"
)

// SortOrderOptions son las opciones del desplegable de orden.
func SortOrderOptions() []Option {
	return []Option{
		{ID: string(Asc), Value: "Menor a mayor"},
		{ID: string(Desc), Value: "Mayor a menor"},
	}
}

// ParseSortOrder acepta "asc"/"ASC"/"desc"/"DESC". Vacío es ASC.
func ParseSortOrder(s string) (SortOrder, bool) {
	switch SortOrder(strings.ToUpper(strings.TrimSpace(s))) {
	case "", Asc:
		return Asc, true
	case Desc:
		return Desc, true
	default:
		return "", false
	}
}
