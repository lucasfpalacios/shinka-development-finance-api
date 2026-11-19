// Se ejecuta antes de los tests e2e: apunta la app a la base de test
// (docker compose up -d db-test). Las variables ya definidas en process.env
// tienen prioridad sobre el .env, así nunca tocamos la base de desarrollo.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DB_HOST: process.env.TEST_DB_HOST ?? 'localhost',
  DB_PORT: process.env.TEST_DB_PORT ?? '5440',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'katana_test',
  DB_SYNC: 'true',
  JWT_SECRET: 'test-secret-que-tiene-mas-de-32-caracteres',
  JWT_EXPIRES_IN: '1h',
  BOT_API_KEY: 'test-bot-api-key-de-24-caracteres-o-mas',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  FRONTEND_URL: 'http://localhost:3000',
});
