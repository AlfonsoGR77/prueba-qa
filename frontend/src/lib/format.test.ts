import { formatConfidence, formatKwh, formatPct, formatPlantDay, formatPlantTime } from './format'

describe('formato es-CO', () => {
  it('usa punto de miles y coma decimal', () => {
    expect(formatKwh(2207.6)).toBe('2.207,6 kWh')
    expect(formatConfidence(0.95)).toBe('0,95')
  })

  it('pone signo a la variación', () => {
    expect(formatPct(109.82)).toBe('+109,8 %')
    expect(formatPct(-79.8)).toBe('−79,8 %')
    expect(formatPct(0.01)).toBe('0,0 %')
  })

  it('muestra la hora de planta sin convertirla a la zona del navegador', () => {
    // La API marca como UTC la hora de planta: 14:00 debe seguir siendo 14:00.
    expect(formatPlantTime('2026-09-12T14:00:00Z')).toBe('12/09 14:00')
    expect(formatPlantDay('2026-09-01')).toBe('01/09')
  })
})
