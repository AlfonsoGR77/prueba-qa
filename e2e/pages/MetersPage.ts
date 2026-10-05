import { expect, type Locator, type Page } from '@playwright/test'
import { AppShell } from './AppShell'

export type StatusTab = 'Todos' | 'Normales' | 'Alertas' | 'Críticas'
export type SortField = 'Medidor' | 'Consumo' | 'Variación' | 'Severidad'

/** Libro de medidores (/medidores): filtros, tabla y paginación. */
export class MetersPage extends AppShell {
  readonly heading: Locator
  readonly search: Locator
  readonly searchButton: Locator
  readonly sortBy: Locator
  readonly sortDirection: Locator
  readonly table: Locator
  readonly pagination: Locator
  readonly next: Locator
  readonly previous: Locator
  readonly emptyState: Locator
  readonly statusGroup: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Libro de medidores', level: 1 })
    this.search = page.getByRole('combobox', { name: 'Medidor' })
    this.searchButton = page.getByRole('button', { name: 'Buscar medidor' })
    this.sortBy = page.getByRole('combobox', { name: 'Ordenar por' })
    this.sortDirection = page.getByRole('button', { name: /^Dirección:/ })
    this.table = page.getByRole('table', { name: 'Medidores filtrados' })
    this.pagination = page.getByRole('navigation', { name: 'Paginación' })
    this.next = this.pagination.getByRole('button', { name: 'Siguiente' })
    this.previous = this.pagination.getByRole('button', { name: 'Anterior' })
    this.emptyState = page.getByText('Ningún medidor coincide con los filtros')
    this.statusGroup = page.getByRole('group', { name: 'Estado' })
  }

  async goto(query = '') {
    await this.page.goto(`/medidores${query}`)
    await expect(this.heading).toBeVisible()
  }

  /** Filas de datos (excluye la fila de encabezados). */
  get rows(): Locator {
    return this.table.getByRole('rowgroup').nth(1).getByRole('row')
  }

  row(meterId: string): Locator {
    return this.table.getByRole('row').filter({ has: this.page.getByRole('rowheader', { name: meterId, exact: true }) })
  }

  /** Celda de un medidor por nombre de columna (el índice sale de los encabezados, no está fijo). */
  async cell(meterId: string, column: string): Promise<Locator> {
    await expect(this.row(meterId)).toBeVisible() // web-first: espera a que la fila exista antes de leer encabezados
    const headers = await this.table.getByRole('columnheader').allInnerTexts()
    const index = headers.findIndex((h) => h.trim() === column)
    if (index < 0) throw new Error(`No existe la columna "${column}". Columnas: ${headers.join(', ')}`)
    return this.row(meterId).locator('th, td').nth(index)
  }


  async filterByStatus(tab: StatusTab) {
    // El <input type=radio> es sr-only: se hace clic en su etiqueta visible, como el usuario,
    // y se verifica el estado accesible del radio (web-first, sin esperas fijas).
    await this.statusGroup.getByText(tab, { exact: true }).click()
    await expect(this.statusGroup.getByRole('radio', { name: tab })).toBeChecked()
  }

  async searchMeter(text: string) {
    await this.search.fill(text)
    await this.searchButton.click()
  }

  async sort(field: SortField, direction: 'ASC' | 'DESC') {
    await this.sortBy.selectOption({ label: field })
    const wantsDesc = direction === 'DESC'
    const isDesc = (await this.sortDirection.getAttribute('aria-label'))?.includes('de mayor a menor')
    if (wantsDesc !== !!isDesc) await this.sortDirection.click()
  }

  async openMeter(meterId: string) {
    await this.row(meterId).getByRole('link', { name: meterId }).click()
  }
}
