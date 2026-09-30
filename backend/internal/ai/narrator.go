package ai

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"energyai/internal/analysis/model"
)

// Narrative es el texto que lee el operador: por qué y qué hacer.
type Narrative struct {
	Reason            string `json:"reason"`
	RecommendedAction string `json:"recommended_action"`
}

// Narrator redacta la explicación y la acción de una anomalía YA clasificada.
// El motor decide el tipo, la severidad y la confianza; el narrador solo escribe.
type Narrator interface {
	Name() string
	Narrate(ctx context.Context, a model.Anomaly) (Narrative, error)
}

// ErrInventedNumber indica que el texto trae una cifra que no está en la evidencia.
var ErrInventedNumber = errors.New("el texto incluye cifras que no están en la evidencia")

// numberPattern encuentra cifras como 110,5 · 2.825 · 58 · 0,94.
var numberPattern = regexp.MustCompile(`\d+(?:[.,]\d+)*`)

// canonical quita separadores para comparar cifras escritas distinto:
// "110,5", "110.5" y "1105" quedan iguales.
func canonical(n string) string {
	return strings.NewReplacer(".", "", ",", "").Replace(n)
}

// allowedNumbers son las cifras que el LLM puede usar: las que el motor ya
// escribió, el número del medidor, la confianza y la prioridad.
func allowedNumbers(a model.Anomaly) map[string]bool {
	allowed := map[string]bool{}
	sources := []string{
		a.Reason,
		a.RecommendedAction,
		a.MeterID,
		fmt.Sprintf("%.2f", a.Confidence),
		fmt.Sprint(a.Priority),
	}
	for _, src := range sources {
		for _, n := range numberPattern.FindAllString(src, -1) {
			allowed[canonical(n)] = true
		}
	}
	return allowed
}

// checkNumbers rechaza un texto que invente cifras. Es la barrera que evita
// que el LLM "alucine" datos: solo puede reusar los números del motor.
func checkNumbers(a model.Anomaly, n Narrative) error {
	allowed := allowedNumbers(a)
	for _, text := range []string{n.Reason, n.RecommendedAction} {
		for _, num := range numberPattern.FindAllString(text, -1) {
			if !allowed[canonical(num)] {
				return fmt.Errorf("%w: %s", ErrInventedNumber, num)
			}
		}
	}
	return nil
}
