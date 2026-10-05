# Generado desde qa/03-casos-caja-negra.md — no editar a mano.
# language: es
Característica: La UI muestra lo mismo que la API y que la documentación
  Como operador
  Quiero que las cifras y las horas sean las mismas en todas las pantallas
  Para confiar en lo que veo y actuar en el lugar y la hora correctos

  Antecedentes:
    Dado que inicié sesión como "admin@energia.local"
    Y que mi navegador está en la zona horaria "America/Bogota"

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

  @CN-18 @api @ui @particion @P3
  Esquema del escenario: Abrir el detalle con distintos IDs
    Cuando abro el detalle con el ID "<id>"
    Entonces <resultado>

    Ejemplos:
      | clase                 | id    | resultado                                                    |
      | válido                | M-109 | veo el detalle de M-109                                      |
      | válido en minúsculas  | m-109 | la API responde 200 con meter_id "M-109"                     |
      | inexistente           | M-999 | API 404 "Medidor no encontrado" · UI "No existe el medidor M-999" |

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

  @CN-20 @api @ui @consistencia @tabla-decision @P1 @DEF-03
  Escenario: El conteo de estados del KPI sigue la tabla TD-2
    Cuando abro "Despacho"
    Entonces el panel "Estado de la planta" → "Medidores" dice "9 normales · 1 alerta · 2 críticas"
    Y GET "/api/v1/dashboard/getSummary" devuelve status_counts {"normal": 9, "alert": 1, "critical": 2}
    Y esos conteos coinciden con los estados de POST "/api/v1/meter/getAll"

  @CN-21 @ui @particion @P3
  Escenario: Las cifras usan el formato de Colombia
    Cuando abro "Medidores"
    Entonces los miles se separan con punto y los decimales con coma, por ejemplo "2.207,6 kWh"
    Y la variación lleva signo: "+109,8 %" y "−0,1 %"
    Y cada valor de "Consumo 24 h" y "Baseline" es el de la API con 1 decimal
