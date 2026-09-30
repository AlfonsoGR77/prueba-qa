// Package auth tiene el login básico: valida email y contraseña, emite un JWT
// y protege las rutas que lo exigen.
package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Errores que el handler traduce a 401.
var (
	ErrInvalidCredentials = errors.New("credenciales inválidas")
	ErrInvalidToken       = errors.New("token inválido o expirado")
)

// issuer va dentro del token para no aceptar tokens de otros sistemas.
const issuer = "energyai-api"

// Credentials es el usuario habilitado para entrar.
type Credentials struct {
	Email    string
	Password string
	Name     string
}

// Service valida credenciales y tokens.
type Service struct {
	user         User
	passwordHash []byte
	secret       []byte
	ttl          time.Duration
}

// claims es lo que va dentro del JWT.
type claims struct {
	Name string `json:"name"`
	jwt.RegisteredClaims
}

// NewService arma el servicio. La contraseña se guarda solo como hash bcrypt:
// en memoria nunca queda el texto plano.
func NewService(c Credentials, secret string, ttl time.Duration) (*Service, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(c.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("generando hash de la contraseña: %w", err)
	}
	return &Service{
		user:         User{Email: strings.ToLower(strings.TrimSpace(c.Email)), Name: c.Name},
		passwordHash: hash,
		secret:       []byte(secret),
		ttl:          ttl,
	}, nil
}

// Login valida las credenciales y devuelve un token.
func (s *Service) Login(email, password string) (TokenResponse, error) {
	// bcrypt se corre aunque el email no coincida, para que la respuesta tarde
	// lo mismo y no delate qué emails existen.
	passwordErr := bcrypt.CompareHashAndPassword(s.passwordHash, []byte(password))
	if email != s.user.Email || passwordErr != nil {
		return TokenResponse{}, ErrInvalidCredentials
	}

	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		Name: s.user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   s.user.Email,
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
		},
	})
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return TokenResponse{}, fmt.Errorf("firmando token: %w", err)
	}

	return TokenResponse{
		AccessToken: signed,
		TokenType:   "Bearer",
		ExpiresIn:   int(s.ttl.Seconds()),
		User:        s.user,
	}, nil
}

// ParseToken valida la firma y la expiración del token y devuelve el usuario.
func (s *Service) ParseToken(raw string) (User, error) {
	var c claims
	_, err := jwt.ParseWithClaims(
		raw,
		&c,
		func(*jwt.Token) (any, error) { return s.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(issuer),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return User{}, ErrInvalidToken
	}
	return User{Email: c.Subject, Name: c.Name}, nil
}
