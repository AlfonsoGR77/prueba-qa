package dashboard

import (
	"net/http"

	"energyai/internal/httpx"
)

// Handler expone el endpoint del dashboard.
type Handler struct {
	svc *Service
}

// NewHandler arma el handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetSummary godoc
//
//	@Summary		Resumen del dashboard
//	@Description	Medidores por estado, anomalías por tipo, consumo total vs. baseline y la lista de prioridades.
//	@Tags			Dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	Summary
//	@Failure		401	{object}	httpx.APIError
//	@Router			/dashboard/getSummary [get]
func (h *Handler) GetSummary(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, h.svc.Summary())
}
