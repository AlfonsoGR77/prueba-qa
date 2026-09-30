# AI Energy Management Platform

MVP para monitorear medidores eléctricos y usar IA para **detectar, explicar, priorizar y recomendar acciones** sobre anomalías.

El objetivo no es solo marcar lecturas raras, sino responder las preguntas de un operador:

- ¿Qué está pasando con los medidores?
- ¿Qué lecturas se salen de su comportamiento esperado?
- ¿La anomalía es real, explicable o un problema de calidad de datos?
- ¿Cuál debería investigarse primero, y por qué?
- ¿Qué acción se recomienda?

## Resultado sobre el dataset

**4 anomalías detectadas · 2 requieren atención prioritaria**

| Prioridad | Medidor | Tipo | Severidad | Confianza | Acción |
|---|---|---|---|---|---|
| 1 | M-109 | REAL_ANOMALY | HIGH | 0,95 | Investigar en sitio |
| 2 | M-112 | DATA_QUALITY | HIGH | 0,95 | Validar el medidor |
| 3 | M-104 | EXPLAINABLE_ANOMALY | MEDIUM | 0,86 | Validar con operación y actualizar baseline |
| 4 | M-106 | FALSE_POSITIVE | LOW | 0,86 | No escalar |

Los otros 8 medidores no generan alertas.

Ejemplo de salida para M-109:

> Consumo +110,5% frente al baseline durante 58 h (desde 12/09 14:00) sin evento operativo que lo explique. La corriente cambió +109,9% en la misma ventana. El factor de potencia pasó de 0,94 a 0,74.
>
> **Acción:** Investigar en sitio la instalación de M-109: identificar qué equipo empezó a consumir más desde 12/09 14:00. El cambio del factor de potencia apunta a motores o cargas inductivas con falla o sobrecarga.

## Cómo correrlo

Requisitos: Go 1.26 o superior. Para correr todo el proyecto (backend + frontend, con o sin Docker) ver el [README general](../README.md).

```bash
cd backend
go test ./...                 # corre todos los tests
go run ./cmd/api              # levanta la API en http://localhost:8080
go run ./cmd/inspect          # resumen del análisis en la terminal
go run ./cmd/inspect -json    # resultado completo con toda la evidencia
```

Los comandos se corren desde `backend/`: ahí están los CSV (`data/`) y el `.env` se busca en la raíz del proyecto (`../.env`).

Swagger (OpenAPI 3.1): http://localhost:8080/docs · spec en http://localhost:8080/docs/openapi.json

Con Docker, la imagen se construye con el `Dockerfile` de esta carpeta (binario estático sobre distroless, con los CSV incluidos) y se levanta desde la raíz con `docker compose up -d --build`.

## API

No hay base de datos: al arrancar, la API lee los CSV, corre el motor una sola vez y guarda el resultado en memoria (`internal/store`). Los datos no cambian mientras corre, así que cada petición solo lee.

### Login

Hay un solo usuario, configurado por variables de entorno. Por defecto:

| Email | Contraseña |
|---|---|
| `admin@energia.local` | `admin123` |

`POST /api/v1/auth/login` devuelve un JWT. Todas las demás rutas de `/api/v1` lo exigen en el header `Authorization: Bearer <token>`. En Swagger: haz login, copia el `access_token` y pégalo en **Authorize** (solo el token, sin `Bearer`).

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Login. Devuelve el token (público) |
| GET | `/api/v1/auth/me` | Usuario del token |
| GET | `/api/v1/meter/getParams` | Opciones de los desplegables: medidores, estados, campos y dirección de orden |
| POST | `/api/v1/meter/getAll` | Lista de medidores filtrada, ordenada y paginada |
| GET | `/api/v1/meter/getById/{id}` | Detalle de un medidor |
| GET | `/api/v1/anomaly/getAll` | Anomalías con evidencia, ordenadas por prioridad |
| GET | `/api/v1/dashboard/getSummary` | Resumen general: estado de medidores, consumo, Confianza IA y último análisis |
| POST | `/api/v1/ai/analyze` | Run AI Analysis: lanza el análisis en segundo plano (202) |
| GET | `/api/v1/ai/analysis/{id}` | Estado del análisis: pasos y resumen (el front hace polling) |
| GET | `/api/v1/ai/analysis/latest` | Último análisis |
| GET | `/health` | Estado del servidor (público) |

Body de `POST /meter/getAll` (todo es opcional; sin body devuelve la página 1 de 10, ordenada por medidor):

```json
{
  "pagination": { "page": 1, "size": 10 },
  "filter": {
    "meter_id": "M-109",
    "status": "CRITICAL",
    "sort_by": "consumption",
    "sort_order": "DESC"
  }
}
```

| Campo | Valores |
|---|---|
| `meter_id` | Búsqueda parcial, sin importar mayúsculas (`109` encuentra `M-109`) |
| `status` | `NORMAL`, `ALERT`, `CRITICAL` |
| `sort_by` | `meter_id` (por defecto), `consumption`, `variation`, `severity` |
| `sort_order` | `ASC` (por defecto), `DESC` |

Estado de alerta de un medidor:

| Resultado del motor | Estado |
|---|---|
| Sin anomalía, o `FALSE_POSITIVE` | `NORMAL` |
| Severidad `HIGH` | `CRITICAL` |
| Cualquier otra anomalía | `ALERT` |

En la lista y el detalle, **consumo** es el total de las últimas 24 h, **baseline** es el consumo diario normal y **variación** es la diferencia porcentual entre los dos (por ejemplo, M-109: 2.207,6 kWh contra 1.052,15 kWh, +109,8%).

Los errores responden siempre con el mismo formato:

```json
{
  "status_code": 400,
  "message": "Filtros inválidos",
  "errors": ["filter.status debe ser NORMAL, ALERT o CRITICAL"],
  "timestamp": "2026-09-24T15:00:00Z",
  "path": "/api/v1/meter/getAll"
}
```

### Variables de entorno

Todas son opcionales. Se definen en el `.env` de la **raíz del proyecto** (copia `../.env.example`), que es el único y lo comparten backend, frontend y `docker compose`. Una variable de entorno real siempre gana al archivo. `.env` está en `.gitignore`: las keys nunca se suben al repo.

| Variable | Por defecto | Uso |
|---|---|---|
| `PORT` | `8080` | Puerto HTTP |
| `DATA_DIR` | `data` | Carpeta con `readings.csv` y `events.csv` |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Orígenes del front permitidos (`*` para todos) |
| `JWT_SECRET` | `dev-secret-change-me` | Secreto para firmar los tokens. **Cámbialo fuera de local** |
| `JWT_TTL` | `8h` | Duración del token |
| `AUTH_EMAIL` | `admin@energia.local` | Email del usuario |
| `AUTH_PASSWORD` | `admin123` | Contraseña del usuario |
| `AUTH_NAME` | `Operador` | Nombre que ve el front |
| `OPENAI_API_KEY` | vacío | Si está, Run AI Analysis redacta las explicaciones con OpenAI; si no, usa el texto del motor |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modelo de OpenAI |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Para usar un proxy o un endpoint compatible |
| `OPENAI_TIMEOUT` | `30s` | Tiempo máximo por llamada |

### Run AI Analysis y OpenAI

`POST /ai/analyze` corre el pipeline en segundo plano y guarda el estado de cada paso: Lecturas → Baseline → Detección → Correlación → Eventos → Explicación → Recomendación. El front consulta `GET /ai/analysis/{id}` hasta que el estado sea `COMPLETED`. Nunca corren dos análisis a la vez.

El motor decide el tipo, la severidad, la confianza y la prioridad. OpenAI solo **redacta** `reason` y `recommended_action` a partir de la evidencia, y el backend rechaza el texto si trae una cifra que no aparece en el texto del motor (`internal/ai/narrator.go`). Si OpenAI falla o inventa una cifra, esa anomalía conserva el texto del motor. El campo `narrated_by` de cada anomalía dice quién la redactó (`engine` u `openai:<modelo>`).

### Regenerar Swagger

La documentación sale de los comentarios `@Summary`, `@Param`, etc. de cada handler. Después de cambiar un endpoint o un DTO:

```bash
go install github.com/swaggo/swag/v2/cmd/swag@latest   # solo la primera vez (swag v2: OpenAPI 3.1)
swag init --v3.1 -g cmd/api/main.go -o docs --parseInternal --parseDependency
```

Cada DTO cierra con un comentario `@name` (por ejemplo `} // @name MeterSummary`): así el schema se llama `MeterSummary` y no `energyai_internal_meter.Summary`.

## Estructura del proyecto

Cada módulo de la API tiene la misma forma: `handler.go` (endpoints HTTP), `service.go` (lógica) y `dto.go` (lo que entra y sale).

```
backend/
├── go.mod
├── Dockerfile                  # build multi-stage: binario estático sobre distroless
├── data/                       # readings.csv y events.csv
├── docs/                       # OpenAPI generado por swag (no se edita a mano)
├── cmd/
│   ├── api/main.go             # servidor HTTP
│   └── inspect/main.go         # CLI: imprime el resultado del motor
└── internal/
    ├── config/                 # variables de entorno
    ├── data/                   # entidades (Reading, Event) y lectura de los CSV
    ├── store/                  # datos y resultado del motor en memoria (hace de repositorio)
    ├── httpx/                  # lo común de la API: errores, paginación, opciones, middlewares
    ├── server/                 # rutas, Swagger y qué rutas exigen login
    ├── auth/                   # login, JWT y middleware que protege las rutas
    ├── meter/                  # getParams, getAll (filtros y orden) y getById
    ├── anomaly/                # lista de anomalías
    ├── dashboard/              # resumen general
    ├── ai/                     # Run AI Analysis: pipeline por pasos y narrador (OpenAI)
    ├── testutil/               # helpers de los tests
    └── analysis/               # motor de anomalías
        ├── analyze.go          # orquesta los pasos y prioriza
        ├── stats/              # mediana, MAD y z robusto
        ├── baseline/           # comportamiento normal de cada medidor
        ├── quality/            # coherencia de las variables eléctricas
        ├── changes/            # cambios sostenidos de consumo
        ├── variables/          # cómo se movió cada variable durante el problema
        ├── classify/           # tipo, eventos, severidad, confianza, explicación y acción
        └── model/              # tipos del resultado (Anomaly, Evidence, Check)
```

Flujo del motor:

```
Lecturas → Baseline → Detección → Calidad de datos → Correlación de variables → Eventos → Clasificación → Explicación → Recomendación → Priorización
```

## Metodología

El motor es **determinístico y explicable**: cada conclusión se puede rastrear hasta números concretos. Se eligieron estadísticas robustas (mediana y MAD) en vez de modelos de ML porque hay solo 14 días de datos, no hay etiquetas para entrenar y cada decisión debe poder explicarse a un operador.

### 1. Baseline

Para cada medidor se calcula su comportamiento normal usando los **primeros 7 días**, el único periodo completo antes de cualquier evento del dataset.

- **Consumo esperado por hora del día:** mediana de las 7 lecturas de cada hora (0 a 23). Se separa por hora porque una planta no consume lo mismo de día que de noche.
- **Consumo diario normal:** mediana de los 7 totales diarios.
- **Voltaje y factor de potencia normales:** mediana de la semana.

Se usa la mediana y no el promedio porque un solo pico distorsiona el promedio, pero no la mediana.

### 2. Z robusto

Mide a cuántas "variaciones normales" está una lectura de lo esperado:

```
z = 0,6745 × (lectura − baseline de su hora) / MAD
```

- **MAD** (median absolute deviation): a cada lectura de la semana de referencia se le resta el baseline de su hora (168 diferencias), y la MAD es la mediana de esas distancias en valor absoluto. Se calcula una sola MAD por medidor con las 168 diferencias, porque con solo 7 valores por hora el resultado es inestable.
- **0,6745** convierte la MAD a la escala de la desviación estándar.
- **Umbral |z| > 3,5**, el recomendado por Iglewicz y Hoaglin para este estimador.

### 3. Cambios sostenidos

Una hora aislada con |z| > 3,5 no es una anomalía: en los medidores sanos aparecen horas sueltas por ruido, pero nunca dos seguidas. Un **cambio** es un tramo de **6 horas o más seguidas** con |z| > 3,5 en la misma dirección. De cada cambio se registra:

- Inicio, fin y duración.
- Dirección (UP o DOWN).
- Consumo esperado vs. real, y la variación porcentual.
- Si sigue activo al final de los datos.

### 4. Calidad de datos

La pregunta no es "¿la red cumple la norma?", sino "¿este medidor dice la verdad?". Se marca una hora como sospechosa si:

- El voltaje se aleja más de ±5% de la mediana del propio medidor.
- El factor de potencia se aleja más de 0,15 de su mediana **mientras el consumo está normal**. Si el consumo también cambió, el FP puede cambiar legítimamente.
- Hay valores imposibles: negativos, o un FP fuera de [0, 1].
- Faltan horas o hay lecturas duplicadas.

Con 3 horas sospechosas o más, el medidor tiene un problema de calidad de datos.

### 5. Correlación de variables

Durante la ventana del problema, cada variable (consumo, corriente, voltaje y FP) se compara contra su baseline **en las mismas horas del día**. La corriente es la prueba física: si el consumo sube y la corriente sube en la misma proporción, el cambio es real y no un error del medidor.

### 6. Eventos

Un evento explica un cambio solo si:

- Ocurrió entre 24 h antes y 6 h después del inicio del cambio.
- Su tipo explica la **dirección** del cambio:

| Tipo de evento | Explica |
|---|---|
| `OPERATIONAL_CHANGE` | Aumentos y caídas |
| `SCHEDULED_OUTAGE` | Solo caídas |
| `UNKNOWN` | Nada |
| `DATA_QUALITY` | Nada sobre consumo (solo refuerza un diagnóstico de calidad) |

### 7. Clasificación

| Pregunta | Resultado |
|---|---|
| ¿Las variables eléctricas no cuadran con el consumo? | `DATA_QUALITY` |
| ¿Hay un cambio sostenido que un evento explica y el consumo ya volvió a lo normal? | `FALSE_POSITIVE` |
| ¿Hay un cambio sostenido que un evento explica y el nuevo nivel se mantiene? | `EXPLAINABLE_ANOMALY` |
| ¿Hay un cambio sostenido que ningún evento explica? | `REAL_ANOMALY` |

### 8. Severidad

- `REAL_ANOMALY`: **HIGH** si la variación supera 50% y sigue activa; **MEDIUM** si supera 20%; si no, **LOW**.
- `DATA_QUALITY`: **HIGH** con 12 horas sospechosas o más; si no, **MEDIUM**.
- `EXPLAINABLE_ANOMALY`: **MEDIUM**.
- `FALSE_POSITIVE`: **LOW**.

### 9. Confianza

Cada tipo de conclusión tiene 4 señales de evidencia con pesos que suman 1. Por ejemplo, para una anomalía real:

- Desviación fuerte.
- Duración sostenida.
- La corriente confirma el cambio.
- Ningún evento lo explica.

Cada señal se cumple en un grado entre 0 y 1, y el puntaje es la suma de peso × cumplimiento. Ese puntaje se lleva a un rango entre 0,5 y 0,95:

```
confianza = 0,5 + (0,95 − 0,5) × puntaje
```

- **Mínimo 0,5:** para llegar a esta etapa, el caso ya superó los umbrales de detección.
- **Máximo 0,95:** nunca se afirma certeza total; siempre queda la validación en campo.
- **×0,9 cuando la conclusión depende de un evento**, porque es un reporte humano que el sistema no puede verificar.

Es un puntaje de evidencia, no una probabilidad calibrada (ver limitaciones).

### 10. Priorización

Orden:
1. Severidad.
2. A igual severidad, la energía en juego (kWh de más o de menos frente a lo esperado).
3. Confianza.

Por eso M-109 (2.825 kWh de más) va antes que M-112 (0 kWh).

### Umbrales y su justificación

Todos son constantes al inicio de cada archivo.

| Umbral | Valor | Fuente |
|---|---|---|
| Z robusto | 3,5 | Literatura: Iglewicz y Hoaglin (1993) |
| Horas seguidas para un cambio | 6 | Diseño: en los datos, los medidores sanos nunca tienen dos horas anómalas seguidas |
| Voltaje | ±5% de su mediana | Límite superior de la NTC 1340 para distribución (+5% / −10%) y separación observada en los datos (sanos < 3%, M-112 ≈ 9%) |
| Factor de potencia | ±0,15 | Datos: la variación normal no supera 0,07 |
| Horas mínimas de calidad | 3 | Diseño |
| Baseline | 7 días | Único periodo completo antes de cualquier evento |
| Ventana de eventos | −24 h / +6 h | Diseño |
| Ajuste por evento | ×0,9 | Diseño: un reporte humano no es verificable |

### Ejemplo completo: M-109

1. **Baseline** de las 15:00: mediana de 49,48 · 51,24 · 51,27 · 51,44 · 51,89 · 53,07 · 53,18 = **51,44 kWh**.
2. **MAD** de las 168 diferencias de la primera semana: **0,905 kWh**.
3. **Z** del 12/09 a las 14:00: 0,6745 × (110,35 − 51,66) / 0,905 = **43,7**.
4. **Cambio:** 58 horas seguidas con z > 3,5 desde el 12/09 14:00, todavía activo. Esperado 2.555,8 kWh, real 5.380,8 kWh: **+110,5%**.
5. **Calidad:** voltaje entre 213,4 y 220,4 V (dentro de ±5%), sin problemas.
6. **Variables:** la corriente sube de 195,9 a 411,1 A (+109,9%) y el FP cae de 0,94 a 0,74. El cambio es físicamente real.
7. **Eventos:** solo hay uno de tipo `UNKNOWN`, que no explica nada → `REAL_ANOMALY`.
8. **Severidad:** +110,5% y activo → `HIGH`.
9. **Confianza:** puntaje 0,997 → 0,5 + 0,45 × 0,997 = **0,95**.
10. **Prioridad:** empata en HIGH con M-112, pero mueve 2.825 kWh de más contra 0 → **#1**.

## Rol de la IA

- **El motor estadístico detecta, clasifica, calcula la confianza y prioriza.** Es determinístico: los mismos datos siempre dan el mismo resultado, y cada paso tiene tests.
- **El LLM se usa para redactar** la explicación y la recomendación a partir de la evidencia ya calculada, con instrucciones de no introducir cifras que no estén en ella. Si no hay API key, se usa una plantilla determinística. Una barrera en el backend rechaza cualquier texto del LLM con cifras que no estén en la evidencia.

Se evitó que el LLM detecte anomalías directamente sobre las lecturas crudas por cuatro razones:
- No sería reproducible.
- No se podría testear.
- Podría inventar cifras.
- No escala a miles de lecturas.

La integración está en `internal/ai` (ver "Run AI Analysis y OpenAI").

## Tests

```bash
go test ./...            # todos
go test -v ./...         # con el nombre de cada test
go test -cover ./...     # con porcentaje de cobertura
go test -run M109 ./...  # solo los que contienen "M109" en el nombre
```

Hay tres tipos de tests:

- **Unitarios, con datos inventados:** mediana, MAD, z robusto, detección de tramos y lógica de eventos (por ejemplo, una parada programada no explica un aumento, y un evento `UNKNOWN` no explica nada).
- **De integración, con los CSV reales:** carga de datos, cambios detectados con inicio, dirección y duración exactos, calidad de datos solo en M-112, y los 4 casos con su tipo, severidad y orden de prioridad.
- **De la API:** login y tokens (contraseña incorrecta, token vencido o firmado con otro secreto), filtros, ordenamientos, paginación y validación de `meter/getAll`, detalle de un medidor, y pruebas de punta a punta con `httptest` (rutas protegidas sin token → 401, dashboard).

> En Windows, Smart App Control puede bloquear algún ejecutable de test según su nombre (pasó con `detect.test.exe`; por eso el paquete se llama `changes`). Si ves `An Application Control policy has blocked this file`, no es un error del código.

`TestAnalyzeRealData` verifica directamente los criterios de evaluación de IA: detectar y priorizar M-109, no escalar M-106 y marcar M-112 como calidad de datos.

## Limitaciones y cómo evolucionaría en producción

- **Baseline fijo.** Se usa la primera semana. En producción: ventana deslizante (por ejemplo, 28 días) que **excluya las horas marcadas como anómalas**, para que una anomalía no se vuelva "lo normal", y rebaseline manual cuando operación confirma un cambio legítimo (caso M-104).
- **Confianza heurística.** Es un puntaje de evidencia. Con casos históricos confirmados se podría calibrar como probabilidad (por ejemplo, con regresión logística).
- **Estacionalidad.** Solo se modela la hora del día. Los datos no muestran diferencias entre días hábiles y fines de semana, y 14 días no alcanzan para modelarlas; con más historia se agregaría el día de la semana.
- **Validación cruzada de voltaje.** Si todos los medidores muestran caídas de voltaje a la vez, el problema es la red; si solo uno, es el medidor. En este dataset, los otros 11 medidores se mantienen estables mientras M-112 salta, lo que refuerza el diagnóstico de calidad de datos.

## Datos

- `readings.csv`: 4.032 lecturas horarias de 12 medidores durante 14 días (consumo, voltaje, corriente y factor de potencia).
- `events.csv`: eventos operativos conocidos.
- `expected_results.csv` (del enunciado) **no está en el repo ni se usa** en ninguna parte del sistema: está reservado al evaluador.
