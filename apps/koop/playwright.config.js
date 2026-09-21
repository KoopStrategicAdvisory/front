import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// Las pruebas E2E corren contra una instancia AISLADA: su propio backend
// (puerto 4100) sobre una base de datos que se recrea desde cero en cada
// corrida (koop_e2e), y su propio Vite (puerto 5199). No usan el backend ni
// la base real de desarrollo, ni S3, ni correo. Ver back/scripts/e2e-server.cjs.
const here = path.dirname(fileURLToPath(import.meta.url));
const BACK_DIR = process.env.KOOP_BACK_DIR || path.resolve(here, '../../../../back');
const BACK_PORT = 4100;
const FRONT_PORT = 5199;

export default defineConfig({
  testDir: './e2e',
  // Un solo worker: todas las pruebas comparten la misma base de datos.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${FRONT_PORT}`,
    // Edge ya viene instalado en Windows: evita descargar un navegador aparte.
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },
  webServer: [
    {
      command: 'node scripts/e2e-server.cjs',
      cwd: BACK_DIR,
      port: BACK_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `pnpm exec vite --port ${FRONT_PORT} --strictPort`,
      cwd: here,
      env: { VITE_API_BASE: `http://localhost:${BACK_PORT}/api` },
      port: FRONT_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
