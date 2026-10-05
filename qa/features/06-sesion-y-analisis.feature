# Generado desde qa/03-casos-caja-negra.md — no editar a mano.
# language: es
Característica: Sesión del operador y ejecución del análisis de IA
  Como operador
  Quiero volver a la pantalla que abrí después de iniciar sesión y poder relanzar el análisis
  Para trabajar con enlaces compartidos y con datos actualizados

  Antecedentes:
    Dado que la aplicación está desplegada

  @CN-22 @ui @flujo @P2 @DEF-07
  Escenario: Abrir un enlace protegido sin sesión y volver a él después del login
    Dado que no tengo una sesión iniciada
    Cuando abro "/medidores/M-104"
    Entonces me redirige a "/login"
    Cuando inicio sesión con "admin@energia.local" y "admin123"
    Entonces llego a "/medidores/M-104" y veo el detalle de M-104
    Y esto ocurre en 10 de 10 intentos

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

  @CN-24 @ui @flujo @P2
  Escenario: Cerrar sesión protege de nuevo las rutas
    Dado que inicié sesión
    Cuando presiono "Cerrar sesión"
    Entonces llego a "/login"
    Y el navegador ya no tiene "energyai.token"
    Cuando abro "/anomalias"
    Entonces me redirige a "/login"
