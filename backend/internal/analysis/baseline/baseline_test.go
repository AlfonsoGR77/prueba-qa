package baseline

import (
	"testing"

	"energyai/internal/testutil"
)

func TestBuildM109(t *testing.T) {
	b := Build(testutil.LoadMeters(t)["M-109"])
	// Los primeros 7 días M-109 consume ~1.052 kWh/día.
	if b.DailyKWh < 1040 || b.DailyKWh > 1065 {
		t.Errorf("baseline diario de M-109 = %.1f, esperaba ~1052", b.DailyKWh)
	}
}
