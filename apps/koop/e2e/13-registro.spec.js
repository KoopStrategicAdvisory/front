import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { loginPorUI, iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearCliente, enlaceDelCorreo } from './helpers/api.js';

async function registrarPorUI(page, { nombre, email, documento, password }) {
  await page.goto('/register');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Correo').fill(email);
  await page.getByPlaceholder('Número de documento').fill(documento);
  await page.getByLabel('Contrasena').fill(password);
  await page.getByRole('button', { name: 'Registrarme' }).click();
}

test.describe('Registro de cuentas', () => {
  test('un cliente de la firma se registra, verifica su correo y entra', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    // La firma ya tiene a esta persona como cliente, con un correo en archivo:
    // el enlace de verificación se manda a ESE correo, no al que se escribe al registrarse.
    await crearCliente(request, token, {
      nombre: 'Clienta Registro E2E', tipo_documento: 'CC', numero_documento: '1010101010', email: 'clienta.archivo@e2e.test',
    });

    await registrarPorUI(page, {
      nombre: 'Clienta Registro E2E', email: 'clienta.nueva@e2e.test', documento: '1010101010', password: 'ClaveNueva123!',
    });
    await expect(page.getByText('Registro recibido.')).toBeVisible();

    const enlace = await enlaceDelCorreo(request, 'clienta.archivo@e2e.test');
    await page.goto(enlace);
    await expect(page.getByText('Email verificado correctamente')).toBeVisible();

    await iniciarSesion(page, { email: 'clienta.nueva@e2e.test', password: 'ClaveNueva123!' });
    await expect(page.getByRole('button', { name: /CLIENTA REGISTRO E2E/i })).toBeVisible();
  });

  test('quien no es cliente de la firma queda pendiente y no puede entrar', async ({ page }) => {
    await registrarPorUI(page, {
      nombre: 'Persona Desconocida E2E', email: 'desconocida@e2e.test', documento: '2020202020', password: 'ClaveNueva123!',
    });
    // Mismo mensaje que en el caso anterior: no revela quién es cliente.
    await expect(page.getByText('Registro recibido.')).toBeVisible();

    await loginPorUI(page, { email: 'desconocida@e2e.test', password: 'ClaveNueva123!' });
    await expect(page.locator('.auth-error')).toHaveText('Cuenta desactivada. Contacta al administrador.');
    await expect(page).toHaveURL(/\/login$/);
  });
});
