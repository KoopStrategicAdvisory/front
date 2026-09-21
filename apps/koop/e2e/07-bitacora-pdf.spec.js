import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente, agregarASeguimiento, vaciarListaDiaria } from './helpers/api.js';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

test.describe('Consulta diaria: bitácora en PDF', () => {
  test('el PDF solo se habilita cuando todos los procesos tienen registro', async ({ page, request }) => {
    const A = '11001400300420260000701';
    const B = '11001400300420260000702';
    const token = await tokenDe(request, ADMIN);
    await vaciarListaDiaria(request, token);
    for (const [n, radicado] of [['A', A], ['B', B]]) {
      const { expediente } = await crearClienteConExpediente(request, token, {
        nombre: `Cliente E2E Bitacora ${n}`, expediente: `E2E-7${n}`, radicado,
      });
      await agregarASeguimiento(request, token, { idExpediente: expediente.id, organismo: 'Consultas Fiscalía' });
    }

    await iniciarSesion(page, ADMIN);
    await page.goto('/consultas');
    const boton = page.getByRole('button', { name: 'Generar bitácora del día (PDF)' });
    await expect(page.getByText('0 de 2 revisados')).toBeVisible();
    await expect(boton).toBeDisabled();

    const registrar = async (radicado) => {
      const tarjeta = page.locator('article', { hasText: radicado });
      await tarjeta.getByRole('button', { name: 'Registrar revisión' }).click();
      await page.getByLabel('Resultado').selectOption('sin_movimiento');
      await page.getByRole('button', { name: 'Guardar revisión' }).click();
      await expect(tarjeta.getByText('Sin movimiento')).toBeVisible();
    };

    // Con solo uno de los dos revisado sigue bloqueado.
    await registrar(A);
    await expect(page.getByText('1 de 2 revisados')).toBeVisible();
    await expect(boton).toBeDisabled();

    // Con los dos revisados se habilita y descarga un PDF real.
    await registrar(B);
    await expect(page.getByText('Todos los procesos tienen registro. La constancia está lista.')).toBeVisible();
    await expect(boton).toBeEnabled();
    const [descarga] = await Promise.all([page.waitForEvent('download'), boton.click()]);
    expect(descarga.suggestedFilename()).toBe(`bitacora-diaria-${hoy()}.pdf`);
    const bytes = fs.readFileSync(await descarga.path());
    expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  });
});
