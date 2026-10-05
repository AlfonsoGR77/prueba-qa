import { expect, type Locator, type Page } from '@playwright/test'
import { AppShell } from './AppShell'

export class AnomaliesPage extends AppShell {
  readonly table: Locator

  constructor(page: Page) {
    super(page)
    this.table = page.getByRole('table', { name: /Anomalías detectadas por la IA/ })
  }

  async goto() {
    await this.page.goto('/anomalias')
    await expect(this.page.getByRole('heading', { name: 'Anomalías IA', level: 1 })).toBeVisible()
  }

  row(meterId: string): Locator {
    return this.table.getByRole('row').filter({ has: this.page.getByRole('rowheader', { name: meterId, exact: true }) })
  }

  async cell(meterId: string, column: string): Promise<Locator> {
    await expect(this.row(meterId)).toBeVisible() // web-first: espera a que la fila exista antes de leer encabezados
    const headers = await this.table.getByRole('columnheader').allInnerTexts()
    const index = headers.findIndex((h) => h.trim() === column)
    if (index < 0) throw new Error(`No existe la columna "${column}"`)
    return this.row(meterId).locator('th, td').nth(index)
  }
}
