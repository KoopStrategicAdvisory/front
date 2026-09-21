import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente, agregarASeguimiento } from './helpers/api.js';

test.describe('Consulta diaria: registrar la revisión', () => {
  test('registrar la revisión del día marca el proceso como revisado', async ({ page, request }) => {
    const RADICADO = '11001400300220260000500';
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Revision', expediente: 'E2E-5', radicado: RADICADO,
    });
    await agregarASeguimiento(request, token, { idExpediente: expediente.id, organismo: 'Consultas Fiscalía' });

    await iniciarSesion(page, ADMIN);
    await page.goto('/consultas');
    const tarjeta = page.locator('article', { hasText: RADICADO });
    await expect(tarjeta.getByText('Pendiente de revisión')).toBeVisible();

    await tarjeta.getByRole('button', { name: 'Registrar revisión' }).click();
    await page.getByLabel('Resultado').selectOption('actuacion_nueva');
    await page.getByLabel('Observaciones').fill('Se consultó el portal: hay un auto nuevo.');
    await page.getByRole('button', { name: 'Guardar revisión' }).click();

    await expect(page.getByText('Revisión del día guardada.')).toBeVisible();
    await expect(tarjeta.getByText('Pendiente de revisión')).toHaveCount(0);
    await expect(tarjeta.getByText('Actuación nueva')).toBeVisible();
    await expect(tarjeta.getByText('Se consultó el portal: hay un auto nuevo.')).toBeVisible();
    await expect(tarjeta.getByText(/Registrado por E2E Admin/)).toBeVisible();
    // Ya no se registra de nuevo: ahora se puede corregir.
    await expect(tarjeta.getByRole('button', { name: 'Corregir registro' })).toBeVisible();
    await expect(tarjeta.getByRole('button', { name: 'Registrar revisión' })).toHaveCount(0);
  });
});
