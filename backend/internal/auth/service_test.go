package auth

import (
	"errors"
	"testing"
	"time"
)

var testCredentials = Credentials{Email: "admin@energia.local", Password: "secreta", Name: "Operador"}

func newTestService(t *testing.T, secret string, ttl time.Duration) *Service {
	t.Helper()
	svc, err := NewService(testCredentials, secret, ttl)
	if err != nil {
		t.Fatal(err)
	}
	return svc
}

func TestLoginAndParseToken(t *testing.T) {
	svc := newTestService(t, "s1", time.Hour)

	res, err := svc.Login("admin@energia.local", "secreta")
	if err != nil {
		t.Fatal(err)
	}
	user, err := svc.ParseToken(res.AccessToken)
	if err != nil {
		t.Fatalf("el token recién emitido debería ser válido: %v", err)
	}
	if user.Email != testCredentials.Email || user.Name != testCredentials.Name {
		t.Errorf("usuario inesperado: %+v", user)
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	svc := newTestService(t, "s1", time.Hour)

	tests := []struct{ name, email, password string }{
		{"contraseña incorrecta", "admin@energia.local", "otra"},
		{"email desconocido", "otro@energia.local", "secreta"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := svc.Login(tt.email, tt.password); !errors.Is(err, ErrInvalidCredentials) {
				t.Errorf("esperaba ErrInvalidCredentials, obtuve %v", err)
			}
		})
	}
}

func TestParseTokenRejectsInvalid(t *testing.T) {
	svc := newTestService(t, "s1", time.Hour)

	other := newTestService(t, "otro-secreto", time.Hour)
	foreign, err := other.Login("admin@energia.local", "secreta")
	if err != nil {
		t.Fatal(err)
	}
	expiredSvc := newTestService(t, "s1", -time.Minute)
	expired, err := expiredSvc.Login("admin@energia.local", "secreta")
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct{ name, token string }{
		{"firmado con otro secreto", foreign.AccessToken},
		{"expirado", expired.AccessToken},
		{"basura", "no-es-un-jwt"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := svc.ParseToken(tt.token); !errors.Is(err, ErrInvalidToken) {
				t.Errorf("esperaba ErrInvalidToken, obtuve %v", err)
			}
		})
	}
}
