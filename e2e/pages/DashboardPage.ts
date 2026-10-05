import { expect, type Locator, type Page } from '@playwright/test'
import { AppShell } from './AppShell'

export class DashboardPage extends AppShell {
  readonly heading: Locator
  readonly orders: Locator
  readonly plantStatus: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Despacho', level: 1 })
    this.orders = page.getByRole('region', { name: 'Órdenes emitidas por la IA' })
    this.plantStatus = page.getByRole('region', { name: 'Estado de la planta' })
  }

  async goto() {
    await this.page.goto('/')
    await expect(this.heading).toBeVisible()
  }

  /** Tarjeta de la orden del medidor (artículo con su heading). */
  order(meterId: string): Locator {
    return this.orders.getByRole('article').filter({ has: this.page.getByRole('heading', { name: meterId }) })
  }
}
