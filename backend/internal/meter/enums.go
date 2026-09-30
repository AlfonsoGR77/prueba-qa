package meter

import (
	"energyai/internal/analysis/model"
	"energyai/internal/httpx"
)

// Status es el estado de alerta de un medidor que ve el operador.
type Status string //	@name	Status

// Estados de alerta.
const (
	StatusNormal   Status = "NORMAL"
	StatusAlert    Status = "ALERT"
	StatusCritical Status = "CRITICAL"
)

// statuses define el orden y el texto de cada estado en el desplegable.
var statuses = []httpx.Option{
	{ID: string(StatusNormal), Value: "Normal"},
	{ID: string(StatusAlert), Value: "Alerta"},
	{ID: string(StatusCritical), Value: "Crítica"},
}

// StatusOf traduce el resultado del motor a un estado de alerta:
//   - sin anomalía, o falso positivo (el motor dice "no escalar"): NORMAL
//   - severidad HIGH: CRITICAL
//   - cualquier otra anomalía: ALERT
func StatusOf(a *model.Anomaly) Status {
	switch {
	case a == nil:
		return StatusNormal
	case a.Severity == model.SeverityHigh:
		return StatusCritical
	default:
		return StatusAlert
	}
}

// SortField es el campo por el que se ordena la lista de medidores.
type SortField string //	@name	SortField

// Campos de ordenamiento.
const (
	SortByMeterID     SortField = "meter_id"
	SortByConsumption SortField = "consumption"
	SortByVariation   SortField = "variation"
	SortBySeverity    SortField = "severity"
)

// sortFields define el orden y el texto de cada campo en el desplegable.
var sortFields = []httpx.Option{
	{ID: string(SortByMeterID), Value: "Medidor"},
	{ID: string(SortByConsumption), Value: "Consumo"},
	{ID: string(SortByVariation), Value: "Variación"},
	{ID: string(SortBySeverity), Value: "Severidad"},
}

// isOption dice si id es una de las opciones.
func isOption(options []httpx.Option, id string) bool {
	for _, o := range options {
		if o.ID == id {
			return true
		}
	}
	return false
}
