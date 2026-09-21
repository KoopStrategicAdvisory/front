import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';

test.describe('Clientes: crear un cliente', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, ADMIN);
    await page.goto('/admin/clientes-activos');
    await expect(page.getByRole('button', { name: 'Nuevo cliente' })).toBeVisible();
  });

  test('un administrador crea un cliente y queda en la lista', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo cliente' }).click();
    await page.getByLabel('Nombre completo / razón social').fill('María Fernanda E2E');
    await page.getByLabel('Número de documento').fill('80153356');
    await page.getByLabel('Email').fill('maria.e2e@cliente.test');
    await page.getByLabel('Celular').fill('300 123 4567');
    await page.getByRole('button', { name: 'Crear cliente' }).click();

    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
    await expect(page.getByText('María Fernanda E2E').first()).toBeVisible();

    // Quedó guardado de verdad: sigue ahí después de recargar.
    await page.reload();
    await expect(page.getByText('María Fernanda E2E').first()).toBeVisible();
  });

  test('sin nombre no se crea el cliente y se avisa', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo cliente' }).click();
    await page.getByLabel('Número de documento').fill('99999999');
    await page.getByRole('button', { name: 'Crear cliente' }).click();

    await expect(page.getByText('El nombre es obligatorio')).toBeVisible();
    await expect(page.getByText('Cliente creado correctamente')).toHaveCount(0);
  });
});
