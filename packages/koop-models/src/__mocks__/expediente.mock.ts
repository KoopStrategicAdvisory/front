import type { Expediente, ExpedienteEtapa } from '../expediente';

const NOW = new Date().toISOString();

export const mockExpediente = (overrides?: Partial<Expediente>): Expediente => ({
  id: 1,
  numero_de_expediente: 'KOOP-2024-001',
  id_usuario: 1,
  id_cliente: 1,
  id_tipo_proc_subtipo_proc_tipo_pre: 1,
  juzgado_o_autoridad_que_conoce: 'Juzgado 5 Laboral del Circuito de Bogotá',
  active: true,
  ...overrides,
});

export const mockExpedienteEtapa = (overrides?: Partial<ExpedienteEtapa>): ExpedienteEtapa => ({
  id: 1,
  id_expediente: 1,
  id_iter_plantilla: 1,
  id_etapa: 1,
  orden: 1,
  id_estado_etapa: 1,
  fecha_inicio: NOW,
  fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  id_usuario_responsable: 2,
  active: true,
  ...overrides,
});

export const mockExpedienteList = (count = 3): Expediente[] =>
  Array.from({ length: count }, (_, i) =>
    mockExpediente({
      id: i + 1,
      numero_de_expediente: `KOOP-2024-00${i + 1}`,
    })
  );
