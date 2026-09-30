// Package httpx tiene lo que comparten todos los módulos de la API:
// respuestas, errores, paginación, opciones de desplegables y middlewares.
package httpx

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

// APIError es el cuerpo de todas las respuestas de error.
type APIError struct {
	StatusCode int      `json:"status_code" example:"404"`
	Message    string   `json:"message" example:"Recurso no encontrado"`
	Errors     []string `json:"errors,omitempty"` // detalle de validación, uno por campo
	Timestamp  string   `json:"timestamp" example:"2026-09-24T15:00:00Z"`
	Path       string   `json:"path" example:"/api/v1/meter/getById/M-999"`
} //	@name	APIError

// WriteJSON responde con status y v convertido a JSON.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		// Los headers ya se enviaron: solo queda dejarlo en el log.
		slog.Error("escribiendo respuesta JSON", "error", err)
	}
}

// WriteError responde con un APIError.
func WriteError(w http.ResponseWriter, r *http.Request, status int, message string, errs ...string) {
	WriteJSON(w, status, APIError{
		StatusCode: status,
		Message:    message,
		Errors:     errs,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		Path:       r.URL.Path,
	})
}

// NotFound responde 404 a cualquier ruta que no exista.
func NotFound(w http.ResponseWriter, r *http.Request) {
	WriteError(w, r, http.StatusNotFound, "Ruta no encontrada")
}
