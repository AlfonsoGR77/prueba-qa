package auth

import (
	"errors"
	"log/slog"
	"net/http"

	"energyai/internal/httpx"
)

// Handler expone los endpoints de autenticación.
type Handler struct {
	svc *Service
}

// NewHandler arma el handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Login godoc
//
//	@Summary		Iniciar sesión
//	@Description	Valida email y contraseña y devuelve un JWT. Úsalo en el header `Authorization: Bearer <token>`.
//	@Tags			Auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		LoginRequest	true	"Credenciales"
//	@Success		200		{object}	TokenResponse
//	@Failure		400		{object}	httpx.APIError
//	@Failure		401		{object}	httpx.APIError
//	@Router			/auth/login [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := httpx.DecodeJSON(w, r, &req); err != nil {
		httpx.WriteError(w, r, http.StatusBadRequest, err.Error())
		return
	}
	if errs := req.Validate(); len(errs) > 0 {
		httpx.WriteError(w, r, http.StatusBadRequest, "Datos inválidos", errs...)
		return
	}

	res, err := h.svc.Login(req.Email, req.Password)
	if errors.Is(err, ErrInvalidCredentials) {
		httpx.WriteError(w, r, http.StatusUnauthorized, "Email o contraseña incorrectos")
		return
	}
	if err != nil {
		slog.Error("login", "error", err)
		httpx.WriteError(w, r, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, res)
}

// Me godoc
//
//	@Summary	Usuario autenticado
//	@Description	Devuelve el usuario del token. Sirve al front para validar la sesión al recargar.
//	@Tags		Auth
//	@Produce	json
//	@Security	BearerAuth
//	@Success	200	{object}	User
//	@Failure	401	{object}	httpx.APIError
//	@Router		/auth/me [get]
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := UserFrom(r.Context())
	if !ok {
		httpx.WriteError(w, r, http.StatusUnauthorized, "Falta el token de autenticación")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, user)
}
