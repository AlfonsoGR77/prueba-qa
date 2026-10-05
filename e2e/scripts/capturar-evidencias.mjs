/**
 * Genera las capturas ANOTADAS de qa/evidencias/DEF-XX/.
 *
 * Cada imagen tiene tres partes:
 *   1. Encabezado: defecto, pantalla y entorno (navegador, zona horaria, commit, fecha).
 *   2. La captura de la pantalla con recuadros numerados sobre el elemento exacto
 *      (rojo = resultado incorrecto, verde = referencia correcta / contexto).
 *   3. Una leyenda debajo: # · Elemento · Esperado · Obtenido · Fuente del esperado.
 * La leyenda va FUERA de la captura para no tapar nada de la aplicación.
 *
 * Uso (con la app arriba):  npm run evidencias
 * Variables: BASE_URL (default http://localhost:5173), API_URL (default http://localhost:8080),
 *            API_LOG (opcional: ruta del log del backend para la evidencia de DEF-05)
 */
import { chromium, request } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../../qa/evidencias')
const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:8080'
const EMAIL = 'admin@energia.local'
const PASS = 'admin123'
const COMMIT = '15765d9'
const TODAY = new Date().toISOString().slice(0, 10)
const RED = '#e5484d'
const GREEN = '#30a46c'

const file = (def, name) => {
  mkdirSync(`${OUT}/${def}`, { recursive: true })
  return `${OUT}/${def}/${name}`
}
const uiEnv = (tz) => `Chromium · zona horaria ${tz} · locale es-CO · 1440×900 · commit ${COMMIT} · ${TODAY}`
const apiEnv = `API ${API} · commit ${COMMIT} · ${TODAY} · token de ${EMAIL}`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ---------------------------------------------------------------- marcas

/** Recuadro con número sobre un rectángulo (coordenadas de página). */
async function drawBox(page, rect, n, color) {
  await page.evaluate(
    ({ rect, n, color }) => {
      const pad = 4
      const d = document.createElement('div')
      d.dataset.qaMark = '1'
      d.style.cssText = `position:absolute;z-index:2147483646;left:${rect.x - pad}px;top:${rect.y - pad}px;width:${rect.width + pad * 2}px;height:${rect.height + pad * 2}px;border:3px solid ${color};border-radius:6px;pointer-events:none;box-shadow:0 0 0 2px rgba(255,255,255,.55)`
      const b = document.createElement('div')
      b.style.cssText = `position:absolute;top:-13px;left:-13px;width:22px;height:22px;border-radius:50%;background:${color};color:#fff;font:700 13px/22px system-ui,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.5)`
      b.textContent = n
      d.appendChild(b)
      document.body.appendChild(d)
    },
    { rect, n, color },
  )
}

/** Rectángulo de un texto exacto (aunque esté dentro de un párrafo más largo). */
async function textRect(page, text) {
  return page.evaluate((text) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const parents = new Set()
    while (walker.nextNode()) parents.add(walker.currentNode.parentElement)
    for (const el of parents) {
      if (el.closest('[data-qa-mark]')) continue
      const nodes = Array.from(el.childNodes).filter((c) => c.nodeType === 3)
      const full = nodes.map((c) => c.textContent).join('')
      const idx = full.indexOf(text)
      if (idx < 0) continue
      let acc = 0, sN, sO, eN, eO
      for (const nd of nodes) {
        const len = nd.textContent.length
        if (sN === undefined && idx < acc + len) { sN = nd; sO = idx - acc }
        if (sN !== undefined && idx + text.length <= acc + len) { eN = nd; eO = idx + text.length - acc; break }
        acc += len
      }
      const r = document.createRange()
      r.setStart(sN, sO)
      r.setEnd(eN, eO)
      const b = r.getBoundingClientRect()
      return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }
    }
    return null
  }, text)
}

async function locRect(locator) {
  const b = await locator.boundingBox()
  const s = await locator.page().evaluate(() => ({ x: scrollX, y: scrollY }))
  return { x: b.x + s.x, y: b.y + s.y, width: b.width, height: b.height }
}

/** Marca un elemento (locator) o un texto exacto (string) con el número n. */
async function mark(page, target, n, color = RED) {
  const rect = typeof target === 'string' ? await textRect(page, target) : await locRect(target)
  if (!rect) throw new Error(`No encontré "${target}" para marcar`)
  await drawBox(page, rect, n, color)
}

// ---------------------------------------------------------------- composición

/**
 * Arma la imagen final: encabezado + captura + leyenda.
 * rows: [{ n, color, element, expected, actual, source }]
 */
async function compose(browser, path, { title, env, png, rows, note }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 400 } })
  const legend = rows
    .map(
      (r) => `<tr>
        <td><span class="n" style="background:${r.color ?? RED}">${r.n}</span></td>
        <td>${r.element}</td>
        <td>${r.expected ?? ''}</td>
        <td class="${(r.color ?? RED) === RED ? 'bad' : ''}">${r.actual ?? ''}</td>
        <td class="src">${r.source ?? ''}</td></tr>`,
    )
    .join('')
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#fff;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#111}
    .h{background:#111;color:#fff;padding:12px 18px;border-bottom:4px solid ${RED}}
    .h b{font-size:16px}.h div{color:#bbb;font-size:12.5px;margin-top:2px}
    img{display:block;width:100%;border-bottom:1px solid #ccc}
    table{border-collapse:collapse;width:100%}
    th{background:#f2f2f2;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:#555;padding:7px 12px;border-bottom:1px solid #ddd}
    td{padding:7px 12px;border-bottom:1px solid #eee;vertical-align:top}
    td.bad{color:#b4141a;font-weight:600}td.src{color:#555;font-size:12.5px}
    .n{display:inline-block;width:22px;height:22px;border-radius:50%;color:#fff;font-weight:700;text-align:center;line-height:22px}
    .note{padding:9px 18px;font-size:13px;color:#333;background:#fafafa}
  </style></head><body>
    <div class="h"><b>${title}</b><div>Entorno: ${env}</div></div>
    <img src="data:image/png;base64,${png.toString('base64')}">
    <table><thead><tr><th>#</th><th>Elemento marcado</th><th>Esperado</th><th>Obtenido</th><th>Fuente del esperado</th></tr></thead><tbody>${legend}</tbody></table>
    ${note ? `<div class="note">${note}</div>` : ''}
  </body></html>`)
  await page.screenshot({ path, fullPage: true })
  await page.close()
  console.log('✓', path.replace(OUT + '/', 'qa/evidencias/'))
}

/** Captura la pantalla (con las marcas), compone la imagen final y limpia las marcas. */
async function capture(page, path, meta, clip) {
  await page.mouse.move(0, 0) // sin hover sobre filas
  const png = await page.screenshot(clip ? { clip } : {})
  await page.evaluate(() => document.querySelectorAll('[data-qa-mark]').forEach((n) => n.remove()))
  await compose(page.context().browser(), path, { ...meta, png })
}

/** "Terminal" para evidencias de API y de tests: líneas con resaltado y la misma leyenda. */
async function terminal(browser, path, { title, env, lines, rows, note }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 200 } })
  const html = lines
    .map((l) => {
      const t = typeof l === 'string' ? { text: l } : l
      const st = t.n ? `outline:3px solid ${t.color ?? RED};background:${(t.color ?? RED) === RED ? 'rgba(229,72,77,.22)' : 'rgba(48,164,108,.2)'}` : ''
      const badge = t.n ? `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${t.color ?? RED};color:#fff;font:700 12px/20px system-ui;text-align:center;margin-right:8px">${t.n}</span>` : ''
      return `<div style="padding:2px 8px;margin:3px 0;border-radius:3px;color:${t.cmd ? '#8ab4ff' : '#e6e6e6'};${st}">${badge}${esc(t.text) || '&nbsp;'}</div>`
    })
    .join('')
  await page.setContent(`<body style="margin:0;background:#0d1117"><pre style="margin:0;padding:16px 14px;font:13.5px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${html}</pre></body>`)
  const png = await page.screenshot({ fullPage: true })
  await page.close()
  await compose(browser, path, { title, env, png, rows, note })
}

async function login(page, path = '/') {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Contraseña').fill(PASS)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('heading', { name: 'Despacho', level: 1 }).waitFor()
  if (path !== '/') await page.goto(BASE + path)
}

const cellOf = async (table, page, meterId, column) => {
  const headers = await table.getByRole('columnheader').allInnerTexts()
  const row = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: meterId, exact: true }) })
  return row.locator('th, td').nth(headers.findIndex((h) => h.trim() === column))
}

// =====================================================================
const browser = await chromium.launch()
const ctxFor = (tz) => browser.newContext({ timezoneId: tz, locale: 'es-CO', viewport: { width: 1440, height: 900 } })
const DOC_FE = 'frontend/README.md y PRODUCT.md: "hora de planta, sin convertirla a la zona del navegador"'

// ---------------- DEF-01 ----------------
{
  const ctx = await ctxFor('America/Bogota')
  const page = await ctx.newPage()
  await login(page)
  await page.getByRole('article', { name: 'M-109' }).waitFor()
  await mark(page, 'Detectada 12/09 09:00', 1, RED)
  await mark(page, 'desde 12/09 14:00', 2, GREEN)
  await capture(page, file('DEF-01', '01-despacho-orden-m109-bogota.png'), {
    title: 'DEF-01 · Despacho → tarjeta "Orden 1 de 4" (M-109): la hora "Detectada" contradice el texto del motor',
    env: uiEnv('America/Bogota'),
    rows: [
      { n: 1, element: 'Encabezado de la tarjeta, esquina superior derecha: "Detectada …"', expected: '12/09 14:00', actual: '12/09 09:00 (−5 h)', source: `${DOC_FE}; API detected_at = 2026-09-12T14:00:00Z` },
      { n: 2, color: GREEN, element: 'Párrafo "Qué encontró la IA" (texto del motor)', expected: 'desde 12/09 14:00', actual: 'desde 12/09 14:00 ✔', source: 'Referencia: el motor escribe la hora de planta' },
    ],
  }, { x: 0, y: 60, width: 1440, height: 500 })

  await page.goto(`${BASE}/anomalias`)
  const table = page.getByRole('table')
  await table.getByRole('rowheader', { name: 'M-106' }).waitFor()
  const exp = { 'M-109': '12/09 14:00', 'M-112': '13/09 00:00', 'M-104': '11/09 00:00', 'M-106': '08/09 00:00' }
  const rows = []
  let n = 1
  for (const [id, e] of Object.entries(exp)) {
    const cell = await cellOf(table, page, id, 'Detectada')
    const got = (await cell.innerText()).trim()
    await mark(page, cell.getByText(got), n)
    rows.push({ n: n++, element: `Fila ${id} · columna "Detectada"`, expected: e, actual: `${got}${got.slice(0, 5) !== e.slice(0, 5) ? ' (cambia el día)' : ''}`, source: 'API anomaly/getAll → detected_at' })
  }
  await capture(page, file('DEF-01', '03-anomalias-columna-detectada-bogota.png'), {
    title: 'DEF-01 · Anomalías IA → tabla, columna "Detectada": las 4 horas están corridas −5 h y 3 cambian de día',
    env: uiEnv('America/Bogota'),
    rows,
  }, { x: 0, y: 60, width: 1440, height: 400 })

  await page.goto(`${BASE}/medidores/M-109`)
  await page.getByRole('heading', { name: 'M-109', level: 1 }).waitFor()
  await mark(page, '14/09 18:00', 1)
  await capture(page, file('DEF-01', '04-detalle-m109-ultima-lectura-bogota.png'), {
    title: 'DEF-01 · Detalle de M-109 → encabezado, texto "Última lectura … (hora de planta)"',
    env: uiEnv('America/Bogota'),
    rows: [{ n: 1, element: 'Encabezado del medidor, a la derecha: "Última lectura"', expected: '14/09 23:00 (última hora del dataset)', actual: '14/09 18:00', source: 'API getById/M-109 → last_reading_at = 2026-09-14T23:00:00Z' }],
  }, { x: 0, y: 60, width: 1440, height: 340 })
  await ctx.close()
}
{
  const ctx = await ctxFor('UTC')
  const page = await ctx.newPage()
  await login(page)
  await page.getByRole('article', { name: 'M-109' }).waitFor()
  await mark(page, 'Detectada 12/09 14:00', 1, GREEN)
  await mark(page, 'desde 12/09 14:00', 2, GREEN)
  await capture(page, file('DEF-01', '02-despacho-orden-m109-utc-control.png'), {
    title: 'DEF-01 · CONTROL: la misma tarjeta con el navegador en UTC → las dos horas coinciden',
    env: uiEnv('UTC'),
    rows: [
      { n: 1, color: GREEN, element: 'Encabezado de la tarjeta: "Detectada …"', expected: '12/09 14:00', actual: '12/09 14:00 ✔', source: 'Prueba que el error depende de la zona del navegador' },
      { n: 2, color: GREEN, element: 'Párrafo "Qué encontró la IA"', expected: 'desde 12/09 14:00', actual: 'desde 12/09 14:00 ✔', source: '—' },
    ],
  }, { x: 0, y: 60, width: 1440, height: 500 })
  await ctx.close()
}

// ---------------- DEF-02 / DEF-03 / DEF-04 (UI) ----------------
{
  const ctx = await ctxFor('America/Bogota')
  const page = await ctx.newPage()
  await login(page, '/medidores')
  await page.getByRole('rowheader', { name: 'M-110' }).waitFor()
  const nav = page.getByRole('navigation', { name: 'Paginación' })
  await mark(page, nav.getByText('1–10'), 1, GREEN)
  await mark(page, nav.getByRole('button', { name: 'Siguiente' }), 2)
  await capture(page, file('DEF-02', '01-libro-siguiente-deshabilitado.png'), {
    title: 'DEF-02 · Libro de medidores → barra de paginación (debajo de la tabla): "Siguiente" deshabilitado con 12 medidores',
    env: uiEnv('America/Bogota'),
    rows: [
      { n: 1, color: GREEN, element: 'Texto de la paginación, abajo a la izquierda', expected: '1–10 de 12 medidores', actual: '1–10 de 12 medidores ✔', source: 'API getAll → count = 12, size = 10 → 2 páginas' },
      { n: 2, element: 'Botón "Siguiente", abajo a la derecha', expected: 'Habilitado (hay página 2)', actual: 'Deshabilitado', source: 'frontend/README: lista paginada; 12 > 10' },
    ],
  })

  await page.goto(`${BASE}/medidores?pagina=2`)
  await page.getByRole('rowheader', { name: 'M-112' }).waitFor()
  await mark(page, page.getByRole('table').getByRole('rowgroup').nth(1), 1)
  await mark(page, page.getByRole('navigation', { name: 'Paginación' }).getByText('11–12'), 2, GREEN)
  await capture(page, file('DEF-02', '02-libro-pagina-2-solo-por-url.png'), {
    title: 'DEF-02 · La página 2 sí existe, pero solo se llega escribiendo ?pagina=2 en la URL',
    env: uiEnv('America/Bogota') + ' · URL: /medidores?pagina=2',
    rows: [
      { n: 1, element: 'Filas de la página 2: M-111 y M-112 (Crítica)', expected: 'Alcanzables con el botón "Siguiente"', actual: 'Solo por URL', source: 'Impacto: M-112 es crítico' },
      { n: 2, color: GREEN, element: 'Texto de la paginación', expected: '11–12 de 12', actual: '11–12 de 12 ✔', source: '—' },
    ],
  }, { x: 0, y: 60, width: 1440, height: 480 })

  await page.goto(`${BASE}/medidores?estado=ALERT`)
  await page.getByRole('rowheader', { name: 'M-106' }).waitFor()
  const table = page.getByRole('table')
  await mark(page, page.getByRole('group', { name: 'Estado' }).getByText('Alertas', { exact: true }), 1, GREEN)
  await mark(page, await cellOf(table, page, 'M-106', 'Estado'), 2)
  await mark(page, await cellOf(table, page, 'M-106', 'Anomalía'), 3, GREEN)
  await capture(page, file('DEF-03', '01-libro-filtro-alertas-incluye-m106.png'), {
    title: 'DEF-03 · Libro de medidores → pestaña "Alertas": M-106 (falso positivo) aparece con estado Alerta',
    env: uiEnv('America/Bogota') + ' · URL: /medidores?estado=ALERT',
    rows: [
      { n: 1, color: GREEN, element: 'Filtro "Estado" → pestaña Alertas (activa)', expected: 'Solo M-104', actual: 'M-104 y M-106', source: '—' },
      { n: 2, element: 'Fila M-106 · columna "Estado"', expected: 'Normal', actual: 'Alerta', source: 'backend/README, tabla "Estado de alerta": FALSE_POSITIVE → NORMAL' },
      { n: 3, color: GREEN, element: 'Fila M-106 · columna "Anomalía"', expected: 'Falso positivo', actual: 'Falso positivo ✔', source: 'Confirma que es FALSE_POSITIVE' },
    ],
  }, { x: 0, y: 60, width: 1440, height: 420 })

  await page.goto(`${BASE}/`)
  const card106 = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'M-106' }) })
  await card106.waitFor()
  await mark(page, card106.getByText('No escalar', { exact: true }).first(), 1, GREEN)
  await mark(page, page.getByRole('region', { name: 'Estado de la planta' }).getByText(/normales ·/), 2)
  await capture(page, file('DEF-03', '02-despacho-kpi-cuenta-m106-como-alerta.png'), {
    title: 'DEF-03 · Despacho: la tarjeta de M-106 dice "No escalar", pero el KPI "Medidores" la cuenta como alerta',
    env: uiEnv('America/Bogota'),
    rows: [
      { n: 1, color: GREEN, element: 'Tarjeta M-106 (orden 4), sello superior derecho', expected: 'No escalar', actual: 'No escalar ✔', source: 'Recomendación del motor' },
      { n: 2, element: 'Panel "Estado de la planta" → casilla "Medidores", texto inferior', expected: '9 normales · 1 alerta · 2 críticas', actual: '8 normales · 2 alerta · 2 críticas', source: 'backend/README: FALSE_POSITIVE → NORMAL' },
    ],
  }, { x: 0, y: 60, width: 1440, height: 720 })

  await page.goto(`${BASE}/medidores`)
  await page.getByRole('rowheader', { name: 'M-101' }).waitFor()
  const search = page.getByRole('combobox', { name: 'Medidor' })
  await search.fill('m-109')
  await page.getByRole('button', { name: 'Buscar medidor' }).click()
  const empty = page.getByText('Ningún medidor coincide con los filtros')
  await empty.waitFor()
  await mark(page, search, 1, GREEN)
  await mark(page, empty.locator('xpath=..'), 2)
  await capture(page, file('DEF-04', '01-libro-busqueda-minusculas-sin-resultados.png'), {
    title: 'DEF-04 · Libro de medidores → buscador "Medidor": "m-109" en minúsculas no encuentra M-109',
    env: uiEnv('America/Bogota') + ' · URL: /medidores?medidor=m-109',
    rows: [
      { n: 1, color: GREEN, element: 'Campo "Medidor" (búsqueda)', expected: '—', actual: 'm-109', source: 'Dato de entrada' },
      { n: 2, element: 'Resultado de la búsqueda', expected: '1 fila: M-109', actual: '"Ningún medidor coincide con los filtros"', source: 'backend/README: meter_id "sin importar mayúsculas"' },
    ],
  }, { x: 0, y: 60, width: 1440, height: 460 })
  await ctx.close()
}

// ---------------- DEF-07 ----------------
{
  let hit = null
  const landings = []
  for (let i = 0; i < 10; i++) {
    const ctx = await ctxFor('America/Bogota')
    const page = await ctx.newPage()
    await page.goto(`${BASE}/medidores/M-104`)
    await page.getByLabel('Email').fill(EMAIL)
    await page.getByLabel('Contraseña').fill(PASS)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.getByRole('heading', { level: 1, name: /^(M-104|Despacho)$/ }).waitFor()
    const path = new URL(page.url()).pathname
    landings.push(path)
    if (path === '/' && !hit) hit = { ctx, page, attempt: i + 1 }
    else await ctx.close()
  }
  if (hit) {
    const { ctx, page, attempt } = hit
    await mark(page, page.getByRole('heading', { name: 'Despacho', level: 1 }), 1)
    const fails = landings.filter((p) => p !== '/medidores/M-104').length
    await capture(page, file('DEF-07', '01-login-desde-enlace-termina-en-despacho.png'), {
      title: 'DEF-07 · Se abrió /medidores/M-104 sin sesión → login → la app terminó en el Despacho',
      env: uiEnv('America/Bogota') + ` · URL final: ${page.url()}`,
      rows: [{ n: 1, element: `Pantalla mostrada después de "Entrar" (intento ${attempt})`, expected: 'Detalle de M-104 (/medidores/M-104)', actual: 'Despacho (/)', source: 'RequireAuth guarda "from" para volver; frontend/README: enlaces compartibles' }],
      note: `<b>Intermitente.</b> 10 intentos en contextos limpios → ${fails} de 10 terminaron en "/". Destinos: ${landings.join(', ')}`,
    }, { x: 0, y: 0, width: 1440, height: 380 })
    await ctx.close()
  }
}

// ---------------- API y tests unitarios ----------------
const api = await request.newContext({ baseURL: API })
const token = (await (await api.post('/api/v1/auth/login', { data: { email: EMAIL, password: PASS } })).json()).access_token
const H = { Authorization: `Bearer ${token}` }

{
  const d = await (await api.get('/api/v1/meter/getById/M-106', { headers: H })).json()
  const s = await (await api.get('/api/v1/dashboard/getSummary', { headers: H })).json()
  await terminal(browser, file('DEF-03', '03-api-m106-status-alert.png'), {
    title: 'DEF-03 · API: GET /meter/getById/M-106 y GET /dashboard/getSummary',
    env: apiEnv,
    lines: [
      { text: '$ curl -s localhost:8080/api/v1/meter/getById/M-106 -H "Authorization: Bearer $TOKEN"', cmd: true },
      `  "meter_id": "${d.meter_id}",`,
      { text: `  "anomaly_type": "${d.anomaly_type}",`, n: 1, color: GREEN },
      `  "severity": "${d.severity}",`,
      { text: `  "status": "${d.status}",`, n: 2 },
      '',
      { text: '$ curl -s localhost:8080/api/v1/dashboard/getSummary -H "Authorization: Bearer $TOKEN"', cmd: true },
      { text: `  "status_counts": ${JSON.stringify(s.status_counts)}`, n: 3 },
    ],
    rows: [
      { n: 1, color: GREEN, element: 'Campo anomaly_type', expected: 'FALSE_POSITIVE', actual: `${d.anomaly_type} ✔`, source: 'README: M-106 = falso positivo' },
      { n: 2, element: 'Campo status', expected: 'NORMAL', actual: d.status, source: 'backend/README, tabla "Estado de alerta"' },
      { n: 3, element: 'status_counts del dashboard', expected: '{"normal":9,"alert":1,"critical":2}', actual: JSON.stringify(s.status_counts), source: 'Consecuencia del punto 2' },
    ],
  })
}
{
  const up = await (await api.post('/api/v1/meter/getAll', { headers: H, data: { filter: { meter_id: 'M-109' } } })).json()
  const lo = await (await api.post('/api/v1/meter/getAll', { headers: H, data: { filter: { meter_id: 'm-109' } } })).json()
  const byId = await api.get('/api/v1/meter/getById/m-109', { headers: H })
  await terminal(browser, file('DEF-04', '02-api-busqueda-sensible-a-mayusculas.png'), {
    title: 'DEF-04 · API: POST /meter/getAll con filter.meter_id en mayúsculas vs. minúsculas',
    env: apiEnv,
    lines: [
      { text: `$ curl -s -X POST localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -d '{"filter":{"meter_id":"M-109"}}'`, cmd: true },
      { text: `  "count": ${up.count}, "rows": [${up.rows.map((r) => `"${r.meter_id}"`).join(', ')}]`, n: 1, color: GREEN },
      '',
      { text: `$ curl -s -X POST localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -d '{"filter":{"meter_id":"m-109"}}'`, cmd: true },
      { text: `  "count": ${lo.count}, "rows": []`, n: 2 },
      '',
      { text: '$ curl -s localhost:8080/api/v1/meter/getById/m-109 -H "Authorization: Bearer $TOKEN"', cmd: true },
      { text: `  HTTP ${byId.status()} (meter_id: "M-109")`, n: 3, color: GREEN },
    ],
    rows: [
      { n: 1, color: GREEN, element: 'Búsqueda "M-109"', expected: 'count 1', actual: `count ${up.count} ✔`, source: '—' },
      { n: 2, element: 'Búsqueda "m-109"', expected: 'count 1 (M-109)', actual: `count ${lo.count}`, source: 'backend/README y Swagger: "sin importar mayúsculas"' },
      { n: 3, color: GREEN, element: 'Control: getById en minúsculas', expected: '200', actual: `${byId.status()} ✔`, source: 'Inconsistente con getAll' },
    ],
  })
}
{
  const r = await api.post('/api/v1/meter/getAll', { headers: H, data: { pagination: { page: -1, size: 10 } } })
  const body = await r.json()
  const r2 = await api.post('/api/v1/meter/getAll', { headers: H, data: { pagination: { page: 1, size: 101 } } })
  const b2 = await r2.json()
  const logPath = process.env.API_LOG
  // Si se pasa API_LOG (archivo con la salida del backend) se muestra la línea real del panic;
  // si no, se indica dónde verla (la ventana donde corre el backend), sin inventar la línea.
  const log = (logPath && existsSync(logPath) ? readFileSync(logPath, 'utf8').split('\n').filter((l) => l.includes('panic')).pop() : null) ??
    '(ver la ventana/terminal del backend: aparece una línea "ERROR panic error=\"runtime error: slice bounds out of range …\"")'
  await terminal(browser, file('DEF-05', '01-api-page-negativo-responde-500.png'), {
    title: 'DEF-05 · API: POST /meter/getAll con pagination.page = -1',
    env: apiEnv,
    lines: [
      { text: `$ curl -s -i -X POST localhost:8080/api/v1/meter/getAll -H "Authorization: Bearer $TOKEN" -d '{"pagination":{"page":-1,"size":10}}'`, cmd: true },
      { text: `  HTTP/1.1 ${r.status()} ${r.statusText()}`, n: 1 },
      `  ${JSON.stringify(body)}`,
      '',
      { text: '# log del backend en ese instante', cmd: true },
      { text: `  ${log.trim()}`, n: 2 },
      '',
      { text: `$ curl -s -X POST ... -d '{"pagination":{"page":1,"size":101}}'     # control: size fuera de rango`, cmd: true },
      { text: `  HTTP ${r2.status()}  ${JSON.stringify(b2.errors)}`, n: 3, color: GREEN },
    ],
    rows: [
      { n: 1, element: 'Código HTTP', expected: '400 "Filtros inválidos"', actual: `${r.status()} "Error interno del servidor"`, source: 'Swagger: page minimum 1; formato de errores del backend/README' },
      { n: 2, element: 'Log del backend', expected: 'Sin errores', actual: 'panic: slice bounds out of range', source: '—' },
      { n: 3, color: GREEN, element: 'Control: size = 101', expected: '400', actual: `${r2.status()} ✔`, source: 'Así debería responder page < 1' },
    ],
  })
}
{
  const txt = readFileSync(`${OUT}/ejecuciones/go-test-defects.txt`, 'utf8').split('\n')
  const block = (name) => {
    const i = txt.findIndex((l) => l.includes(`--- FAIL: ${name}`))
    const out = [txt[i]]
    for (let j = i + 1; j < txt.length && txt[j].startsWith('    '); j++) out.push(txt[j])
    return out
  }
  const sev = block('TestQA_RealSeverityBoundaries')
  let k = 0
  await terminal(browser, file('DEF-06', '01-unit-test-limites-de-severidad.png'), {
    title: 'DEF-06 · Test unitario de valores límite de realSeverity (backend/internal/analysis/classify)',
    env: `Go 1.26 · commit ${COMMIT} · ${TODAY} · archivo severity_defects_test.go`,
    lines: [
      { text: '$ cd backend && go test -tags defects -run TestQA_RealSeverityBoundaries ./internal/analysis/classify/', cmd: true },
      ...sev.map((l) => (l.includes('esperaba') ? { text: l, n: ++k } : l)),
    ],
    rows: [
      { n: 1, element: 'Variación exactamente 50 %, activa', expected: 'MEDIUM', actual: 'HIGH', source: 'backend/README §8: HIGH si "supera" 50 %' },
      { n: 2, element: 'Variación −50 %, activa', expected: 'MEDIUM', actual: 'HIGH', source: 'Ídem (el código usa valor absoluto)' },
      { n: 3, element: 'Variación exactamente 20 %, no activa', expected: 'LOW', actual: 'MEDIUM', source: 'backend/README §8: MEDIUM si "supera" 20 %' },
    ],
    note: 'Causa: <code>classify.go:222</code> <code>case p &gt;= 50 &amp;&amp; c.Ongoing</code> y <code>classify.go:224</code> <code>case p &gt;= 20</code>.',
  })
  const miss = block('TestQA_SingleMissingHourDoesNotProduceZeroDate')
  await terminal(browser, file('DEF-08', '01-unit-test-hora-faltante-fecha-cero.png'), {
    title: 'DEF-08 · Test unitario: un medidor sano al que le falta UNA hora (backend/internal/analysis)',
    env: `Go 1.26 · commit ${COMMIT} · ${TODAY} · archivo quality_defects_test.go`,
    lines: [
      { text: '$ cd backend && go test -tags defects -run TestQA_SingleMissingHour ./internal/analysis/', cmd: true },
      ...miss.map((l) => (l.includes('detected_at') ? { text: l, n: 1 } : l)),
    ],
    rows: [{ n: 1, element: 'Anomalía generada', expected: 'Sin anomalía (doc §4: 3 h sospechosas o más) o fecha del hueco', actual: 'DATA_QUALITY con detected_at 0001-01-01', source: 'backend/README §4 "Calidad de datos"' }],
    note: 'Causa: <code>quality.go:37</code> <code>HasIssue()</code> se activa con <code>MissingHours &gt; 0</code> aunque <code>FlaggedHours = 0</code>; <code>FirstFlagged</code> queda en cero.',
  })
}

await api.dispose()
await browser.close()
writeFileSync(`${OUT}/.generado`, `Capturas generadas ${new Date().toISOString()} contra ${BASE} / ${API}\n`)
