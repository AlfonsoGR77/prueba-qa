package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"energyai/internal/config"
	"energyai/internal/store"
	"energyai/internal/testutil"
)

// Tests de punta a punta: pasan por el router, los middlewares y los handlers.

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	cfg := config.Config{
		CORSOrigins:  []string{"http://localhost:5173"},
		JWTSecret:    "test",
		JWTTTL:       time.Hour,
		AuthEmail:    "admin@energia.local",
		AuthPassword: "admin123",
		AuthName:     "Operador",
	}
	h, err := NewHandler(cfg, store.New(testutil.LoadData(t)))
	if err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	return srv
}

// do hace una petición y devuelve el status y el body como map.
func do(t *testing.T, method, url, token, body string) (int, map[string]any) {
	t.Helper()
	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	out := map[string]any{}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		t.Fatalf("%s %s: la respuesta no es un objeto JSON: %v", method, url, err)
	}
	return res.StatusCode, out
}

func login(t *testing.T, base string) string {
	t.Helper()
	status, body := do(t, http.MethodPost, base+"/api/v1/auth/login", "",
		`{"email":"admin@energia.local","password":"admin123"}`)
	if status != http.StatusOK {
		t.Fatalf("login: esperaba 200, obtuve %d: %v", status, body)
	}
	return body["access_token"].(string)
}

func TestProtectedRoutesRequireToken(t *testing.T) {
	srv := newTestServer(t)

	routes := []struct{ method, path string }{
		{http.MethodGet, "/api/v1/auth/me"},
		{http.MethodGet, "/api/v1/meter/getParams"},
		{http.MethodPost, "/api/v1/meter/getAll"},
		{http.MethodGet, "/api/v1/meter/getById/M-109"},
		{http.MethodGet, "/api/v1/anomaly/getAll"},
		{http.MethodGet, "/api/v1/dashboard/getSummary"},
	}
	for _, r := range routes {
		t.Run(r.path, func(t *testing.T) {
			status, body := do(t, r.method, srv.URL+r.path, "", "")
			if status != http.StatusUnauthorized || body["status_code"] != float64(401) {
				t.Errorf("sin token: esperaba 401, obtuve %d: %v", status, body)
			}
		})
	}
}

func TestLoginAndQueryMeters(t *testing.T) {
	srv := newTestServer(t)
	token := login(t, srv.URL)

	status, body := do(t, http.MethodPost, srv.URL+"/api/v1/meter/getAll", token,
		`{"pagination":{"page":1,"size":5},"filter":{"status":"CRITICAL","sort_by":"consumption","sort_order":"DESC"}}`)
	if status != http.StatusOK {
		t.Fatalf("getAll: esperaba 200, obtuve %d: %v", status, body)
	}
	rows := body["rows"].([]any)
	if body["count"] != float64(2) || len(rows) != 2 {
		t.Fatalf("esperaba 2 medidores críticos, obtuve %v", body)
	}
	if first := rows[0].(map[string]any)["meter_id"]; first != "M-109" {
		t.Errorf("el crítico con más consumo debería ser M-109, obtuve %v", first)
	}

	status, body = do(t, http.MethodPost, srv.URL+"/api/v1/meter/getAll", token, `{"filter":{"status":"ROJO"}}`)
	if status != http.StatusBadRequest || len(body["errors"].([]any)) != 1 {
		t.Errorf("filtro inválido: esperaba 400 con 1 error, obtuve %d: %v", status, body)
	}

	status, _ = do(t, http.MethodGet, srv.URL+"/api/v1/meter/getById/M-999", token, "")
	if status != http.StatusNotFound {
		t.Errorf("medidor inexistente: esperaba 404, obtuve %d", status)
	}
}

func TestDashboardSummary(t *testing.T) {
	srv := newTestServer(t)
	token := login(t, srv.URL)

	status, body := do(t, http.MethodGet, srv.URL+"/api/v1/dashboard/getSummary", token, "")
	if status != http.StatusOK {
		t.Fatalf("esperaba 200, obtuve %d: %v", status, body)
	}
	counts := body["status_counts"].(map[string]any)
	if cons := body["consumption"].(map[string]any); cons["period_kwh"].(float64) <= 0 {
		t.Errorf("el consumo del periodo debería ser positivo: %v", cons)
	}
	if counts["normal"] != float64(8) || counts["alert"] != float64(2) || counts["critical"] != float64(2) {
		t.Errorf("conteo por estado inesperado: %v", counts)
	}
	if body["anomalies_detected"] != float64(4) || body["requiring_attention"] != float64(2) {
		t.Errorf("esperaba 4 anomalías y 2 que requieren atención: %v", body)
	}
}

func TestRunAIAnalysis(t *testing.T) {
	srv := newTestServer(t)
	token := login(t, srv.URL)

	status, body := do(t, http.MethodPost, srv.URL+"/api/v1/ai/analyze", token, "")
	if status != http.StatusAccepted {
		t.Fatalf("analyze: esperaba 202, obtuve %d: %v", status, body)
	}
	id := body["id"].(string)

	deadline := time.Now().Add(5 * time.Second)
	for body["status"] == "RUNNING" && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
		_, body = do(t, http.MethodGet, srv.URL+"/api/v1/ai/analysis/"+id, token, "")
	}
	if body["status"] != "COMPLETED" {
		t.Fatalf("esperaba COMPLETED, obtuve %v", body)
	}
	summary := body["summary"].(map[string]any)
	if summary["anomalies_detected"] != float64(4) || summary["requiring_attention"] != float64(2) {
		t.Errorf("resumen inesperado: %v", summary)
	}

	_, dash := do(t, http.MethodGet, srv.URL+"/api/v1/dashboard/getSummary", token, "")
	if last := dash["last_analysis"].(map[string]any); last["id"] != id {
		t.Errorf("el dashboard debería mostrar el último análisis %s, obtuve %v", id, last)
	}

	status, _ = do(t, http.MethodGet, srv.URL+"/api/v1/ai/analysis/AN-9999", token, "")
	if status != http.StatusNotFound {
		t.Errorf("análisis inexistente: esperaba 404, obtuve %d", status)
	}
}
