import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { loginPorUI } from './helpers/auth.js';

test.describe('Login inválido', () => {
  test('una contraseña incorrecta muestra un error y no deja entrar', async ({ page }) => {
    await loginPorUI(page, { email: ADMIN.email, password: 'contraseña-equivocada' });

    const error = page.locator('.auth-error');
    await expect(error).toHaveText('Credenciales inválidas.');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /E2E ADMIN/i })).toHaveCount(0);
  });
});
