import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users.js';
import { iniciarSesion } from './helpers/auth.js';
import { tokenDe, crearClienteConExpediente, subirDocumento } from './helpers/api.js';

// Los documentos se guardan en un S3 falso en memoria (ver
// back/scripts/e2e-server.cjs): nunca se toca el bucket real.
async function abrirDocumentos(page, idExpediente) {
  await iniciarSesion(page, ADMIN);
  await page.goto(`/admin/expedientes/${idExpediente}`);
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
}

test.describe('Documentos de un expediente', () => {
  test('sube un documento y aparece en la lista', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Docs Subir', expediente: 'E2E-10A', radicado: '11001400301020260001000',
    });
    await abrirDocumentos(page, expediente.id);

    await page.getByRole('button', { name: /Subir Documentos/ }).click();
    await page.locator('input[type=file]').setInputFiles({
      name: 'auto-admisorio.txt', mimeType: 'text/plain', buffer: Buffer.from('contenido del auto'),
    });
    await page.getByLabel('Tipo de documento *').selectOption({ index: 2 });
    await page.getByRole('button', { name: 'Subir 1 documento' }).click();

    await expect(page.getByText('1 documento subido exitosamente')).toBeVisible();
    await expect(page.getByText('auto-admisorio.txt').first()).toBeVisible();
  });

  test('descarga un documento con su contenido original', async ({ page, request, context }) => {
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Docs Bajar', expediente: 'E2E-10B', radicado: '11001400301020260001001',
    });
    await subirDocumento(request, token, { idExpediente: expediente.id, nombre: 'memorial.txt', contenido: 'texto del memorial' });
    await abrirDocumentos(page, expediente.id);

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByTitle('Descargar').click(),
    ]);
    await popup.waitForLoadState();
    await expect(popup.locator('body')).toHaveText('texto del memorial');
  });

  test('elimina un documento y desaparece de la lista', async ({ page, request }) => {
    const token = await tokenDe(request, ADMIN);
    const { expediente } = await crearClienteConExpediente(request, token, {
      nombre: 'Cliente E2E Docs Borrar', expediente: 'E2E-10C', radicado: '11001400301020260001002',
    });
    await subirDocumento(request, token, { idExpediente: expediente.id, nombre: 'borrador.txt', contenido: 'x' });
    await abrirDocumentos(page, expediente.id);
    await expect(page.getByText('borrador.txt').first()).toBeVisible();

    await page.getByTitle('Eliminar').click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

    await expect(page.getByText('Documento eliminado')).toBeVisible();
    await expect(page.getByText('borrador.txt')).toHaveCount(0);
  });
});
