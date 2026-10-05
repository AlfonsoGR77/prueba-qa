import type { Locator, Page } from '@playwright/test'

/** Barra superior común a todas las pantallas autenticadas. */
export class AppShell {
  readonly nav: Locator
  readonly logout: Locator
  readonly runAnalysis: Locator

  constructor(readonly page: Page) {
    this.nav = page.getByRole('navigation', { name: 'Principal' })
    this.logout = page.getByRole('button', { name: 'Cerrar sesión' })
    this.runAnalysis = page.getByRole('button', { name: /Run AI Analysis/ })
  }

  async goToMeters() {
    await this.nav.getByRole('link', { name: 'Medidores' }).click()
  }

  async goToAnomalies() {
    await this.nav.getByRole('link', { name: 'Anomalías IA' }).click()
  }
}
