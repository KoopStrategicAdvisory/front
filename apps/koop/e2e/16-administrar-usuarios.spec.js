import { test, expect } from '@playwright/test';
import { ADMIN, ABOGADO } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';

test.describe('Administrar usuarios', () => {
  test('un administrador ve la pantalla de usuarios (antes decía "Acceso restringido")', async ({ page }) => {
    await iniciarSesion(page, ADMIN);
    await page.goto('/admin/usuarios');

    await expect(page.getByText('Acceso restringido')).toHaveCount(0);
    // Ve a las personas de la firma (las cuentas de servicio del sistema no cuentan).
    await expect(page.getByText(/Usuarios activados · \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Mostrar' }).click();
    await expect(page.getByText('E2E Abogado').first()).toBeVisible();
    await expect(page.getByText('Sistema Koop')).toHaveCount(0);
  });

  test('un abogado que abre /admin/usuarios es devuelto al dashboard', async ({ page }) => {
    await iniciarSesion(page, ABOGADO);
    await page.goto('/admin/usuarios');

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
