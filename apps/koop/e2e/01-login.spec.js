import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { loginPorUI } from './helpers/auth.js';

test.describe('Login', () => {
  test('un administrador inicia sesión y llega al dashboard', async ({ page }) => {
    await loginPorUI(page, ADMIN);

    await expect(page).toHaveURL(/\/dashboard$/);
    // La barra superior muestra el nombre de quien tiene la sesión abierta.
    await expect(page.getByRole('button', { name: /E2E ADMIN/i })).toBeVisible();
  });
});
