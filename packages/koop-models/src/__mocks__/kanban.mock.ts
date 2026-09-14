import type { Tablero, ColumnaKanban, KanbanPosicion } from '../kanban';

export const mockTablero = (overrides?: Partial<Tablero>): Tablero => ({
  id: 1,
  nombre: 'Tablero de Tareas Koop',
  descripcion: 'Gestión de tareas por estados',
  tipo_granularidad: 'tarea',
  tipo_ambito: 'global',
  es_publico: false,
  active: true,
  ...overrides,
});

export const mockColumnaKanban = (overrides?: Partial<ColumnaKanban>): ColumnaKanban => ({
  id: 1,
  id_tablero: 1,
  nombre: 'Pendiente',
  orden: 1,
  color: '#64748b',
  es_inicial: true,
  es_final: false,
  active: true,
  ...overrides,
});

export const mockColumnasKanban = (): ColumnaKanban[] => [
  mockColumnaKanban({ id: 1, nombre: 'Pendiente', orden: 1, es_inicial: true }),
  mockColumnaKanban({ id: 2, nombre: 'En Progreso', orden: 2, color: '#0ea5e9', es_inicial: false }),
  mockColumnaKanban({ id: 3, nombre: 'En Revisión', orden: 3, color: '#f59e0b', es_inicial: false }),
  mockColumnaKanban({ id: 4, nombre: 'Completado', orden: 4, color: '#22c55e', es_inicial: false, es_final: true }),
];

export const mockKanbanPosicion = (
  overrides?: Partial<Extract<KanbanPosicion, { tipo_entidad: 'TAREA' }>>
): KanbanPosicion => ({
  id: 1,
  id_tablero: 1,
  id_columna: 1,
  tipo_entidad: 'TAREA',
  id_tarea: 1,
  orden_vertical: 0,
  active: true,
  ...overrides,
});
