package ai

import (
	"net/http"

	"energyai/internal/httpx"
)

// Handler expone el análisis de IA.
type Handler struct {
	svc *Service
}

// NewHandler arma el handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Analyze godoc
//
//	@Summary		Run AI Analysis
//	@Description	Lanza el análisis en segundo plano y responde 202 con el análisis en curso.
//	@Description	Pasos: Lecturas → Baseline → Detección → Correlación → Eventos → Explicación → Recomendación.
//	@Description	Consulta el avance con GET /ai/analysis/{id}. Si ya hay uno corriendo, devuelve ese (200).
//	@Tags			AI
//	@Produce		json
//	@Security		BearerAuth
//	@Success		202	{object}	Run	"Análisis iniciado"
//	@Success		200	{object}	Run	"Ya había un análisis en curso"
//	@Failure		401	{object}	httpx.APIError
//	@Router			/ai/analyze [post]
func (h *Handler) Analyze(w http.ResponseWriter, _ *http.Request) {
	run, started := h.svc.Start()
	status := http.StatusAccepted
	if !started {
		status = http.StatusOK
	}
	httpx.WriteJSON(w, status, run)
}

// GetByID godoc
//
//	@Summary		Estado de un análisis
//	@Description	Pasos con su estado (PENDING, RUNNING, DONE, FAILED) y, al terminar, el resumen.
//	@Tags			AI
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"ID del análisis"	example(AN-0002)
//	@Success		200	{object}	Run
//	@Failure		401	{object}	httpx.APIError
//	@Failure		404	{object}	httpx.APIError
//	@Router			/ai/analysis/{id} [get]
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	run, ok := h.svc.Get(r.PathValue("id"))
	if !ok {
		httpx.WriteError(w, r, http.StatusNotFound, "Análisis no encontrado")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, run)
}

// GetLatest godoc
//
//	@Summary		Último análisis
//	@Description	El análisis más reciente, terminado o en curso.
//	@Tags			AI
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	Run
//	@Failure		401	{object}	httpx.APIError
//	@Router			/ai/analysis/latest [get]
func (h *Handler) GetLatest(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, h.svc.Latest())
}
