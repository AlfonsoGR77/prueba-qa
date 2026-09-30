package auth

import (
	"context"
	"net/http"
	"strings"

	"energyai/internal/httpx"
)

// userKey es la llave para guardar el usuario en el context de la petición.
// Un tipo propio evita choques con llaves de otros paquetes.
type userKey struct{}

// Require deja pasar solo peticiones con un "Authorization: Bearer <token>"
// válido. El usuario queda en el context.
func (s *Service) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || raw == "" {
			httpx.WriteError(w, r, http.StatusUnauthorized, "Falta el token de autenticación")
			return
		}
		user, err := s.ParseToken(raw)
		if err != nil {
			httpx.WriteError(w, r, http.StatusUnauthorized, "Token inválido o expirado")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userKey{}, user)))
	})
}

// UserFrom devuelve el usuario que dejó Require en el context.
func UserFrom(ctx context.Context) (User, bool) {
	u, ok := ctx.Value(userKey{}).(User)
	return u, ok
}
