package analysis

import (
	"encoding/json"
	"testing"

	"energyai/internal/analysis/model"
	"energyai/internal/analysis/variables"
	"energyai/internal/data"
	"energyai/internal/testutil"
)

// analyzeRealData corre el motor completo con los CSV reales.
func analyzeRealData(t *testing.T) []model.Anomaly {
	t.Helper()
	return Analyze(testutil.LoadData(t))
}

// findAnomaly busca la anomalía de un medidor o hace fallar el test.
func findAnomaly(t *testing.T, anomalies []model.Anomaly, meterID string) model.Anomaly {
	t.Helper()
	for _, a := range anomalies {
		if a.MeterID == meterID {
			return a
		}
	}
	t.Fatalf("no se encontró %s en los resultados", meterID)
	return model.Anomaly{}
}

// ---------- Los 4 casos de la prueba con los CSV reales ----------

func TestAnalyzeRealData(t *testing.T) {
	anomalies := analyzeRealData(t)
	if len(anomalies) != 4 {
		t.Fatalf("esperaba 4 anomalías, obtuve %d: %+v", len(anomalies), anomalies)
	}

	type summary struct {
		meter    string
		typ      model.AnomalyType
		severity model.Severity
		priority int
	}
	// En orden de prioridad: M-109 primero.
	expected := []summary{
		{"M-109", model.TypeReal, model.SeverityHigh, 1},
		{"M-112", model.TypeDataQuality, model.SeverityHigh, 2},
		{"M-104", model.TypeExplainable, model.SeverityMedium, 3},
		{"M-106", model.TypeFalsePositive, model.SeverityLow, 4},
	}

	for i, want := range expected {
		a := anomalies[i]
		got := summary{a.MeterID, a.Type, a.Severity, a.Priority}
		if got != want {
			t.Errorf("posición %d: esperaba %+v, obtuve %+v", i+1, want, got)
		}
		if a.Confidence < 0.7 || a.Confidence > 0.95 {
			t.Errorf("%s: confianza %.2f fuera del rango esperado", a.MeterID, a.Confidence)
		}
		if a.Reason == "" || a.RecommendedAction == "" {
			t.Errorf("%s: falta la explicación o la acción recomendada", a.MeterID)
		}
	}

	if anomalies[3].Anomaly {
		t.Error("M-106 es un falso positivo: anomaly debería ser false")
	}
}

// ---------- Evidencia de los casos reales ----------

func TestM109Evidence(t *testing.T) {
	a := findAnomaly(t, analyzeRealData(t), "M-109")

	ev := a.Evidence
	if !variables.Find(ev.Variables, variables.Current).Changed {
		t.Error("la corriente de M-109 debería aparecer como cambiada")
	}
	if !variables.Find(ev.Variables, variables.PowerFactor).Changed {
		t.Error("el factor de potencia de M-109 debería aparecer como cambiado")
	}
	if variables.Find(ev.Variables, variables.Voltage).Changed {
		t.Error("el voltaje de M-109 no cambió de forma relevante")
	}
	if len(ev.RelatedEvents) != 1 || ev.RelatedEvents[0].Type != data.EventUnknown {
		t.Errorf("esperaba solo el evento UNKNOWN relacionado, obtuve %+v", ev.RelatedEvents)
	}
	if a.Confidence < 0.9 {
		t.Errorf("M-109 debería tener confianza alta, obtuve %.2f", a.Confidence)
	}
}

func TestM112Evidence(t *testing.T) {
	a := findAnomaly(t, analyzeRealData(t), "M-112")

	if variables.Find(a.Evidence.Variables, variables.Consumption).Changed {
		t.Error("el consumo de M-112 debería verse estable")
	}
	if !variables.Find(a.Evidence.Variables, variables.Voltage).Changed {
		t.Error("el voltaje de M-112 debería aparecer como cambiado")
	}
}

// El resultado debe poder convertirse a JSON (NaN o Inf lo harían fallar).
func TestAnalyzeResultIsValidJSON(t *testing.T) {
	if _, err := json.Marshal(analyzeRealData(t)); err != nil {
		t.Fatalf("el resultado no se puede convertir a JSON: %v", err)
	}
}

// Sin datos no hay anomalías, y la API debe responder [] en vez de null.
func TestAnalyzeEmpty(t *testing.T) {
	out, err := json.Marshal(Analyze(nil, nil))
	if err != nil {
		t.Fatal(err)
	}
	if string(out) != "[]" {
		t.Errorf("esperaba [], obtuve %s", out)
	}
}
