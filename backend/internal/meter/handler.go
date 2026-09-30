package meter

import (
	"net/http"

	"energyai/internal/httpx"
)

// Handler expone los endpoints de medidores.
type Handler struct {
	svc *Service
}

// NewHandler arma el handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetParams godoc
//
//	@Summary		Opciones de los filtros
//	@Description	Opciones de los desplegables: medidores, estados de alerta, campos y dirección de ordenamiento.
//	@Tags			Meters
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	ParamsResponse
//	@Failure		401	{object}	httpx.APIError
//	@Router			/meter/getParams [get]
func (h *Handler) GetParams(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, h.svc.Params())
}

// GetAll godoc
//
//	@Summary		Lista de medidores, filtrada, ordenada y paginada
//	@Description	Filtros opcionales: `meter_id` (parcial), `status` (NORMAL, ALERT, CRITICAL).
//	@Description	Orden: `sort_by` (meter_id, consumption, variation, severity) y `sort_order` (ASC, DESC).
//	@Description	Sin body devuelve la página 1 de 10, ordenada por medidor.
//	@Tags			Meters
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		PagedRequest	false	"Paginación y filtros"
//	@Success		200		{object}	httpx.PaginatedResult[meter.Summary]
//	@Failure		400		{object}	httpx.APIError
//	@Failure		401		{object}	httpx.APIError
//	@Router			/meter/getAll [post]
func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	var req PagedRequest
	if err := httpx.DecodeJSON(w, r, &req); err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, err.Error())
		return
	}
	if errs := req.Normalize(); len(errs) > 0 {
		httpx.WriteError(w, r, http.StatusBadRequest, "Filtros inválidos", errs...)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, h.svc.GetAll(req))
}

// GetByID godoc
//
//	@Summary		Detalle de un medidor
//	@Description	Consumo actual (últimas 24 h), baseline, variación, estado, voltaje, corriente,
//	@Description	factor de potencia, histórico horario y diario, anomalía y eventos.
//	@Tags			Meters
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"ID del medidor"	example(M-109)
//	@Success		200	{object}	Detail
//	@Failure		401	{object}	httpx.APIError
//	@Failure		404	{object}	httpx.APIError
//	@Router			/meter/getById/{id} [get]
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	detail, ok := h.svc.GetByID(r.PathValue("id"))
	if !ok {
		httpx.WriteError(w, r, http.StatusNotFound, "Medidor no encontrado")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, detail)
}
