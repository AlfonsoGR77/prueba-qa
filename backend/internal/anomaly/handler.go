package anomaly

import (
	"net/http"

	"energyai/internal/analysis/model"
	"energyai/internal/httpx"
)

// lister es lo que el handler necesita del servicio. Declararlo aquí (y no
// usar *Service directo) permite probar el handler con un servicio falso.
type lister interface {
	GetAll() []model.Anomaly
}

// Handler expone los endpoints de anomalías.
type Handler struct {
	svc lister
}

// NewHandler arma el handler.
func NewHandler(svc lister) *Handler {
	return &Handler{svc: svc}
}

// GetAll godoc
//
//	@Summary		Anomalías detectadas
//	@Description	Todas las anomalías, ordenadas por prioridad (1 = revisar primero), con explicación,
//	@Description	acción recomendada y evidencia. Los falsos positivos vienen con `anomaly: false`.
//	@Tags			Anomalies
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{array}		model.Anomaly
//	@Failure		401	{object}	httpx.APIError
//	@Router			/anomaly/getAll [get]
func (h *Handler) GetAll(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, h.svc.GetAll())
}
