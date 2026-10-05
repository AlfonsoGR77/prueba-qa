# Generado desde qa/03-casos-caja-negra.md — no editar a mano.
# language: es
Característica: Filtros, búsqueda y orden del libro de medidores
  Como operador
  Quiero filtrar por estado, buscar un medidor y ordenar la lista
  Para encontrar rápido lo que requiere atención

  Antecedentes:
    Dado que tengo una sesión iniciada como "admin@energia.local"
    Y que el motor ya clasificó los 12 medidores del dataset

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

  @CN-11 @api @particion @P3
  Escenario: Combinar estado y búsqueda sin coincidencias
    Cuando envío POST "/api/v1/meter/getAll" con filter {"status": "CRITICAL", "meter_id": "M-104"}
    Entonces la respuesta tiene código 200
    Y "rows" es una lista vacía

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
