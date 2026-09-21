import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente } from './helpers/api.js';

test.describe('Tareas de un expediente', () => {
  test('crear, editar y eliminar una tarea', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Tareas', expediente: 'E2E-11', radicado: '11001400301120260001100',
    });
    await iniciarSesion(page, ADMIN);
    await page.goto(`/admin/expedientes/${expediente.id}`);
    await page.getByRole('button', { name: 'Tareas', exact: true }).click();

    // Una fila = el bloque más pequeño que contiene el título y sus botones.
    const fila = (titulo) => page.locator('div', { has: page.getByText(titulo, { exact: true }) })
      .filter({ has: page.getByRole('button', { name: '🗑️' }) }).last();

    // Crear
    await page.getByRole('button', { name: /Nueva Tarea/ }).click();
    await page.getByLabel('Título *').fill('Presentar demanda E2E');
    await page.getByLabel('Estado *').selectOption({ index: 2 });
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(page.getByText('Tarea creada')).toBeVisible();
    await expect(page.getByText('Presentar demanda E2E', { exact: true })).toBeVisible();

    // Editar
    await fila('Presentar demanda E2E').getByRole('button', { name: '✏️' }).click();
    await page.getByLabel('Título *').fill('Presentar demanda E2E (ajustada)');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Tarea actualizada')).toBeVisible();
    await expect(page.getByText('Presentar demanda E2E (ajustada)', { exact: true })).toBeVisible();

    // Eliminar
    await fila('Presentar demanda E2E (ajustada)').getByRole('button', { name: '🗑️' }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByText('Tarea eliminada')).toBeVisible();
    await expect(page.getByText('Presentar demanda E2E (ajustada)', { exact: true })).toHaveCount(0);
  });
});
