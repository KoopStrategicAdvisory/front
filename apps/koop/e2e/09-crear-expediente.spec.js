import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearCliente } from './helpers/api.js';

test.describe('Expedientes: crear un expediente', () => {
  test('un administrador crea un expediente con el asistente de 3 pasos', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    const cliente = await crearCliente(request, token, { nombre: 'Cliente E2E Expediente' });

    await iniciarSesion(page, ADMIN);
    await page.goto('/admin/expedientes');
    await page.getByRole('button', { name: /Nuevo Expediente/ }).click();

    // Paso 1: datos básicos
    await page.getByPlaceholder('2024', { exact: true }).fill('2026');
    await page.getByPlaceholder('10', { exact: true }).fill('901');
    await page.getByLabel('N° Radicado del despacho (opcional)').fill('11001400300520260000900');
    await page.getByLabel('Cliente *').selectOption(String(cliente.id));
    await page.getByRole('button', { name: 'Siguiente →' }).click();

    // Paso 2: materia (tipo → subtipo → pretensión, en cascada)
    await page.getByLabel('Tipo de proceso').selectOption({ label: 'Proceso Civil' });
    await page.getByLabel('Subtipo de proceso').selectOption({ index: 2 });
    await page.getByLabel('Tipo de pretensión').selectOption({ index: 2 });
    await page.getByRole('button', { name: 'Siguiente →' }).click();

    // Paso 3: contraparte, correo del juzgado y confirmación
    await page.getByLabel('Contraparte / Parte demandada *').fill('Empresa Demandada E2E S.A.S.');
    await page.getByLabel('Correo del juzgado / entidad *').fill('juzgado.e2e@rama.test');
    await expect(page.getByText('KOOP-2026-901').first()).toBeVisible();
    await page.getByRole('button', { name: 'Crear expediente' }).click();

    await expect(page.getByText('Expediente creado exitosamente')).toBeVisible();
    await expect(page.getByText('KOOP-2026-901').first()).toBeVisible();

    // Quedó guardado con los datos que se escribieron.
    const lista = await (await request.get('http://localhost:4100/api/expedientes?search=KOOP-2026-901', {
      headers: { Authorization: `Bearer ${token}` },
    })).json();
    const guardado = (lista.items || lista.data || [])[0];
    expect(guardado.numero_radicado_despacho).toBe('11001400300520260000900');
    expect(guardado.contraparte).toBe('Empresa Demandada E2E S.A.S.');
  });
});
