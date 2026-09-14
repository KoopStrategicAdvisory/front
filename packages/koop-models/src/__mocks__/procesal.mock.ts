import type { Actuacion, Audiencia } from '../procesal';

const NOW = new Date().toISOString();
const IN_30_DAYS = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

export const mockActuacion = (overrides?: Partial<Actuacion>): Actuacion => ({
  id: 1,
  id_expediente: 1,
  id_expediente_etapa: 1,
  fecha: NOW,
  id_tipo_actuacion: 1,
  titulo: 'Auto admisorio de la demanda',
  descripcion: 'El juzgado admite la demanda y ordena notificar al demandado',
  autoridad_emite: 'Juzgado 5 Laboral del Circuito de Bogotá',
  id_usuario_registra: 2,
  es_hito: true,
  created_at: NOW,
  active: true,
  ...overrides,
});

export const mockAudiencia = (overrides?: Partial<Audiencia>): Audiencia => ({
  id: 1,
  id_expediente: 1,
  tipo_audiencia: 'Audiencia de Conciliación',
  fecha_programada: IN_30_DAYS,
  modalidad: 'virtual',
  enlace_virtual: 'https://meet.google.com/abc-defg-hij',
  juzgado_o_autoridad: 'Juzgado 5 Laboral del Circuito de Bogotá',
  id_usuario_responsable: 2,
  estado: 'programada',
  active: true,
  ...overrides,
});
