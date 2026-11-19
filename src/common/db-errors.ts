import { QueryFailedError } from 'typeorm';

// Código de Postgres para "violación de restricción UNIQUE"
export function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err.driverError as { code?: string }).code === '23505'
  );
}
