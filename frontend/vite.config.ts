/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// El .env vive en la raíz del proyecto, compartido con el backend.
const envDir = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // En desarrollo el front llama a /api y Vite lo reenvía al backend en Go:
      // así no hay CORS y la URL del backend vive en un solo lugar.
      proxy: {
        '/api': { target: env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080', changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/testing/setup.ts'],
      css: false,
      globals: true,
      // Tests deterministas: las fechas se evalúan igual en cualquier máquina.
      env: { TZ: 'UTC' },
    },
  }
})
