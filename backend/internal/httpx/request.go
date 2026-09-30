package httpx

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

// maxBodyBytes limita el tamaño del body para que nadie pueda mandar gigas.
const maxBodyBytes = 1 << 20 // 1 MB

// DecodeJSON lee el body como JSON en dst. Un body vacío no es error: dst se
// queda con sus valores por defecto (como un filtro sin filtros).
// Los campos que no existen en dst sí son error, para detectar typos del front.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()

	err := dec.Decode(dst)
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("body inválido: %w", err)
	}
	return nil
}
