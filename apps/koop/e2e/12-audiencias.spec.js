import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente } from './helpers/api.js';

test.describe('Audiencias de un expediente', () => {
  test('registrar, editar y eliminar una audiencia', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Audiencias', expediente: 'E2E-12', radicado: '11001400301220260001200',
    });
    await iniciarSesion(page, ADMIN);
    await page.goto(`/admin/expedientes/${expediente.id}`);
    await page.getByRole('button', { name: 'Audiencias', exact: true }).click();

    // Registrar: el tipo y la fecha son obligatorios.
    await page.getByRole('button', { name: /Nueva Audiencia/ }).click();
    await page.getByRole('button', { name: 'Registrar', exact: true }).click();
    await expect(page.getByText('El tipo de audiencia es obligatorio')).toBeVisible();

    await page.getByLabel('Tipo de audiencia *').fill('Audiencia de Conciliación E2E');
    await page.getByLabel('Fecha programada *').fill('2026-11-15');
    await page.getByLabel('Juzgado / Autoridad').fill('Juzgado 5 Laboral E2E');
    await page.getByRole('button', { name: 'Registrar', exact: true }).click();
    await expect(page.getByText('Audiencia registrada')).toBeVisible();
    await expect(page.getByText('Audiencia de Conciliación E2E').first()).toBeVisible();

    // Editar
    await page.getByRole('button', { name: '✏️' }).click();
    await page.getByLabel('Tipo de audiencia *').fill('Audiencia de Juzgamiento E2E');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Audiencia actualizada')).toBeVisible();
    await expect(page.getByText('Audiencia de Juzgamiento E2E').first()).toBeVisible();

    // Eliminar
    await page.getByRole('button', { name: '🗑️' }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByText('Audiencia eliminada')).toBeVisible();
    await expect(page.getByText('Audiencia de Juzgamiento E2E')).toHaveCount(0);
  });
});
