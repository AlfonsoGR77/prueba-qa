package ai

import (
	"context"
	"errors"
	"testing"
	"time"

	"energyai/internal/analysis/model"
	"energyai/internal/store"
	"energyai/internal/testutil"
)

// fakeNarrator reemplaza a OpenAI en los tests.
type fakeNarrator struct {
	fail map[string]bool // medidores con los que falla
}

func (f fakeNarrator) Name() string { return "fake" }

func (f fakeNarrator) Narrate(_ context.Context, a model.Anomaly) (Narrative, error) {
	if f.fail[a.MeterID] {
		return Narrative{}, errors.New("falla simulada")
	}
	return Narrative{Reason: "Texto de prueba para " + a.MeterID, RecommendedAction: "Acción de prueba"}, nil
}

// waitFinished hace polling como el front hasta que el análisis termina.
func waitFinished(t *testing.T, svc *Service, id string) Run {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		run, ok := svc.Get(id)
		if !ok {
			t.Fatalf("no se encontró el análisis %s", id)
		}
		if run.Status != RunRunning {
			return run
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("el análisis %s no terminó a tiempo", id)
	return Run{}
}

func TestStartupRunIsRecorded(t *testing.T) {
	svc := NewService(store.New(testutil.LoadData(t)), nil)

	run := svc.Latest()
	if run.ID != "AN-0001" || run.Trigger != TriggerStartup || run.Status != RunCompleted {
		t.Errorf("esperaba AN-0001 del arranque completado, obtuve %+v", run)
	}
	if run.Summary == nil || run.Summary.AnomaliesDetected != 4 || run.Summary.RequiringAttention != 2 {
		t.Errorf("resumen inesperado: %+v", run.Summary)
	}
}

func TestRunWithNarrator(t *testing.T) {
	st := store.New(testutil.LoadData(t))
	svc := NewService(st, fakeNarrator{fail: map[string]bool{"M-112": true}})

	started, ok := svc.Start()
	if !ok || started.Status != RunRunning || started.ID != "AN-0002" {
		t.Fatalf("esperaba AN-0002 corriendo, obtuve %+v (started=%v)", started, ok)
	}

	run := waitFinished(t, svc, started.ID)
	if run.Status != RunCompleted {
		t.Fatalf("esperaba COMPLETED, obtuve %s: %s", run.Status, run.Error)
	}
	for _, s := range run.Steps {
		if s.Status != StepDone || s.Detail == "" {
			t.Errorf("paso %s: estado %s, detalle %q", s.Key, s.Status, s.Detail)
		}
	}
	if got := run.Steps[len(run.Steps)-1].Detail; got != "4 anomalías detectadas · 2 requieren atención prioritaria" {
		t.Errorf("mensaje final inesperado: %q", got)
	}

	// El store quedó con el texto nuevo, salvo M-112 que conserva el del motor.
	for _, a := range st.Anomalies() {
		wantNarrator := "fake"
		if a.MeterID == "M-112" {
			wantNarrator = model.NarratorEngine
		}
		if a.NarratedBy != wantNarrator {
			t.Errorf("%s: narrated_by = %q, esperaba %q", a.MeterID, a.NarratedBy, wantNarrator)
		}
	}
	// La clasificación no cambia: el narrador solo escribe.
	if first := st.Anomalies()[0]; first.MeterID != "M-109" || first.Type != model.TypeReal {
		t.Errorf("la prioridad 1 debería seguir siendo M-109 REAL_ANOMALY: %+v", first)
	}
}

func TestCheckNumbers(t *testing.T) {
	a := model.Anomaly{
		MeterID:           "M-109",
		Confidence:        0.95,
		Priority:          1,
		Reason:            "Consumo +110,5% frente al baseline durante 58 h (desde 12/09 14:00).",
		RecommendedAction: "Investigar en sitio la instalación de M-109.",
	}

	tests := []struct {
		name string
		text string
		ok   bool
	}{
		{"reusa las cifras del motor", "El consumo de M-109 subió 110,5% durante 58 h desde el 12/09 a las 14:00.", true},
		{"acepta punto decimal", "Subió 110.5% con confianza 0,95.", true},
		{"rechaza una cifra inventada", "El consumo subió 120% en 58 h.", false},
		{"rechaza un redondeo propio", "El consumo subió 110% en 58 h.", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkNumbers(a, Narrative{Reason: tt.text, RecommendedAction: "Revisar M-109."})
			if (err == nil) != tt.ok {
				t.Errorf("checkNumbers(%q) = %v, esperaba ok=%v", tt.text, err, tt.ok)
			}
		})
	}
}

func TestThousands(t *testing.T) {
	for in, want := range map[int]string{7: "7", 336: "336", 4032: "4.032", 1234567: "1.234.567"} {
		if got := thousands(in); got != want {
			t.Errorf("thousands(%d) = %q, esperaba %q", in, got, want)
		}
	}
}
