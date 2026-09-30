// Package config lee la configuración de la API desde variables de entorno.
// Todas tienen un valor por defecto para poder correr en local sin configurar nada.
package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// DefaultJWTSecret solo sirve para desarrollo. main avisa si se está usando.
const DefaultJWTSecret = "dev-secret-change-me"

// Config es la configuración de la API.
type Config struct {
	Port         string
	ReadingsPath string
	EventsPath   string
	CORSOrigins  []string
	JWTSecret    string
	JWTTTL       time.Duration
	// Usuario del login básico. No hay base de datos de usuarios: es uno solo,
	// configurado por variables de entorno.
	AuthEmail    string
	AuthPassword string
	AuthName     string
	// OpenAI redacta las explicaciones de Run AI Analysis. Sin API key se usa
	// el texto determinístico del motor.
	OpenAIAPIKey  string
	OpenAIModel   string
	OpenAIBaseURL string
	OpenAITimeout time.Duration
}

// Load lee la configuración. Devuelve error si algún valor tiene un formato inválido.
func Load() (Config, error) {
	dataDir := env("DATA_DIR", "data")

	ttl, err := time.ParseDuration(env("JWT_TTL", "8h"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_TTL inválido: %w", err)
	}
	openAITimeout, err := time.ParseDuration(env("OPENAI_TIMEOUT", "30s"))
	if err != nil {
		return Config{}, fmt.Errorf("OPENAI_TIMEOUT inválido: %w", err)
	}

	return Config{
		Port:          env("PORT", "8080"),
		ReadingsPath:  filepath.Join(dataDir, "readings.csv"),
		EventsPath:    filepath.Join(dataDir, "events.csv"),
		CORSOrigins:   splitList(env("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")),
		JWTSecret:     env("JWT_SECRET", DefaultJWTSecret),
		JWTTTL:        ttl,
		AuthEmail:     env("AUTH_EMAIL", "admin@energia.local"),
		AuthPassword:  env("AUTH_PASSWORD", "admin123"),
		AuthName:      env("AUTH_NAME", "Operador"),
		OpenAIAPIKey:  os.Getenv("OPENAI_API_KEY"),
		OpenAIModel:   env("OPENAI_MODEL", "gpt-4o-mini"),
		OpenAIBaseURL: env("OPENAI_BASE_URL", "https://api.openai.com/v1"),
		OpenAITimeout: openAITimeout,
	}, nil
}

// env devuelve la variable de entorno key, o fallback si no está definida.
func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// splitList convierte "a, b,c" en ["a", "b", "c"].
func splitList(s string) []string {
	out := []string{}
	for _, part := range strings.Split(s, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}
