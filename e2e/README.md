# E2E · Playwright (TypeScript)

Pruebas automatizadas de EnergIA: **API** (con `request`) y **UI** (Chromium con zona horaria `America/Bogota`, la de los operadores, y `UTC` como control).

## Correr la suite (un solo comando)

Requisitos: Node 20+ y la app levantada. Por defecto, la suite apunta al **modo desarrollo** del README: backend en `:8080` y frontend en `:5173`.

```bash
cd e2e
npm run setup     # solo la primera vez: instala dependencias y el Chromium de Playwright
npm test          # corre todo: setup (login) → api → chromium-bogota → chromium-utc
```

Resultado esperado: **79 passed**. Una vez instalado, el comando único es `npm test`. Los comandos son iguales en PowerShell, CMD, macOS y Linux.

| Comando | Qué hace |
|---|---|
| `npm test` | Toda la suite contra el modo desarrollo (`localhost:5173`) |
| `npm run test:smoke` | Solo la suite de humo (13 tests etiquetados `@smoke`, SM-01 a SM-13) |
| `npm run test:docker` | Toda la suite contra Docker (`localhost:3000`) |
| `npm run test:start-app` | Levanta backend y frontend (si no están arriba) y corre la suite (requiere Go 1.26+ y pnpm) |
| `npm run test:api` | Solo los tests de API |
| `npm run test:ui` | Solo UI en Chromium · America/Bogota |
| `npm run test:headed` | UI con el navegador visible |
| `npm run test:all-browsers` | Agrega Firefox y WebKit (antes: `npx playwright install firefox webkit`) |
| `npm run report` | Abre el reporte HTML del último run |
| `npm run ejecuciones` | Corre go test, Vitest, Playwright y requests de API, y guarda las salidas en `qa/evidencias/ejecuciones/` |
| `npm run evidencias` | Regenera las capturas anotadas de `qa/evidencias/DEF-XX/` |

Para otras URLs: copia `.env.example` a `.env` y ajusta `BASE_URL` y `API_URL`.

## Resultado esperado hoy

**Todo en verde.** Los tests que evidencian defectos están marcados con `test.fail()`: Playwright espera que fallen y los cuenta como correctos. Cuando el equipo corrija un defecto, ese test empieza a pasar, Playwright lo reporta como *"expected to fail but passed"* y la suite se pone roja hasta quitar la marca. Así el test sirve de regresión.

| Defecto | Test | Proyecto |
|---|---|---|
| DEF-01 · Hora de planta convertida a la zona del navegador | `tests/ui/timezone.spec.ts` | falla en `chromium-bogota`, pasa en `chromium-utc` |
| DEF-02 · No se puede pasar a la página 2 del libro | `tests/ui/defects.spec.ts` | UI |
| DEF-03 · M-106 (falso positivo) sale como Alerta | `tests/ui/defects.spec.ts`, `tests/api/meters.api.spec.ts` | UI + API |
| DEF-04 · Búsqueda por medidor distingue mayúsculas | `tests/ui/defects.spec.ts`, `tests/api/meters.api.spec.ts` | UI + API |
| DEF-05 · `page` negativo → 500 | `tests/api/meters.api.spec.ts` | API |
| DEF-07 · Tras el login no vuelve al enlace original (intermitente) | `tests/ui/defects.spec.ts` | UI (10 intentos) |

## Estructura

```
e2e/
├── playwright.config.ts     # proyectos, timezoneId, storageState, reporter, webServer
├── data/
│   ├── env.ts               # URLs y credenciales (variables de entorno, con defaults)
│   └── meters.ts            # oráculo: valores esperados tomados de la DOCUMENTACIÓN, no de la API
├── fixtures/test.ts         # extiende `test`: page objects + cliente `api` autenticado (token por worker)
├── scripts/
│   ├── ejecuciones.mjs      # corre las suites y guarda las salidas (UTF-8) en qa/evidencias/ejecuciones
│   └── capturar-evidencias.mjs  # capturas anotadas para qa/evidencias/DEF-XX
├── pages/                   # Page Objects: Login, Dashboard, Meters, MeterDetail, Anomalies, AppShell
└── tests/
    ├── setup/auth.setup.ts  # login UNA vez por la UI → .auth/operador.json (storageState)
    ├── api/                 # smoke (@smoke), auth (negativas, 401, JWT alterado) y meters (límites, filtros, decisión, consistencia)
    └── ui/                  # smoke (@smoke), flujo de negocio, login, anomalías, zona horaria y defectos
```

## Decisiones

- **Locators**: `getByRole` / `getByLabel` / `getByText` en los tests. Hay tres excepciones, todas encapsuladas en los Page Objects:
  - **Celdas de tabla** (`MetersPage.cell`, `AnomaliesPage.cell`): la fila se ubica por su `rowheader` (el ID del medidor). La columna se calcula **en tiempo de ejecución** desde el texto de los `columnheader`, y se toma la celda `th, td` en esa posición. Así, si cambia el orden de las columnas, el test sigue funcionando.
  - **Filas de datos** (`MetersPage.rows`): el segundo `rowgroup` de la tabla, es decir el `tbody` sin la fila de encabezados.
  - **Casillas etiqueta/valor** (`MeterDetailPage.field` y `electrical`): el componente `Field` no tiene semántica (`div` + `span`), así que se ubica la etiqueta por texto y se sube a su contenedor (`xpath=..`). Recomendación al equipo: `<dl>/<dt>/<dd>` o `aria-labelledby`, que además mejora la accesibilidad.
- **Cero esperas fijas**: no hay `waitForTimeout`. Solo `expect` web-first y auto-waiting.
- **Login reutilizable**: el proyecto `setup` guarda la sesión y los proyectos de UI dependen de él. Los tests de login usan un `storageState` vacío.
- **Aserciones de negocio**: prioridad, tipo, severidad, estado y cifras (kWh, %, confianza) comparados contra la documentación. También se compara la API contra la UI.
- **Fallos**: trace, screenshot y video se guardan solo cuando un test falla (`retain-on-failure`). El reporte queda en HTML y en JUnit.
- **Esperas**: los `{ timeout: 3_000 }` de `defects.spec.ts` no son esperas fijas. Son el tope del `expect` web-first, acortado porque esos tests fallan hoy a propósito.
- **CI**: `.github/workflows/qa.yml` levanta la app con `START_APP=1`, corre la suite y sube el reporte como artefacto. Lo simulé localmente con `CI=1 START_APP=1` (la app arranca sola y la suite queda en verde); la primera ejecución real en GitHub ocurre al subir el fork.
