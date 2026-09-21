import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente, agregarASeguimiento } from './helpers/api.js';

test.describe('Consulta diaria: retirar un proceso', () => {
  test('retirar un proceso lo saca de la lista, y cancelar lo deja', async ({ page, request }) => {
    const RADICADO = '11001400300320260000600';
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Retiro', expediente: 'E2E-6', radicado: RADICADO,
    });
    await agregarASeguimiento(request, token, { idExpediente: expediente.id, organismo: 'Consultas Fiscalía' });

    await iniciarSesion(page, ADMIN);
    await page.goto('/consultas');
    const tarjeta = page.locator('article', { hasText: RADICADO });
    await expect(tarjeta).toBeVisible();

    // Cancelar no retira nada.
    await tarjeta.getByRole('button', { name: 'Retirar de la lista' }).click();
    await expect(page.getByText('dejará de revisarse desde hoy')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(tarjeta).toBeVisible();

    // Confirmar sí lo retira.
    await tarjeta.getByRole('button', { name: 'Retirar de la lista' }).click();
    await page.getByRole('button', { name: 'Retirar proceso' }).click();
    await expect(page.locator('article', { hasText: RADICADO })).toHaveCount(0);

    // Sigue fuera después de recargar: el retiro quedó guardado.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Consulta diaria de procesos' })).toBeVisible();
    await expect(page.locator('article', { hasText: RADICADO })).toHaveCount(0);
  });
});
