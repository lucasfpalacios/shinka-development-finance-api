import { ValueTransformer } from 'typeorm';

// Postgres devuelve las columnas decimal como string ("1234.50").
// Este transformer las convierte a number al leerlas.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};
