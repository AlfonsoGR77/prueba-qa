import { expect, test } from '../../fixtures/test'
import { env } from '../../data/env'
import { TOTAL_METERS } from '../../data/meters'

/**
 * Suite de humo de API (qa/02-smoke.md · SM-01 a SM-07 y SM-13).
 * Solo `npm run test:smoke` (todo lo etiquetado @smoke).
 */
test.describe('Smoke · API', { tag: '@smoke' }, () => {
  test('SM-01 · /health responde 200', async ({ request }) => {
    const res = await request.get(`${env.apiURL}/health`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  test('SM-02 · el login entrega un token Bearer', async ({ request }) => {
    const res = await request.post(`${env.apiURL}/api/v1/auth/login`, { data: { email: env.email, password: env.password } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toMatchObject({ token_type: 'Bearer', access_token: expect.any(String) })
  })

  test('SM-03 · las rutas protegidas exigen token', async ({ request }) => {
    const res = await request.get(`${env.apiURL}/api/v1/meter/getParams`)
    expect(res.status()).toBe(401)
  })

  test('SM-04 · el motor cargó los 12 medidores', async ({ api }) => {
    const res = await api.post('meter/getAll')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(TOTAL_METERS)
    expect(body.rows).toHaveLength(10)
  })

  test('SM-05 · el caso principal M-109 existe como anomalía real', async ({ api }) => {
    const res = await api.get('meter/getById/M-109')
    expect(res.status()).toBe(200)
    expect((await res.json()).anomaly.type).toBe('REAL_ANOMALY')
  })

  test('SM-06 · hay 4 anomalías detectadas', async ({ api }) => {
    const res = await api.get('anomaly/getAll')
    expect(res.status()).toBe(200)
    expect(await res.json()).toHaveLength(4)
  })

  test('SM-07 · el resumen del dashboard responde', async ({ api }) => {
    const res = await api.get('dashboard/getSummary')
    expect(res.status()).toBe(200)
    expect((await res.json()).total_meters).toBe(TOTAL_METERS)
  })

  test('SM-13 · la documentación de la API (Swagger) está disponible', async ({ request }) => {
    const res = await request.get(`${env.apiURL}/docs`)
    expect(res.status()).toBe(200)
  })
})
