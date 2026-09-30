package meter

import (
	"fmt"
	"strings"
	"time"

	"energyai/internal/analysis/model"
	"energyai/internal/data"
	"energyai/internal/httpx"
)

// maxMeterIDLength limita la búsqueda por meter_id.
const maxMeterIDLength = 50

// ParamsResponse son las opciones de los desplegables del filtro.
type ParamsResponse struct {
	Meters     []httpx.Option `json:"meters"`      // un ítem por medidor: { id: "M-109", value: "M-109" }
	Statuses   []httpx.Option `json:"statuses"`    // NORMAL, ALERT, CRITICAL
	SortFields []httpx.Option `json:"sort_fields"` // meter_id, consumption, variation, severity
	SortOrders []httpx.Option `json:"sort_orders"` // ASC, DESC
} //	@name	ParamsResponse

// Filter son los filtros de la lista de medidores. Todos son opcionales.
type Filter struct {
	// Coincidencia parcial y sin importar mayúsculas: "109" encuentra M-109.
	MeterID   string          `json:"meter_id,omitempty" example:"M-109"`
	Status    Status          `json:"status,omitempty" enums:"NORMAL,ALERT,CRITICAL"`
	SortBy    SortField       `json:"sort_by,omitempty" enums:"meter_id,consumption,variation,severity" default:"meter_id"`
	SortOrder httpx.SortOrder `json:"sort_order,omitempty" enums:"ASC,DESC" default:"ASC"`
} //	@name	Filter

// PagedRequest es el body de POST /meter/getAll: { pagination, filter }.
type PagedRequest struct {
	Pagination httpx.Pagination `json:"pagination"`
	Filter     Filter           `json:"filter"`
} //	@name	PagedRequest

// Normalize pone los valores por defecto y devuelve los errores de validación.
func (r *PagedRequest) Normalize() []string {
	errs := r.Pagination.Normalize()
	f := &r.Filter

	f.MeterID = strings.TrimSpace(f.MeterID)
	if len(f.MeterID) > maxMeterIDLength {
		errs = append(errs, fmt.Sprintf("filter.meter_id no puede superar %d caracteres", maxMeterIDLength))
	}

	f.Status = Status(strings.ToUpper(string(f.Status)))
	if f.Status != "" && !isOption(statuses, string(f.Status)) {
		errs = append(errs, "filter.status debe ser NORMAL, ALERT o CRITICAL")
	}

	f.SortBy = SortField(strings.ToLower(string(f.SortBy)))
	if f.SortBy == "" {
		f.SortBy = SortByMeterID
	}
	if !isOption(sortFields, string(f.SortBy)) {
		errs = append(errs, "filter.sort_by debe ser meter_id, consumption, variation o severity")
	}

	order, ok := httpx.ParseSortOrder(string(f.SortOrder))
	if !ok {
		errs = append(errs, "filter.sort_order debe ser ASC o DESC")
	}
	f.SortOrder = order

	return errs
}

// Summary es una fila de la lista de medidores (una tarjeta del dashboard).
type Summary struct {
	MeterID        string             `json:"meter_id" example:"M-109"`
	Status         Status             `json:"status" enums:"NORMAL,ALERT,CRITICAL"`
	Severity       *model.Severity    `json:"severity" enums:"HIGH,MEDIUM,LOW"` // null si no hay anomalía
	AnomalyType    *model.AnomalyType `json:"anomaly_type" enums:"REAL_ANOMALY,EXPLAINABLE_ANOMALY,FALSE_POSITIVE,DATA_QUALITY"`
	Priority       *int               `json:"priority" example:"1"`             // 1 = revisar primero; null si no hay anomalía
	ConsumptionKWh float64            `json:"consumption_kwh" example:"2207.6"` // consumo de las últimas 24 h
	BaselineKWh    float64            `json:"baseline_kwh" example:"1052.15"`   // consumo diario normal
	VariationPct   float64            `json:"variation_pct" example:"109.82"`   // consumo vs. baseline
	LastReadingAt  time.Time          `json:"last_reading_at"`
} //	@name	MeterSummary

// Metric compara el último valor de una variable contra su valor normal.
type Metric struct {
	Value     float64 `json:"value" example:"218.4"`    // última lectura
	Baseline  float64 `json:"baseline" example:"219.7"` // mediana de la semana de referencia
	ChangePct float64 `json:"change_pct" example:"-0.59"`
} //	@name	Metric

// Electrical son las variables eléctricas del medidor.
type Electrical struct {
	VoltageV    Metric `json:"voltage_v"`
	CurrentA    Metric `json:"current_a"`
	PowerFactor Metric `json:"power_factor"`
} //	@name	Electrical

// HourlyPoint es una lectura del histórico, con el consumo esperado a esa hora.
type HourlyPoint struct {
	Timestamp      time.Time `json:"timestamp"`
	ConsumptionKWh float64   `json:"consumption_kwh" example:"110.35"`
	ExpectedKWh    float64   `json:"expected_kwh" example:"51.66"` // baseline de esa hora del día
	VoltageV       float64   `json:"voltage_v" example:"218.4"`
	CurrentA       float64   `json:"current_a" example:"411.1"`
	PowerFactor    float64   `json:"power_factor" example:"0.74"`
} //	@name	HourlyPoint

// DailyPoint es el consumo total de un día contra el baseline diario.
type DailyPoint struct {
	Date           string  `json:"date" example:"2026-09-12"`
	ConsumptionKWh float64 `json:"consumption_kwh" example:"1650.2"`
	BaselineKWh    float64 `json:"baseline_kwh" example:"1052.15"`
} //	@name	DailyPoint

// Detail es el detalle de un medidor (la pantalla al hacer clic en uno).
type Detail struct {
	Summary
	Electrical    Electrical     `json:"electrical"`
	HourlyHistory []HourlyPoint  `json:"hourly_history"`
	DailyHistory  []DailyPoint   `json:"daily_history"`
	Anomaly       *model.Anomaly `json:"anomaly"` // explicación, acción y evidencia; null si no hay anomalía
	Events        []data.Event   `json:"events"`  // eventos operativos registrados para el medidor
} //	@name	Detail
