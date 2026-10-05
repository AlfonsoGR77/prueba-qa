// Configuración del entorno. Lee e2e/.env si existe (Node 20.12+) y aplica valores por defecto.
try {
  process.loadEnvFile('.env')
} catch {
  // sin .env: se usan las variables del sistema o los valores por defecto
}

export const env = {
  baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
  apiURL: process.env.API_URL ?? 'http://localhost:8080',
  email: process.env.E2E_EMAIL ?? 'admin@energia.local',
  password: process.env.E2E_PASSWORD ?? 'admin123',
  /** Sesión guardada por el proyecto `setup` y reutilizada por los tests de UI. */
  storageState: '.auth/operador.json',
}
