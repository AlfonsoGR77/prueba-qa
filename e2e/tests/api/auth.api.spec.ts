import { expect, test } from '@playwright/test'
import { env } from '../../data/env'

const LOGIN = '/api/v1/auth/login'

test.describe('API · auth (partición de equivalencia y negativas)', () => {
  test('login válido devuelve un JWT Bearer con expiración de 8 h', async ({ request }) => {
    const res = await request.post(LOGIN, { data: { email: env.email, password: env.password } })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ token_type: 'Bearer', expires_in: 28800, user: { email: env.email, name: 'Operador' } })
    expect(body.access_token.split('.')).toHaveLength(3)
  })

  const cases = [
    { name: 'contraseña incorrecta', data: { email: env.email, password: 'x' }, status: 401 },
    { name: 'email inexistente', data: { email: 'no@existe.co', password: env.password }, status: 401 },
    { name: 'campos vacíos', data: { email: '', password: '' }, status: 400 },
    { name: 'falta password', data: { email: env.email }, status: 400 },
  ]
  for (const c of cases) {
    test(`login inválido: ${c.name} → ${c.status} con formato de error estándar`, async ({ request }) => {
      const res = await request.post(LOGIN, { data: c.data })
      expect(res.status()).toBe(c.status)
      const body = await res.json()
      expect(body).toMatchObject({ status_code: c.status, path: LOGIN })
      expect(typeof body.message).toBe('string')
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  }

  test('body que no es JSON → 400', async ({ request }) => {
    const res = await request.post(LOGIN, { data: 'esto no es json', headers: { 'Content-Type': 'application/json' } })
    expect(res.status()).toBe(400)
  })

  const protectedRoutes = [
    ['GET', '/api/v1/auth/me'],
    ['GET', '/api/v1/meter/getParams'],
    ['POST', '/api/v1/meter/getAll'],
    ['GET', '/api/v1/meter/getById/M-109'],
    ['GET', '/api/v1/anomaly/getAll'],
    ['GET', '/api/v1/dashboard/getSummary'],
    ['POST', '/api/v1/ai/analyze'],
  ] as const
  for (const [method, path] of protectedRoutes) {
    test(`${method} ${path} sin token → 401`, async ({ request }) => {
      const res = await request.fetch(path, { method })
      expect(res.status()).toBe(401)
    })
  }

  test('token manipulado (alg none) → 401', async ({ request }) => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const forged = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: env.email, iss: 'energyai-api', exp: 9999999999 })}.`
    const res = await request.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${forged}` } })
    expect(res.status()).toBe(401)
  })

  test('/health es público', async ({ request }) => {
    const res = await request.get('/health')
    expect(res.ok()).toBeTruthy()
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})
