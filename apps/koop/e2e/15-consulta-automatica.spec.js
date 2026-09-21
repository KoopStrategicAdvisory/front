import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente, agregarASeguimiento, vaciarListaDiaria } from './helpers/api.js';

// La Rama Judicial es simulada en el servidor de pruebas (back/scripts/e2e-server.cjs):
// siempre devuelve la actuación del 2026-05-25 "Oficio Enviado Virtualmente / RADICACION OFICIO 629".
test.describe('Consulta diaria: verificación automática de Rama Judicial', () => {
  test('genera el registro del día con fecha de actuación, actuación y anotación', async ({ page, request }) => {
    const RADICADO = '11001400301520260001500';
    const token = await tokenDe(request, ADMIN);
    await vaciarListaDiaria(request, token);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Automatica', expediente: 'E2E-15', radicado: RADICADO,
    });
    await agregarASeguimiento(request, token, {
      idExpediente: expediente.id, organismo: 'Consulta de procesos Rama Judicial', modalidad: 'automatica',
    });

    await iniciarSesion(page, ADMIN);
    await page.goto('/consultas');
    const tarjeta = page.locator('article', { hasText: RADICADO });
    await expect(tarjeta.getByText('Automática', { exact: true })).toBeVisible();
    await expect(tarjeta.getByText('Pendiente de revisión')).toBeVisible();

    await page.getByRole('button', { name: 'Consultar automáticos ahora' }).click();

    await expect(page.getByText(/1 de 1 procesos consultados, 1 registro generado/)).toBeVisible();
    await expect(tarjeta.getByText('Pendiente de revisión')).toHaveCount(0);
    await expect(tarjeta.getByText('Actuación nueva')).toBeVisible();
    await expect(tarjeta.getByText(
      'Generado automáticamente (Rama Judicial) — Fecha de actuación: 2026-05-25 — Actuación: Oficio Enviado Virtualmente — Anotación: RADICACION OFICIO 629'
    )).toBeVisible();
    // Queda a nombre de la cuenta de servicio, no de una persona.
    await expect(tarjeta.getByText(/Registrado por Sistema Koop/)).toBeVisible();

    // Una segunda pasada sin cambios no duplica el registro.
    await page.getByRole('button', { name: 'Consultar automáticos ahora' }).click();
    await expect(page.getByText(/1 de 1 procesos consultados, 0 registros generados/)).toBeVisible();
  });
});
