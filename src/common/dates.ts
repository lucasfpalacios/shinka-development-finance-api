export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Mes actual en formato 'YYYY-MM'
export function currentMonth(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

// '2026-12' → ['2026-12-01', '2027-01-01'] (desde inclusive, hasta exclusive)
export function monthRange(month: string): [string, string] {
  const [year, m] = month.split('-').map(Number);
  const next =
    m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
  return [`${month}-01`, `${next}-01`];
}
