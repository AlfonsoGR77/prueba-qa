// Package data tiene las entidades del dominio (lecturas y eventos) y la
// carga de los CSV. No hay base de datos: los CSV se leen una sola vez al
// arrancar y viven en memoria.
package data

import "time"

// EventType es el tipo de un evento operativo.
type EventType string //	@name	EventType

// Tipos de evento que aparecen en events.csv.
const (
	EventOperationalChange EventType = "OPERATIONAL_CHANGE"
	EventScheduledOutage   EventType = "SCHEDULED_OUTAGE"
	EventDataQuality       EventType = "DATA_QUALITY"
	EventUnknown           EventType = "UNKNOWN"
)

// Reading es una lectura horaria de un medidor (una fila de readings.csv).
type Reading struct {
	MeterID        string    `json:"meter_id"`
	Timestamp      time.Time `json:"timestamp"`
	ConsumptionKWh float64   `json:"consumption_kwh"`
	VoltageV       float64   `json:"voltage_v"`
	CurrentA       float64   `json:"current_a"`
	PowerFactor    float64   `json:"power_factor"`
	Status         string    `json:"status"`
} //	@name	Reading

// Event es un evento operativo conocido (una fila de events.csv).
type Event struct {
	MeterID     string    `json:"meter_id"`
	Timestamp   time.Time `json:"timestamp"`
	Type        EventType `json:"type"`
	Description string    `json:"description"`
} //	@name	Event
