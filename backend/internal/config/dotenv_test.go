package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadDotEnv(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".env")
	content := "# comentario\nENERGYAI_TEST_A=uno\nexport ENERGYAI_TEST_B=\"dos\"\nENERGYAI_TEST_C=archivo\n"
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ENERGYAI_TEST_C", "real") // una variable real gana al archivo

	if err := LoadDotEnv(path); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		os.Unsetenv("ENERGYAI_TEST_A")
		os.Unsetenv("ENERGYAI_TEST_B")
	})

	want := map[string]string{"ENERGYAI_TEST_A": "uno", "ENERGYAI_TEST_B": "dos", "ENERGYAI_TEST_C": "real"}
	for k, v := range want {
		if got := os.Getenv(k); got != v {
			t.Errorf("%s = %q, esperaba %q", k, got, v)
		}
	}
}

func TestLoadDotEnvMissingFile(t *testing.T) {
	if err := LoadDotEnv(filepath.Join(t.TempDir(), "no-existe.env")); err != nil {
		t.Errorf("un .env inexistente no debería ser error: %v", err)
	}
}
