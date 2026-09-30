package classify

import (
	"fmt"
	"strings"
	"time"

	"energyai/internal/analysis/changes"
)

// Funciones que dan formato a los textos que lee una persona (reason, acciones).

func dirWord(d changes.Direction) string {
	if d == changes.Down {
		return "a la baja"
	}
	return "al alza"
}

// pct formatea un porcentaje con signo y coma decimal: +110,5%
func pct(x float64) string {
	return strings.Replace(fmt.Sprintf("%+.1f%%", x), ".", ",", 1)
}

// num formatea un número con coma decimal.
func num(x float64, decimals int) string {
	return strings.Replace(fmt.Sprintf("%.*f", decimals, x), ".", ",", 1)
}

// fmtTime formatea una fecha como 12/09 14:00.
func fmtTime(t time.Time) string {
	return t.Format("02/01 15:04")
}
