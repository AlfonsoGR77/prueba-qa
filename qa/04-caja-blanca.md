# 04 · Pruebas de caja blanca

Revisé el código después de la caja negra, con dos objetivos: **explicar la causa raíz** de lo que encontré y **buscar lo que la caja negra no alcanza** (ramas que el dataset no recorre).

## 1. Módulos elegidos y por qué

| Módulo | Riesgo (ver plan §2) | Por qué |
|---|---|---|
| `backend/internal/meter` (`enums.go`, `service.go`, `dto.go`) | R2, R4 | Convierte el resultado del motor en lo que ve el operador (estado), y además filtra y busca |
| `backend/internal/httpx/paging.go` | R4, R6 | Toda la paginación pasa por aquí |
| `backend/internal/analysis/classify` + `quality` | R1 | Reglas de negocio del motor. `classify` tiene solo **6,9 %** de cobertura propia |
| `frontend/src/lib/format.ts` | R3 | Todas las fechas de la UI salen de aquí |
| `frontend/src/features/meters/components/Pagination.tsx` | R4 | Navegación del libro |
| `frontend/src/app/routes/LoginRoute.tsx` + `useLoginForm.ts` | R5 | Redirección después del login |

## 2. Hallazgos por módulo (ramas, condiciones, casos borde)

### 2.1 `meter/enums.go` · `StatusOf` (líneas 29–38) → DEF-03

```go
switch {
case a == nil:                         return StatusNormal
case a.Severity == model.SeverityHigh: return StatusCritical
default:                               return StatusAlert
}
```

- El comentario de la función (líneas 25–28) dice "sin anomalía, **o falso positivo**: NORMAL", pero **no existe una rama para `TypeFalsePositive`**. La condición solo mira la severidad.
- Tabla de ramas: `nil` ✔ cubierta · HIGH ✔ · MEDIUM ✔ · LOW ✔ · **FALSE_POSITIVE ✘ (no existe)**.
- `TestStatusOf` prueba "severidad baja → ALERT", que es correcto para una anomalía real LOW, pero no prueba el tipo. **El test valida el código, no la regla.**
- Arreglo sugerido: `case a == nil || a.Type == model.TypeFalsePositive: return StatusNormal`.

### 2.2 `meter/service.go:59` · búsqueda → DEF-04

`strings.Contains(sm.MeterID, search)` distingue mayúsculas. `dto.go` normaliza `Status` (ToUpper) y `SortBy` (ToLower), pero **a `MeterID` solo le hace `TrimSpace`**. El comentario de `Filter.MeterID` (dto.go:26) promete "sin importar mayúsculas". Los tests usan "109" y "M-11", nunca minúsculas.
Arreglo: `strings.Contains(strings.ToUpper(sm.MeterID), strings.ToUpper(search))`, o normalizar en `Normalize()`.

### 2.3 `httpx/paging.go` · `Normalize` (líneas 23–36) y `Paginate` (47–56) → DEF-05

- `Normalize` valida `Size` en [1,100], pero para `Page` solo reemplaza el 0. **Falta la rama `Page < 0`.**
- `Paginate`: `start := min((p.Page-1)*p.Size, len(items))` → con page −1 y size 10, `start = −20` → `items[-20:…]` → **panic**. El middleware `Recover` lo convierte en 500 (por eso el servidor no se cae).
- Valores límite del cálculo: page=0 (normalizado) ✔ · 1 ✔ · fuera de rango ✔ (`min` lo acota) · **negativo ✘**.

### 2.4 `analysis/classify/classify.go:219–229` · `realSeverity` → DEF-06

`p >= 50 && c.Ongoing` y `p >= 20`. La documentación (§8) dice "**supera** 50 %" y "**supera** 20 %" (estricto). En el límite exacto (50,0 % o 20,0 %) el código da una severidad más alta que la documentada. El dataset no tiene valores en el límite (M-109 = 110,5 %), así que la caja negra no puede verlo. Además, `math.Abs` hace que las caídas también cuenten (−50 % activo → HIGH), algo que la documentación no menciona.

### 2.5 `analysis/quality/quality.go:36–38` · `HasIssue` → DEF-08 (latente)

`FlaggedHours >= 3 || MissingHours > 0 || DuplicateReadings > 0`. Con **una sola hora faltante** y ninguna sospechosa, el medidor pasa a DATA_QUALITY, pero `FirstFlagged` y `LastFlagged` quedan en cero. Resultado (confirmado con un test): `detected_at = 0001-01-01`, el texto "Hay 0 h con lecturas eléctricas incoherentes desde 01/01 00:00" y una ventana vacía para las variables. El dataset no tiene huecos; en producción, una hora perdida es muy común.

### 2.6 `frontend/src/lib/format.ts:55–58` · `formatPlantTime` → DEF-01

```ts
return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
```

El comentario de las líneas 51–52 dice "Se leen las partes **UTC**", pero usa `getDate/getHours` (hora **local**). Las funciones vecinas `formatPlantDate` y `formatPlantDay` sí usan `getUTC*`, lo que confirma que es un descuido. Se usa en 9 componentes (Despacho, Libro, Detalle, Anomalías, Investigación, EventList, WindowFacts, gráfica horaria).

**Por qué no lo detectaron los tests:** `vite.config.ts:33` → `test.env: { TZ: 'UTC' }`. En UTC, local = UTC, así que `format.test.ts` pasa **para cualquier implementación**. Es un test que no puede fallar: el entorno de prueba es distinto del entorno real de los usuarios (UTC-5).

### 2.7 `Pagination.tsx:13` → DEF-02

`const pages = Math.max(1, Math.floor(count / size))` → floor(12/10) = 1, así que "Siguiente" queda deshabilitado (`page >= pages`). Debe ser `Math.ceil`. Valores límite: count = 0, 9 y 10 funcionan bien; **11 y 12 fallan** (cualquier count que no sea múltiplo de size).

### 2.8 `LoginRoute.tsx:13` + `useLoginForm.ts:31` → DEF-07

Hay dos navegaciones compitiendo: `actions.login()` hace `setToken()`, que re-renderiza `LoginRoute`, y como el estado ya es `authenticated` responde con `<Navigate to="/">` **ignorando `location.state.from`**. Mientras tanto, `useLoginForm` hace `navigate(from)` cuando se resuelve el `await`. Gana la que llegue primero. Medido: ~70 % de los intentos termina en `/` (29 de 41, en 3 corridas).
Arreglo: en `LoginRoute`, `<Navigate to={location.state?.from ?? paths.dashboard} replace />`.

## 3. Tests existentes: qué cubren y cuánto confío en ellos

### Backend (`go test ./...` → todo verde)

| Paquete | Cobertura propia (suite original, antes de mis tests) | Qué cubre | Qué NO cubre |
|---|---|---|---|
| analysis (integración) | 100 % | Los 4 casos con el CSV real: tipo, severidad y orden | Datos sintéticos de borde |
| analysis/classify | **6,9 %** | Solo `explainingEvent` (eventos y ventana) | `Change`, `DataQuality`, `realSeverity`, `confidence`: se ejercitan solo de forma indirecta con 4 casos |
| analysis/quality | 89,7 % | Voltaje, FP, valores inválidos | Huecos y duplicados en combinación con 0 horas sospechosas (DEF-08) |
| analysis/stats, baseline, changes | 80–90 % | Mediana, MAD, z, tramos | `Biggest` con varios cambios (60 %) |
| meter | 79,6 % | Filtros, orden, paginación positiva, getById | FALSE_POSITIVE → estado, minúsculas, page negativo |
| httpx | **0 %** propia | — | Paginación y validación (solo se prueban indirectamente) |
| auth | 28,3 % | Login, token vencido u otro secreto | Handler `Me`, `UserFrom` |
| server (E2E con httptest) | 78,9 % | 401 sin token, flujos principales | — |
| anomaly, dashboard, store, config.Load | 0 % | — | Todo |

Con mis tests agregados, la cobertura propia sube en `classify` (6,9 % → 73,3 %) y en `httpx` (0 % → 18,3 %); ver [`ejecuciones/go-test-cover.txt`](evidencias/ejecuciones/go-test-cover.txt).

Cobertura **real** con `-coverpkg=./internal/...`: **84,2 %** (detalle en [`evidencias/ejecuciones/go-cover-gaps-original.txt`](evidencias/ejecuciones/go-cover-gaps-original.txt)). El número es alto porque los tests de integración pasan por casi todo el código, pero **cobertura de líneas no es cobertura de reglas**: los defectos DEF-03, 04, 05 y 06 están en líneas "cubiertas".

### Frontend (`pnpm test` → 11 tests verdes)

- `format.test.ts`: formato es-CO y hora de planta, **anulado por `TZ=UTC`** (ver 2.6).
- `useMeterFilters.test.ts`: parseo de la URL, bien diseñado (incluye inválidos).
- `marks.test.tsx`: accesibilidad de los sellos (el estado no depende solo del color).
- Sin tests: `Pagination`, rutas, `AuthProvider` y `LoginRoute`, y no hay ningún test de componente con datos de la API.

### ¿Confío en ellos?

**En el motor, sí.** Los tests de integración fijan los 4 resultados del enunciado y los unitarios de estadística son sólidos. **En la capa de presentación (estado, búsqueda, paginación, fechas), no.** Los tests verifican lo que el código hace, no lo que dice la documentación, y el test de fechas corre en un entorno (UTC) que oculta justo el riesgo principal (usuarios en UTC-5). Los 8 defectos pasaron con la suite en verde.

## 4. Tests que agregué

No modifiqué código de la aplicación. Solo agregué tests nuevos:

| Archivo | Qué prueba | Estado hoy |
|---|---|---|
| `backend/internal/httpx/paging_test.go` | Valores límite de la paginación (8 casos) | ✅ verde (regresión) |
| `backend/internal/analysis/classify/classify_qa_test.go` | **Tabla de decisión** completa de `Change()`: 6 combinaciones evento × dirección × normalizado → tipo, severidad, anomaly, rango de confianza | ✅ verde (sube la cobertura de `classify` de 6,9 % a 73,3 %) |
| `backend/internal/meter/defects_test.go` · tag `defects` | DEF-03 (tabla tipo × severidad → estado), DEF-04 (minúsculas), DEF-05 (page < 0) | ❌ falla hasta que se corrijan |
| `backend/internal/httpx/paging_defects_test.go` · tag `defects` | DEF-05: `Paginate` no debe hacer panic | ❌ |
| `backend/internal/analysis/classify/severity_defects_test.go` · tag `defects` | DEF-06: límites 50 % y 20 % | ❌ |
| `backend/internal/analysis/quality_defects_test.go` · tag `defects` | DEF-08: una hora faltante no debe dar `detected_at` 0001-01-01 | ❌ |
| `frontend/src/lib/format.tz.test.ts` | DEF-01 con `vi.stubEnv('TZ','America/Bogota')` · `it.fails` | ✅ "expected fail" |
| `frontend/src/features/meters/components/Pagination.test.tsx` | Valores límite (0, 9, 10, 20) + DEF-02 (11 y 12) · `it.fails` | ✅ + "expected fail" |

```bash
cd backend && go test ./...                         # verde: suite del equipo + QA
cd backend && go test -tags defects ./internal/...  # 7 tests fallan: DEF-03, 04, 05, 06 y 08
cd frontend && pnpm test                            # 17 passed | 4 expected fail
```

**Por qué un build tag en Go:** Go no tiene un equivalente a `test.fail()`. El tag mantiene verde `go test ./...` (el CI del equipo) y deja los tests listos: cuando se corrija un defecto, se quita el tag de ese archivo y el test pasa a ser de regresión.

**Recomendaciones para la suite del equipo:**

1. Quitar `TZ: 'UTC'` de `vite.config.ts` o correr los tests de fechas en **varias** zonas (UTC, America/Bogota, Asia/Tokyo).
2. Escribir tests desde las tablas de la documentación (estado, severidad), no desde el código.
3. Agregar tests de propiedades para la paginación (para todo count y size, la suma de filas de todas las páginas = count).
4. Agregar tests de datos sintéticos con huecos y duplicados en `analysis`.
