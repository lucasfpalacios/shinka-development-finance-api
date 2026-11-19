// Los DTOs tienen todas sus propiedades definidas (las que no vinieron en el
// request quedan en undefined). Sin esto, Object.assign(entidad, dto) pisaría
// los campos que el usuario NO mandó.
export function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
