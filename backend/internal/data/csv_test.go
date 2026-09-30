package data

import (
	"os"
	"path/filepath"
	"testing"
)

// Las rutas son relativas a esta carpeta (internal/data), por eso ../../data.
const (
	readingsPath = "../../data/readings.csv"
	eventsPath   = "../../data/events.csv"
)

func TestLoadReadings(t *testing.T) {
	readings, err := LoadReadings(readingsPath)
	if err != nil {
		t.Fatal(err)
	}

	if len(readings) != 4032 {
		t.Fatalf("esperaba 4032 lecturas, obtuve %d", len(readings))
	}

	// Lecturas por medidor.
	byMeter := map[string]int{}
	for _, r := range readings {
		byMeter[r.MeterID]++
	}
	if len(byMeter) != 12 {
		t.Fatalf("esperaba 12 medidores, obtuve %d", len(byMeter))
	}
	for id, n := range byMeter {
		if n != 336 {
			t.Errorf("%s: esperaba 336 lecturas (14 días x 24 h), obtuve %d", id, n)
		}
	}

	first := readings[0]
	if first.MeterID != "M-101" || first.Timestamp.Format("2006-01-02 15:04") != "2026-09-01 00:00" {
		t.Errorf("primera lectura inesperada: %+v", first)
	}
}

func TestLoadEvents(t *testing.T) {
	events, err := LoadEvents(eventsPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 4 {
		t.Fatalf("esperaba 4 eventos, obtuve %d", len(events))
	}
	if events[1].Type != EventScheduledOutage {
		t.Errorf("segundo evento: esperaba %s, obtuve %s", EventScheduledOutage, events[1].Type)
	}
}

// Archivos mal formados deben devolver un error, nunca hacer caer el programa.
func TestLoadReadingsInvalidFiles(t *testing.T) {
	const header = "meter_id,timestamp,consumption_kwh,voltage_v,current_a,power_factor,status\n"
	tests := []struct {
		name    string
		content string
	}{
		{"vacío", ""},
		{"faltan columnas", header + "M-101,2026-09-01 00:00:00,23.5\n"},
		{"fecha inválida", header + "M-101,ayer,23.5,221.9,101.28,0.954,OK\n"},
		{"número inválido", header + "M-101,2026-09-01 00:00:00,abc,221.9,101.28,0.954,OK\n"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "readings.csv")
			if err := os.WriteFile(path, []byte(tt.content), 0o600); err != nil {
				t.Fatal(err)
			}
			if _, err := LoadReadings(path); err == nil {
				t.Error("esperaba un error")
			}
		})
	}
}

func TestLoadReadingsMissingFile(t *testing.T) {
	if _, err := LoadReadings("no-existe.csv"); err == nil {
		t.Error("esperaba un error por archivo inexistente")
	}
}
