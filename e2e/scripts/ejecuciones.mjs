/**
 * Corre las suites y guarda su salida en qa/evidencias/ejecuciones/ (UTF-8, sin colores),
 * con un encabezado que registra fecha, sistema operativo y versiones.
 *
 * Uso (con la app arriba, desde e2e/):  npm run ejecuciones
 *   --sin-playwright   omite la corrida de Playwright (la más larga)
 *
 * Funciona igual en Windows (PowerShell/CMD), macOS y Linux. Así se evita el
 * problema de PowerShell, que al redirigir con ">" guarda los archivos en UTF-16.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { arch, platform, release, type } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '../..')
const OUT = resolve(ROOT, 'qa/evidencias/ejecuciones')
const API = process.env.API_URL ?? 'http://localhost:8080'
const COMMIT_APP = '15765d9'
mkdirSync(OUT, { recursive: true })

const strip = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r\n/g, '\n')
const run = (cmd, cwd) => {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' }, maxBuffer: 64 * 1024 * 1024 })
  return { code: r.status, out: strip(`${r.stdout ?? ''}${r.stderr ?? ''}`) }
}
const version = (cmd) => run(cmd, ROOT).out.trim().split('\n')[0]

const env = [
  `Fecha:      ${new Date().toISOString()}`,
  `SO:         ${type()} ${release()} (${platform()} ${arch()})`,
  `Go:         ${version('go version')}`,
  `Node:       ${process.version}`,
  `pnpm:       ${version('pnpm --version')}`,
  `App:        commit ${COMMIT_APP} (código de la aplicación sin modificar)`,
].join('\n')

function save(file, title, cmd, cwd, expected) {
  process.stdout.write(`▶ ${title} … `)
  const { code, out } = run(cmd, cwd)
  const header = `# ${title}\n# Comando: (cd ${cwd.replace(ROOT, '').replace(/^[\\/]/, '') || '.'}) ${cmd}\n# Esperado: ${expected}\n# Código de salida: ${code}\n${env.replace(/^/gm, '# ')}\n\n`
  writeFileSync(resolve(OUT, file), header + out, 'utf8')
  console.log(`listo (salida ${code}) → qa/evidencias/ejecuciones/${file}`)
}

const backend = resolve(ROOT, 'backend')
const frontend = resolve(ROOT, 'frontend')
const e2e = resolve(ROOT, 'e2e')

save('go-test-normal.txt', 'Backend · suite del equipo + tests QA verdes', 'go test ./...', backend, 'todo ok')
save('go-test-cover.txt', 'Backend · cobertura por paquete', 'go test -cover ./...', backend, 'porcentaje por paquete')
save('go-test-defects.txt', 'Backend · tests que evidencian defectos (build tag defects)', 'go test -tags defects ./internal/...', backend, 'FALLAN 7 tests: DEF-03, DEF-04, DEF-05, DEF-06, DEF-08 (salida 1 es lo esperado)')
save('vitest-verbose.txt', 'Frontend · Vitest', 'pnpm vitest run --reporter=verbose', frontend, '17 passed | 4 expected fail')
if (!process.argv.includes('--sin-playwright')) {
  save('playwright-run.txt', 'E2E · Playwright (API + UI Bogotá + UTC)', 'npx playwright test --reporter=list', e2e, '79 passed (los test.fail cuentan como passed)')
}

// ---- Requests / responses de la API para DEF-03, DEF-04 y DEF-05 ----
process.stdout.write('▶ API · requests y responses … ')
const call = async (method, path, body, token) => {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, statusText: res.statusText, json: await res.json() }
}
try {
  const login = await call('POST', '/api/v1/auth/login', { email: 'admin@energia.local', password: 'admin123' })
  const T = login.json.access_token
  const curl = (m, p, b) => `curl -s -X ${m} ${API}${p} -H "Authorization: Bearer $TOKEN"${b ? ` -H "Content-Type: application/json" -d '${JSON.stringify(b)}'` : ''}`
  const blocks = []
  const add = async (title, m, p, b, pick, expected) => {
    const r = await call(m, p, b, T)
    blocks.push(`## ${title}\n\n\`\`\`bash\n${curl(m, p, b)}\n\`\`\`\n\nRespuesta: **HTTP ${r.status}**\n\n\`\`\`json\n${JSON.stringify(pick ? pick(r.json) : r.json, null, 2)}\n\`\`\`\n\n**Esperado:** ${expected}\n`)
  }
  await add('DEF-03 · M-106 (FALSE_POSITIVE) tiene status ALERT', 'GET', '/api/v1/meter/getById/M-106', null,
    (j) => ({ meter_id: j.meter_id, anomaly_type: j.anomaly_type, severity: j.severity, status: j.status }), '`status: "NORMAL"` (backend/README, tabla "Estado de alerta")')
  await add('DEF-03 · Conteo de estados del dashboard', 'GET', '/api/v1/dashboard/getSummary', null,
    (j) => ({ status_counts: j.status_counts }), '`{"normal": 9, "alert": 1, "critical": 2}`')
  await add('DEF-04 · Búsqueda "M-109" (control)', 'POST', '/api/v1/meter/getAll', { filter: { meter_id: 'M-109' } },
    (j) => ({ count: j.count, rows: j.rows.map((r) => r.meter_id) }), 'count 1')
  await add('DEF-04 · Búsqueda "m-109" en minúsculas', 'POST', '/api/v1/meter/getAll', { filter: { meter_id: 'm-109' } },
    (j) => ({ count: j.count, rows: j.rows.map((r) => r.meter_id) }), 'count 1 (M-109): "sin importar mayúsculas"')
  await add('DEF-05 · pagination.page = -1', 'POST', '/api/v1/meter/getAll', { pagination: { page: -1, size: 10 } },
    null, 'HTTP 400 con error de validación (Swagger: page minimum 1). En la ventana del backend aparece `ERROR panic … slice bounds out of range`')
  await add('DEF-05 · control: pagination.size = 101', 'POST', '/api/v1/meter/getAll', { pagination: { page: 1, size: 101 } },
    null, 'HTTP 400 (así debería responder page < 1)')
  writeFileSync(resolve(OUT, 'api-requests.md'),
    `# Evidencia de API · requests y responses\n\n\`\`\`\n${env}\nAPI:        ${API}\n\`\`\`\n\nObtener el token: \`POST /api/v1/auth/login\` con \`{"email":"admin@energia.local","password":"admin123"}\` → \`access_token\`.\n\n${blocks.join('\n')}`, 'utf8')
  console.log('listo → qa/evidencias/ejecuciones/api-requests.md')
} catch (e) {
  console.log(`no se pudo (¿el backend está arriba en ${API}?): ${e.message}`)
}
