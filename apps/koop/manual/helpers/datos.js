// Datos de EJEMPLO (inventados) para ilustrar el manual. Se crean por la API
// en la base aislada de pruebas: jamás se usan datos reales de la firma.
import { API, tokenDe, crearCliente, subirDocumento } from '../../e2e/helpers/api.js';

async function post(request, token, ruta, data) {
  const res = await request.post(`${API}${ruta}`, { data, headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok()) throw new Error(`POST ${ruta} falló (${res.status()}): ${await res.text()}`);
  return res.json();
}

export async function sembrarEjemplo(request, admin) {
  const token = await tokenDe(request, admin);

  const maria = await crearCliente(request, token, {
    nombre: 'María Fernanda Torres Ríos', tipo_persona: 'NATURAL', tipo_documento: 'CC', numero_documento: '52123456',
    email: 'maria.torres@correo.test', telefono: '300 123 4567',
  });
  const carlos = await crearCliente(request, token, {
    nombre: 'Carlos Andrés Gómez Peña', tipo_persona: 'NATURAL', tipo_documento: 'CC', numero_documento: '79654321',
    email: 'carlos.gomez@correo.test', telefono: '311 765 4321',
  });
  const constructora = await crearCliente(request, token, {
    nombre: 'Constructora Andina S.A.S.', tipo_persona: 'JURIDICA', tipo_documento: 'NIT', numero_documento: '900123456',
    email: 'juridica@constructoraandina.test', telefono: '601 555 0100',
  });

  const exp = (id_cliente, numero, radicado, contraparte, juzgado, combo) => post(request, token, '/expedientes', {
    numero_de_expediente: numero, numero_radicado_despacho: radicado, id_cliente,
    id_tipo_proc_subtipo_proc_tipo_pre: combo, contraparte, juzgado_o_autoridad_que_conoce: juzgado,
    correo_juzgado: 'j01ccbta@cendoj.ramajudicial.gov.co',
  });
  const e1 = await exp(maria.id, 'KOOP-2026-1', '11001310300120250012300', 'Banco Ejemplo S.A.', 'Juzgado 1 Civil del Circuito de Bogotá', 1);
  const e2 = await exp(carlos.id, 'KOOP-2026-2', '11001400300520260004500', 'Comercializadora Sol y Luna S.A.S.', 'Juzgado 5 Civil Municipal de Bogotá', 1);
  const e3 = await exp(constructora.id, 'KOOP-2026-3', '11001310502420260009800', 'Ministerio de Ejemplo', 'Juzgado 24 Laboral del Circuito de Bogotá', 1);

  // Actividad de ejemplo en el primer expediente
  await post(request, token, '/tareas', { titulo: 'Preparar el escrito de alegatos', id_expediente: e1.id, id_estado_tarea: 1, id_prioridad: 2, fecha_limite: '2026-10-15' });
  await post(request, token, '/tareas', { titulo: 'Reunión con la clienta para revisar pruebas', id_expediente: e1.id, id_estado_tarea: 2, id_prioridad: 3, fecha_limite: '2026-10-05' });
  await post(request, token, '/audiencias', { id_expediente: e1.id, tipo_audiencia: 'Audiencia de conciliación', fecha_programada: '2026-11-12T09:00:00', modalidad: 'virtual', estado: 'programada', juzgado_o_autoridad: 'Juzgado 1 Civil del Circuito de Bogotá', enlace_virtual: 'https://meet.example.com/audiencia-koop' });
  await post(request, token, '/actuaciones', { id_expediente: e1.id, fecha: '2026-09-10', titulo: 'Auto admite la demanda', id_tipo_actuacion: 1, descripcion: 'El despacho admite la demanda y ordena notificar a la parte demandada.' });
  await subirDocumento(request, token, { idExpediente: e1.id, nombre: 'demanda-radicada.pdf', contenido: '%PDF-1.4 ejemplo', mime: 'application/pdf' });

  return {
    token, maria, carlos, constructora, e1, e2, e3,
  };
}
