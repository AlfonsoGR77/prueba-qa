import { expect, test } from '../../fixtures/test'
import { anomalies } from '../../data/meters'

/** Tabla de decisión del motor vista desde la UI: tipo → severidad → acción → prioridad. */
test('Anomalías IA muestra los 4 casos documentados en orden de prioridad', async ({ anomaliesPage }) => {
  await anomaliesPage.goto()
  await expect(anomaliesPage.table.getByRole('rowheader')).toHaveText(anomalies.map((a) => a.meterId))

  const action: Record<string, string> = {
    REAL_ANOMALY: 'Investigar',
    DATA_QUALITY: 'Validar medidor',
    EXPLAINABLE_ANOMALY: 'Validar operación',
    FALSE_POSITIVE: 'No escalar',
  }
  for (const a of anomalies) {
    await expect(await anomaliesPage.cell(a.meterId, 'Prior.')).toHaveText(String(a.priority))
    await expect(await anomaliesPage.cell(a.meterId, 'Tipo')).toHaveText(a.typeLabel)
    await expect(await anomaliesPage.cell(a.meterId, 'Severidad')).toHaveText(a.severityLabel)
    await expect(await anomaliesPage.cell(a.meterId, 'Acción')).toHaveText(action[a.type])
    await expect(await anomaliesPage.cell(a.meterId, 'Confianza')).toContainText(a.confidence.toFixed(2).replace('.', ','))
  }
})

test('Run AI Analysis recorre los 7 pasos y termina completado', async ({ page, dashboard }) => {
  await dashboard.goto()
  await dashboard.runAnalysis.click()
  const sheet = page.getByRole('region', { name: /Análisis de IA/ })
  await expect(sheet).toBeVisible()
  for (const step of ['Lecturas', 'Baseline', 'Detección', 'Correlación', 'Eventos', 'Explicación', 'Recomendación']) {
    await expect(sheet).toContainText(step)
  }
  await expect(sheet).toContainText('4 anomalías detectadas · 2 requieren atención prioritaria')
})
