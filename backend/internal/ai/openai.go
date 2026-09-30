package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"energyai/internal/analysis/model"
)

// OpenAIConfig es la configuración del cliente de OpenAI.
type OpenAIConfig struct {
	APIKey  string
	Model   string
	BaseURL string // https://api.openai.com/v1, o un proxy compatible
	Timeout time.Duration
}

// OpenAINarrator redacta con la API de Chat Completions de OpenAI.
// Se usa net/http directo: es una sola llamada y no justifica un SDK.
type OpenAINarrator struct {
	cfg    OpenAIConfig
	client *http.Client
}

// NewOpenAINarrator arma el narrador.
func NewOpenAINarrator(cfg OpenAIConfig) *OpenAINarrator {
	return &OpenAINarrator{cfg: cfg, client: &http.Client{Timeout: cfg.Timeout}}
}

// Name identifica al narrador en la respuesta de la API ("openai:<modelo>").
func (o *OpenAINarrator) Name() string {
	return "openai:" + o.cfg.Model
}

const systemPrompt = `Eres un analista de gestión de energía. Redactas, en español y para un operador de planta,
la explicación y la acción recomendada de una anomalía que un motor estadístico YA clasificó.
Reglas:
- No cambies el tipo, la severidad, la confianza ni la prioridad.
- Usa SOLO cifras que aparezcan en "texto_del_motor", escritas igual (coma decimal). No calcules ni redondees cifras nuevas.
- "reason": máximo 2 frases; qué pasó, desde cuándo y qué variables lo confirman.
- "recommended_action": 1 o 2 frases, concreta y accionable en sitio.
- Sin markdown, sin emojis, sin inventar causas que la evidencia no muestre.`

// chatRequest es el body de POST /chat/completions.
type chatRequest struct {
	Model          string         `json:"model"`
	Messages       []chatMessage  `json:"messages"`
	ResponseFormat responseFormat `json:"response_format"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type responseFormat struct {
	Type       string     `json:"type"`
	JSONSchema jsonSchema `json:"json_schema"`
}

type jsonSchema struct {
	Name   string         `json:"name"`
	Strict bool           `json:"strict"`
	Schema map[string]any `json:"schema"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// narrativeSchema obliga al modelo a responder exactamente { reason, recommended_action }.
var narrativeSchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"reason":             map[string]any{"type": "string"},
		"recommended_action": map[string]any{"type": "string"},
	},
	"required":             []string{"reason", "recommended_action"},
	"additionalProperties": false,
}

// Narrate le pide a OpenAI el texto y verifica que no invente cifras.
func (o *OpenAINarrator) Narrate(ctx context.Context, a model.Anomaly) (Narrative, error) {
	input, err := json.Marshal(map[string]any{
		"medidor":         a.MeterID,
		"tipo":            a.Type,
		"severidad":       a.Severity,
		"confianza":       a.Confidence,
		"prioridad":       a.Priority,
		"texto_del_motor": map[string]string{"reason": a.Reason, "recommended_action": a.RecommendedAction},
		"evidencia":       a.Evidence,
	})
	if err != nil {
		return Narrative{}, fmt.Errorf("armando el prompt: %w", err)
	}

	body, err := json.Marshal(chatRequest{
		Model: o.cfg.Model,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: string(input)},
		},
		ResponseFormat: responseFormat{
			Type:       "json_schema",
			JSONSchema: jsonSchema{Name: "narrative", Strict: true, Schema: narrativeSchema},
		},
	})
	if err != nil {
		return Narrative{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(o.cfg.BaseURL, "/")+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return Narrative{}, err
	}
	req.Header.Set("Authorization", "Bearer "+o.cfg.APIKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := o.client.Do(req)
	if err != nil {
		return Narrative{}, fmt.Errorf("llamando a OpenAI: %w", err)
	}
	defer res.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return Narrative{}, fmt.Errorf("leyendo la respuesta de OpenAI: %w", err)
	}
	var cr chatResponse
	if err := json.Unmarshal(raw, &cr); err != nil {
		return Narrative{}, fmt.Errorf("respuesta de OpenAI inválida (HTTP %d): %w", res.StatusCode, err)
	}
	if res.StatusCode != http.StatusOK {
		msg := http.StatusText(res.StatusCode)
		if cr.Error != nil {
			msg = cr.Error.Message
		}
		return Narrative{}, fmt.Errorf("OpenAI respondió HTTP %d: %s", res.StatusCode, msg)
	}
	if len(cr.Choices) == 0 {
		return Narrative{}, errors.New("OpenAI no devolvió texto")
	}

	var n Narrative
	if err := json.Unmarshal([]byte(cr.Choices[0].Message.Content), &n); err != nil {
		return Narrative{}, fmt.Errorf("el texto de OpenAI no es el JSON esperado: %w", err)
	}
	n.Reason, n.RecommendedAction = strings.TrimSpace(n.Reason), strings.TrimSpace(n.RecommendedAction)
	if n.Reason == "" || n.RecommendedAction == "" {
		return Narrative{}, errors.New("OpenAI devolvió campos vacíos")
	}
	if err := checkNumbers(a, n); err != nil {
		return Narrative{}, err
	}
	return n, nil
}
