# EnergIA · Frontend

Dashboard para monitorear medidores eléctricos: qué requiere atención, por qué lo dice la IA y qué hacer.

Stack: React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7, TanStack Query 5, axios y Recharts.

## Cómo correrlo

Requisitos: Node 20.19+ o 22.12+ (lo que pide Vite 8), pnpm y el backend corriendo en `http://localhost:8080` (ver `../backend/README.md`). Para correr todo el proyecto junto, con o sin Docker, ver el [README general](../README.md).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # tests (Vitest)
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm build        # build de producción en dist/
```

En desarrollo, Vite reenvía `/api` al backend, así que no hay CORS. La URL del backend es `VITE_API_PROXY_TARGET` (por defecto `http://localhost:8080`); para apuntar a otro backend, cámbiala en el `.env` de la raíz del proyecto (plantilla: `../.env.example`).

En Docker, el `Dockerfile` hace el build con Node 22 y sirve `dist/` con nginx. `nginx.conf` reenvía `/api` al servicio `backend` del `docker-compose.yml` y resuelve las rutas del SPA con `index.html`. El front llama a `/api/v1` con ruta relativa, así que funciona desde cualquier dominio o IP sin configurar CORS.

## Pantallas

| Ruta | Pantalla | Qué responde |
|---|---|---|
| `/login` | Acceso | — |
| `/` | Despacho | ¿Qué está pasando y qué reviso primero? Órdenes por prioridad, los 6 KPI y el libro de medidores |
| `/medidores` | Libro de medidores | Filtros por estado, búsqueda por `meter_id` y orden por consumo, variación o severidad. Los filtros viven en la URL |
| `/medidores/:id` | Detalle | Consumo actual, baseline, variación, estado, voltaje, corriente, factor de potencia e histórico |
| `/anomalias` | Anomalías IA | Tipo, severidad, confianza y acción de cada anomalía |
| `/anomalias/:id` | Investigación | Qué encontró la IA, la acción, la comparación contra baseline, las variables, la evidencia con su puntaje y los eventos |

**Run AI Analysis** está en la barra superior de todas las pantallas. Abre una hoja con los 7 pasos del motor, que se van chequeando a medida que el backend avanza (polling a `GET /ai/analysis/{id}`).

## Arquitectura

Organizada por features, al estilo Bulletproof React. Cada feature tiene sus llamadas HTTP, sus queries y sus componentes.

```
src/
├── app/                 # arranque: providers, router y pantallas (routes/)
├── config/paths.ts      # rutas de la app en un solo lugar
├── features/
│   ├── auth/            # login, sesión y ruta protegida
│   ├── dashboard/       # órdenes y KPIs del despacho
│   ├── meters/          # libro, filtros, detalle
│   ├── anomalies/       # tabla de anomalías e investigación
│   └── analysis/        # Run AI Analysis
├── components/
│   ├── ui/              # piezas del sistema de diseño (Field, Sheet, Stamp...)
│   ├── charts/          # gráficas compartidas (Recharts)
│   ├── domain/          # piezas del dominio que usan varias features
│   └── layout/          # AppShell y encabezados
├── lib/                 # axios, TanStack Query, formato es-CO, etiquetas
├── types/api.entities.ts  # tipos de la API (espejo de /docs/openapi.json)
└── styles/index.css     # tokens del diseño (Tailwind @theme)
```

Reglas:

- **Las dependencias van en una sola dirección:** `app` → `features` → `components` / `lib` / `types`. Una feature no importa de otra: las pantallas en `app/routes` las combinan.
- **Cada feature separa tres capas.** `*.services.ts` hace las llamadas con axios; `*.queries.ts` tiene los hooks de TanStack Query; los componentes solo usan los hooks.
- **Las query keys salen de `lib/query-keys.ts`** y son jerárquicas: invalidar `['meters']` refresca la lista y los detalles de un golpe.
- **La lógica sale de la vista** con un `useX` al lado del componente, cuando la lógica es más que trivial (por ejemplo, `useLoginForm`).
- **Contextos como interfaz `{ state, actions }`.** El `Provider` va en su propio archivo y el hook `useX` en `x-context.ts`.

Las skills de buenas prácticas están en `.agents/skills/`: `vercel-react-best-practices`, `vercel-composition-patterns` y `tanstack-query-best-practices`.

## Diseño

El sistema visual está documentado en `DESIGN.md` y el producto en `PRODUCT.md`. En resumen: formulario de orden de trabajo, tinta verde preimpresa, cifras en máquina de escribir y sellos para el estado. El estado nunca depende solo del color.

Las fechas del dataset son **hora de planta**: se muestran tal como vienen, sin convertirlas a la zona del navegador (`lib/format.ts`).
