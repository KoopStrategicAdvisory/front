import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearCuentaActiva } from './helpers/api.js';

test.describe('Nombres con tildes y ñ', () => {
  test('el nombre de quien tiene la sesión se ve completo, no como "MARAA"', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    await crearCuentaActiva(request, token, {
      nombre: 'María José Ñañez Ríos', email: 'tildes@e2e.test', password: 'ClaveTildes123!', documento: '4040404040',
    });

    await iniciarSesion(page, { email: 'tildes@e2e.test', password: 'ClaveTildes123!' });

    // La barra muestra el nombre en mayúsculas y sin tildes (MARIA JOSE NANEZ RIOS);
    // lo que NO debe pasar es verlo dañado (MARAA, con caracteres raros).
    const nombre = page.getByRole('button', { name: /MAR[IÍ]A JOS[EÉ] [NÑ]A[NÑ]EZ R[IÍ]OS/i });
    await expect(nombre).toBeVisible();
    expect(await nombre.innerText()).not.toMatch(/[ÃÂ]/);
  });
});
