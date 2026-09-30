# Prueba técnica · QA Senior

Bienvenido/a. Esta prueba evalúa cómo **diseñas, ejecutas y comunicas** pruebas sobre un producto real: una plataforma que monitorea medidores eléctricos y usa IA para detectar anomalías de consumo (backend en Go, frontend en React).

**Tiempo sugerido:** 4 a 6 horas. **Plazo de entrega:** el que te indique el equipo de selección.

> El producto **tiene defectos**. Parte de la prueba es encontrarlos. No te decimos cuántos ni dónde.

---

## 1. Antes de empezar

1. Levanta la aplicación siguiendo el [README](README.md) (con Docker o en modo desarrollo).
2. Credenciales: `admin@energia.local` / `admin123`.
3. Lee la documentación: es tu **oráculo** (lo que el sistema *debería* hacer).
   - [README.md](README.md): visión general y resultado esperado.
   - [backend/README.md](backend/README.md): API, reglas de negocio, metodología del motor.
   - [frontend/README.md](frontend/README.md) y [frontend/PRODUCT.md](frontend/PRODUCT.md): pantallas y comportamiento esperado.
   - Swagger: http://localhost:8080/docs
4. Contexto: los usuarios son operadores de planta en Colombia (zona horaria `America/Bogota`).

Si algo del entorno no funciona, documéntalo como hallazgo y continúa con lo que puedas.

---

## 2. Qué tienes que hacer

### Parte A · Estrategia y plan de pruebas (corto)

Un documento breve (1–2 páginas máximo) con:

- Alcance: qué vas a probar y qué dejas fuera, y por qué.
- Análisis de riesgos: ¿qué partes del producto tienen mayor impacto si fallan? Prioriza.
- Tipos de prueba que aplicarás y a qué capa (UI, API, unitario).
- Criterios de entrada/salida.

### Parte B · Pruebas de humo (smoke)

Define y ejecuta una suite de humo: el conjunto **mínimo** de verificaciones que dirían "este build se puede probar". Indica por qué elegiste cada caso y el resultado de ejecutarlo.

### Parte C · Pruebas funcionales de caja negra

Diseña y ejecuta casos de prueba sobre la UI **y** sobre la API, sin mirar el código. Esperamos ver técnicas de diseño aplicadas explícitamente, por ejemplo:

- Partición de equivalencia y análisis de valores límite (filtros, paginación, login).
- Tablas de decisión (reglas de negocio del motor: tipo → estado, severidad, prioridad).
- Pruebas negativas y de validación de entradas.
- Consistencia entre capas (lo que devuelve la API vs. lo que muestra la UI vs. lo que dice la documentación).

Formato sugerido para cada caso: `ID · Título · Precondición · Pasos · Datos · Resultado esperado · Resultado obtenido · Estado`.

No buscamos cantidad sino **buen criterio**: 15–25 casos bien pensados valen más que 80 triviales.

### Parte D · Pruebas de caja blanca

Ahora sí, abre el código (`backend/internal/**`, `frontend/src/**`).

- Elige **al menos dos** módulos que consideres de riesgo y revísalos: ramas, condiciones, validaciones, casos borde.
- Revisa también los **tests existentes** (`go test ./...`, `pnpm test`): ¿qué cubren?, ¿qué no?, ¿confías en ellos? Justifica.
- Propón (y si quieres, escribe) los tests unitarios que faltan para los defectos o riesgos que encontraste.

### Parte E · Reporte de defectos

Encuentra y reporta **mínimo 2 defectos** (idealmente más). Por cada uno:

- Título claro.
- Severidad y prioridad (y por qué son distintas, si lo son).
- Entorno (navegador, SO, zona horaria, versión/commit).
- Pasos para reproducir, datos usados.
- Resultado esperado (citando la fuente: documentación, regla de negocio, sentido común) vs. obtenido.
- Evidencia: captura, video, request/response (curl o similar).
- Si lo identificaste: causa raíz probable (archivo y línea) y cómo lo detectarías automáticamente.

### Parte F · Automatización con Playwright

Crea un proyecto de Playwright (TypeScript) en una carpeta `e2e/` en la raíz del repo.

**Mínimo obligatorio:**

- **1 flujo E2E de negocio completo** automatizado sobre la UI, por ejemplo: login → Libro de medidores → filtrar/buscar → abrir el detalle de un medidor → validar datos clave contra lo esperado.
- **1 test que evidencie uno de los defectos que encontraste** (debe fallar hoy y pasar cuando se corrija; puedes marcarlo con `test.fail()` y explicarlo).
- Un `e2e/README.md` con cómo instalar y correr los tests (un solo comando).

**Lo que vamos a mirar:**

- Locators robustos (`getByRole`, `getByLabel`, …) en lugar de selectores frágiles.
- Cero `waitForTimeout` / esperas fijas: usa las esperas automáticas y los `expect` web-first.
- Organización: Page Objects o fixtures, datos de prueba y configuración separados del test.
- Login reutilizable (por ejemplo `storageState`) en lugar de loguearte en cada test.
- Aserciones que prueben algo de negocio, no solo que "la página cargó".

**Suma puntos (opcional):**

- Tests de API con `request` de Playwright.
- Ejecución en más de un navegador o con una zona horaria configurada (`timezoneId`).
- Un workflow de GitHub Actions que levante la app y corra la suite.
- Reporte HTML, trazas o video en caso de fallo.

---

## 3. Entregables

Haz un fork o un repo privado a partir de este y comparte el acceso. Estructura sugerida:

```
qa/
├── 01-plan-de-pruebas.md
├── 02-smoke.md
├── 03-casos-caja-negra.md      (o .xlsx / .csv)
├── 04-caja-blanca.md
├── 05-defectos.md              (o un issue de GitHub por defecto)
└── evidencias/
e2e/
├── README.md
├── playwright.config.ts
└── tests/...
```

Cierra con un **resumen ejecutivo** de media página: ¿liberarías este build a producción? ¿Por qué? ¿Qué riesgos quedan abiertos?

---

## 4. Cómo evaluamos

| Criterio | Peso |
|---|---|
| Defectos encontrados y calidad de los reportes | 30 % |
| Diseño de casos (técnicas, cobertura, criterio de riesgo) | 25 % |
| Automatización con Playwright | 25 % |
| Caja blanca y análisis de los tests existentes | 10 % |
| Comunicación: plan, resumen ejecutivo, claridad | 10 % |

Reglas:

- No modifiques el código de la aplicación para "arreglar" los defectos en tu entrega; repórtalos. (Sí puedes agregar tests.)
- Puedes usar las herramientas que quieras (Postman, IA, extensiones, etc.). Si usas IA, cuéntanos cómo y para qué; lo valoramos.
- Si algo no está claro, toma una decisión razonable, **déjala escrita** y sigue.

En la entrevista de seguimiento te pediremos reproducir uno de tus defectos en vivo y explicar tu test de Playwright.

¡Éxitos!
