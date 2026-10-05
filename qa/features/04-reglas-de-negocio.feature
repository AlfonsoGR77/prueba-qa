# Generado desde qa/03-casos-caja-negra.md — no editar a mano.
# language: es
Característica: Clasificación, estado y prioridad de las anomalías
  Como operador
  Quiero que el motor clasifique, priorice y explique cada anomalía según reglas fijas
  Para decidir qué revisar primero y qué no escalar

  Antecedentes:
    Dado que tengo un token válido
    Y que el motor analizó el dataset de 14 días y 12 medidores

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

  @CN-16 @api @valores-limite @P2
  Escenario: La confianza está entre 0,5 y 0,95 y se reduce ×0,9 cuando depende de un evento
    Cuando consulto GET "/api/v1/anomaly/getAll"
    Entonces cada "confidence" está entre 0.45 y 0.95
    Y M-109 y M-112 (sin evento que explique) tienen 0.95
    Y M-104 y M-106 (explicadas por un evento) tienen como máximo 0.86
