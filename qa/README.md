# Entrega · Prueba técnica QA — EnergIA

| | |
|---|---|
| **Candidato** | Alfonso González |
| **Build probado** | commit `15765d9` de `biaenergy/prueba-qa` |
| **Video (≤ 15 min)** | https://youtu.be/y5NR9Tyr6_E |
| **Veredicto** | **No liberar todavía.** Ver el [resumen ejecutivo](01-plan-de-pruebas.md#resumen-ejecutivo) |

## Resultado en una tabla

| Actividad | Resultado |
|---|---|
| Smoke | 13 / 13 ✅. El build se puede probar |
| Caja negra | 24 casos en Gherkin · 16 ✅ · 8 ❌ |
| Defectos | 8: 2 Alta · 4 Media · 2 Baja (+2 hallazgos de entorno) |
| Caja blanca | 8 módulos revisados · 8 archivos de test nuevos · cobertura de `classify` de 6,9 % a 73,3 % |
| Playwright | 79 tests (13 de humo + API + UI · Bogotá y UTC) · todos en verde, con los defectos marcados `test.fail()` |

## Cómo leer la entrega (en orden)

| # | Documento | Qué contiene |
|---|---|---|
| 1 | [01-plan-de-pruebas.md](01-plan-de-pruebas.md) | Resumen ejecutivo, alcance, riesgos priorizados, tipos de prueba por capa, criterios de entrada y salida |
| 2 | [02-smoke.md](02-smoke.md) | Criterio de selección, 13 escenarios Gherkin y resultados |
| 3 | [03-casos-caja-negra.md](03-casos-caja-negra.md) | Particiones, valores límite y tablas de decisión → matriz de 24 casos → cada caso en Gherkin con su resultado y evidencia |
| 4 | [04-caja-blanca.md](04-caja-blanca.md) | Ramas y condiciones por módulo, análisis de los tests existentes, tests nuevos |
| 5 | [05-defectos.md](05-defectos.md) | Una ficha por defecto: severidad/prioridad, reproducción Gherkin, dónde mirar, capturas anotadas, causa raíz, test que lo detecta |
| — | [features/](features/) | Los escenarios Gherkin como archivos `.feature` (generados desde 02 y 03) |
| — | [evidencias/](evidencias/README.md) | Capturas anotadas por defecto y salidas de las ejecuciones, con índice |
| — | [../e2e/README.md](../e2e/README.md) | Suite de Playwright: estructura y cómo correrla con un comando |
| — | [Entorno](#entorno-de-ejecución) · [Uso de IA](#uso-de-ia) | Más abajo en este archivo |

## Estructura

```
qa/
├── README.md                     ← este archivo
├── 01-plan-de-pruebas.md
├── 02-smoke.md
├── 03-casos-caja-negra.md
├── 04-caja-blanca.md
├── 05-defectos.md
├── features/                     ← Gherkin (.feature)
│   ├── 00-smoke.feature
│   ├── 01-autenticacion.feature
│   ├── 02-paginacion.feature
│   ├── 03-filtros-busqueda-orden.feature
│   ├── 04-reglas-de-negocio.feature
│   ├── 05-consistencia-entre-capas.feature
│   └── 06-sesion-y-analisis.feature
└── evidencias/
    ├── README.md                 ← índice: qué marca cada captura
    ├── DEF-01/ … DEF-08/         ← capturas anotadas por defecto
    └── ejecuciones/              ← salidas de go test, vitest, playwright y requests de API
```

## Entorno de ejecución

Ejecuté las pruebas en dos entornos. Los resultados coinciden en ambos.

| Elemento | Equipo del QA (principal) | Entorno de apoyo (Linux, usado con la IA) |
|---|---|---|
| SO | Windows (x64) | Linux x86_64 |
| Modo de la app | Desarrollo: `go run ./cmd/api` (:8080) + `pnpm dev` (:5173) | Igual |
| Backend | Go 1.27.1 · sin `OPENAI_API_KEY` (narrador = motor) | Go 1.26.6 |
| Frontend / E2E | Node 24.21 · pnpm 10.34 · Vite 8 | Node 22.22 · pnpm 10.28 |
| Navegador | Microsoft Edge (exploración manual) · Chromium 141 de Playwright 1.56.1 (automatización) | Chromium 141 de Playwright |
| Zona horaria | `America/Bogota` (UTC-5); control en `UTC` | Igual (`timezoneId`) |
| Resultado Playwright | **79/79 passed** | 79/79 passed |

**Hallazgos de entorno** (no son defectos del producto; se documentan como pide la prueba):

- **E-01.** `backend/go.mod` exige `go 1.26.0`. Con un Go anterior y sin acceso a `proxy.golang.org`, `go run` intenta descargar el toolchain y falla. Sugerencia: decir en el README "Go 1.26+ **obligatorio**".
- **E-02.** En mi equipo Windows, Docker Desktop no arranca: muestra *"Virtualization support not detected"* porque la virtualización por hardware (VT-x/AMD-V) está desactivada en la BIOS. **Decisión:** usar el modo desarrollo del README, que ejecuta el mismo código. El `docker-compose.yml` no se pudo validar. Sugerencia: decirlo en los requisitos del README. Evidencia: [`evidencias/entorno/E-02-docker-sin-virtualizacion.png`](evidencias/entorno/E-02-docker-sin-virtualizacion.png).

## Uso de IA

Usé **Claude** (asistente de IA) de forma intensiva y lo declaro con detalle:

| La IA hizo | Yo hice |
|---|---|
| Leer la documentación y el código, y proponer la estrategia, los riesgos y la matriz de casos | Definir el enfoque y el formato de la entrega: Gherkin, capturas anotadas con esperado/obtenido, orden de carpetas |
| Explorar la API y la UI en un entorno Linux y encontrar candidatos a defecto | Levantar la app en mi equipo Windows y reproducir los defectos en mi navegador |
| Escribir los tests (Go, Vitest, Playwright) y los scripts de evidencias | Ejecutar la suite en mi equipo (79/79) y revisar cada documento |
| Redactar los borradores de los documentos | Validar severidad, prioridad y el veredicto de liberación |

**Controles para no confiar a ciegas en la IA:**

1. Cada defecto tiene un test automatizado que **falla hoy** (`test.fail()`, `it.fails` o build tag `defects`). Se comprobó, en una copia aparte y sin tocar el repo, que el test cambia de estado cuando el defecto se corrige.
2. Todo se ejecutó en dos entornos con el mismo resultado.
3. Verifiqué con Git que **no se modificó código de la aplicación**: `git diff --name-status 15765d9..HEAD` solo muestra archivos agregados (`A`).

## Cómo reproducir todo

Requisitos: Git, Go 1.26+, Node 20+ y pnpm. Docker es opcional. Los comandos sirven en PowerShell, CMD, macOS y Linux.

```bash
# 1. App en modo desarrollo: dos terminales que quedan abiertas
cd backend  && go run ./cmd/api          # http://localhost:8080
cd frontend && pnpm install && pnpm dev  # http://localhost:5173
#    (alternativa con Docker: docker compose up -d --build → http://localhost:3000)

# 2. Tests unitarios
cd backend  && go test ./...                         # verde
cd backend  && go test -tags defects ./internal/...  # 7 tests fallan a propósito (defectos)
cd frontend && pnpm test                             # 17 passed | 4 expected fail

# 3. Playwright (tercera terminal)
cd e2e && npm run setup     # solo la primera vez
npm test                    # 79 passed  ·  solo humo: npm run test:smoke  ·  con Docker: npm run test:docker
npm run report              # reporte HTML

# 4. Regenerar la evidencia en el equipo que ejecuta (con la app arriba)
npm run ejecuciones         # salidas de go test, vitest, playwright y API → qa/evidencias/ejecuciones/
npm run evidencias          # capturas anotadas → qa/evidencias/DEF-XX/
```

## Qué agregué al repo (sin tocar código de la aplicación)

- `qa/`: esta documentación, los `.feature` y la evidencia.
- `e2e/`: Playwright (TypeScript) con Page Objects, fixtures, `storageState`, tests de API, proyectos Bogotá y UTC, reporte HTML con trace y video en los fallos, y los scripts que regeneran la evidencia (`npm run ejecuciones`, `npm run evidencias`).
- `.github/workflows/qa.yml`: CI que corre Go, Vitest y Playwright, levanta la app y sube el reporte.
- Tests unitarios nuevos en `backend/internal/**` (`*_qa_test.go`, `paging_test.go`, `*_defects_test.go` con build tag `defects`) y en el frontend (`format.tz.test.ts`, `Pagination.test.tsx`).
