# 03 · Casos de prueba de caja negra (UI + API)

| | |
|---|---|
| **Build** | commit `15765d9` |
| **Ejecución** | 3–4 oct 2026 · Windows (equipo del QA) y Linux · Chromium 141 de Playwright + Microsoft Edge · zona horaria `America/Bogota` · locale `es-CO` |
| **Oráculo** | README.md · backend/README.md · frontend/README.md · frontend/PRODUCT.md · Swagger `/docs` |
| **Diseño** | Solo desde la documentación, **sin mirar el código** (la caja blanca está en [04](04-caja-blanca.md)) |
| **Formato** | Gherkin en español. Los mismos escenarios están como archivos `.feature` en [`features/`](features/) |
| **Resultado** | 24 casos · **16 ✅ Pasa · 8 ❌ Falla** (6 defectos distintos) · 23 automatizados en Playwright |

## Contenido

1. [Cómo leer cada caso](#1-cómo-leer-cada-caso)
2. [Análisis previo por técnica](#2-análisis-previo-por-técnica)
3. [Matriz de casos](#3-matriz-de-casos)
4. [Casos detallados](#4-casos-detallados)
   - [F1 · Autenticación](#f1--autenticación) (CN-01 a CN-05)
   - [F2 · Paginación](#f2--paginación) (CN-06 a CN-08)
   - [F3 · Filtros, búsqueda y orden](#f3--filtros-búsqueda-y-orden) (CN-09 a CN-12)
   - [F4 · Reglas de negocio del motor](#f4--reglas-de-negocio-del-motor) (CN-13 a CN-16)
   - [F5 · Consistencia entre capas](#f5--consistencia-entre-capas-doc--api--ui) (CN-17 a CN-21)
   - [F6 · Sesión y análisis](#f6--sesión-y-análisis) (CN-22 a CN-24)
5. [Observaciones sin defecto](#5-observaciones-sin-defecto)

---

## 1. Cómo leer cada caso

La prueba sugiere el formato *ID · Título · Precondición · Pasos · Datos · Resultado esperado · Resultado obtenido · Estado*. En Gherkin cada campo tiene su lugar:

| Campo sugerido | Dónde está en cada caso |
|---|---|
| ID y título | Encabezado `CN-XX · …` y etiqueta `@CN-XX` del escenario |
| Precondición | `Antecedentes` de la característica + pasos `Dado` |
| Pasos | `Cuando` / `Y` |
| Datos | Valores en el paso o tabla `Ejemplos` |
| Resultado esperado | `Entonces` / `Y` / `Pero` |
| Resultado obtenido y estado | Bloque **Resultado** debajo del escenario, con enlace a la evidencia |

Etiquetas: `@api` / `@ui` (capa) · `@particion` `@valores-limite` `@tabla-decision` `@negativa` `@consistencia` (técnica) · `@P1`/`@P2`/`@P3` (prioridad por riesgo, ver [plan §2](01-plan-de-pruebas.md#2-análisis-de-riesgos-impacto--probabilidad)) · `@DEF-XX` (defecto que encontró).

---

## 2. Análisis previo por técnica

### 2.1 Partición de equivalencia y valores límite: paginación (`POST /meter/getAll`)

Documentado en Swagger: `size` con `minimum: 1` y `maximum: 100`; `page` con `minimum: 1`. El 0 significa "no enviado" (page 1, size 10).

| Parámetro | Clases válidas | Clases inválidas | Valores límite probados |
|---|---|---|---|
| `size` | 1–100 · 0 (= default) | < 0 · > 100 · decimal · texto | −1 · 0 · 1 · 100 · 101 · 10.5 |
| `page` | ≥ 1 · 0 (= default) · más allá del final (→ `[]`) | < 0 · texto | −5 · −1 · 0 · 1 · 2 · 3 · 4 |
| UI (12 medidores, 10 por página) | 2 páginas | — | count = 9 · 10 · 11 · 12 |

### 2.2 Partición de equivalencia: filtros y login

| Entrada | Clases válidas | Clases inválidas |
|---|---|---|
| `status` | `NORMAL` · `ALERT` · `CRITICAL` · minúsculas | `ROJO` → 400 |
| `meter_id` | exacta (`M-109`) · parcial (`109`, `M-1`) · **minúsculas** (`m-109`) · sin coincidencia (`xyz`) | > 50 caracteres → 400 |
| `sort_by` × `sort_order` | 4 campos × `ASC`/`DESC` | `foo`, `XYZ` → 400 |
| Login | credenciales correctas · email con mayúsculas o espacios | contraseña incorrecta · usuario inexistente · vacíos · body no-JSON |

### 2.3 Tablas de decisión: reglas del motor

**TD-1 · Clasificación (backend/README §7) y severidad (§8)**

| Condición | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| ¿Variables eléctricas incoherentes? | **S** | N | N | N | N |
| ¿Cambio sostenido (≥ 6 h)? | – | S | S | S | N |
| ¿Un evento lo explica (tipo y dirección)? | – | S | S | N | – |
| ¿El consumo volvió a lo normal? | – | S | N | – | – |
| **Tipo** | DATA_QUALITY | FALSE_POSITIVE | EXPLAINABLE | REAL | sin anomalía |
| **Severidad** | HIGH si ≥ 12 h sospechosas, si no MEDIUM | LOW | MEDIUM | HIGH si > 50 % y activo · MEDIUM si > 20 % · si no LOW | – |
| **Caso del dataset** | M-112 | M-106 | M-104 | M-109 | los otros 8 |

**TD-2 · Estado de alerta (backend/README, tabla "Estado de alerta")**

| Resultado del motor | Sin anomalía | FALSE_POSITIVE (cualquier severidad) | Severidad HIGH | Otra anomalía |
|---|---|---|---|---|
| **Estado** | NORMAL | **NORMAL** | CRITICAL | ALERT |
| Caso | M-101 … | **M-106** | M-109, M-112 | M-104 |

**TD-3 · ¿El evento explica el cambio? (§6)** · ventana de −24 h a +6 h del inicio

| Tipo de evento | Cambio UP | Cambio DOWN |
|---|---|---|
| OPERATIONAL_CHANGE | Explica | Explica |
| SCHEDULED_OUTAGE | No | Explica |
| UNKNOWN | No | No |
| DATA_QUALITY | No | No |

---

## 3. Matriz de casos

| ID | Título | Técnica | Capa | Prioridad | Estado | Defecto | Automatizado |
|---|---|---|---|---|---|---|---|
| [CN-01](#cn-01--login-válido-lleva-al-despacho) | Login válido lleva al Despacho | Partición | UI | P2 | ✅ | — | `setup/auth.setup.ts` |
| [CN-02](#cn-02--login-inválido-no-revela-qué-dato-falló) | Login inválido no revela qué falló | Partición · Negativa | UI | P2 | ✅ | — | `ui/login.spec.ts` |
| [CN-03](#cn-03--validación-de-campos-obligatorios-en-el-login) | Validación de campos obligatorios | Negativa | API | P2 | ✅ | — | `api/auth.api.spec.ts` |
| [CN-04](#cn-04--el-email-se-normaliza) | El email se normaliza | Partición | UI | P3 | ✅ | — | `ui/login.spec.ts` |
| [CN-05](#cn-05--rutas-protegidas-exigen-un-jwt-válido) | Rutas protegidas exigen JWT | Negativa | API | P2 | ✅ | — | `api/auth.api.spec.ts` |
| [CN-06](#cn-06--límites-de-paginationsize) | Límites de `size` | Valores límite | API | P2 | ✅ | — | `api/meters.api.spec.ts` |
| [CN-07](#cn-07--límites-de-paginationpage) | Límites de `page` | Valores límite | API | P2 | ❌ | DEF-05 | `api/meters.api.spec.ts` |
| [CN-08](#cn-08--la-ui-pagina-12-medidores-en-2-páginas) | La UI pagina 12 medidores | Valores límite | UI | P1 | ❌ | DEF-02 | `ui/defects.spec.ts` |
| [CN-09](#cn-09--filtro-por-estado) | Filtro por estado | Partición | API · UI | P1 | ❌ | DEF-03 | `api/meters.api.spec.ts` |
| [CN-10](#cn-10--búsqueda-por-meter_id) | Búsqueda por `meter_id` | Partición | API · UI | P1 | ❌ | DEF-04 | `ui/defects.spec.ts` |
| [CN-11](#cn-11--filtros-combinados) | Filtros combinados | Partición | API | P3 | ✅ | — | (curl) |
| [CN-12](#cn-12--ordenamiento) | Ordenamiento | Partición · Límites | API · UI | P2 | ✅ | — | `api/meters.api.spec.ts` |
| [CN-13](#cn-13--td-2-tipo--severidad--estado) | TD-2: tipo + severidad → estado | Tabla de decisión | API | P1 | ❌ | DEF-03 | `api/meters.api.spec.ts` |
| [CN-14](#cn-14--td-1-clasificación-severidad-y-acción) | TD-1: clasificación y acción | Tabla de decisión | UI | P1 | ✅ | — | `ui/anomalies.spec.ts` |
| [CN-15](#cn-15--prioridad-severidad--kwh--confianza) | Prioridad | Tabla de decisión | API | P1 | ✅ | — | `api/meters.api.spec.ts` |
| [CN-16](#cn-16--rango-de-la-confianza) | Rango de la confianza | Valores límite | API | P2 | ✅ | — | `api/meters.api.spec.ts` |
| [CN-17](#cn-17--detalle-de-m-109-vs-el-ejemplo-documentado) | Detalle M-109 vs. doc | Consistencia | API · UI | P1 | ✅ | — | `ui/meters-flow.spec.ts` |
| [CN-18](#cn-18--id-del-medidor-en-el-detalle) | ID del medidor en el detalle | Partición | API · UI | P3 | ✅ | — | `api/meters.api.spec.ts` |
| [CN-19](#cn-19--la-hora-de-planta-es-la-misma-en-doc-api-y-ui) | Hora de planta doc = API = UI | Consistencia | UI | P1 | ❌ | DEF-01 | `ui/timezone.spec.ts` |
| [CN-20](#cn-20--el-kpi-del-despacho-cumple-la-regla-de-estados) | KPI del Despacho vs. regla | Consistencia · TD-2 | API · UI | P1 | ❌ | DEF-03 | `ui/defects.spec.ts` |
| [CN-21](#cn-21--formato-de-números-es-co) | Formato es-CO | Partición | UI | P3 | ✅ | — | `ui/meters-flow.spec.ts` |
| [CN-22](#cn-22--después-del-login-vuelve-a-la-ruta-pedida) | Volver a la ruta pedida tras login | Flujo | UI | P2 | ❌ | DEF-07 | `ui/defects.spec.ts` |
| [CN-23](#cn-23--run-ai-analysis-y-concurrencia) | Run AI Analysis y concurrencia | Flujo · Negativa | API · UI | P3 | ✅ | — | `ui/anomalies.spec.ts` |
| [CN-24](#cn-24--cerrar-sesión) | Cerrar sesión | Flujo | UI | P2 | ✅ | — | `ui/login.spec.ts` |

Las rutas de "Automatizado" son relativas a `e2e/tests/`.

---

## 4. Casos detallados

### F1 · Autenticación

Archivo: [`features/01-autenticacion.feature`](features/01-autenticacion.feature)

```gherkin
# language: es
Característica: Autenticación del operador
  Como operador de planta
  Quiero entrar con mi usuario
  Para ver el estado de mis medidores sin que otros accedan a la información

  Antecedentes:
    Dado que la aplicación está desplegada y responde en "/health"
    Y que existe el usuario "admin@energia.local" con contraseña "admin123"
```

#### CN-01 · Login válido lleva al Despacho

```gherkin
  @CN-01 @ui @particion @P2
  Escenario: Iniciar sesión con credenciales válidas
    Dado que no tengo una sesión iniciada
    Y que estoy en la pantalla "/login"
    Cuando escribo "admin@energia.local" en "Email"
    Y escribo "admin123" en "Contraseña"
    Y presiono "Entrar"
    Entonces llego a la pantalla "Despacho" en la ruta "/"
    Y veo el botón "Cerrar sesión"
    Y el navegador guarda el token en "energyai.token"
```

> **Resultado:** igual al esperado. **Estado:** ✅ Pasa

#### CN-02 · Login inválido no revela qué dato falló

```gherkin
  @CN-02 @ui @particion @negativa @P2
  Esquema del escenario: Iniciar sesión con credenciales inválidas
    Dado que estoy en la pantalla "/login"
    Cuando escribo "<email>" en "Email"
    Y escribo "<contraseña>" en "Contraseña"
    Y presiono "Entrar"
    Entonces veo el mensaje "Email o contraseña incorrectos"
    Y sigo en la ruta "/login"

    Ejemplos:
      | clase                         | email               | contraseña |
      | contraseña incorrecta         | admin@energia.local | admin1234  |
      | usuario inexistente           | otro@energia.local  | admin123   |
      | contraseña en otra mayúscula  | admin@energia.local | ADMIN123   |
```

> **Resultado:** el mismo mensaje en los 3 casos (no permite adivinar qué usuarios existen). **Estado:** ✅ Pasa

#### CN-03 · Validación de campos obligatorios en el login

```gherkin
  @CN-03 @api @negativa @P2
  Esquema del escenario: Login con body incompleto o inválido
    Cuando envío POST "/api/v1/auth/login" con el body <body>
    Entonces la respuesta tiene código 400
    Y el body tiene "status_code", "message", "timestamp" y "path"
    Y "errors" contiene <errores>

    Ejemplos:
      | body                                  | errores                                          |
      | {"email":"","password":""}            | "email es obligatorio", "password es obligatorio" |
      | {"email":"admin@energia.local"}       | "password es obligatorio"                         |
      | xx                                    | (message "body inválido: …")                      |
```

> **Resultado:** igual al esperado en las 3 filas. **Estado:** ✅ Pasa

#### CN-04 · El email se normaliza

```gherkin
  @CN-04 @ui @particion @P3
  Escenario: El email no distingue mayúsculas ni espacios
    Dado que estoy en la pantalla "/login"
    Cuando escribo "  ADMIN@ENERGIA.LOCAL  " en "Email"
    Y escribo "admin123" en "Contraseña"
    Y presiono "Entrar"
    Entonces llego a la pantalla "Despacho"
```

> **Resultado:** entra. **Estado:** ✅ Pasa

#### CN-05 · Rutas protegidas exigen un JWT válido

```gherkin
  @CN-05 @api @negativa @P2
  Esquema del escenario: Llamar una ruta protegida sin un token válido
    Cuando envío <método> "<ruta>" con el header Authorization "<authorization>"
    Entonces la respuesta tiene código 401

    Ejemplos:
      | método | ruta                         | authorization                       |
      | GET    | /api/v1/auth/me              | (sin header)                        |
      | GET    | /api/v1/meter/getParams      | (sin header)                        |
      | POST   | /api/v1/meter/getAll         | (sin header)                        |
      | GET    | /api/v1/meter/getById/M-109  | (sin header)                        |
      | GET    | /api/v1/anomaly/getAll       | (sin header)                        |
      | GET    | /api/v1/dashboard/getSummary | (sin header)                        |
      | POST   | /api/v1/ai/analyze           | (sin header)                        |
      | GET    | /api/v1/meter/getParams      | Bearer abc                          |
      | GET    | /api/v1/meter/getParams      | <token válido sin prefijo Bearer>   |
      | GET    | /api/v1/auth/me              | Bearer <JWT forjado con alg "none"> |

  Escenario: El endpoint de salud es público
    Cuando envío GET "/health" sin token
    Entonces la respuesta tiene código 200 y el body {"status":"ok"}
```

> **Resultado:** 401 en las 10 filas; `/health` 200. **Estado:** ✅ Pasa

---

### F2 · Paginación

Archivo: [`features/02-paginacion.feature`](features/02-paginacion.feature)

```gherkin
# language: es
Característica: Paginación del libro de medidores
  Como operador
  Quiero recorrer la lista de medidores por páginas
  Para revisar todos los medidores, incluidos los que no caben en la primera página

  Antecedentes:
    Dado que el dataset tiene 12 medidores
    Y que tengo un token válido de "admin@energia.local"
```

#### CN-06 · Límites de `pagination.size`

```gherkin
  @CN-06 @api @valores-limite @P2
  Esquema del escenario: Valores límite de size
    Cuando envío POST "/api/v1/meter/getAll" con pagination {"page": 1, "size": <size>}
    Entonces la respuesta tiene código <código>
    Y <resultado>

    Ejemplos:
      | size | código | resultado                                                       |
      | 0    | 200    | size = 10 y 10 filas (0 = no enviado)                           |
      | 1    | 200    | 1 fila                                                          |
      | 100  | 200    | 12 filas                                                        |
      | 101  | 400    | "errors" contiene "pagination.size debe estar entre 1 y 100"    |
      | -1   | 400    | "errors" contiene "pagination.size debe estar entre 1 y 100"    |
      | 10.5 | 400    | message "body inválido: …"                                      |
```

> **Resultado:** igual al esperado en las 6 filas. **Estado:** ✅ Pasa

#### CN-07 · Límites de `pagination.page`

```gherkin
  @CN-07 @api @valores-limite @P2 @DEF-05
  Esquema del escenario: Valores límite de page
    Cuando envío POST "/api/v1/meter/getAll" con pagination {"page": <page>, "size": <size>}
    Entonces la respuesta tiene código <código>
    Y <resultado>

    Ejemplos:
      | page | size | código | resultado                                  |
      | 0    | 10   | 200    | page = 1 y 10 filas (0 = no enviado)       |
      | 2    | 10   | 200    | 2 filas (última página parcial)            |
      | 3    | 5    | 200    | 2 filas                                    |
      | 4    | 5    | 200    | 0 filas: "rows" = [] (fuera de rango)      |
      | -1   | 10   | 400    | error de validación (Swagger: minimum 1)   |
      | -5   | 5    | 400    | error de validación                        |
```

> **Resultado:**
>
> | page | Obtenido |
> |---|---|
> | 0, 2, 3, 4 | Igual al esperado |
> | **−1, −5** | **500 "Error interno del servidor"** y `panic: slice bounds out of range` en el log |
>
> **Estado:** ❌ Falla → [DEF-05](05-defectos.md#def-05--paginationpage-negativo-responde-500-en-vez-de-400) · **Evidencia:** [`evidencias/DEF-05/01-api-page-negativo-responde-500.png`](evidencias/DEF-05/01-api-page-negativo-responde-500.png)

#### CN-08 · La UI pagina 12 medidores en 2 páginas

```gherkin
  @CN-08 @ui @valores-limite @P1 @DEF-02
  Escenario: Pasar a la página 2 del libro de medidores
    Dado que inicié sesión
    Y que estoy en "Medidores" sin filtros
    Entonces la paginación dice "1–10 de 12 medidores"
    Y el botón "Siguiente" está habilitado
    Cuando presiono "Siguiente"
    Entonces la URL contiene "pagina=2"
    Y la tabla muestra los medidores "M-111" y "M-112"
```

> **Resultado:** la paginación dice "1–10 de 12 medidores", pero **"Siguiente" está deshabilitado**. La página 2 existe: solo se llega escribiendo `?pagina=2` en la URL.
> **Estado:** ❌ Falla → [DEF-02](05-defectos.md#def-02--el-libro-de-medidores-no-deja-pasar-a-la-página-2) · **Evidencia:** [`evidencias/DEF-02/01-libro-siguiente-deshabilitado.png`](evidencias/DEF-02/01-libro-siguiente-deshabilitado.png), [`02-libro-pagina-2-solo-por-url.png`](evidencias/DEF-02/02-libro-pagina-2-solo-por-url.png)

---

### F3 · Filtros, búsqueda y orden

Archivo: [`features/03-filtros-busqueda-orden.feature`](features/03-filtros-busqueda-orden.feature)

```gherkin
# language: es
Característica: Filtros, búsqueda y orden del libro de medidores
  Como operador
  Quiero filtrar por estado, buscar un medidor y ordenar la lista
  Para encontrar rápido lo que requiere atención

  Antecedentes:
    Dado que tengo una sesión iniciada como "admin@energia.local"
    Y que el motor ya clasificó los 12 medidores del dataset
```

#### CN-09 · Filtro por estado

```gherkin
  @CN-09 @api @ui @particion @P1 @DEF-03
  Esquema del escenario: Filtrar el libro por estado
    Cuando filtro por el estado "<status>"
    Entonces la respuesta tiene código <código>
    Y la lista contiene <medidores>

    Ejemplos:
      | clase                  | status   | código | medidores                                         |
      | válida                 | CRITICAL | 200    | M-109, M-112                                      |
      | válida                 | ALERT    | 200    | M-104                                             |
      | válida                 | NORMAL   | 200    | los 9 restantes (incluido M-106, falso positivo)  |
      | válida en minúsculas   | critical | 200    | M-109, M-112                                      |
      | inválida               | ROJO     | 400    | error "filter.status debe ser NORMAL, ALERT o CRITICAL" |
```

> **Resultado:**
>
> | status | Obtenido |
> |---|---|
> | CRITICAL, critical, ROJO | Igual al esperado |
> | **ALERT** | **M-104 y M-106** |
> | **NORMAL** | **8 medidores** (sin M-106) |
>
> **Estado:** ❌ Falla → [DEF-03](05-defectos.md#def-03--un-false_positive-m-106-tiene-estado-alert-en-vez-de-normal) · **Evidencia:** [`evidencias/DEF-03/01-libro-filtro-alertas-incluye-m106.png`](evidencias/DEF-03/01-libro-filtro-alertas-incluye-m106.png)

#### CN-10 · Búsqueda por `meter_id`

```gherkin
  @CN-10 @api @ui @particion @P1 @DEF-04
  Esquema del escenario: Buscar un medidor por su código
    Dado que estoy en "Medidores"
    Cuando escribo "<texto>" en el buscador "Medidor"
    Y presiono "Buscar medidor"
    Entonces veo <resultado>

    Ejemplos:
      | clase                    | texto | resultado                                                            |
      | coincidencia parcial     | 109   | solo M-109                                                           |
      | prefijo                  | M-1   | los 12 medidores                                                     |
      | minúsculas               | m-109 | solo M-109 (doc: "sin importar mayúsculas")                          |
      | sin coincidencia         | xyz   | "Ningún medidor coincide con los filtros" y el botón "Quitar filtros" |
```

> **Resultado:** `109`, `M-1` y `xyz` igual al esperado. **`m-109` → 0 resultados** en la UI y en la API (`count: 0`); en mayúsculas sí lo encuentra.
> **Estado:** ❌ Falla → [DEF-04](05-defectos.md#def-04--la-búsqueda-por-meter_id-distingue-mayúsculas) · **Evidencia:** [`evidencias/DEF-04/01-libro-busqueda-minusculas-sin-resultados.png`](evidencias/DEF-04/01-libro-busqueda-minusculas-sin-resultados.png), [`02-api-busqueda-sensible-a-mayusculas.png`](evidencias/DEF-04/02-api-busqueda-sensible-a-mayusculas.png)

#### CN-11 · Filtros combinados

```gherkin
  @CN-11 @api @particion @P3
  Escenario: Combinar estado y búsqueda sin coincidencias
    Cuando envío POST "/api/v1/meter/getAll" con filter {"status": "CRITICAL", "meter_id": "M-104"}
    Entonces la respuesta tiene código 200
    Y "rows" es una lista vacía
```

> **Resultado:** `rows: []`. **Estado:** ✅ Pasa (ejecutado con curl)

#### CN-12 · Ordenamiento

```gherkin
  @CN-12 @api @ui @particion @valores-limite @P2
  Esquema del escenario: Ordenar el libro
    Cuando ordeno por "<sort_by>" en dirección "<sort_order>" con 100 por página
    Entonces la lista queda ordenada por ese campo en esa dirección
    Y el primer medidor es "<primero>"
    Y los empates se resuelven por meter_id de menor a mayor

    Ejemplos:
      | sort_by     | sort_order | primero |
      | consumption | DESC       | M-109   |
      | consumption | ASC        | M-107   |
      | variation   | DESC       | M-109   |
      | variation   | ASC        | M-105   |
      | severity    | DESC       | M-109   |
      | meter_id    | DESC       | M-112   |

  Escenario: Severidad descendente con empate
    Cuando ordeno por "severity" en dirección "DESC"
    Entonces los 4 primeros son "M-109, M-112, M-104, M-106"

  Esquema del escenario: Orden inválido
    Cuando ordeno por "<sort_by>" en dirección "<sort_order>"
    Entonces la respuesta tiene código 400 con el error "<error>"

    Ejemplos:
      | sort_by | sort_order | error                                                          |
      | foo     | ASC        | filter.sort_by debe ser meter_id, consumption, variation o severity |
      | meter_id| XYZ        | filter.sort_order debe ser ASC o DESC                           |
```

> **Resultado:** igual al esperado en todos los casos (por ejemplo, consumption DESC: M-109 2.207,6 → … → M-107 474,7). **Estado:** ✅ Pasa

---

### F4 · Reglas de negocio del motor

Archivo: [`features/04-reglas-de-negocio.feature`](features/04-reglas-de-negocio.feature)

```gherkin
# language: es
Característica: Clasificación, estado y prioridad de las anomalías
  Como operador
  Quiero que el motor clasifique, priorice y explique cada anomalía según reglas fijas
  Para decidir qué revisar primero y qué no escalar

  Antecedentes:
    Dado que tengo un token válido
    Y que el motor analizó el dataset de 14 días y 12 medidores
```

#### CN-13 · TD-2: tipo + severidad → estado

```gherkin
  @CN-13 @api @tabla-decision @P1 @DEF-03
  Esquema del escenario: Estado de alerta según la tabla de decisión TD-2
    Cuando consulto GET "/api/v1/meter/getById/<medidor>"
    Entonces "anomaly_type" es "<tipo>"
    Y "severity" es "<severidad>"
    Y "status" es "<estado>"

    Ejemplos:
      | regla TD-2                  | medidor | tipo                | severidad | estado   |
      | severidad HIGH              | M-109   | REAL_ANOMALY        | HIGH      | CRITICAL |
      | severidad HIGH              | M-112   | DATA_QUALITY        | HIGH      | CRITICAL |
      | otra anomalía               | M-104   | EXPLAINABLE_ANOMALY | MEDIUM    | ALERT    |
      | FALSE_POSITIVE → NORMAL     | M-106   | FALSE_POSITIVE      | LOW       | NORMAL   |
      | sin anomalía                | M-101   | null                | null      | NORMAL   |
```

> **Resultado:** 4 de 5 filas igual al esperado. **M-106: `status` = "ALERT"**.
> **Estado:** ❌ Falla → [DEF-03](05-defectos.md#def-03--un-false_positive-m-106-tiene-estado-alert-en-vez-de-normal) · **Evidencia:** [`evidencias/DEF-03/03-api-m106-status-alert.png`](evidencias/DEF-03/03-api-m106-status-alert.png)

#### CN-14 · TD-1: clasificación, severidad y acción

```gherkin
  @CN-14 @ui @tabla-decision @P1
  Esquema del escenario: Cada caso del dataset cae en su regla de TD-1
    Dado que inicié sesión
    Cuando abro "Anomalías IA"
    Entonces la fila de "<medidor>" muestra Tipo "<tipo>", Severidad "<severidad>" y Acción "<acción>"

    Ejemplos:
      | regla TD-1 | medidor | tipo                | severidad | acción            |
      | R4         | M-109   | Anomalía real       | Alta      | Investigar        |
      | R1         | M-112   | Calidad de datos    | Alta      | Validar medidor   |
      | R3         | M-104   | Anomalía explicable | Media     | Validar operación |
      | R2         | M-106   | Falso positivo      | Baja      | No escalar        |
```

> **Resultado:** igual al esperado en las 4 filas. **Estado:** ✅ Pasa

#### CN-15 · Prioridad: severidad → kWh → confianza

```gherkin
  @CN-15 @api @tabla-decision @P1
  Escenario: El orden de prioridad sigue severidad, luego energía en juego, luego confianza
    Cuando consulto GET "/api/v1/anomaly/getAll"
    Entonces recibo 4 anomalías en este orden:
      | prioridad | medidor | severidad | impact_kwh |
      | 1         | M-109   | HIGH      | 2825.0     |
      | 2         | M-112   | HIGH      | 0          |
      | 3         | M-104   | MEDIUM    | 2177.6     |
      | 4         | M-106   | LOW       | -499.9     |
    Y M-109 va antes que M-112 porque, con la misma severidad, mueve más energía
```

> **Resultado:** igual al esperado. **Estado:** ✅ Pasa

#### CN-16 · Rango de la confianza

```gherkin
  @CN-16 @api @valores-limite @P2
  Escenario: La confianza está entre 0,5 y 0,95 y se reduce ×0,9 cuando depende de un evento
    Cuando consulto GET "/api/v1/anomaly/getAll"
    Entonces cada "confidence" está entre 0.45 y 0.95
    Y M-109 y M-112 (sin evento que explique) tienen 0.95
    Y M-104 y M-106 (explicadas por un evento) tienen como máximo 0.86
```

> **Resultado:** 0,95 · 0,95 · 0,86 · 0,86. **Estado:** ✅ Pasa

---

### F5 · Consistencia entre capas (doc ↔ API ↔ UI)

Archivo: [`features/05-consistencia-entre-capas.feature`](features/05-consistencia-entre-capas.feature)

```gherkin
# language: es
Característica: La UI muestra lo mismo que la API y que la documentación
  Como operador
  Quiero que las cifras y las horas sean las mismas en todas las pantallas
  Para confiar en lo que veo y actuar en el lugar y la hora correctos

  Antecedentes:
    Dado que inicié sesión como "admin@energia.local"
    Y que mi navegador está en la zona horaria "America/Bogota"
```

#### CN-17 · Detalle de M-109 vs. el ejemplo documentado

```gherkin
  @CN-17 @api @ui @consistencia @P1
  Escenario: Las cifras clave de M-109 coinciden con el ejemplo del backend/README
    Cuando abro el detalle del medidor "M-109"
    Entonces veo:
      | campo                  | valor UI     | valor API (getById)    |
      | Consumo actual · 24 h  | 2.207,6 kWh  | consumption_kwh 2207.6 |
      | Baseline diario        | 1.052,2 kWh  | baseline_kwh 1052.15   |
      | Variación              | +109,8 %     | variation_pct 109.82   |
      | Estado                 | Crítica      | status CRITICAL        |
    Y el histórico tiene 336 lecturas horarias y 14 días
    Y el cambio dura 58 h, dirección UP y sigue activo
    Y la corriente confirma el cambio (+105,6 % en la última lectura)
```

> **Resultado:** igual al esperado en la API y en la UI. **Estado:** ✅ Pasa

#### CN-18 · ID del medidor en el detalle

```gherkin
  @CN-18 @api @ui @particion @P3
  Esquema del escenario: Abrir el detalle con distintos IDs
    Cuando abro el detalle con el ID "<id>"
    Entonces <resultado>

    Ejemplos:
      | clase                 | id    | resultado                                                    |
      | válido                | M-109 | veo el detalle de M-109                                      |
      | válido en minúsculas  | m-109 | la API responde 200 con meter_id "M-109"                     |
      | inexistente           | M-999 | API 404 "Medidor no encontrado" · UI "No existe el medidor M-999" |
```

> **Resultado:** igual al esperado. **Estado:** ✅ Pasa

#### CN-19 · La hora de planta es la misma en doc, API y UI

```gherkin
  @CN-19 @ui @consistencia @P1 @DEF-01
  Esquema del escenario: Las horas se muestran tal como vienen (hora de planta)
    Dado que la API devuelve "<campo_api>" = "<valor_api>"
    Cuando miro "<lugar>" en la pantalla "<pantalla>"
    Entonces veo "<esperado>"

    Ejemplos:
      | pantalla     | lugar                                    | campo_api                | valor_api            | esperado    |
      | Despacho     | tarjeta Orden 1 (M-109) → "Detectada"    | detected_at (M-109)      | 2026-09-12T14:00:00Z | 12/09 14:00 |
      | Anomalías IA | columna "Detectada", fila M-112          | detected_at (M-112)      | 2026-09-13T00:00:00Z | 13/09 00:00 |
      | Anomalías IA | columna "Detectada", fila M-104          | detected_at (M-104)      | 2026-09-11T00:00:00Z | 11/09 00:00 |
      | Anomalías IA | columna "Detectada", fila M-106          | detected_at (M-106)      | 2026-09-08T00:00:00Z | 08/09 00:00 |
      | Detalle M-109| encabezado → "Última lectura"            | last_reading_at          | 2026-09-14T23:00:00Z | 14/09 23:00 |

  Escenario: Control con el navegador en UTC
    Dado que mi navegador está en la zona horaria "UTC"
    Cuando miro la tarjeta Orden 1 (M-109) en "Despacho"
    Entonces veo "Detectada 12/09 14:00"
```

> **Resultado:**
>
> | Lugar | Esperado | Obtenido (Bogotá) |
> |---|---|---|
> | Despacho · Orden 1 · Detectada | 12/09 14:00 | **12/09 09:00** |
> | Anomalías · M-112 | 13/09 00:00 | **12/09 19:00** (otro día) |
> | Anomalías · M-104 | 11/09 00:00 | **10/09 19:00** (otro día) |
> | Anomalías · M-106 | 08/09 00:00 | **07/09 19:00** (otro día) |
> | Detalle · Última lectura | 14/09 23:00 | **14/09 18:00** |
> | Control en UTC | 12/09 14:00 | 12/09 14:00 ✔ |
>
> En la misma tarjeta, el texto del motor dice "desde 12/09 14:00" mientras el encabezado dice "Detectada 12/09 09:00".
> **Estado:** ❌ Falla → [DEF-01](05-defectos.md#def-01--la-hora-de-planta-se-muestra-5-h-antes-en-colombia) · **Evidencia:** [`evidencias/DEF-01/`](evidencias/DEF-01/) (4 capturas)

#### CN-20 · El KPI del Despacho cumple la regla de estados

```gherkin
  @CN-20 @api @ui @consistencia @tabla-decision @P1 @DEF-03
  Escenario: El conteo de estados del KPI sigue la tabla TD-2
    Cuando abro "Despacho"
    Entonces el panel "Estado de la planta" → "Medidores" dice "9 normales · 1 alerta · 2 críticas"
    Y GET "/api/v1/dashboard/getSummary" devuelve status_counts {"normal": 9, "alert": 1, "critical": 2}
    Y esos conteos coinciden con los estados de POST "/api/v1/meter/getAll"
```

> **Resultado:** UI y API muestran **8 normales · 2 alerta · 2 críticas**. Son coherentes entre sí, pero no con la regla documentada.
> **Estado:** ❌ Falla → [DEF-03](05-defectos.md#def-03--un-false_positive-m-106-tiene-estado-alert-en-vez-de-normal) · **Evidencia:** [`evidencias/DEF-03/02-despacho-kpi-cuenta-m106-como-alerta.png`](evidencias/DEF-03/02-despacho-kpi-cuenta-m106-como-alerta.png)

#### CN-21 · Formato de números es-CO

```gherkin
  @CN-21 @ui @particion @P3
  Escenario: Las cifras usan el formato de Colombia
    Cuando abro "Medidores"
    Entonces los miles se separan con punto y los decimales con coma, por ejemplo "2.207,6 kWh"
    Y la variación lleva signo: "+109,8 %" y "−0,1 %"
    Y cada valor de "Consumo 24 h" y "Baseline" es el de la API con 1 decimal
```

> **Resultado:** igual al esperado. **Estado:** ✅ Pasa

---

### F6 · Sesión y análisis

Archivo: [`features/06-sesion-y-analisis.feature`](features/06-sesion-y-analisis.feature)

```gherkin
# language: es
Característica: Sesión del operador y ejecución del análisis de IA
  Como operador
  Quiero volver a la pantalla que abrí después de iniciar sesión y poder relanzar el análisis
  Para trabajar con enlaces compartidos y con datos actualizados

  Antecedentes:
    Dado que la aplicación está desplegada
```

#### CN-22 · Después del login vuelve a la ruta pedida

```gherkin
  @CN-22 @ui @flujo @P2 @DEF-07
  Escenario: Abrir un enlace protegido sin sesión y volver a él después del login
    Dado que no tengo una sesión iniciada
    Cuando abro "/medidores/M-104"
    Entonces me redirige a "/login"
    Cuando inicio sesión con "admin@energia.local" y "admin123"
    Entonces llego a "/medidores/M-104" y veo el detalle de M-104
    Y esto ocurre en 10 de 10 intentos
```

> **Resultado:** la redirección a `/login` funciona, pero después de entrar **la app termina en `/` (Despacho)**: 8 de 10 intentos en una corrida y 9 de 10 en otra. Es intermitente (condición de carrera).
> **Estado:** ❌ Falla → [DEF-07](05-defectos.md#def-07--después-del-login-no-siempre-vuelve-a-la-ruta-pedida) · **Evidencia:** [`evidencias/DEF-07/01-login-desde-enlace-termina-en-despacho.png`](evidencias/DEF-07/01-login-desde-enlace-termina-en-despacho.png)

#### CN-23 · Run AI Analysis y concurrencia

```gherkin
  @CN-23 @api @ui @flujo @negativa @P3
  Escenario: Ejecutar el análisis desde la UI
    Dado que inicié sesión
    Cuando presiono "Run AI Analysis"
    Entonces veo la hoja "Análisis de IA" con los 7 pasos: Lecturas, Baseline, Detección, Correlación, Eventos, Explicación, Recomendación
    Y termina con "4 anomalías detectadas · 2 requieren atención prioritaria"

  Escenario: Nunca corren dos análisis a la vez
    Cuando envío 10 POST "/api/v1/ai/analyze" en paralelo
    Entonces solo las peticiones que arrancan un análisis reciben 202
    Y las demás reciben 200 con el análisis que ya está corriendo

  Escenario: Consultar un análisis inexistente
    Cuando consulto GET "/api/v1/ai/analysis/AN-9999"
    Entonces la respuesta tiene código 404 "Análisis no encontrado"
```

> **Resultado:** igual al esperado (en la ráfaga: 3 × 202 y 7 × 200). **Estado:** ✅ Pasa

#### CN-24 · Cerrar sesión

```gherkin
  @CN-24 @ui @flujo @P2
  Escenario: Cerrar sesión protege de nuevo las rutas
    Dado que inicié sesión
    Cuando presiono "Cerrar sesión"
    Entonces llego a "/login"
    Y el navegador ya no tiene "energyai.token"
    Cuando abro "/anomalias"
    Entonces me redirige a "/login"
```

> **Resultado:** igual al esperado. **Estado:** ✅ Pasa

---

## 5. Observaciones sin defecto

Para conversar con el equipo; no las reporto como defectos.

| # | Observación | Por qué no es defecto |
|---|---|---|
| O-1 | Al ordenar por severidad ASC, los medidores sin anomalía quedan primero | Es coherente con "sin anomalía = rango 0". Confirmar con producto |
| O-2 | `status` en minúscula (`critical`) se acepta | La documentación lista los valores en mayúsculas, pero aceptar minúsculas es tolerante y no rompe ningún contrato. Confirmar con producto |
| O-3 | `page = 99 999 999 999` → 200 con `[]` | Comportamiento aceptable, aunque no hay límite superior |
| O-4 | En el árbol de accesibilidad, las casillas etiqueta/valor del detalle ("Consumo actual", "Baseline diario"…) no exponen un rol ni un nombre que las relacione | Afecta la accesibilidad y obliga a ubicarlas por texto al automatizar (ver `e2e/README.md`) |
