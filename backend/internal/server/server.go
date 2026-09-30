// Package server arma las rutas de la API: crea los servicios, los handlers y decide qué rutas exigen login.
package server

import (
	"net/http"

	"energyai/internal/ai"
	"energyai/internal/anomaly"
	"energyai/internal/auth"
	"energyai/internal/config"
	"energyai/internal/dashboard"
	"energyai/internal/httpx"
	"energyai/internal/meter"
	"energyai/internal/store"
)

// apiPrefix va delante de todas las rutas de la API.
const apiPrefix = "/api/v1"

// NewHandler devuelve el handler HTTP con todas las rutas y middlewares.
func NewHandler(cfg config.Config, st *store.Store) (http.Handler, error) {
	authSvc, err := auth.NewService(
		auth.Credentials{Email: cfg.AuthEmail, Password: cfg.AuthPassword, Name: cfg.AuthName},
		cfg.JWTSecret,
		cfg.JWTTTL,
	)
	if err != nil {
		return nil, err
	}
	meterSvc := meter.NewService(st)
	aiSvc := ai.NewService(st, newNarrator(cfg))

	authH := auth.NewHandler(authSvc)
	meterH := meter.NewHandler(meterSvc)
	anomalyH := anomaly.NewHandler(anomaly.NewService(st))
	dashboardH := dashboard.NewHandler(dashboard.NewService(st, meterSvc, aiSvc))
	aiH := ai.NewHandler(aiSvc)

	// protected exige un JWT válido.
	protected := func(h http.HandlerFunc) http.Handler { return authSvc.Require(h) }

	mux := http.NewServeMux()

	// Públicas
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /docs", serveDocsPage)
	mux.HandleFunc("GET /docs/openapi.json", serveOpenAPI)
	mux.HandleFunc("GET /swagger/", redirectToDocs)
	mux.HandleFunc("POST "+apiPrefix+"/auth/login", authH.Login)

	// Protegidas
	mux.Handle("GET "+apiPrefix+"/auth/me", protected(authH.Me))

	mux.Handle("GET "+apiPrefix+"/meter/getParams", protected(meterH.GetParams))
	mux.Handle("POST "+apiPrefix+"/meter/getAll", protected(meterH.GetAll))
	mux.Handle("GET "+apiPrefix+"/meter/getById/{id}", protected(meterH.GetByID))

	mux.Handle("GET "+apiPrefix+"/anomaly/getAll", protected(anomalyH.GetAll))

	mux.Handle("GET "+apiPrefix+"/dashboard/getSummary", protected(dashboardH.GetSummary))

	mux.Handle("POST "+apiPrefix+"/ai/analyze", protected(aiH.Analyze))
	mux.Handle("GET "+apiPrefix+"/ai/analysis/latest", protected(aiH.GetLatest))
	mux.Handle("GET "+apiPrefix+"/ai/analysis/{id}", protected(aiH.GetByID))

	// Cualquier otra ruta: 404 en JSON (el mux por defecto responde texto plano).
	mux.HandleFunc("/", httpx.NotFound)

	return httpx.Chain(mux, httpx.Recover, httpx.Logger, httpx.CORS(cfg.CORSOrigins)), nil
}

// newNarrator usa OpenAI si hay API key; si no, nil (el texto del motor).
func newNarrator(cfg config.Config) ai.Narrator {
	if cfg.OpenAIAPIKey == "" {
		return nil
	}
	return ai.NewOpenAINarrator(ai.OpenAIConfig{
		APIKey:  cfg.OpenAIAPIKey,
		Model:   cfg.OpenAIModel,
		BaseURL: cfg.OpenAIBaseURL,
		Timeout: cfg.OpenAITimeout,
	})
}
