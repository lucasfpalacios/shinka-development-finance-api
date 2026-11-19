const REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'BOT_API_KEY',
] as const;

// Se ejecuta al arrancar: si falta algo o un secreto es débil, la app no levanta.
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
  if (String(config.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
  if (String(config.BOT_API_KEY).length < 24) {
    throw new Error('BOT_API_KEY debe tener al menos 24 caracteres');
  }
  return config;
}
