package data

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"time"
)

// Formato de fecha de cada CSV.
const (
	readingLayout = "2006-01-02 15:04:05"
	eventLayout   = "2006-01-02 15:04"
)

// Cantidad de columnas de cada CSV.
const (
	readingColumns = 7
	eventColumns   = 4
)

// LoadReadings lee readings.csv.
// Columnas: meter_id, timestamp, consumption_kwh, voltage_v, current_a, power_factor, status
func LoadReadings(path string) ([]Reading, error) {
	rows, err := readCSV(path, readingColumns)
	if err != nil {
		return nil, err
	}

	readings := make([]Reading, 0, len(rows))
	for i, row := range rows {
		ts, err := time.Parse(readingLayout, row[1])
		if err != nil {
			return nil, fmt.Errorf("%s fila %d: timestamp inválido: %w", path, i+2, err)
		}
		nums, err := parseFloats(row[2:6])
		if err != nil {
			return nil, fmt.Errorf("%s fila %d: %w", path, i+2, err)
		}
		readings = append(readings, Reading{
			MeterID:        row[0],
			Timestamp:      ts,
			ConsumptionKWh: nums[0],
			VoltageV:       nums[1],
			CurrentA:       nums[2],
			PowerFactor:    nums[3],
			Status:         row[6],
		})
	}
	return readings, nil
}

// LoadEvents lee events.csv.
// Columnas: meter_id, event_timestamp, event_type, description
func LoadEvents(path string) ([]Event, error) {
	rows, err := readCSV(path, eventColumns)
	if err != nil {
		return nil, err
	}

	events := make([]Event, 0, len(rows))
	for i, row := range rows {
		ts, err := time.Parse(eventLayout, row[1])
		if err != nil {
			return nil, fmt.Errorf("%s fila %d: timestamp inválido: %w", path, i+2, err)
		}
		events = append(events, Event{
			MeterID:     row[0],
			Timestamp:   ts,
			Type:        EventType(row[2]),
			Description: row[3],
		})
	}
	return events, nil
}

// readCSV abre un archivo CSV y devuelve sus filas sin el encabezado.
// Todas las filas deben tener exactamente columns columnas; así después
// podemos leer row[6] sin miedo a que el programa se caiga.
func readCSV(path string, columns int) ([][]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err // el error de os.Open ya incluye la ruta
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = columns
	rows, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("leyendo %s: %w", path, err)
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("%s está vacío", path)
	}
	return rows[1:], nil
}

// parseFloats convierte una lista de textos en números decimales.
func parseFloats(fields []string) ([]float64, error) {
	out := make([]float64, len(fields))
	for i, s := range fields {
		v, err := strconv.ParseFloat(s, 64)
		if err != nil {
			return nil, fmt.Errorf("número inválido %q: %w", s, err)
		}
		out[i] = v
	}
	return out, nil
}
