import { render, screen } from '@testing-library/react'
import { SegmentedMeter } from './SegmentedMeter'
import { SeverityMark } from './SeverityMark'
import { StatusMark } from './StatusMark'

describe('el estado nunca depende solo del color', () => {
  it('los sellos llevan texto', () => {
    render(<StatusMark status="CRITICAL" />)
    expect(screen.getByText('Crítica')).toBeInTheDocument()
  })

  it('un medidor normal no lleva sello, pero sí dice su estado', () => {
    render(<StatusMark status="NORMAL" />)
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('la severidad se escribe en palabras', () => {
    render(<SeverityMark severity="HIGH" />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('la confianza es un meter accesible con su valor', () => {
    render(<SegmentedMeter value={0.95} />)
    const meter = screen.getByRole('meter', { name: 'Confianza' })
    expect(meter).toHaveAttribute('aria-valuenow', '0.95')
    expect(meter).toHaveAttribute('aria-valuetext', '0,95 (Alta)')
  })
})
