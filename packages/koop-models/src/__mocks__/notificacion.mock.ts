import type { Notificacion } from '../notificacion';

const NOW = new Date().toISOString();
const IN_30_DAYS = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

export const mockNotificacion = (overrides?: Partial<Notificacion>): Notificacion => ({
  id: 1,
  id_expediente: 1,
  id_actuacion: 1,
  id_tipo_notificacion: 1,
  parte_notificada: 'Empresa ABC S.A.S',
  destinatario: 'Representante Legal',
  direccion_o_correo: 'legal@empresaabc.co',
  fecha_realizacion: NOW,
  dias_plazo: 10,
  fecha_vencimiento: IN_30_DAYS,
  objeto_notificacion: 'Notificación del auto admisorio',
  estado: 'surtida',
  active: true,
  ...overrides,
});
