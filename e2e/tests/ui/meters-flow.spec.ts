import { expect, test } from '../../fixtures/test'
import { anomalies, m109 } from '../../data/meters'

/**
 * Flujo E2E de negocio (el del evaluador en PRODUCT.md):
 * Despacho → Libro de medidores → filtrar Críticas → buscar M-109 → detalle → investigación.
 * La sesión viene del proyecto `setup` (storageState): no se hace login aquí.
 */
test.describe('Flujo del operador: de la orden prioritaria al detalle del medidor', () => {
  test('encuentra M-109 filtrando por estado y búsqueda, y valida sus datos clave', async ({
    page,
    dashboard,
    metersPage,
    meterDetail,
  }) => {
    await test.step('Despacho: la orden 1 es M-109, anomalía real de severidad alta', async () => {
      await dashboard.goto()
      const lead = dashboard.order('M-109')
      await expect(lead).toContainText('Orden 1 de 4')
      await expect(lead).toContainText(m109.type)
      await expect(lead).toContainText(m109.reasonFragment)
      await expect(lead).toContainText(m109.actionFragment)
    })

    await test.step('Libro de medidores: filtrar por "Críticas" deja solo M-109 y M-112', async () => {
      await dashboard.goToMeters()
      await expect(metersPage.heading).toBeVisible()
      await metersPage.filterByStatus('Críticas')
      await expect(page).toHaveURL(/estado=CRITICAL/) // los filtros viven en la URL (frontend/README.md)
      await expect(metersPage.table.getByRole('rowheader')).toHaveText(['M-109', 'M-112'])
      await expect(metersPage.pagination).toContainText('1–2 de 2 medidores')
    })

    await test.step('Ordenar por consumo de mayor a menor pone a M-109 primero', async () => {
      await metersPage.sort('Consumo', 'DESC')
      await expect(page).toHaveURL(/orden=consumption/)
      await expect(page).toHaveURL(/dir=DESC/)
      await expect(metersPage.table.getByRole('rowheader').first()).toHaveText('M-109')
    })

    await test.step('Buscar "109" (búsqueda parcial) deja una sola fila con los datos esperados', async () => {
      await metersPage.searchMeter('109')
      await expect(page).toHaveURL(/medidor=109/)
      await expect(metersPage.rows).toHaveCount(1)
      await expect(await metersPage.cell('M-109', 'Estado')).toHaveText(m109.status)
      await expect(await metersPage.cell('M-109', 'Consumo 24 h')).toHaveText(m109.consumption)
      await expect(await metersPage.cell('M-109', 'Baseline')).toHaveText(m109.baseline)
      await expect(await metersPage.cell('M-109', 'Variación')).toHaveText(m109.variation)
      await expect(await metersPage.cell('M-109', 'Severidad')).toHaveText(m109.severity)
      await expect(await metersPage.cell('M-109', 'Anomalía')).toHaveText(m109.type)
    })

    await test.step('Detalle de M-109: cifras clave, estado, orden y variables eléctricas', async () => {
      await metersPage.openMeter('M-109')
      await meterDetail.expectLoaded('M-109')

      const header = meterDetail.header('M-109')
      await expect(header).toContainText(m109.status)
      await expect(meterDetail.field(header, 'Consumo actual · 24 h')).toContainText(m109.consumption)
      await expect(meterDetail.field(header, 'Baseline diario')).toContainText(m109.baseline)
      await expect(meterDetail.field(header, 'Variación')).toContainText(m109.variation)
      await expect(meterDetail.field(header, 'Severidad')).toContainText(`${m109.severity}${m109.type}`)

      const expected = anomalies.find((a) => a.meterId === 'M-109')!
      await expect(meterDetail.order).toHaveAccessibleName(`Orden ${expected.priority} · ${expected.typeLabel} · Investigar`)
      await expect(meterDetail.order).toContainText(m109.reasonFragment)
      await expect(meterDetail.order.getByRole('meter', { name: 'Confianza' })).toBeVisible()
      await expect(meterDetail.order).toContainText(m109.confidence)

      // La corriente confirma el cambio: el aumento de consumo es físico, no un error del medidor.
      await expect(meterDetail.electrical('Corriente')).toContainText(m109.current.value)
      await expect(meterDetail.electrical('Corriente')).toContainText(m109.current.change)
      await expect(meterDetail.electrical('Factor de potencia')).toContainText(m109.powerFactorNormal)
      await expect(page.getByRole('heading', { name: 'Histórico por hora' })).toBeVisible()
      await expect(page.getByText('No operational event reported')).toBeVisible()
    })

    await test.step('Abrir la investigación lleva a la orden de trabajo de M-109', async () => {
      await meterDetail.openInvestigation.click()
      await expect(page).toHaveURL(/\/anomalias\/M-109$/)
      await expect(page.getByRole('heading', { name: 'Acción recomendada' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Acción recomendada' })).toContainText(m109.actionFragment)
    })
  })

  test('la API y la UI muestran las mismas cifras para cada medidor de la lista (consistencia entre capas)', async ({
    api,
    metersPage,
  }) => {
    const res = await api.post('meter/getAll', { data: { pagination: { page: 1, size: 10 } } })
    expect(res.ok()).toBeTruthy()
    const body = (await res.json()) as { rows: { meter_id: string; consumption_kwh: number; baseline_kwh: number }[] }

    await metersPage.goto()
    await expect(metersPage.rows).toHaveCount(body.rows.length)
    const fmt = (n: number) => `${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)} kWh`
    for (const r of body.rows) {
      await expect.soft(await metersPage.cell(r.meter_id, 'Consumo 24 h')).toHaveText(fmt(r.consumption_kwh))
      await expect.soft(await metersPage.cell(r.meter_id, 'Baseline')).toHaveText(fmt(r.baseline_kwh))
    }
  })

  test('buscar un medidor que no existe muestra el estado vacío y permite quitar filtros', async ({ page, metersPage }) => {
    await metersPage.goto()
    await metersPage.searchMeter('XYZ')
    await expect(metersPage.emptyState).toBeVisible()
    await expect(page.getByText('No hay medidores que contengan "XYZ".')).toBeVisible()
    await page.getByRole('button', { name: 'Quitar filtros' }).click()
    await expect(metersPage.rows).toHaveCount(10)
  })

  test('un medidor inexistente en la URL muestra "No existe el medidor"', async ({ page }) => {
    await page.goto('/medidores/M-999')
    await expect(page.getByRole('heading', { name: 'No existe el medidor M-999' })).toBeVisible()
  })
})
