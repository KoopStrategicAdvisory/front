import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { loginPorUI, iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearCuentaActiva, enlaceDelCorreo } from './helpers/api.js';

test.describe('Recuperación de contraseña', () => {
  test('pide el enlace por correo, cambia la contraseña y entra con la nueva', async ({ page, request }) => {
    const EMAIL = 'recupera@e2e.test';
    const VIEJA = 'ClaveVieja123!';
    const NUEVA = 'ClaveNueva456!';
    const token = await tokenDe(request, ADMIN);
    await crearCuentaActiva(request, token, { nombre: 'Recupera E2E', email: EMAIL, password: VIEJA, documento: '3030303030' });

    // 1. Pide el enlace
    await page.goto('/forgot-password');
    await page.getByLabel('Correo').fill(EMAIL);
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(page.getByText('Si el email existe, recibirás un enlace')).toBeVisible();

    // 2. Abre el enlace del correo y elige la contraseña nueva
    // (el correo de verificación del registro también está en el buzón: se toma el último)
    const enlace = await enlaceDelCorreo(request, EMAIL);
    expect(enlace).toContain('/reset-password?token=');
    await page.goto(enlace);
    await page.getByLabel('Nueva contraseña').fill(NUEVA);
    await page.getByLabel('Confirmar contraseña').fill(NUEVA);
    await page.getByRole('button', { name: 'Restablecer contraseña' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // 3. La vieja ya no sirve; la nueva sí.
    await loginPorUI(page, { email: EMAIL, password: VIEJA });
    await expect(page.locator('.auth-error')).toHaveText('Credenciales inválidas.');
    await iniciarSesion(page, { email: EMAIL, password: NUEVA });
    await expect(page.getByRole('button', { name: /RECUPERA E2E/i })).toBeVisible();
  });

  test('un enlace de recuperación inválido no cambia nada', async ({ page }) => {
    await page.goto('/reset-password?token=token-inventado');
    await page.getByLabel('Nueva contraseña').fill('OtraClave789!');
    await page.getByLabel('Confirmar contraseña').fill('OtraClave789!');
    await page.getByRole('button', { name: 'Restablecer contraseña' }).click();
    await expect(page.locator('.auth-error')).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password/);
  });
});
