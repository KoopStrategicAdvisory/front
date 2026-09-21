import { test, expect } from '@playwright/test';
import { ADMIN } from '../e2e/fixtures/users.js';
import { iniciarSesion } from '../e2e/helpers/auth.js';
import { enlaceDelCorreo, agregarASeguimiento } from '../e2e/helpers/api.js';
import { captura } from './helpers/captura.js';
import { sembrarEjemplo } from './helpers/datos.js';

// Este guion recorre el sistema paso a paso con datos de ejemplo y saca las
// capturas que ilustran el manual (docs/manual/img). Las pruebas se ejecutan
// EN ORDEN y comparten los datos sembrados al inicio.
test.describe.configure({ mode: 'serial' });

let d; // datos de ejemplo

test.beforeAll(async ({ request }) => { d = await sembrarEjemplo(request, ADMIN); });

test.describe('1. Primeros pasos', () => {
  test('inicio y acceso', async ({ page }) => {
    await page.goto('/');
    await captura(page, '01-inicio', { resaltar: [page.getByRole('link', { name: /CLIENTE KOOP/i })] });

    await page.goto('/login');
    await captura(page, '02-login', {
      resaltar: [page.getByLabel('Correo'), page.getByLabel('Contraseña'), page.getByRole('button', { name: 'Iniciar sesión' }),
        page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }), page.getByRole('link', { name: 'Regístrate' })],
    });

    await page.getByLabel('Correo').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill('clave-equivocada');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.locator('.auth-error')).toBeVisible();
    await captura(page, '03-login-error', { resaltar: [page.locator('.auth-error')] });
  });

  test('recuperar la contraseña', async ({ page }) => {
    await page.goto('/forgot-password');
    await captura(page, '04-olvide-contrasena', { resaltar: [page.getByLabel('Correo'), page.getByRole('button', { name: 'Enviar enlace' })] });
    await page.getByLabel('Correo').fill('maria.torres@correo.test');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(page.locator('.auth-info')).toBeVisible();
    await captura(page, '05-olvide-enviado', { resaltar: [page.locator('.auth-info')] });
  });

  test('crear una cuenta (registro)', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Nombre').fill('María Fernanda Torres Ríos');
    await page.getByLabel('Correo').fill('maria.torres@correo.test');
    await page.getByPlaceholder('Número de documento').fill('52123456');
    await page.getByLabel('Contrasena').fill('MiClaveSegura123');
    await captura(page, '06-registro', {
      resaltar: [page.getByLabel('Nombre'), page.getByLabel('Correo'), page.getByPlaceholder('Número de documento'), page.getByLabel('Contrasena'), page.getByRole('button', { name: 'Registrarme' })],
    });
    await page.getByRole('button', { name: 'Registrarme' }).click();
    await expect(page.getByText('Registro recibido.')).toBeVisible();
    await captura(page, '07-registro-recibido', { resaltar: [page.getByText('Registro recibido.')] });
  });

  test('perfil y menú de usuario', async ({ page }) => {
    await iniciarSesion(page, ADMIN);
    await expect(page.getByText('BIENVENIDO DE NUEVO', { exact: false })).toBeVisible();
    await captura(page, '08-perfil', {
      resaltar: [page.getByRole('button', { name: /E2E ADMIN/i }), page.getByText('Expedientes', { exact: true }), page.getByText('Centro administrativo'), page.getByText('Alertas de vencimiento')],
    });
    await page.getByRole('button', { name: /E2E ADMIN/i }).click();
    await captura(page, '09-menu-usuario', {
      resaltar: [page.getByRole('link', { name: 'Clientes', exact: true }), page.getByRole('link', { name: 'Expedientes', exact: true }),
        page.getByRole('link', { name: 'Tareas', exact: true }), page.getByRole('link', { name: 'Consultas', exact: true })],
    });
  });
});

test.describe('2. Clientes', () => {
  test.beforeEach(async ({ page }) => { await iniciarSesion(page, ADMIN); });

  test('lista y búsqueda', async ({ page }) => {
    await page.goto('/admin/clientes-activos');
    await expect(page.getByText('Carlos Andrés Gómez Peña').first()).toBeVisible();
    await captura(page, '10-clientes-lista', {
      resaltar: [page.getByPlaceholder('Buscar por nombre, email, documento o celular'), page.getByRole('button', { name: 'Nuevo cliente' }), page.getByRole('button', { name: 'Refrescar' })],
    });
    await page.getByPlaceholder('Buscar por nombre, email, documento o celular').fill('Torres');
    await captura(page, '11-clientes-busqueda', { resaltar: [page.getByPlaceholder('Buscar por nombre, email, documento o celular')] });
  });

  test('crear un cliente', async ({ page }) => {
    await page.goto('/admin/clientes-activos');
    await page.getByRole('button', { name: 'Nuevo cliente' }).click();
    await page.getByLabel('Nombre completo / razón social').fill('Laura Sofía Martínez Díaz');
    await page.getByLabel('Número de documento').fill('1032456789');
    await page.getByLabel('Email').fill('laura.martinez@correo.test');
    await page.getByLabel('Celular').fill('315 222 3344');
    await captura(page, '12-cliente-nuevo', {
      resaltar: [page.getByLabel('Nombre completo / razón social'), page.getByLabel('Número de documento'), page.getByLabel('Email'), page.getByLabel('Celular'), page.getByRole('button', { name: 'Crear cliente' })],
    });
    await page.getByRole('button', { name: 'Crear cliente' }).click();
    await expect(page.getByText('Cliente creado correctamente')).toBeVisible();
    await captura(page, '13-cliente-creado', { resaltar: [page.getByText('Cliente creado correctamente')] });
  });
});

test.describe('3. Expedientes', () => {
  test.beforeEach(async ({ page }) => { await iniciarSesion(page, ADMIN); });

  test('cliente con sus expedientes y lista de expedientes', async ({ page }) => {
    await page.goto('/admin/clientes-activos');
    await page.getByText('María Fernanda Torres Ríos').first().click();
    await captura(page, '14-cliente-expandido');

    await page.goto('/admin/expedientes');
    await expect(page.getByText('KOOP-2026-1').first()).toBeVisible();
    await captura(page, '15-expedientes-lista', {
      resaltar: [page.getByRole('button', { name: /Nuevo Expediente/ }), page.getByPlaceholder('Buscar por número de expediente...'), page.getByText('KOOP-2026-1').first()],
    });
  });

  test('crear un expediente con el asistente', async ({ page }) => {
    await page.goto('/admin/expedientes');
    await page.getByRole('button', { name: /Nuevo Expediente/ }).click();
    await page.getByPlaceholder('2024', { exact: true }).fill('2026');
    await page.getByPlaceholder('10', { exact: true }).fill('4');
    await page.getByLabel('N° Radicado del despacho (opcional)').fill('11001400300720260012300');
    await page.getByLabel('Cliente *').selectOption({ label: 'Carlos Andrés Gómez Peña' });
    await captura(page, '16-expediente-paso1', {
      resaltar: [page.getByPlaceholder('2024', { exact: true }), page.getByLabel('N° Radicado del despacho (opcional)'), page.getByLabel('Cliente *'), page.getByRole('button', { name: 'Siguiente →' })],
    });
    await page.getByRole('button', { name: 'Siguiente →' }).click();
    await page.getByLabel('Tipo de proceso').selectOption({ label: 'Proceso Civil' });
    await page.getByLabel('Subtipo de proceso').selectOption({ index: 2 });
    await page.getByLabel('Tipo de pretensión').selectOption({ index: 2 });
    await captura(page, '17-expediente-paso2', {
      resaltar: [page.getByLabel('Tipo de proceso'), page.getByLabel('Subtipo de proceso'), page.getByLabel('Tipo de pretensión')],
    });
    await page.getByRole('button', { name: 'Siguiente →' }).click();
    await page.getByLabel('Contraparte / Parte demandada *').fill('Almacenes Ejemplo S.A.');
    await page.getByLabel('Juzgado / Autoridad que conoce').fill('Juzgado 7 Civil Municipal de Bogotá');
    await page.getByLabel('Correo del juzgado / entidad *').fill('j07cmbta@cendoj.ramajudicial.gov.co');
    await captura(page, '18-expediente-paso3', {
      resaltar: [page.getByLabel('Contraparte / Parte demandada *'), page.getByLabel('Correo del juzgado / entidad *'), page.getByRole('button', { name: 'Crear expediente' })],
    });
    await page.getByRole('button', { name: 'Crear expediente' }).click();
    await expect(page.getByText('Expediente creado exitosamente')).toBeVisible();
    await captura(page, '19-expediente-creado', { resaltar: [page.getByText('Expediente creado exitosamente')] });
  });

  test('detalle del expediente y sus pestañas', async ({ page }) => {
    await page.goto(`/admin/expedientes/${d.e1.id}`);
    await expect(page.getByRole('button', { name: 'Actuaciones', exact: true })).toBeVisible();
    await captura(page, '20-detalle-encabezado', {
      resaltar: [page.getByRole('button', { name: 'Actuaciones', exact: true }), page.getByRole('button', { name: 'Documentos', exact: true })],
    });

    for (const [pestana, archivo] of [['Actuaciones', '21-tab-actuaciones'], ['Audiencias', '22-tab-audiencias'], ['Etapas', '23-tab-etapas'], ['Tareas', '24-tab-tareas'], ['Documentos', '25-tab-documentos'], ['Radicados', '26-tab-radicados']]) {
      await page.getByRole('button', { name: pestana, exact: true }).click();
      await captura(page, archivo);
    }
  });
});

test.describe('4. Tareas', () => {
  test.beforeEach(async ({ page }) => { await iniciarSesion(page, ADMIN); });

  test('tablero de tareas', async ({ page }) => {
    await page.goto('/admin/tareas');
    await page.getByRole('button', { name: 'Todas las tareas' }).click();
    await expect(page.getByText('Preparar el escrito de alegatos').first()).toBeVisible();
    await captura(page, '27-tareas-lista', {
      resaltar: [page.getByRole('button', { name: /Nueva Tarea/ }), page.getByRole('button', { name: /Lista/ }), page.getByRole('button', { name: /Tablero/ }),
        page.getByRole('button', { name: 'Mis tareas' }), page.getByRole('button', { name: 'Todas las tareas' })],
    });
    // El botón queda bajo la barra superior si la página está desplazada: se sube al inicio primero.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('button', { name: /Nueva Tarea/ }).dispatchEvent('click');
    await expect(page.getByRole('heading', { name: /Nueva Tarea/ })).toBeVisible();
    await captura(page, '29-tarea-nueva');
    await page.goto('/admin/tareas');
    await page.getByRole('button', { name: /Tablero/ }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await captura(page, '28-tareas-tablero', { pausa: 900 });
  });
});

test.describe('5. Consulta diaria de procesos', () => {
  test.beforeEach(async ({ page }) => { await iniciarSesion(page, ADMIN); });

  test('agregar el primer proceso a la lista', async ({ page }) => {
    await page.goto('/consultas');
    await expect(page.getByText('Agrega tu primer proceso')).toBeVisible();
    await captura(page, '30-consulta-vacia', { resaltar: [page.getByRole('button', { name: /Agregar primer proceso/ }), page.getByLabel('Fecha de revisión')] });

    await page.getByRole('button', { name: /Agregar primer proceso/ }).click();
    await page.getByLabel('Buscar cliente').fill('Torres');
    await page.getByRole('combobox').first().selectOption({ label: 'María Fernanda Torres Ríos · 52123456' });
    await page.getByLabel('2. Expediente', { exact: false }).selectOption({ index: 1 });
    await captura(page, '31-consulta-agregar-paso12', {
      resaltar: [page.getByLabel('Buscar cliente'), page.getByLabel('2. Expediente', { exact: false }), page.getByText('Radicado que se consultará')],
    });
    await page.getByLabel('3. Página de consulta').selectOption('Consulta de procesos Rama Judicial');
    await page.getByLabel('4. Modalidad de consulta').selectOption('automatica');
    await captura(page, '32-consulta-agregar-paso34', {
      resaltar: [page.getByLabel('3. Página de consulta'), page.getByLabel('4. Modalidad de consulta'), page.getByRole('button', { name: 'Agregar a la lista diaria' })],
    });
    await page.getByRole('button', { name: 'Agregar a la lista diaria' }).click();
    await expect(page.getByText('Proceso agregado a la lista diaria.')).toBeVisible();
  });

  test('la lista con varios procesos y la consulta automática', async ({ page, request }) => {
    await agregarASeguimiento(request, d.token, { idExpediente: d.e2.id, organismo: 'Consultas Fiscalía', modalidad: 'manual' });
    await agregarASeguimiento(request, d.token, { idExpediente: d.e3.id, organismo: 'SIUGJ', modalidad: 'manual' });
    await page.goto('/consultas');
    await expect(page.getByText('0 de 3 revisados')).toBeVisible();
    const tarjeta = page.locator('article', { hasText: '11001310300120250012300' });
    await captura(page, '33-consulta-lista', {
      resaltar: [page.getByRole('button', { name: /Agregar proceso/ }), page.getByText('0 de 3 revisados'), page.getByRole('button', { name: 'Consultar automáticos ahora' }),
        tarjeta.getByText('Pendiente de revisión'), tarjeta.getByRole('link', { name: 'Abrir página' }), tarjeta.getByRole('button', { name: 'Registrar revisión' }), tarjeta.getByRole('button', { name: 'Retirar de la lista' })],
    });

    await page.getByRole('button', { name: 'Consultar automáticos ahora' }).click();
    await expect(page.getByText(/registro generado/)).toBeVisible();
    await captura(page, '34-consulta-automatica', {
      enfocar: tarjeta,
      resaltar: [tarjeta.getByText(/Generado automáticamente/), tarjeta.getByText(/Registrado por Sistema Koop/), tarjeta.getByRole('button', { name: 'Corregir registro' })],
    });
  });

  test('registrar la revisión manual y corregirla', async ({ page }) => {
    await page.goto('/consultas');
    const tarjeta = page.locator('article', { hasText: '11001400300520260004500' });
    await tarjeta.getByRole('button', { name: 'Registrar revisión' }).click();
    await page.getByLabel('Resultado').selectOption('termino_corriendo');
    await page.getByLabel('Observaciones').fill('Se notificó el auto; el término para contestar vence el 30 de octubre.');
    await captura(page, '35-consulta-registrar', {
      resaltar: [page.getByLabel('Resultado'), page.getByLabel('Observaciones'), page.getByRole('button', { name: 'Guardar revisión' })],
    });
    await page.getByRole('button', { name: 'Guardar revisión' }).click();
    await expect(page.getByText('Revisión del día guardada.')).toBeVisible();
    await captura(page, '36-consulta-revisado', { enfocar: tarjeta, resaltar: [tarjeta.getByText('Término corriendo'), tarjeta.getByText(/Registrado por/), tarjeta.getByRole('button', { name: 'Corregir registro' })] });
  });

  test('retirar un proceso y generar la bitácora del día', async ({ page }) => {
    await page.goto('/consultas');
    const tarjeta = page.locator('article', { hasText: '11001310502420260009800' });
    await tarjeta.getByRole('button', { name: 'Retirar de la lista' }).click();
    await captura(page, '37-consulta-retirar', { resaltar: [page.getByRole('button', { name: 'Retirar proceso' })] });
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Revisa el último pendiente para completar el día.
    await tarjeta.getByRole('button', { name: 'Registrar revisión' }).click();
    await page.getByLabel('Resultado').selectOption('sin_movimiento');
    await page.getByRole('button', { name: 'Guardar revisión' }).click();
    await expect(page.getByText('Todos los procesos tienen registro. La constancia está lista.')).toBeVisible();
    await captura(page, '38-consulta-bitacora', {
      resaltar: [page.getByText('3 de 3 revisados'), page.getByRole('button', { name: 'Generar bitácora del día (PDF)' })],
    });
  });
});

test.describe('6. Administración', () => {
  test.beforeEach(async ({ page }) => { await iniciarSesion(page, ADMIN); });

  test('usuarios y prospectos', async ({ page, request }) => {
    // Una persona que se registra y cuya cédula NO coincide con ningún cliente.
    await request.post('http://localhost:4100/api/auth/register', {
      data: { nombre: 'Andrea Paola Rojas', email: 'andrea.rojas@correo.test', password: 'ClaveNueva123!', tipo_documento: 'CC', numero_documento: '1098765432', telefono: '320 555 1122' },
    });

    await page.goto('/admin/usuarios');
    await expect(page.getByText('Acceso restringido')).toHaveCount(0);
    await expect(page.getByText('Administrar usuarios', { exact: true })).toBeVisible();
    await captura(page, '39-usuarios-pendientes', { resaltar: [page.getByText('Usuarios creados (no activados)'), page.getByPlaceholder('Buscar por nombre o correo')] });
    await page.getByRole('button', { name: 'Mostrar' }).click();
    await captura(page, '39b-usuarios-activados', { pausa: 800 });

    await page.goto('/admin/prospectos');
    await expect(page.getByText('Andrea Paola Rojas')).toBeVisible();
    await captura(page, '40-prospectos', { resaltar: [page.getByText('Andrea Paola Rojas'), page.getByRole('button', { name: /Descartar/ })] });
  });
});

test.describe('7. Portal del cliente', () => {
  test('verificar el correo, entrar y ver mis casos', async ({ page, request }) => {
    const enlace = await enlaceDelCorreo(request, 'maria.torres@correo.test');
    await page.goto(enlace);
    await expect(page.getByText('Email verificado correctamente')).toBeVisible();
    await captura(page, '41-verificar-correo', { resaltar: [page.getByText('Email verificado correctamente')] });

    await iniciarSesion(page, { email: 'maria.torres@correo.test', password: 'MiClaveSegura123' });
    await captura(page, '42-cliente-perfil', { pausa: 800 });
    await page.goto('/mis-casos');
    await expect(page.getByText('KOOP-2026-1').first()).toBeVisible();
    await captura(page, '43-mis-casos', { resaltar: [page.getByText('KOOP-2026-1').first()] });
  });
});
