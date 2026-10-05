import { expect, test } from '../../fixtures/test'
import { env } from '../../data/env'
import { PAGE_SIZE, TOTAL_METERS } from '../../data/meters'
import { LoginPage } from '../../pages/LoginPage'

/**
 * Nota sobre `{ timeout: 3_000 }`: NO es una espera fija. Es el tope del `expect` web-first
 * (reintenta hasta cumplirse). Se acorta porque estos tests fallan hoy a propósito y no tiene
 * sentido esperar los 7 s por defecto para confirmar algo que no va a ocurrir.
 *
 * Tests que evidencian defectos abiertos (qa/05-defectos.md). Están marcados con
 * test.fail(): hoy fallan y la suite queda verde; cuando el defecto se corrija,
 * Playwright avisa "expected to fail but passed" y se quita la marca.
 */

test('DEF-02 · con 12 medidores se puede llegar a la página 2 con "Siguiente"', async ({ page, metersPage }) => {
  test.fail(true, 'DEF-02 abierto: Pagination.tsx calcula las páginas con Math.floor (12/10 = 1)')

  await metersPage.goto()
  await expect(metersPage.pagination).toContainText(`1–${PAGE_SIZE} de ${TOTAL_METERS} medidores`)

  // Partición/valor límite: count = size + 2 → 2 páginas → "Siguiente" debe estar habilitado.
  await expect(metersPage.next).toBeEnabled({ timeout: 3_000 })
  await metersPage.next.click()
  await expect(page).toHaveURL(/pagina=2/)
  await expect(metersPage.table.getByRole('rowheader')).toHaveText(['M-111', 'M-112'])
})

test('DEF-03 · M-106 (falso positivo, "No escalar") aparece como Normal en el libro', async ({ metersPage }) => {
  test.fail(true, 'DEF-03 abierto: StatusOf no trata FALSE_POSITIVE como NORMAL')

  await metersPage.goto('?medidor=M-106')
  await expect(await metersPage.cell('M-106', 'Anomalía')).toHaveText('Falso positivo')
  // backend/README.md: "Sin anomalía, o FALSE_POSITIVE → NORMAL"
  await expect(await metersPage.cell('M-106', 'Estado')).toHaveText('Normal', { timeout: 3_000 })
})

test('DEF-03 · el KPI del despacho cuenta 9 normales, 1 alerta y 2 críticas', async ({ dashboard }) => {
  test.fail(true, 'DEF-03 abierto: el resumen cuenta a M-106 como alerta')

  await dashboard.goto()
  await expect(dashboard.plantStatus).toContainText('9 normales · 1 alerta · 2 críticas', { timeout: 3_000 })
})

test('DEF-04 · buscar "m-109" en minúsculas encuentra M-109', async ({ metersPage }) => {
  test.fail(true, 'DEF-04 abierto: la búsqueda por meter_id distingue mayúsculas')

  await metersPage.goto()
  await metersPage.searchMeter('m-109')
  await expect(metersPage.rows).toHaveCount(1, { timeout: 3_000 })
  await expect(metersPage.table.getByRole('rowheader')).toHaveText(['M-109'])
})

test.describe('DEF-07 · deep link después del login', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('tras iniciar sesión desde un enlace protegido, el operador SIEMPRE vuelve a ese enlace', async ({ browser }, testInfo) => {
    test.fail(true, 'DEF-07 abierto: carrera entre LoginRoute (<Navigate to="/">) y navigate(from) — falla ~70 % de las veces (29 de 41 intentos medidos)')
    test.setTimeout(90_000)

    // Defecto intermitente: se repite el flujo N veces en contextos limpios.
    // Con una tasa de falla de ~70 % (incluso con 50 %), la probabilidad de que 10 intentos pasen todos es < 0,1 %,
    // así que test.fail() es estable hoy; cuando se corrija pasarán los 10 y Playwright avisará.
    const attempts = 10
    const landed: string[] = []
    for (let i = 0; i < attempts; i++) {
      const ctx = await browser.newContext({ ...testInfo.project.use, storageState: undefined })
      const page = await ctx.newPage()
      await page.goto('/medidores/M-104')
      await expect(page).toHaveURL(/\/login$/)
      await new LoginPage(page).login(env.email, env.password)
      // Estado final estable: o el detalle de M-104 o el Despacho.
      await expect(page.getByRole('heading', { level: 1, name: /^(M-104|Despacho)$/ })).toBeVisible()
      landed.push(new URL(page.url()).pathname)
      await ctx.close()
    }
    testInfo.annotations.push({ type: 'aterrizajes', description: landed.join(', ') })
    expect(landed.filter((p) => p !== '/medidores/M-104'), `destinos: ${landed.join(', ')}`).toEqual([])
  })
})
