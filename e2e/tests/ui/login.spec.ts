import { expect, test } from '../../fixtures/test'
import { env } from '../../data/env'

// Estos tests necesitan empezar SIN sesión.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login (partición de equivalencia)', () => {
  test('sin sesión, una ruta protegida redirige a /login (el regreso a la ruta original es DEF-07)', async ({ page }) => {
    await page.goto('/medidores/M-104')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  })

  const invalid = [
    { name: 'contraseña incorrecta', email: env.email, password: 'admin1234', msg: 'Email o contraseña incorrectos' },
    { name: 'usuario inexistente', email: 'otro@energia.local', password: env.password, msg: 'Email o contraseña incorrectos' },
    { name: 'contraseña en mayúsculas (case-sensitive)', email: env.email, password: env.password.toUpperCase(), msg: 'Email o contraseña incorrectos' },
  ]
  for (const c of invalid) {
    test(`credenciales inválidas: ${c.name}`, async ({ page, loginPage }) => {
      await loginPage.goto()
      await loginPage.login(c.email, c.password)
      await expect(loginPage.error).toContainText(c.msg)
      await expect(page).toHaveURL(/\/login$/)
    })
  }

  test('email con mayúsculas y espacios es válido (se normaliza)', async ({ page, loginPage }) => {
    await loginPage.goto()
    await loginPage.login(`  ${env.email.toUpperCase()}  `, env.password)
    await expect(page.getByRole('heading', { name: 'Despacho', level: 1 })).toBeVisible()
  })

  test('cerrar sesión borra el token y protege de nuevo las rutas', async ({ page, loginPage }) => {
    await loginPage.goto()
    await loginPage.login(env.email, env.password)
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => localStorage.getItem('energyai.token'))).toBeNull()
    await page.goto('/anomalias')
    await expect(page).toHaveURL(/\/login$/)
  })
})
