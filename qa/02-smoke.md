# 02 · Suite de humo (smoke)

| | |
|---|---|
| **Pregunta que responde** | ¿Este build se puede probar? |
| **Build** | commit `15765d9` |
| **Ejecución** | 3–4 oct 2026 · Windows (equipo del QA) y Linux · Chromium 141 de Playwright + Microsoft Edge · `America/Bogota` · backend :8080 · frontend :5173 (modo desarrollo) |
| **Formato** | Gherkin. Archivo: [`features/00-smoke.feature`](features/00-smoke.feature) |
| **Resultado** | **13 / 13 ✅. El build se puede probar** |

## 1. Criterio de selección

Un caso entra al smoke solo si, al fallar, **no tiene sentido seguir probando**. Por eso cubre estas cinco preguntas:

1. ¿El servidor responde? (SM-01, SM-13)
2. ¿Se puede entrar y las rutas están protegidas? (SM-02, SM-03, SM-08)
3. ¿El motor cargó los datos y produjo resultados? (SM-04 a SM-07)
4. ¿Las pantallas principales cargan? (SM-09 a SM-11)
5. ¿La función de IA visible para el usuario termina? (SM-12)

Quedan **fuera a propósito** las horas, la paginación y los estados. Son funcionalidad, no "el build arranca", y se prueban en [03](03-casos-caja-negra.md).

## 2. Escenarios

```gherkin
# language: es
@smoke
Característica: Smoke · el build se puede probar
  Como QA
  Quiero verificar lo mínimo indispensable del build
  Para decidir si vale la pena ejecutar el resto de las pruebas

  Antecedentes:
    Dado que el backend está en "http://localhost:8080"
    Y que el frontend está en "http://localhost:5173"

  @SM-01 @api
  Escenario: El servidor está vivo
    Cuando envío GET "/health"
    Entonces la respuesta tiene código 200 y el body {"status":"ok"}

  @SM-02 @api
  Escenario: El login entrega un token
    Cuando envío POST "/api/v1/auth/login" con "admin@energia.local" / "admin123"
    Entonces la respuesta tiene código 200
    Y el body tiene "access_token" y "token_type" = "Bearer"

  @SM-03 @api
  Escenario: Las rutas están protegidas
    Cuando envío GET "/api/v1/meter/getParams" sin token
    Entonces la respuesta tiene código 401

  @SM-04 @api
  Escenario: El motor cargó los 12 medidores
    Dado que tengo un token válido
    Cuando envío POST "/api/v1/meter/getAll" sin body
    Entonces la respuesta tiene código 200, "count" = 12 y 10 filas

  @SM-05 @api
  Escenario: El caso principal existe
    Dado que tengo un token válido
    Cuando envío GET "/api/v1/meter/getById/M-109"
    Entonces la respuesta tiene código 200 y "anomaly.type" = "REAL_ANOMALY"

  @SM-06 @api
  Escenario: Hay anomalías detectadas
    Dado que tengo un token válido
    Cuando envío GET "/api/v1/anomaly/getAll"
    Entonces recibo 4 anomalías

  @SM-07 @api
  Escenario: El resumen del dashboard responde
    Dado que tengo un token válido
    Cuando envío GET "/api/v1/dashboard/getSummary"
    Entonces la respuesta tiene código 200 y "total_meters" = 12

  @SM-08 @ui
  Escenario: El operador puede entrar
    Dado que estoy en "/login"
    Cuando inicio sesión con "admin@energia.local" / "admin123"
    Entonces llego a "Despacho" y veo el botón "Cerrar sesión"

  @SM-09 @ui
  Escenario: El Despacho muestra datos
    Dado que inicié sesión
    Entonces veo la tarjeta "Orden 1 de 4" del medidor "M-109"
    Y veo el panel "Estado de la planta"

  @SM-10 @ui
  Escenario: El libro de medidores carga
    Cuando abro "Medidores"
    Entonces veo la tabla de medidores con filas

  @SM-11 @ui
  Escenario: El detalle de un medidor carga
    Cuando abro "/medidores/M-109"
    Entonces veo el encabezado "M-109"

  @SM-12 @ui
  Escenario: Run AI Analysis termina
    Cuando presiono "Run AI Analysis"
    Entonces la hoja "Análisis de IA" termina con "4 anomalías detectadas · 2 requieren atención prioritaria"

  @SM-13 @api
  Escenario: La documentación de la API está disponible
    Cuando abro "http://localhost:8080/docs"
    Entonces la respuesta tiene código 200
```

## 3. Resultados

| ID | Verificación | Por qué está en el smoke | Herramienta | Estado |
|---|---|---|---|---|
| SM-01 | `/health` → 200 | Sin servidor no hay nada que probar | curl · `smoke.api.spec.ts` | ✅ |
| SM-02 | Login → token | Todas las rutas dependen del JWT | curl · `smoke.api.spec.ts` | ✅ |
| SM-03 | Sin token → 401 | Un build sin protección no se debe probar ni liberar | curl · `smoke.api.spec.ts` | ✅ |
| SM-04 | 12 medidores | Prueba que los CSV y el motor cargaron | curl · `smoke.api.spec.ts` | ✅ |
| SM-05 | M-109 = REAL_ANOMALY | Es el caso principal del producto | curl · `smoke.api.spec.ts` | ✅ |
| SM-06 | 4 anomalías | Es el resultado principal del motor | curl · `smoke.api.spec.ts` | ✅ |
| SM-07 | Resumen del dashboard | La primera pantalla depende de él | curl · `smoke.api.spec.ts` | ✅ |
| SM-08 | Login en la UI | El usuario puede entrar | `setup/auth.setup.ts` | ✅ |
| SM-09 | Despacho con datos | El front consume la API y renderiza | `ui/smoke.spec.ts` | ✅ |
| SM-10 | Libro de medidores | Es la pantalla de trabajo principal | `ui/smoke.spec.ts` | ✅ |
| SM-11 | Detalle de un medidor | Navegación al detalle | `ui/smoke.spec.ts` | ✅ |
| SM-12 | Run AI Analysis | Función de IA visible al usuario | `ui/smoke.spec.ts` | ✅ |
| SM-13 | Swagger | Es parte del oráculo de las pruebas | curl · `smoke.api.spec.ts` | ✅ |

**Veredicto: 13/13 ✅. El build se puede probar.**

Cómo repetirlo: `cd e2e && npm run test:smoke`, que ejecuta exactamente estos 13 casos: los tests etiquetados `@smoke` en `e2e/tests/api/smoke.api.spec.ts`, `e2e/tests/ui/smoke.spec.ts` y `e2e/tests/setup/auth.setup.ts` (SM-08).
Salida de la ejecución: [`evidencias/ejecuciones/playwright-run.txt`](evidencias/ejecuciones/playwright-run.txt).
