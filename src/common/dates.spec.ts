import { currentMonth, monthRange } from './dates';

describe('dates', () => {
  it('monthRange devuelve el rango del mes', () => {
    expect(monthRange('2026-03')).toEqual(['2026-03-01', '2026-04-01']);
  });

  it('monthRange cruza el año en diciembre', () => {
    expect(monthRange('2026-12')).toEqual(['2026-12-01', '2027-01-01']);
  });

  it('currentMonth formatea con dos dígitos', () => {
    expect(currentMonth(new Date(2026, 0, 15))).toBe('2026-01');
  });
});
