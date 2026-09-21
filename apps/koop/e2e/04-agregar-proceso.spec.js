import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente } from './helpers/api.js';

test.describe('Consulta diaria: agregar un proceso', () => {
  test('agrega un proceso a la lista diaria eligiendo cliente, radicado y página', async ({ page, request }) => {
    const RADICADO = '11001400300120260000400';
    const token = await tokenDe(request, ADMIN);
    const { cliente, expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Agregar', expediente: 'E2E-4', radicado: RADICADO,
    });

    await iniciarSesion(page, ADMIN);
    await page.goto('/consultas');
    await page.getByRole('button', { name: /Agregar (primer )?proceso/ }).click();

    await page.getByLabel('Buscar cliente').fill('Cliente E2E Agregar');
    await page.getByRole('combobox').first().selectOption(String(cliente.id));
    await page.getByLabel('2. Expediente', { exact: false }).selectOption(String(expediente.id));
    await expect(page.getByText('Radicado que se consultará')).toBeVisible();
    await page.getByLabel('3. Página de consulta').selectOption('Consultas Fiscalía');
    await page.getByRole('button', { name: 'Agregar a la lista diaria' }).click();

    // Aparece en la lista, pendiente de revisar, con su radicado y la modalidad manual.
    await expect(page.getByText('Proceso agregado a la lista diaria.')).toBeVisible();
    const tarjeta = page.locator('article', { hasText: RADICADO });
    await expect(tarjeta.getByRole('heading', { name: RADICADO })).toBeVisible();
    await expect(tarjeta.getByText('Cliente E2E Agregar')).toBeVisible();
    await expect(tarjeta.getByText('Consultas Fiscalía')).toBeVisible();
    await expect(tarjeta.getByText('Manual')).toBeVisible();
    await expect(tarjeta.getByText('Pendiente de revisión')).toBeVisible();
  });
});
