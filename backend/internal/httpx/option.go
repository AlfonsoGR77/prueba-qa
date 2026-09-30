package httpx

// Option es un ítem de un desplegable del front: { id, value }.
// id es lo que el front manda de vuelta en el filtro; value es el texto que ve el usuario.
type Option struct {
	ID    string `json:"id" example:"CRITICAL"`
	Value string `json:"value" example:"Crítica"`
} //	@name	Option
