import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

/**
 * Tests de QA · DEF-02: valores límite de la paginación del Libro de medidores.
 * count = 12, size = 10 → 2 páginas. Hoy pages = floor(12/10) = 1 y "Siguiente"
 * queda deshabilitado: M-111 y M-112 (crítica) no se alcanzan desde la UI.
 */
const cases = [
  { count: 0, size: 10, page: 1, next: false, range: '0–0' },
  { count: 9, size: 10, page: 1, next: false, range: '1–9' },
  { count: 10, size: 10, page: 1, next: false, range: '1–10' },
  { count: 20, size: 10, page: 2, next: false, range: '11–20' },
]

describe('Pagination (límites que hoy funcionan)', () => {
  it.each(cases)('count=$count size=$size page=$page', ({ count, size, page, next, range }) => {
    render(<Pagination page={page} size={size} count={count} onPage={() => {}} />)
    expect(screen.getByText(range)).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /siguiente/i })
    if (next) expect(btn).toBeEnabled()
    else expect(btn).toBeDisabled()
  })
})

describe('Pagination (DEF-02)', () => {
  it.fails('con 12 medidores y 10 por página, "Siguiente" está habilitado en la página 1', async () => {
    const onPage = vi.fn()
    render(<Pagination page={1} size={10} count={12} onPage={onPage} />)
    const next = screen.getByRole('button', { name: /siguiente/i })
    expect(next).toBeEnabled()
    await userEvent.click(next)
    expect(onPage).toHaveBeenCalledWith(2)
  })

  it.fails('con 11 medidores (size + 1) hay segunda página', () => {
    render(<Pagination page={1} size={10} count={11} onPage={() => {}} />)
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled()
  })
})
