# 01 · Estrategia y plan de pruebas — EnergIA

**Build:** commit `15765d9` · **Fechas de ejecución:** 3 y 4 oct 2026 · **Autor:** Alfonso González (QA)

## Resumen ejecutivo

**No liberaría este build a producción.** El motor de anomalías está bien: clasifica, prioriza y explica los 4 casos tal como dice la documentación, y su lógica central tiene buenos tests. Los problemas están en lo que **ve el operador**:

1. **DEF-01 (Alta):** en Colombia, todas las horas de planta aparecen **5 horas antes**, y en 3 de las 4 anomalías también cambia el **día**. En la misma tarjeta se lee "Detectada 12/09 09:00" junto a "desde 12/09 14:00". Una persona que va a revisar en sitio no puede saber cuál de las dos es la correcta.
2. **DEF-02 (Alta):** el Libro de medidores no deja pasar a la página 2. M-111 y **M-112 (crítica)** no se pueden alcanzar con los controles.
3. **DEF-03 (Media):** M-106, el falso positivo, aparece como "Alerta" aunque la regla dice NORMAL. Eso infla el KPI y contradice el "No escalar" que la misma app recomienda.

Los tres tienen arreglos de una línea, y ya existen tests automatizados que pasarán cuando se corrijan. Con DEF-01, DEF-02 y DEF-03 resueltos y la suite en verde, **sí** liberaría.

**Riesgos que siguen abiertos:** DEF-04 (la búsqueda distingue mayúsculas), DEF-05 (`page` negativo devuelve 500), DEF-06 (los límites de severidad no coinciden con la documentación), DEF-07 (después del login no siempre se vuelve al enlace original) y DEF-08 (una sola hora faltante genera una anomalía con fecha 0001-01-01). Tampoco probé el narrador con OpenAI (no tenía API key), el despliegue con Docker (ver E-02), la carga ni la seguridad a fondo. Detalle en [05-defectos.md](05-defectos.md).

## 1. Alcance

| Dentro | Fuera (y por qué) |
|---|---|
| API REST `/api/v1` completa: auth, meters, anomalies, dashboard, ai | **Narrador OpenAI** (`OPENAI_API_KEY`): no tenía key. Sí revisé la barrera anti-cifras por código y sus tests |
| UI: Login, Despacho, Libro de medidores, Detalle, Anomalías IA, Investigación, Run AI Analysis | **Rendimiento y carga**: son 12 medidores en memoria. No es el riesgo de un MVP |
| Reglas de negocio del motor (tipo, estado, severidad, confianza, prioridad) | **Seguridad a fondo** (pentest, rate limiting). Solo hice negativas de auth y de JWT |
| Consistencia entre la documentación, la API y la UI | **Accesibilidad completa** (WCAG). Solo observé roles y nombres accesibles al automatizar |
| Zona horaria `America/Bogota` (la de los usuarios) | **Otros navegadores**: corrí Chromium. Firefox y WebKit quedan configurados (`ALL_BROWSERS=1`) |
| Caja blanca: `meter`, `httpx/paging`, `classify`, `quality`, `frontend/lib/format`, `Pagination`, `LoginRoute` | **Despliegue con Docker**: Docker Desktop no arranca en mi equipo (E-02). Usé el modo desarrollo, que el README ofrece como alternativa |

## 2. Análisis de riesgos (impacto × probabilidad)

| # | Área | Si falla… | Impacto | Prob. | Prioridad |
|---|---|---|---|---|---|
| R1 | **Clasificación y priorización del motor** | El operador escala un falso positivo o ignora una anomalía real | Alto | Media | **P1** |
| R2 | **Estado del medidor (tipo + severidad → estado)** y KPI | Alertas falsas, desconfianza en la herramienta | Alto | Media | **P1** |
| R3 | **Fechas y horas de planta** (zona horaria) | Investigación en sitio en la hora o el día equivocados | Alto | Alta (usuarios en UTC-5) | **P1** |
| R4 | **Navegación del libro: filtros, búsqueda, paginación** | Un medidor crítico queda "invisible" | Alto | Media | **P1** |
| R5 | Autenticación y protección de rutas | Acceso no autorizado o sesión rota | Alto | Baja | P2 |
| R6 | Validación de entradas de la API | Errores 500 o respuestas inconsistentes | Medio | Media | P2 |
| R7 | Run AI Analysis (asincronía, concurrencia) | Análisis colgados o duplicados | Medio | Baja | P3 |
| R8 | Formato es-CO de números | Lecturas mal interpretadas | Medio | Baja | P3 |

## 3. Tipos de prueba por capa

Los casos de humo y de caja negra están escritos en **Gherkin (español)**: `Característica` → `Antecedentes` → `Escenario` / `Esquema del escenario` con `Ejemplos`. Cada escenario lleva etiquetas de ID, capa, técnica y prioridad. Los mismos escenarios están como archivos `.feature` en [`features/`](features/).

| Tipo | Capa | Técnica / herramienta | Dónde |
|---|---|---|---|
| Humo | API + UI | Checklist mínimo, curl + Playwright | [02-smoke.md](02-smoke.md) |
| Funcional de caja negra | API | Partición de equivalencia, valores límite, tablas de decisión, negativas · curl y Playwright `request` | [03](03-casos-caja-negra.md), `e2e/tests/api` |
| Funcional de caja negra | UI | Flujos de negocio y consistencia entre capas · Playwright con `timezoneId` | [03](03-casos-caja-negra.md), `e2e/tests/ui` |
| Caja blanca | Unitario (Go / Vitest) | Revisión de ramas y condiciones, cobertura `-coverpkg`, tests nuevos | [04-caja-blanca.md](04-caja-blanca.md) |
| Regresión de defectos | Unitario + E2E | Tests con `test.fail()` / `it.fails` / build tag `defects` | [05-defectos.md](05-defectos.md) |
| Exploratoria | UI | Sesiones cortas guiadas por riesgo (R3, R4) | Hallazgos DEF-01, DEF-02 y DEF-07 |

## 4. Criterios de entrada y salida

**Entrada:** la app levanta (`/health` 200 y el frontend responde), el login funciona, la documentación está disponible como oráculo y **la suite de humo pasa completa** (si no, el build vuelve a desarrollo sin seguir probando).

**Salida (para recomendar la liberación):**

- Smoke 100 %. Casos P1 ejecutados al 100 %.
- **0 defectos abiertos de severidad Alta**, y ninguno Medio sobre R1–R4.
- `go test ./...`, `pnpm test` y la suite de Playwright en verde. Los tests de defectos con `test.fail()` deben "fallar como se espera" o haberse convertido en tests normales al corregir el defecto.
- Los riesgos que quedan abiertos están documentados y aceptados por el Product Owner.

**Estado actual:** no se cumplen los criterios de salida (2 defectos Altos y 1 Medio sobre R2).

## 5. Entorno y uso de IA

El entorno de ejecución (Windows del QA y Linux de apoyo), los hallazgos de entorno E-01 y E-02 y la declaración de uso de IA están en el [README de la entrega](README.md#entorno-de-ejecución), para que este plan no pase de 2 páginas.
