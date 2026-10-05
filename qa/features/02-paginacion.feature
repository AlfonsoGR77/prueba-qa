# Generado desde qa/03-casos-caja-negra.md — no editar a mano.
# language: es
Característica: Paginación del libro de medidores
  Como operador
  Quiero recorrer la lista de medidores por páginas
  Para revisar todos los medidores, incluidos los que no caben en la primera página

  Antecedentes:
    Dado que el dataset tiene 12 medidores
    Y que tengo un token válido de "admin@energia.local"

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

  @CN-08 @ui @valores-limite @P1 @DEF-02
  Escenario: Pasar a la página 2 del libro de medidores
    Dado que inicié sesión
    Y que estoy en "Medidores" sin filtros
    Entonces la paginación dice "1–10 de 12 medidores"
    Y el botón "Siguiente" está habilitado
    Cuando presiono "Siguiente"
    Entonces la URL contiene "pagina=2"
    Y la tabla muestra los medidores "M-111" y "M-112"
