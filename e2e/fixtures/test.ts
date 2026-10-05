import { test as base, expect, type APIRequestContext } from '@playwright/test'
import { env } from '../data/env'
import { AnomaliesPage } from '../pages/AnomaliesPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { MeterDetailPage } from '../pages/MeterDetailPage'
import { MetersPage } from '../pages/MetersPage'

interface Pages {
  loginPage: LoginPage
  dashboard: DashboardPage
  metersPage: MetersPage
  meterDetail: MeterDetailPage
  anomaliesPage: AnomaliesPage
}

interface Api {
  /** Cliente HTTP ya autenticado contra la API (Bearer). Un token por worker. */
  api: APIRequestContext
}

export const test = base.extend<Pages, Api & { token: string }>({
  // ---- page objects (por test) ----
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboard: async ({ page }, use) => use(new DashboardPage(page)),
  metersPage: async ({ page }, use) => use(new MetersPage(page)),
  meterDetail: async ({ page }, use) => use(new MeterDetailPage(page)),
  anomaliesPage: async ({ page }, use) => use(new AnomaliesPage(page)),

  // ---- API (por worker: se hace login una sola vez) ----
  token: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env.apiURL })
      const res = await ctx.post('/api/v1/auth/login', { data: { email: env.email, password: env.password } })
      expect(res.status(), 'login de la API').toBe(200)
      const { access_token } = (await res.json()) as { access_token: string }
      await ctx.dispose()
      await use(access_token)
    },
    { scope: 'worker' },
  ],
  api: [
    async ({ playwright, token }, use) => {
      const ctx = await playwright.request.newContext({
        baseURL: `${env.apiURL}/api/v1/`,
        extraHTTPHeaders: { Authorization: `Bearer ${token}` },
      })
      await use(ctx)
      await ctx.dispose()
    },
    { scope: 'worker' },
  ],
})

export { expect }
