import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// Genera las capturas de pantalla del manual de usuario recorriendo la app
// real contra la MISMA instancia aislada que usan las pruebas E2E (base
// koop_e2e con datos de ejemplo inventados, nunca datos reales de la firma).
const here = path.dirname(fileURLToPath(import.meta.url));
const BACK_DIR = process.env.KOOP_BACK_DIR || path.resolve(here, '../../../../back');
const BACK_PORT = 4100;
const FRONT_PORT = 5199;

export default defineConfig({
  testDir: './manual',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${FRONT_PORT}`,
    channel: 'msedge',
    viewport: { width: 1366, height: 820 },
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'off',
    screenshot: 'off',
  },
  webServer: [
    {
      command: 'node scripts/e2e-server.cjs',
      cwd: BACK_DIR,
      port: BACK_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
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
