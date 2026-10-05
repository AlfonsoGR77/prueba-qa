# Evidencias

Todas las capturas son **anotadas** y tienen la misma estructura. Las automáticas se generan con Playwright; las marcadas "manual" son capturas mías en Windows + Edge, anotadas con el mismo formato:

1. **Encabezado:** defecto, pantalla o endpoint, y entorno (navegador, zona horaria, locale, resolución, commit, fecha).
2. **Captura** con recuadros numerados sobre el elemento exacto: 🔴 rojo = resultado incorrecto · 🟢 verde = referencia correcta o contexto.
3. **Leyenda** debajo de la captura (fuera de ella, para no tapar la aplicación): `# · Elemento marcado · Esperado · Obtenido · Fuente del esperado`.

Se regeneran con la app arriba: `cd e2e && npm run evidencias` (script `e2e/scripts/capturar-evidencias.mjs`). Las capturas de DEF-06 y DEF-08 salen de `ejecuciones/go-test-defects.txt`, así que conviene correr antes `npm run ejecuciones`.

## Estructura

```
evidencias/
├── DEF-01/   hora de planta corrida −5 h          (4 capturas automáticas: Bogotá + control en UTC, y 1 manual en Windows + Edge)
├── DEF-02/   paginación                           (2 capturas de UI)
├── DEF-03/   FALSE_POSITIVE con estado ALERT      (2 de UI + 1 de API)
├── DEF-04/   búsqueda sensible a mayúsculas       (1 de UI + 1 de API)
├── DEF-05/   page negativo → 500                  (1 de API + log)
├── DEF-06/   límites de severidad                 (1 de test unitario)
├── DEF-07/   deep link perdido tras el login      (1 de UI con los 10 intentos)
├── DEF-08/   hora faltante → fecha 0001-01-01     (1 de test unitario)
├── entorno/  hallazgos de entorno                (E-02: Docker sin virtualización)
└── ejecuciones/   salidas completas de las corridas (texto)
```

## Índice

| Archivo | Defecto | Pantalla / origen | Qué muestra (marcas) |
|---|---|---|---|
| [DEF-01/01-despacho-orden-m109-bogota.png](DEF-01/01-despacho-orden-m109-bogota.png) | DEF-01 | Despacho → tarjeta Orden 1 (M-109) | ① "Detectada 12/09 09:00" · ② texto del motor "desde 12/09 14:00" |
| [DEF-01/02-despacho-orden-m109-utc-control.png](DEF-01/02-despacho-orden-m109-utc-control.png) | DEF-01 (control) | La misma tarjeta con el navegador en UTC | ① y ② coinciden en 14:00 |
| [DEF-01/03-anomalias-columna-detectada-bogota.png](DEF-01/03-anomalias-columna-detectada-bogota.png) | DEF-01 | Anomalías IA → columna "Detectada" | ①–④ las 4 filas, con tabla esperado vs. obtenido |
| [DEF-01/04-detalle-m109-ultima-lectura-bogota.png](DEF-01/04-detalle-m109-ultima-lectura-bogota.png) | DEF-01 | Detalle M-109 → "Última lectura" | ① 14/09 18:00 en vez de 23:00 |
| [DEF-01/05-despacho-edge-windows-manual.png](DEF-01/05-despacho-edge-windows-manual.png) | DEF-01 y DEF-03 | Despacho en **Windows + Edge** (captura manual del QA) | ① "Detectada 12/09 09:00" · ② texto del motor 14:00 · ③ KPI "8 normales · 2 alerta" · ④ M-106 "No escalar" |
| [DEF-02/01-libro-siguiente-deshabilitado.png](DEF-02/01-libro-siguiente-deshabilitado.png) | DEF-02 | Medidores → paginación | ① "1–10 de 12" · ② botón "Siguiente" deshabilitado |
| [DEF-02/02-libro-pagina-2-solo-por-url.png](DEF-02/02-libro-pagina-2-solo-por-url.png) | DEF-02 | `/medidores?pagina=2` | ① M-111 y M-112 · ② "11–12 de 12" |
| [DEF-03/01-libro-filtro-alertas-incluye-m106.png](DEF-03/01-libro-filtro-alertas-incluye-m106.png) | DEF-03 | Medidores → pestaña "Alertas" | ① filtro · ② estado de M-106 · ③ tipo "Falso positivo" |
| [DEF-03/02-despacho-kpi-cuenta-m106-como-alerta.png](DEF-03/02-despacho-kpi-cuenta-m106-como-alerta.png) | DEF-03 | Despacho → "Estado de la planta" | ① "No escalar" · ② "8 normales · 2 alerta" |
| [DEF-03/03-api-m106-status-alert.png](DEF-03/03-api-m106-status-alert.png) | DEF-03 | API `getById/M-106` y `getSummary` | ① anomaly_type · ② status · ③ status_counts |
| [DEF-04/01-libro-busqueda-minusculas-sin-resultados.png](DEF-04/01-libro-busqueda-minusculas-sin-resultados.png) | DEF-04 | Medidores → buscador | ① "m-109" · ② sin resultados |
| [DEF-04/02-api-busqueda-sensible-a-mayusculas.png](DEF-04/02-api-busqueda-sensible-a-mayusculas.png) | DEF-04 | API `getAll` | ① mayúsculas · ② minúsculas · ③ control getById |
| [DEF-05/01-api-page-negativo-responde-500.png](DEF-05/01-api-page-negativo-responde-500.png) | DEF-05 | API `getAll` con page −1 | ① HTTP 500 · ② panic en el log · ③ control size 101 → 400 |
| [DEF-06/01-unit-test-limites-de-severidad.png](DEF-06/01-unit-test-limites-de-severidad.png) | DEF-06 | `go test -tags defects` | ①–③ los 3 valores límite que fallan |
| [DEF-07/01-login-desde-enlace-termina-en-despacho.png](DEF-07/01-login-desde-enlace-termina-en-despacho.png) | DEF-07 | Login desde `/medidores/M-104` | ① terminó en Despacho; nota con los 10 intentos |
| [DEF-08/01-unit-test-hora-faltante-fecha-cero.png](DEF-08/01-unit-test-hora-faltante-fecha-cero.png) | DEF-08 | `go test -tags defects` | ① detected_at 0001-01-01 |
| [entorno/E-02-docker-sin-virtualizacion.png](entorno/E-02-docker-sin-virtualizacion.png) | E-02 (entorno) | Docker Desktop en Windows | ① "Virtualization support not detected" · ② "Engine stopped" |

## Ejecuciones (texto)

Se generan con `cd e2e && npm run ejecuciones`, con la app arriba. Cada archivo empieza con un encabezado que registra el comando, el resultado esperado, el código de salida, la fecha, el SO y las versiones de Go, Node y pnpm.

| Archivo | Comando | Resultado esperado |
|---|---|---|
| [ejecuciones/go-test-normal.txt](ejecuciones/go-test-normal.txt) | `cd backend && go test ./...` | Todo `ok` |
| [ejecuciones/go-test-cover.txt](ejecuciones/go-test-cover.txt) | `go test -cover ./...` | Cobertura por paquete |
| [ejecuciones/go-test-defects.txt](ejecuciones/go-test-defects.txt) | `go test -tags defects ./internal/...` | 7 tests fallan (DEF-03, 04, 05, 06, 08) |
| [ejecuciones/vitest-verbose.txt](ejecuciones/vitest-verbose.txt) | `cd frontend && pnpm vitest run --reporter=verbose` | 17 passed · 4 expected fail |
| [ejecuciones/playwright-run.txt](ejecuciones/playwright-run.txt) | `cd e2e && npx playwright test --reporter=list` | 79 passed (incluye los `test.fail`) |
| [ejecuciones/api-requests.md](ejecuciones/api-requests.md) | requests a la API (con su equivalente en curl) | Requests y responses de DEF-03, 04 y 05 |
| [ejecuciones/go-cover-gaps-original.txt](ejecuciones/go-cover-gaps-original.txt) | `go test -coverpkg=./internal/...` **sin** los tests QA | Funciones con < 70 % · total 84,2 % (medición única, sobre la suite original del equipo) |
