// Servidor HTTP de la API. Uso, desde la carpeta backend:
//
//	go run ./cmd/api
//
// Swagger queda en http://localhost:8080/docs
//
// La configuración sale de variables de entorno (ver internal/config).
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "energyai/docs" // documentación generada por swag (registra el spec de Swagger)
	"energyai/internal/config"
	"energyai/internal/server"
	"energyai/internal/store"
)

//	@title							EnergIA API
//	@version						1.0
//	@description					API para monitorear medidores eléctricos y priorizar sus anomalías.
//	@description					Primero haz login en POST /auth/login, copia el `access_token` y pégalo en **Authorize**.
//	@BasePath						/api/v1
//	@securitydefinitions.bearerauth	BearerAuth
//	@bearerformat					JWT
//	@description					Pega solo el token (sin "Bearer").

func main() {
	if err := run(); err != nil {
		slog.Error("el servidor se detuvo con error", "error", err)
		os.Exit(1)
	}
}

func run() error {
	// El .env vive en la raíz del proyecto (compartido con el front) y se corre
	// desde backend/, por eso "../.env". Es opcional; las variables de entorno
	// reales tienen prioridad (en Docker llegan desde docker-compose.yml).
	if err := config.LoadDotEnv("../.env"); err != nil {
		return err
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if cfg.JWTSecret == config.DefaultJWTSecret {
		slog.Warn("usando el JWT_SECRET de desarrollo: defínelo en producción")
	}
	if cfg.OpenAIAPIKey == "" {
		slog.Info("sin OPENAI_API_KEY: las explicaciones las redacta el motor")
	}

	// Los CSV se leen y se analizan una sola vez, al arrancar.
	st, err := store.Load(cfg.ReadingsPath, cfg.EventsPath)
	if err != nil {
		return err
	}

	handler, err := server.NewHandler(cfg, st)
	if err != nil {
		return err
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Ctrl+C (o la señal de Docker) cierra el servidor esperando a que
	// terminen las peticiones en curso.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		slog.Info("API escuchando",
			"url", "http://localhost:"+cfg.Port,
			"docs", "http://localhost:"+cfg.Port+"/docs",
		)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	case <-ctx.Done():
		slog.Info("cerrando el servidor")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	}
}
