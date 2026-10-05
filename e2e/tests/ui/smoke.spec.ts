import { expect, test } from '../../fixtures/test'

/**
 * Suite de humo de UI (qa/02-smoke.md · SM-09 a SM-12). SM-08 (login) es el proyecto `setup`.
 * Solo `npm run test:smoke` (todo lo etiquetado @smoke).
 */
test.describe('Smoke · UI', { tag: '@smoke' }, () => {
  test('SM-09 · el Despacho muestra la orden 1 y el estado de la planta', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.order('M-109')).toContainText('Orden 1 de 4')
    await expect(dashboard.plantStatus).toContainText('Medidores')
  })

  test('SM-10 · el libro de medidores carga con filas', async ({ metersPage }) => {
    await metersPage.goto()
    await expect(metersPage.rows).toHaveCount(10)
  })

  test('SM-11 · el detalle de un medidor carga', async ({ meterDetail }) => {
    await meterDetail.goto('M-109')
    await expect(meterDetail.header('M-109')).toBeVisible()
  })

  test('SM-12 · Run AI Analysis termina', async ({ page, dashboard }) => {
    await dashboard.goto()
    await dashboard.runAnalysis.click()
    const sheet = page.getByRole('region', { name: /Análisis de IA/ })
    await expect(sheet).toContainText('4 anomalías detectadas · 2 requieren atención prioritaria')
  })
})
