import { expect, test as setup } from '@playwright/test'
import { env } from '../../data/env'
import { LoginPage } from '../../pages/LoginPage'

/**
 * Login reutilizable: se hace UNA vez por la UI y la sesión (el JWT en
 * localStorage) se guarda en .auth/operador.json. Los tests de UI arrancan ya
 * autenticados gracias a `storageState` en playwright.config.ts.
 */
setup('SM-08 · login del operador', { tag: '@smoke' }, async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.login(env.email, env.password)

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Despacho', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()

  await page.context().storageState({ path: env.storageState })
})
