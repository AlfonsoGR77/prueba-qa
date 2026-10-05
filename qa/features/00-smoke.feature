# Generado desde qa/02-smoke.md — no editar a mano.
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
