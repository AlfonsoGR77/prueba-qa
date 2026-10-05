import { formatPlantDate, formatPlantDay, formatPlantTime } from './format'

/**
 * Tests de QA · DEF-01. vite.config.ts fuerza TZ=UTC en los tests, y eso
 * esconde el defecto: los usuarios están en America/Bogota (UTC-5).
 * Aquí se cambia la zona del proceso para probar como el operador real.
 * `it.fails`: hoy falla (defecto abierto); cuando se corrija, Vitest avisará
 * que pasó y habrá que quitar el `.fails`.
 */
describe('hora de planta en la zona del operador (America/Bogota)', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'America/Bogota')
  })
  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('el entorno de este test está realmente en UTC-5', () => {
    expect(new Date('2026-09-12T14:00:00Z').getHours()).toBe(9)
  })

  it.fails('formatPlantTime no convierte 14:00 de planta a 09:00 (DEF-01)', () => {
    expect(formatPlantTime('2026-09-12T14:00:00Z')).toBe('12/09 14:00')
  })

  it.fails('formatPlantTime no cambia de día una lectura de medianoche (DEF-01)', () => {
    // M-106: detectada 08/09 00:00 → hoy la UI muestra 07/09 19:00
    expect(formatPlantTime('2026-09-08T00:00:00Z')).toBe('08/09 00:00')
  })

  it('formatPlantDay y formatPlantDate sí usan las partes UTC (control)', () => {
    expect(formatPlantDay('2026-09-08T00:00:00Z')).toBe('08/09')
    expect(formatPlantDate('2026-09-01T00:00:00Z')).toBe('1 sept')
  })
})
