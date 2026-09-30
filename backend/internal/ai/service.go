// Package ai ejecuta el análisis de IA (botón Run AI Analysis): corre el motor
// paso a paso, redacta las explicaciones (con OpenAI si hay API key) y publica
// el resultado en el store.
package ai

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"energyai/internal/analysis"
	"energyai/internal/analysis/baseline"
	"energyai/internal/analysis/changes"
	"energyai/internal/analysis/model"
	"energyai/internal/analysis/quality"
	"energyai/internal/analysis/stats"
	"energyai/internal/analysis/variables"
	"energyai/internal/data"
	"energyai/internal/store"
)

const (
	// maxRuns es cuántos análisis se recuerdan para GET /ai/analysis/{id}.
	maxRuns = 20
	// runTimeout corta un análisis colgado (por ejemplo, si OpenAI no responde).
	runTimeout = 2 * time.Minute
)

// Pasos del pipeline, en orden.
var pipeline = []Step{
	{Key: "readings", Label: "Lecturas"},
	{Key: "baseline", Label: "Baseline"},
	{Key: "detection", Label: "Detección"},
	{Key: "correlation", Label: "Correlación"},
	{Key: "events", Label: "Eventos"},
	{Key: "explanation", Label: "Explicación"},
	{Key: "recommendation", Label: "Recomendación"},
}

// Service ejecuta y recuerda los análisis.
type Service struct {
	store    *store.Store
	narrator Narrator // nil: se usa el texto del motor

	mu      sync.Mutex
	seq     int
	runs    []*Run // del más viejo al más nuevo
	running *Run
}

// NewService arma el servicio y registra el análisis que el store hizo al arrancar.
func NewService(st *store.Store, narrator Narrator) *Service {
	s := &Service{store: st, narrator: narrator}
	s.recordStartup()
	return s
}

// NarratorName dice quién redacta las explicaciones de los próximos análisis.
func (s *Service) NarratorName() string {
	if s.narrator == nil {
		return model.NarratorEngine
	}
	return s.narrator.Name()
}

// Start lanza un análisis en segundo plano. Si ya hay uno corriendo, devuelve
// ese mismo y started = false: nunca corren dos a la vez.
func (s *Service) Start() (run Run, started bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running != nil {
		return s.running.clone(), false
	}
	r := s.newRun(TriggerManual)
	s.running = r
	go s.execute(r)
	return r.clone(), true
}

// Get devuelve un análisis por ID.
func (s *Service) Get(id string) (Run, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, r := range s.runs {
		if strings.EqualFold(r.ID, id) {
			return r.clone(), true
		}
	}
	return Run{}, false
}

// Latest devuelve el último análisis (el que está corriendo, si hay uno).
func (s *Service) Latest() Run {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.runs[len(s.runs)-1].clone()
}

// newRun crea un análisis con todos los pasos pendientes. Se llama con el lock tomado.
func (s *Service) newRun(trigger Trigger) *Run {
	s.seq++
	r := &Run{
		ID:        fmt.Sprintf("AN-%04d", s.seq),
		Status:    RunRunning,
		Trigger:   trigger,
		Narrator:  s.NarratorName(),
		StartedAt: time.Now().UTC(),
		Steps:     append([]Step{}, pipeline...),
	}
	for i := range r.Steps {
		r.Steps[i].Status = StepPending
	}
	s.runs = append(s.runs, r)
	if len(s.runs) > maxRuns {
		s.runs = s.runs[len(s.runs)-maxRuns:]
	}
	return r
}

// recordStartup registra como AN-0001 el análisis que ya hizo el store al
// arrancar (con el texto del motor), para que siempre exista un "último análisis".
func (s *Service) recordStartup() {
	s.mu.Lock()
	r := s.newRun(TriggerStartup)
	r.Narrator = model.NarratorEngine
	s.mu.Unlock()

	anomalies := s.store.Anomalies()
	for i := range r.Steps {
		r.Steps[i].Status = StepDone
	}
	r.Steps[len(r.Steps)-1].Detail = recommendationDetail(anomalies)
	s.finish(r, anomalies, nil)
}

// execute corre el pipeline. Cada paso actualiza su estado para que el front
// lo vaya mostrando mientras hace polling a GET /ai/analysis/{id}.
func (s *Service) execute(r *Run) {
	ctx, cancel := context.WithTimeout(context.Background(), runTimeout)
	defer cancel()

	defer func() {
		if p := recover(); p != nil {
			slog.Error("análisis con panic", "run", r.ID, "error", p)
			s.finish(r, nil, fmt.Errorf("error interno: %v", p))
		}
	}()

	readings, events := s.store.Readings(), s.store.Events()
	var (
		groups    map[string][]data.Reading
		baselines map[string]baseline.Baseline
		anomalies []model.Anomaly
	)

	// 1. Lecturas: agrupar por medidor.
	s.step(r, 0, func() string {
		groups = data.GroupByMeter(readings)
		return fmt.Sprintf("%s lecturas · %d medidores", thousands(len(readings)), len(groups))
	})

	// 2. Baseline: comportamiento normal de cada medidor.
	s.step(r, 1, func() string {
		baselines = make(map[string]baseline.Baseline, len(groups))
		for id, rs := range groups {
			baselines[id] = baseline.Build(rs)
		}
		return fmt.Sprintf("%d baselines con los primeros %d días", len(baselines), baseline.Days)
	})

	// 3. Detección: cambios sostenidos y calidad de datos.
	s.step(r, 2, func() string {
		var changed, flagged int
		for id, rs := range groups {
			if len(changes.Detect(rs, baselines[id])) > 0 {
				changed++
			}
			if quality.Check(rs, baselines[id]).HasIssue() {
				flagged++
			}
		}
		return fmt.Sprintf("%d medidores con cambios sostenidos · %d con lecturas incoherentes", changed, flagged)
	})

	// 4. Correlación: el motor completo clasifica cada caso comparando variables.
	s.step(r, 3, func() string {
		anomalies = analysis.Analyze(readings, events)
		confirmed := 0
		for _, a := range anomalies {
			if variables.Find(a.Evidence.Variables, variables.Current).Changed {
				confirmed++
			}
		}
		return fmt.Sprintf("%d casos clasificados · la corriente confirma el cambio en %d", len(anomalies), confirmed)
	})

	// 5. Eventos: cuáles cambios explica un evento operativo.
	s.step(r, 4, func() string {
		explained := 0
		for _, a := range anomalies {
			if a.Type == model.TypeExplainable || a.Type == model.TypeFalsePositive {
				explained++
			}
		}
		return fmt.Sprintf("%d eventos evaluados · %d explican el cambio", len(events), explained)
	})

	// 6. Explicación: el narrador redacta (OpenAI o el motor).
	s.step(r, 5, func() string {
		return s.narrate(ctx, anomalies)
	})

	// 7. Recomendación: ya vienen priorizadas; se publican.
	s.step(r, 6, func() string {
		s.store.SetAnomalies(anomalies)
		return recommendationDetail(anomalies)
	})

	s.finish(r, anomalies, nil)
}

// step marca el paso i como corriendo, ejecuta fn y lo marca como hecho con su detalle.
func (s *Service) step(r *Run, i int, fn func() string) {
	s.mu.Lock()
	r.Steps[i].Status = StepRunning
	s.mu.Unlock()

	detail := fn()

	s.mu.Lock()
	r.Steps[i].Status = StepDone
	r.Steps[i].Detail = detail
	s.mu.Unlock()
}

// narrate reemplaza reason y recommended_action por el texto del narrador.
// Si falla con una anomalía, esa conserva el texto del motor: nunca se pierde una explicación.
func (s *Service) narrate(ctx context.Context, anomalies []model.Anomaly) string {
	if s.narrator == nil {
		return "Redacción del motor (sin OPENAI_API_KEY)"
	}

	var wg sync.WaitGroup
	errs := make([]error, len(anomalies))
	for i := range anomalies {
		wg.Add(1)
		go func() {
			defer wg.Done()
			n, err := s.narrator.Narrate(ctx, anomalies[i])
			if err != nil {
				errs[i] = err
				return
			}
			anomalies[i].Reason = n.Reason
			anomalies[i].RecommendedAction = n.RecommendedAction
			anomalies[i].NarratedBy = s.narrator.Name()
		}()
	}
	wg.Wait()

	failed := 0
	for i, err := range errs {
		if err != nil {
			failed++
			slog.Warn("el narrador falló; se usa el texto del motor", "meter", anomalies[i].MeterID, "error", err)
		}
	}
	if failed == 0 {
		return fmt.Sprintf("%d explicaciones redactadas con %s", len(anomalies), s.narrator.Name())
	}
	return fmt.Sprintf("%d de %d redactadas con %s · %d con el texto del motor",
		len(anomalies)-failed, len(anomalies), s.narrator.Name(), failed)
}

// finish cierra el análisis con su resumen, o con el error.
func (s *Service) finish(r *Run, anomalies []model.Anomaly, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	r.FinishedAt = &now
	r.DurationMs = now.Sub(r.StartedAt).Milliseconds()
	if s.running == r {
		s.running = nil
	}

	if err != nil {
		r.Status = RunFailed
		r.Error = err.Error()
		for i := range r.Steps {
			if r.Steps[i].Status == StepRunning {
				r.Steps[i].Status = StepFailed
			}
		}
		return
	}
	r.Status = RunCompleted
	r.Summary = summarize(anomalies)
}

// summarize cuenta el resultado de un análisis.
func summarize(anomalies []model.Anomaly) *Summary {
	sm := &Summary{
		AnomaliesDetected: len(anomalies),
		ByType: map[model.AnomalyType]int{
			model.TypeReal:          0,
			model.TypeExplainable:   0,
			model.TypeFalsePositive: 0,
			model.TypeDataQuality:   0,
		},
	}
	total := 0.0
	for _, a := range anomalies {
		sm.ByType[a.Type]++
		total += a.Confidence
		if a.Severity == model.SeverityHigh {
			sm.RequiringAttention++
		}
	}
	if len(anomalies) > 0 {
		sm.AvgConfidence = stats.Round(total/float64(len(anomalies)), 2)
	}
	return sm
}

// recommendationDetail es el mensaje final: "4 anomalías detectadas · 2 requieren atención prioritaria".
func recommendationDetail(anomalies []model.Anomaly) string {
	sm := summarize(anomalies)
	return fmt.Sprintf("%d anomalías detectadas · %d requieren atención prioritaria",
		sm.AnomaliesDetected, sm.RequiringAttention)
}

// thousands formatea 4032 como "4.032".
func thousands(n int) string {
	s := fmt.Sprint(n)
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte('.')
		}
		b.WriteRune(c)
	}
	return b.String()
}
