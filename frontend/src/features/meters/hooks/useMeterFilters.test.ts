import { parseMeterFilters, toPagedRequest } from './useMeterFilters'

describe('filtros de medidores en la URL', () => {
  it('sin parámetros usa los valores por defecto', () => {
    expect(parseMeterFilters(new URLSearchParams())).toEqual({
      meterId: '',
      status: '',
      sortBy: 'meter_id',
      sortOrder: 'ASC',
      page: 1,
    })
  })

  it('lee estado, búsqueda, orden y página', () => {
    const f = parseMeterFilters(new URLSearchParams('estado=CRITICAL&medidor=109&orden=consumption&dir=DESC&pagina=2'))
    expect(f).toEqual({ meterId: '109', status: 'CRITICAL', sortBy: 'consumption', sortOrder: 'DESC', page: 2 })
  })

  it('ignora valores inválidos en vez de mandarlos a la API', () => {
    const f = parseMeterFilters(new URLSearchParams('estado=ROJO&orden=precio&dir=arriba&pagina=-3'))
    expect(f.status).toBe('')
    expect(f.sortBy).toBe('meter_id')
    expect(f.sortOrder).toBe('ASC')
    expect(f.page).toBe(1)
  })

  it('arma el body de POST /meter/getAll sin campos vacíos', () => {
    const request = toPagedRequest({ meterId: '', status: 'ALERT', sortBy: 'severity', sortOrder: 'DESC', page: 1 })
    expect(request).toEqual({
      pagination: { page: 1, size: 10 },
      filter: { status: 'ALERT', sort_by: 'severity', sort_order: 'DESC' },
    })
  })
})
