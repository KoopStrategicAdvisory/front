import { test, expect } from '@playwright/test';
import { ADMIN, CLIENTE } from './fixtures/users.js';
import { loginPorUI } from './helpers/auth.js';

test.describe('Acceso a Consultas por rol', () => {
  test('un cliente que abre /consultas es devuelto al dashboard', async ({ page }) => {
    await loginPorUI(page, CLIENTE);
    await expect(page.getByRole('button', { name: /E2E CLIENTE/i })).toBeVisible();

    await page.goto('/consultas');

    // La ruta está protegida por rol: a un cliente lo devuelve al dashboard.
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Consulta diaria de procesos' })).toHaveCount(0);
  });

  test('un administrador sí ve la consulta diaria de procesos', async ({ page }) => {
    await loginPorUI(page, ADMIN);
    await expect(page.getByRole('button', { name: /E2E ADMIN/i })).toBeVisible();

    await page.goto('/consultas');

    await expect(page).toHaveURL(/\/consultas$/);
    await expect(page.getByRole('heading', { name: 'Consulta diaria de procesos' })).toBeVisible();
  });
});
