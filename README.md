# EnergIA · AI Energy Management Platform

> **¿Vienes a presentar la prueba técnica de QA?** Empieza por [PRUEBA_QA.md](PRUEBA_QA.md).

MVP para monitorear medidores eléctricos y usar IA para **detectar, explicar, priorizar y recomendar acciones** sobre anomalías de consumo.

Con 14 días de lecturas horarias de 12 medidores, la plataforma responde lo que necesita un operador: qué está pasando, qué se sale de lo normal, si la anomalía es real, explicable o un problema de calidad de datos, cuál revisar primero y qué hacer.

| Prioridad | Medidor | Resultado | Acción |
|---|---|---|---|
| 1 | M-109 | Anomalía real (+110,5 % sin evento que lo explique) | Investigar en sitio |
| 2 | M-112 | Calidad de datos (voltaje y factor de potencia incoherentes) | Validar el medidor |
| 3 | M-104 | Anomalía explicable (nueva línea productiva) | Actualizar baseline |
| 4 | M-106 | Falso positivo (parada programada) | No escalar |

## Proyecto

Este repo tiene dos aplicaciones y la configuración para correrlas juntas:

| Carpeta | Qué es | Documentación |
|---|---|---|
| [`backend/`](backend/) | API en Go: motor de detección de anomalías, login con JWT, Run AI Analysis y narrador opcional con OpenAI | [backend/README.md](backend/README.md): API, variables de entorno, metodología del motor y tests |
| [`frontend/`](frontend/) | Dashboard en React 19 + Vite + TanStack Query | [frontend/README.md](frontend/README.md): pantallas y arquitectura. El diseño está en [DESIGN.md](frontend/DESIGN.md) y el producto en [PRODUCT.md](frontend/PRODUCT.md) |

```
energy-ai/
├── .env.example         # plantilla de variables (copiar como .env)
├── docker-compose.yml   # backend + frontend
├── backend/             # API en Go (datos en backend/data/*.csv)
└── frontend/            # React, servido por nginx en Docker
```

## Configuración

Hay **un solo `.env`**, en la raíz del proyecto. Lo usan el backend, el frontend y `docker compose`:

```bash
cp .env.example .env
```

Todas las variables son opcionales y tienen un valor por defecto, así que la app arranca sin tocar nada. Las que conviene definir:

| Variable | Para qué |
|---|---|
| `OPENAI_API_KEY` | Si está, Run AI Analysis redacta las explicaciones con OpenAI. Si no, las escribe el motor |
| `JWT_SECRET` | Secreto de los tokens. **Cámbialo fuera de local** |
| `AUTH_EMAIL`, `AUTH_PASSWORD` | Usuario del login (por defecto `admin@energia.local` / `admin123`) |

La lista completa está en [backend/README.md](backend/README.md#variables-de-entorno). El `.env` está en `.gitignore` y nunca se sube al repo.

## Cómo correrlo

### Con Docker

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API (Swagger) | http://localhost:8080/docs |

nginx sirve el frontend y reenvía `/api` al backend, así que la app funciona desde cualquier IP sin configurar CORS. Para detenerla: `docker compose down`.

### En desarrollo

Se corre cada aplicación en su propia terminal. El frontend se recarga solo al guardar.

```bash
# Terminal 1: backend (Go 1.26+), en http://localhost:8080
cd backend
go run ./cmd/api

# Terminal 2: frontend (Node 20.19+ y pnpm), en http://localhost:5173
cd frontend
pnpm install
pnpm dev
```

El backend se corre desde `backend/`: ahí busca los CSV (`data/`) y el `.env` de la raíz (`../.env`). En desarrollo, Vite reenvía `/api` al backend.

## Despliegue en un servidor

En cualquier máquina con Docker (por ejemplo, una VM o un LXC de Proxmox):

```bash
git clone <url-del-repo> energy-ai
cd energy-ai
cp .env.example .env     # completa JWT_SECRET, AUTH_PASSWORD y OPENAI_API_KEY
docker compose up -d --build
```

Para actualizar: `git pull && docker compose up -d --build`.

El servidor construye las imágenes, así que no hace falta un registro como Docker Hub. Los CSV van dentro de la imagen del backend.

## Tests

```bash
# backend
cd backend
go test ./...

# frontend
cd frontend
pnpm test && pnpm lint && pnpm typecheck
```

El detalle de qué cubre cada suite está en el README de cada aplicación.
