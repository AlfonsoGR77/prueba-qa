import { defineConfig, devices } from '@playwright/test'
import { env } from './data/env'

/**
 * Configuración de la suite E2E de EnergIA.
 *
 * Proyectos:
 *  - setup            → hace login una sola vez y guarda la sesión (storageState).
 *  - api              → pruebas de la API con `request` (sin navegador).
 *  - chromium-bogota  → UI en Chromium con zona horaria America/Bogota (la de los operadores).
 *  - chromium-utc     → los mismos tests de zona horaria pero en UTC: demuestra que DEF-01
 *                       depende de la zona del navegador (en UTC pasan, en Bogotá fallan).
 *  - firefox / webkit → solo con ALL_BROWSERS=1.
 */

const uiDefaults = {
  baseURL: env.baseURL,
  locale: 'es-CO',
  viewport: { width: 1440, height: 900 }, // en pantallas angostas la tabla oculta columnas
  storageState: env.storageState,
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]],

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /setup\/.*\.setup\.ts/, use: { baseURL: env.baseURL } },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: { baseURL: env.apiURL, extraHTTPHeaders: { Accept: 'application/json' } },
    },
    {
      name: 'chromium-bogota',
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], ...uiDefaults, timezoneId: 'America/Bogota' },
    },
    {
      name: 'chromium-utc',
      testMatch: /ui\/timezone\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], ...uiDefaults, timezoneId: 'UTC' },
    },
    ...(process.env.ALL_BROWSERS
      ? [
          {
            name: 'firefox-bogota',
            testMatch: /ui\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: { ...devices['Desktop Firefox'], ...uiDefaults, timezoneId: 'America/Bogota' },
          },
          {
            name: 'webkit-bogota',
            testMatch: /ui\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: { ...devices['Desktop Safari'], ...uiDefaults, timezoneId: 'America/Bogota' },
          },
        ]
      : []),
  ],

  // Con START_APP=1 Playwright levanta la app (modo desarrollo) si no está corriendo.
  // Sin START_APP se asume que ya está arriba (docker compose up -d o go run + pnpm dev).
  webServer: process.env.START_APP
    ? [
        {
          command: 'go run ./cmd/api',
          cwd: '../backend',
          url: `${env.apiURL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: 'pnpm dev --host 127.0.0.1',
          cwd: '../frontend',
          url: env.baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : undefined,
})
