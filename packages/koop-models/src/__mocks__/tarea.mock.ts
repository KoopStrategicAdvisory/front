import type { Tarea, ChecklistItem } from '../tarea';

const NOW = new Date().toISOString();
const IN_7_DAYS = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

export const mockTarea = (overrides?: Partial<Tarea>): Tarea => ({
  id: 1,
  id_expediente: 1,
  titulo: 'Redactar escrito de demanda',
  descripcion: 'Elaborar la demanda ordinaria laboral con todos los requisitos del CPTSS',
  id_usuario_asignado: 2,
  id_usuario_creador: 1,
  id_prioridad: 1,
  id_estado_tarea: 1,
  fecha_limite: IN_7_DAYS,
  es_hito_preclusivo: true,
  observaciones: 'Verificar documentos de liquidación antes de radicar',
  created_at: NOW,
  active: true,
  ...overrides,
});

export const mockTareaCompletada = (overrides?: Partial<Tarea>): Tarea =>
  mockTarea({
    id: 2,
    titulo: 'Radicación de demanda',
    id_estado_tarea: 2,
    fecha_completado: NOW,
    es_hito_preclusivo: false,
    ...overrides,
  });

export const mockTareaList = (count = 5): Tarea[] =>
  Array.from({ length: count }, (_, i) =>
    mockTarea({
      id: i + 1,
      titulo: `Tarea ${i + 1}`,
      es_hito_preclusivo: i === 0,
    })
  );

export const mockChecklistItem = (overrides?: Partial<ChecklistItem>): ChecklistItem => ({
  id: 1,
  id_tarea: 1,
  descripcion: 'Verificar poder del cliente',
  completado: false,
  created_at: NOW,
  active: true,
  ...overrides,
});
