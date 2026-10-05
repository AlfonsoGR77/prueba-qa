# Generado desde qa/03-casos-caja-negra.md — no editar a mano.
# language: es
Característica: Autenticación del operador
  Como operador de planta
  Quiero entrar con mi usuario
  Para ver el estado de mis medidores sin que otros accedan a la información

  Antecedentes:
    Dado que la aplicación está desplegada y responde en "/health"
    Y que existe el usuario "admin@energia.local" con contraseña "admin123"

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

  @CN-04 @ui @particion @P3
  Escenario: El email no distingue mayúsculas ni espacios
    Dado que estoy en la pantalla "/login"
    Cuando escribo "  ADMIN@ENERGIA.LOCAL  " en "Email"
    Y escribo "admin123" en "Contraseña"
    Y presiono "Entrar"
    Entonces llego a la pantalla "Despacho"

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
