import { expect, type Locator, type Page } from '@playwright/test'
import { AppShell } from './AppShell'

/** Detalle de un medidor (/medidores/:id). */
export class MeterDetailPage extends AppShell {
  constructor(page: Page) {
    super(page)
  }

  async goto(meterId: string) {
    await this.page.goto(`/medidores/${meterId}`)
    await this.expectLoaded(meterId)
  }

  async expectLoaded(meterId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/medidores/${meterId}$`))
    await expect(this.title(meterId)).toBeVisible()
  }

  title(meterId: string): Locator {
    return this.page.getByRole('heading', { name: meterId, level: 1 })
  }

  /** Encabezado de la hoja: región con nombre = ID del medidor. */
  header(meterId: string): Locator {
    return this.page.getByRole('region', { name: meterId })
  }

  /**
   * Casilla "etiqueta / valor". El componente Field no tiene semántica (div + span),
   * así que se ubica por el texto visible de la etiqueta y se sube a su contenedor.
   * Recomendación al equipo: usar <dl>/<dt>/<dd> o aria-labelledby para poder usar getByRole.
   */
  field(scope: Locator, label: string): Locator {
    return scope.getByText(label, { exact: true }).locator('xpath=..')
  }

  /** Casilla de una variable eléctrica (Voltaje, Corriente, Factor de potencia): tiene la nota "Normal …". */
  electrical(label: 'Voltaje' | 'Corriente' | 'Factor de potencia'): Locator {
    return this.page.getByText(label, { exact: true }).locator('xpath=..').filter({ hasText: /Normal/ })
  }

  get order(): Locator {
    return this.page.getByRole('region', { name: /^Orden \d+ ·/ })
  }

  get lastReading(): Locator {
    return this.page.getByText(/^Última lectura \d/)
  }

  get openInvestigation(): Locator {
    return this.page.getByRole('link', { name: 'Abrir investigación' })
  }
}
