import { expect, test } from '../../fixtures/test'
import { anomalies, m109 } from '../../data/meters'

/**
 * DEF-01 · La hora de planta se convierte a la zona del navegador.
 *
 * Oráculo: frontend/README.md y PRODUCT.md → "Las fechas del dataset son hora de
 * planta: se muestran tal como vienen, sin convertirlas a la zona del navegador".
 * El propio `reason` del motor dice "desde 12/09 14:00".
 *
 * Estos tests corren en dos proyectos:
 *  - chromium-utc    → pasan (UTC no desplaza la hora: por eso el bug no se ve en CI ni en los unit tests).
 *  - chromium-bogota → fallan hoy (marcados con test.fail). Cuando se corrija el defecto,
 *                      Playwright reportará "expected to fail but passed" y hay que quitar la marca.
 */
test.describe('Hora de planta (DEF-01)', () => {
  test.beforeEach(({}, testInfo) => {
    test.fail(
      testInfo.project.use.timezoneId === 'America/Bogota' || testInfo.project.name.includes('bogota'),
      'DEF-01 abierto: en America/Bogota la UI muestra la hora de planta 5 h antes',
    )
  })

  test('la orden de M-109 muestra "Detectada" igual que el inicio que dice el motor', async ({ dashboard }) => {
    await dashboard.goto()
    const lead = dashboard.order('M-109')
    await expect(lead).toContainText('desde 12/09 14:00') // texto del motor: siempre correcto
    await expect(lead).toContainText(`Detectada ${m109.reasonFragment.match(/\d{2}\/\d{2} \d{2}:\d{2}/)![0]}`)
  })

  test('la columna "Detectada" de Anomalías IA coincide con la documentación', async ({ anomaliesPage }) => {
    await anomaliesPage.goto()
    for (const a of anomalies) {
      await expect.soft(await anomaliesPage.cell(a.meterId, 'Detectada')).toHaveText(a.detectedAtPlant)
    }
  })

  test('la última lectura de M-109 es 14/09 23:00 (última hora del dataset)', async ({ meterDetail }) => {
    await meterDetail.goto('M-109')
    await expect(meterDetail.lastReading).toContainText(m109.lastReadingPlant)
  })
})
