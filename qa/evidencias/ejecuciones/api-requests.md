# Evidencia de API · requests y responses

```
Fecha:      2026-10-04T18:45:43.079Z
SO:         Windows_NT 10.0.26200 (win32 x64)
Go:         go version go1.27.1 windows/amd64
Node:       v24.21.0
pnpm:       10.34.6
App:        commit 15765d9 (código de la aplicación sin modificar)
API:        http://localhost:8080
```

Obtener el token: `POST /api/v1/auth/login` con `{"email":"admin@energia.local","password":"admin123"}` → `access_token`.

## DEF-03 · M-106 (FALSE_POSITIVE) tiene status ALERT

```bash
curl -s -X GET http://localhost:8080/api/v1/meter/getById/M-106 -H "Authorization: Bearer $TOKEN"
```

Respuesta: **HTTP 200**

```json
{
  "meter_id": "M-106",
  "anomaly_type": "FALSE_POSITIVE",
  "severity": "LOW",
  "status": "ALERT"
}
```

**Esperado:** `status: "NORMAL"` (backend/README, tabla "Estado de alerta")

## DEF-03 · Conteo de estados del dashboard

```bash
curl -s -X GET http://localhost:8080/api/v1/dashboard/getSummary -H "Authorization: Bearer $TOKEN"
```

Respuesta: **HTTP 200**

```json
{
  "status_counts": {
    "normal": 8,
    "alert": 2,
    "critical": 2
  }
}
```

**Esperado:** `{"normal": 9, "alert": 1, "critical": 2}`

## DEF-04 · Búsqueda "M-109" (control)

```bash
curl -s -X POST http://localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"filter":{"meter_id":"M-109"}}'
```

Respuesta: **HTTP 200**

```json
{
  "count": 1,
  "rows": [
    "M-109"
  ]
}
```

**Esperado:** count 1

## DEF-04 · Búsqueda "m-109" en minúsculas

```bash
curl -s -X POST http://localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"filter":{"meter_id":"m-109"}}'
```

Respuesta: **HTTP 200**

```json
{
  "count": 0,
  "rows": []
}
```

**Esperado:** count 1 (M-109): "sin importar mayúsculas"

## DEF-05 · pagination.page = -1

```bash
curl -s -X POST http://localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"pagination":{"page":-1,"size":10}}'
```

Respuesta: **HTTP 500**

```json
{
  "status_code": 500,
  "message": "Error interno del servidor",
  "timestamp": "2026-10-04T18:48:35Z",
  "path": "/api/v1/meter/getAll"
}
```

**Esperado:** HTTP 400 con error de validación (Swagger: page minimum 1). En la ventana del backend aparece `ERROR panic … slice bounds out of range`

## DEF-05 · control: pagination.size = 101

```bash
curl -s -X POST http://localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"pagination":{"page":1,"size":101}}'
```

Respuesta: **HTTP 400**

```json
{
  "status_code": 400,
  "message": "Filtros inválidos",
  "errors": [
    "pagination.size debe estar entre 1 y 100"
  ],
  "timestamp": "2026-10-04T18:48:35Z",
  "path": "/api/v1/meter/getAll"
}
```

**Esperado:** HTTP 400 (así debería responder page < 1)
