import { expect, test } from '../../fixtures/test'
import { allMeterIds, anomalies, m109, TOTAL_METERS } from '../../data/meters'

interface Row {
  meter_id: string
  status: string
  severity: string | null
  anomaly_type: string | null
  priority: number | null
  consumption_kwh: number
  variation_pct: number
}
interface Page {
  page: number
  size: number
  count: number
  rows: Row[]
}

test.describe('API · POST /meter/getAll · paginación (valores límite)', () => {
  const ok = [
    { page: 0, size: 0, expPage: 1, expSize: 10, rows: 10, why: '0 = no enviado → defaults' },
    { page: 1, size: 1, expPage: 1, expSize: 1, rows: 1, why: 'size mínimo' },
    { page: 1, size: 100, expPage: 1, expSize: 100, rows: 12, why: 'size máximo' },
    { page: 2, size: 10, expPage: 2, expSize: 10, rows: 2, why: 'última página parcial' },
    { page: 3, size: 5, expPage: 3, expSize: 5, rows: 2, why: 'última página exacta' },
    { page: 4, size: 5, expPage: 4, expSize: 5, rows: 0, why: 'primera página fuera de rango → []' },
  ]
  for (const c of ok) {
    test(`page=${c.page} size=${c.size} (${c.why})`, async ({ api }) => {
      const res = await api.post('meter/getAll', { data: { pagination: { page: c.page, size: c.size } } })
      expect(res.status()).toBe(200)
      const body = (await res.json()) as Page
      expect(body).toMatchObject({ page: c.expPage, size: c.expSize, count: TOTAL_METERS })
      expect(body.rows).toHaveLength(c.rows)
    })
  }

  for (const size of [101, -1]) {
    test(`size=${size} → 400 "pagination.size debe estar entre 1 y 100"`, async ({ api }) => {
      const res = await api.post('meter/getAll', { data: { pagination: { page: 1, size } } })
      expect(res.status()).toBe(400)
      expect((await res.json()).errors).toContain('pagination.size debe estar entre 1 y 100')
    })
  }

  test('DEF-05 · page=-1 debe ser 400 (validación), no 500', async ({ api }) => {
    test.fail(true, 'DEF-05 abierto: Pagination.Normalize no valida page < 0 y Paginate hace panic')
    const res = await api.post('meter/getAll', { data: { pagination: { page: -1, size: 10 } } })
    expect(res.status()).toBe(400)
  })
})

test.describe('API · POST /meter/getAll · filtros y orden', () => {
  test('sin body: página 1 de 10, ordenada por medidor ASC', async ({ api }) => {
    const body = (await (await api.post('meter/getAll')).json()) as Page
    expect(body.rows.map((r) => r.meter_id)).toEqual(allMeterIds.slice(0, 10))
  })

  test('status=CRITICAL devuelve M-109 y M-112', async ({ api }) => {
    const body = (await (await api.post('meter/getAll', { data: { filter: { status: 'CRITICAL' } } })).json()) as Page
    expect(body.rows.map((r) => r.meter_id)).toEqual(['M-109', 'M-112'])
  })

  test('status inválido → 400 con el mensaje documentado', async ({ api }) => {
    const res = await api.post('meter/getAll', { data: { filter: { status: 'ROJO' } } })
    expect(res.status()).toBe(400)
    expect(await res.json()).toMatchObject({
      status_code: 400,
      message: 'Filtros inválidos',
      errors: ['filter.status debe ser NORMAL, ALERT o CRITICAL'],
      path: '/api/v1/meter/getAll',
    })
  })

  test('meter_id "109" encuentra M-109 (búsqueda parcial)', async ({ api }) => {
    const body = (await (await api.post('meter/getAll', { data: { filter: { meter_id: '109' } } })).json()) as Page
    expect(body.rows.map((r) => r.meter_id)).toEqual(['M-109'])
  })

  test('DEF-04 · meter_id "m-109" encuentra M-109 (sin importar mayúsculas)', async ({ api }) => {
    test.fail(true, 'DEF-04 abierto: strings.Contains distingue mayúsculas')
    const body = (await (await api.post('meter/getAll', { data: { filter: { meter_id: 'm-109' } } })).json()) as Page
    expect(body.rows.map((r) => r.meter_id)).toEqual(['M-109'])
  })

  const sorts = [
    { by: 'consumption', order: 'DESC', first: 'M-109', key: 'consumption_kwh' as const },
    { by: 'consumption', order: 'ASC', first: 'M-107', key: 'consumption_kwh' as const },
    { by: 'variation', order: 'DESC', first: 'M-109', key: 'variation_pct' as const },
  ]
  for (const s of sorts) {
    test(`sort_by=${s.by} ${s.order} queda ordenado de verdad`, async ({ api }) => {
      const body = (await (
        await api.post('meter/getAll', { data: { pagination: { size: 100 }, filter: { sort_by: s.by, sort_order: s.order } } })
      ).json()) as Page
      const values = body.rows.map((r) => r[s.key])
      const sorted = [...values].sort((a, b) => (s.order === 'ASC' ? a - b : b - a))
      expect(values).toEqual(sorted)
      expect(body.rows[0].meter_id).toBe(s.first)
    })
  }

  test('sort_by=severity DESC: HIGH → MEDIUM → LOW → sin anomalía; empate por meter_id', async ({ api }) => {
    const body = (await (
      await api.post('meter/getAll', { data: { pagination: { size: 4 }, filter: { sort_by: 'severity', sort_order: 'DESC' } } })
    ).json()) as Page
    expect(body.rows.map((r) => r.meter_id)).toEqual(['M-109', 'M-112', 'M-104', 'M-106'])
  })
})

test.describe('API · tabla de decisión: tipo + severidad → estado (backend/README.md)', () => {
  for (const a of anomalies) {
    const fp = a.type === 'FALSE_POSITIVE'
    test(`${a.meterId}: ${a.type}/${a.severity} → ${a.status}`, async ({ api }) => {
      test.fail(fp, 'DEF-03 abierto: FALSE_POSITIVE debería ser NORMAL')
      const d = await (await api.get(`meter/getById/${a.meterId}`)).json()
      expect(d.anomaly_type).toBe(a.type)
      expect(d.severity).toBe(a.severity)
      expect(d.priority).toBe(a.priority)
      expect(d.status).toBe(a.status)
    })
  }
})

test.describe('API · GET /meter/getById', () => {
  test('M-109: cifras del ejemplo de la documentación', async ({ api }) => {
    const d = await (await api.get('meter/getById/M-109')).json()
    expect(d).toMatchObject({
      meter_id: 'M-109',
      status: 'CRITICAL',
      consumption_kwh: m109.api.consumption_kwh,
      baseline_kwh: m109.api.baseline_kwh,
      variation_pct: m109.api.variation_pct,
      last_reading_at: '2026-09-14T23:00:00Z',
    })
    expect(d.hourly_history).toHaveLength(m109.api.hourly)
    expect(d.daily_history).toHaveLength(m109.api.daily)
    expect(d.anomaly.evidence.change).toMatchObject({ hours: 58, direction: 'UP', ongoing: true })
    // La variación es consistente con consumo y baseline (consistencia interna)
    expect(d.variation_pct).toBeCloseTo(((d.consumption_kwh - d.baseline_kwh) / d.baseline_kwh) * 100, 1)
  })

  test('el ID no distingue mayúsculas: m-109 → M-109', async ({ api }) => {
    const res = await api.get('meter/getById/m-109')
    expect(res.status()).toBe(200)
    expect((await res.json()).meter_id).toBe('M-109')
  })

  test('medidor inexistente → 404 "Medidor no encontrado"', async ({ api }) => {
    const res = await api.get('meter/getById/M-999')
    expect(res.status()).toBe(404)
    expect((await res.json()).message).toBe('Medidor no encontrado')
  })
})

test.describe('API · anomalías y dashboard', () => {
  test('anomaly/getAll: 4 anomalías en el orden de prioridad documentado', async ({ api }) => {
    const list = (await (await api.get('anomaly/getAll')).json()) as { meter_id: string; type: string; severity: string; confidence: number; priority: number }[]
    expect(list.map((a) => [a.priority, a.meter_id, a.type, a.severity, a.confidence])).toEqual(
      anomalies.map((a) => [a.priority, a.meterId, a.type, a.severity, a.confidence]),
    )
    for (const a of list) {
      expect(a.confidence).toBeGreaterThanOrEqual(0.5 * 0.9)
      expect(a.confidence).toBeLessThanOrEqual(0.95)
    }
  })

  test('dashboard/getSummary es consistente con la lista de medidores y las anomalías', async ({ api }) => {
    const s = await (await api.get('dashboard/getSummary')).json()
    const rows = ((await (await api.post('meter/getAll', { data: { pagination: { size: 100 } } })).json()) as Page).rows
    const count = (st: string) => rows.filter((r) => r.status === st).length
    expect(s.total_meters).toBe(rows.length)
    expect(s.status_counts).toEqual({ normal: count('NORMAL'), alert: count('ALERT'), critical: count('CRITICAL') })
    expect(s.anomalies_detected).toBe(4)
    expect(s.requiring_attention).toBe(2)
    expect(s.ai_confidence).toBeCloseTo((0.95 + 0.95 + 0.86 + 0.86) / 4, 1)
  })

  test('DEF-03 · dashboard: 9 normales, 1 alerta, 2 críticas según la regla documentada', async ({ api }) => {
    test.fail(true, 'DEF-03 abierto: M-106 se cuenta como alerta')
    const s = await (await api.get('dashboard/getSummary')).json()
    expect(s.status_counts).toEqual({ normal: 9, alert: 1, critical: 2 })
  })
})
