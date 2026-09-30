// Comando para ver en la terminal el resultado del motor.
// Uso, desde la carpeta backend:
//
//	go run ./cmd/inspect          resumen legible
//	go run ./cmd/inspect -json    resultado completo en JSON (lo que devolverá la API)
//	go run ./cmd/inspect -readings otra/ruta.csv -events otra/ruta.csv
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"energyai/internal/analysis"
	"energyai/internal/analysis/model"
	"energyai/internal/data"
)

func main() {
	jsonOut := flag.Bool("json", false, "imprimir el resultado completo en JSON")
	readingsPath := flag.String("readings", "data/readings.csv", "ruta del CSV de lecturas")
	eventsPath := flag.String("events", "data/events.csv", "ruta del CSV de eventos")
	flag.Parse()

	readings, err := data.LoadReadings(*readingsPath)
	if err != nil {
		log.Fatal(err)
	}
	events, err := data.LoadEvents(*eventsPath)
	if err != nil {
		log.Fatal(err)
	}

	anomalies := analysis.Analyze(readings, events)

	if *jsonOut {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		if err := enc.Encode(anomalies); err != nil {
			log.Fatal(err)
		}
		return
	}

	printSummary(anomalies)
}

// printSummary muestra las anomalías en un formato fácil de leer.
func printSummary(anomalies []model.Anomaly) {
	var high int
	for _, a := range anomalies {
		if a.Severity == model.SeverityHigh {
			high++
		}
	}
	fmt.Printf("%d anomalías detectadas · %d requieren atención prioritaria\n\n", len(anomalies), high)

	for _, a := range anomalies {
		fmt.Printf(
			"#%d %s  %s  %s  confianza %.2f\n",
			a.Priority,
			a.MeterID,
			a.Type,
			a.Severity,
			a.Confidence,
		)
		fmt.Printf("   Por qué: %s\n", a.Reason)
		fmt.Printf("   Acción:  %s\n\n", a.RecommendedAction)
	}
}
