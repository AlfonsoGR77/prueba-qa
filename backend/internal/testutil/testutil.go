// Package testutil tiene helpers que comparten los tests de varios paquetes.
// Solo lo importan archivos _test.go, así que no llega al programa final.
package testutil

import (
	"math"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"energyai/internal/data"
)

// DataDir es la ruta absoluta de backend/data. Se calcula desde la ubicación
// de este archivo, así funciona sin importar en qué carpeta corra el test.
func DataDir() string {
	_, file, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(file), "..", "..", "data")
}

// LoadData lee los CSV reales o hace fallar el test.
func LoadData(t *testing.T) ([]data.Reading, []data.Event) {
	t.Helper()
	readings, err := data.LoadReadings(filepath.Join(DataDir(), "readings.csv"))
	if err != nil {
		t.Fatal(err)
	}
	events, err := data.LoadEvents(filepath.Join(DataDir(), "events.csv"))
	if err != nil {
		t.Fatal(err)
	}
	return readings, events
}

// LoadMeters lee el CSV real y lo agrupa por medidor.
func LoadMeters(t *testing.T) map[string][]data.Reading {
	t.Helper()
	readings, _ := LoadData(t)
	return data.GroupByMeter(readings)
}

// MustParse convierte "2006-01-02 15:04" en time.Time o hace fallar el test.
func MustParse(t *testing.T, s string) time.Time {
	t.Helper()
	ts, err := time.Parse("2006-01-02 15:04", s)
	if err != nil {
		t.Fatal(err)
	}
	return ts
}

// AlmostEqual compara decimales con tolerancia a errores de redondeo.
func AlmostEqual(a, b float64) bool {
	return math.Abs(a-b) < 1e-9
}
