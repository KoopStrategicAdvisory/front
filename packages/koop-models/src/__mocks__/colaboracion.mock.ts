import type { Etiqueta, Comentario, Adjunto, Dependencia } from '../colaboracion';

const NOW = new Date().toISOString();

export const mockEtiqueta = (overrides?: Partial<Etiqueta>): Etiqueta => ({
  id: 1,
  nombre: 'Urgente',
  color: '#ef4444',
  active: true,
  ...overrides,
});

export const mockComentario = (overrides?: Partial<Comentario>): Comentario => ({
  id: 1,
  tipo_entidad: 'tarea',
  id_tarea: 1,
  id_usuario_autor: 2,
  contenido: 'Falta anexar el poder del cliente',
  editado: false,
  created_at: NOW,
  active: true,
  ...overrides,
});

export const mockAdjunto = (overrides?: Partial<Adjunto>): Adjunto => ({
  id: 1,
  tipo_entidad: 'tarea',
  id_tarea: 1,
  nombre_archivo: 'poder.pdf',
  url_archivo: 's3://koop-docs/tarea-1/poder.pdf',
  mime_type: 'application/pdf',
  active: true,
  ...overrides,
});

export const mockDependencia = (overrides?: Partial<Dependencia>): Dependencia => ({
  id: 1,
  tipo_dependencia: 'FS',
  es_bloqueante: true,
  active: true,
  ...overrides,
});
