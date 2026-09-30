package auth

import "strings"

// LoginRequest es el body de POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email" example:"admin@energia.local"`
	Password string `json:"password" example:"admin123"`
} //	@name	LoginRequest

// Validate normaliza el email y devuelve los errores de validación.
func (r *LoginRequest) Validate() []string {
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
	errs := []string{}
	if r.Email == "" {
		errs = append(errs, "email es obligatorio")
	}
	if r.Password == "" {
		errs = append(errs, "password es obligatorio")
	}
	return errs
}

// User es el usuario autenticado, sin datos sensibles.
type User struct {
	Email string `json:"email" example:"admin@energia.local"`
	Name  string `json:"name" example:"Operador"`
} //	@name	User

// TokenResponse es la respuesta de un login exitoso.
type TokenResponse struct {
	AccessToken string `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	TokenType   string `json:"token_type" example:"Bearer"`
	ExpiresIn   int    `json:"expires_in" example:"28800"` // segundos
	User        User   `json:"user"`
} //	@name	TokenResponse
