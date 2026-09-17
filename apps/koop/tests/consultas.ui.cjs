// UI aislada: usa componentes reales con API/sesión simuladas, sin datos de la firma.
// node tests/consultas.ui.cjs [ruta al módulo playwright] [URL Vite]
const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    const output = path.resolve('tests/output'); fs.mkdirSync(output, { recursive: true });
    let items = [], logs = [];
    const externo = '11001310300120260012300';
    await page.route('**/src/main.jsx', (route) => route.fulfill({ contentType: 'application/javascript', body: `
      import React from '/node_modules/.vite/deps/react.js';
      import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
      import Page from '/src/pages/dinamic/Consultas/index.jsx';
      import '/src/styles/theme.css';
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Page));
    ` }));
    await page.route('**/src/context/AuthContext*', (route) => route.fulfill({ contentType: 'application/javascript', body: `export const useAuth = () => ({ user: { roles: ['admin'] } });` }));
    await page.route('**/src/api/axios.js', (route) => route.fulfill({ contentType: 'application/javascript', body: `
      async function send(method, url, body, config) {
        const params = config?.params ? '?' + new URLSearchParams(config.params) : '';
        const r = await fetch('/__test-api' + url + params, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
        return { data: config?.responseType === 'blob' ? await r.blob() : await r.json() };
      }
      export default { get: (u,c) => send('GET',u,null,c), post: (u,b) => send('POST',u,b), put: (u,b) => send('PUT',u,b) };
    ` }));
    await page.route('**/__test-api/**', async (route) => {
      const url = new URL(route.request().url()); const pathname = url.pathname.replace('/__test-api', '');
      const method = route.request().method(); const payload = route.request().postDataJSON();
      let body;
      if (pathname === '/clientes') body = { data: [{ id: '1', nombre: 'Cliente de prueba' }], total: 1 };
      else if (pathname === '/expedientes') {
        assert.equal(url.searchParams.get('id_cliente'), '1'); assert.equal(url.searchParams.get('con_radicado'), 'true');
        body = { data: [{ id: '8', numero_de_expediente: 'KOOP-2026-99', numero_radicado_despacho: externo, nombre_tipo_proceso: 'Civil' }], total: 1 };
      } else if (pathname === '/consultas-externas/seguimientos') {
        assert.equal(payload.id_expediente, '8'); assert.equal(payload.numero_radicado, undefined);
        items = [{ id_radicado_publico: '9', numero_radicado: externo, nombre_cliente: 'Cliente de prueba', organismo: payload.organismo, modalidad: payload.modalidad }]; body = { id: '1' };
      } else if (pathname === '/consultas-externas/radicados') body = { items };
      else if (pathname === '/consultas-externas' && method === 'GET') body = { items: logs };
      else if (pathname === '/consultas-externas' && method === 'POST') {
        logs = [{ ...payload, id: '10', nombre_usuario: 'Abogada de prueba', created_at: new Date().toISOString() }];
        items[0].ultima_consulta_hoy_id = '10'; body = logs[0];
      } else if (pathname.endsWith('/seguimiento')) { assert.equal(payload.modalidad, null); items = []; body = { retirado: true }; }
      else throw new Error('Petición inesperada: ' + method + ' ' + pathname);
      await route.fulfill({ json: body });
    });
    await page.goto(process.argv[3] || 'http://127.0.0.1:5187');
    await page.getByRole('heading', { name: 'Agrega tu primer proceso' }).waitFor().catch(async (error) => {
      console.error(errors, await page.locator('body').innerText()); throw error;
    });
    assert.equal(await page.getByRole('button', { name: 'Generar bitácora del día (PDF)' }).isEnabled(), false);
    await page.screenshot({ path: path.join(output, 'consulta-vacia.png'), fullPage: true });
    await page.getByRole('button', { name: '+ Agregar primer proceso', exact: true }).click();
    await page.locator('select').filter({ has: page.locator('option[value="1"]') }).selectOption('1');
    await page.getByLabel('2. Expediente', { exact: false }).selectOption('8');
    assert.equal(await page.getByText('KOOP-2026-99').count(), 0);
    await page.getByLabel('3. Página de consulta').selectOption('Consulta de procesos Rama Judicial');
    assert.equal(await page.getByLabel('4. Modalidad de consulta').locator('option[value="automatica"]').count(), 1);
    await page.getByLabel('4. Modalidad de consulta').selectOption('automatica');
    await page.getByLabel('3. Página de consulta').selectOption('Consultas Fiscalía');
    assert.equal(await page.getByLabel('4. Modalidad de consulta').inputValue(), 'manual');
    assert.equal(await page.getByLabel('4. Modalidad de consulta').locator('option').count(), 1);
    await page.screenshot({ path: path.join(output, 'consulta-alta.png'), fullPage: true });
    await page.getByRole('button', { name: 'Agregar a la lista diaria' }).click();
    await page.getByRole('heading', { name: externo }).waitFor();
    await page.getByRole('button', { name: 'Registrar revisión', exact: true }).click();
    await page.getByLabel('Resultado', { exact: true }).selectOption('sin_movimiento');
    await page.getByLabel('Observaciones', { exact: true }).fill('Consulta realizada en el portal.');
    await page.getByRole('button', { name: 'Guardar revisión', exact: true }).click();
    await page.getByText('Todos los procesos tienen registro. La constancia está lista.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Generar bitácora del día (PDF)' }).isEnabled(), true);
    await page.screenshot({ path: path.join(output, 'consulta-lista.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'consulta-movil.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole('button', { name: 'Retirar de la lista', exact: true }).click();
    await page.getByRole('button', { name: 'Retirar proceso', exact: true }).click();
    await page.getByRole('heading', { name: 'Agrega tu primer proceso' }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: lista vacía, cascada, radicado externo, modalidades, registro, PDF habilitado, retiro y móvil.');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
