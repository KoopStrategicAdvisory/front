import type { Id } from './shared';

export interface Tarea {
  id: Id;
  id_expediente?: Id;
  id_expediente_etapa?: Id;
  id_tarea_plantilla?: Id;
  titulo: string;
  descripcion?: string;
  id_usuario_asignado?: Id;
  id_usuario_creador?: Id;
  id_prioridad?: Id;
  id_estado_tarea?: Id;
  fecha_limite?: string;
  fecha_completado?: string;
  es_hito_preclusivo?: boolean;
  observaciones?: string;
  created_at?: string;
  active: boolean;
}

export type CreateTareaInput = Pick<Tarea, 'titulo'> & {
  descripcion?: string;
  id_expediente?: Id;
  id_usuario_asignado?: Id;
  id_prioridad?: Id;
  fecha_limite?: string;
};

export type UpdateTareaInput = Partial<CreateTareaInput> & {
  id_estado_tarea?: Id;
  observaciones?: string;
};

export interface ListTareasParams {
  id_expediente?: Id;
  id_usuario_asignado?: Id;
  limit?: number;
  offset?: number;
  vencidas?: boolean;
}

export interface ChecklistItem {
  id: Id;
  id_tarea: Id;
  descripcion: string;
  completado?: boolean;
  created_at?: string;
  active: boolean;
}

export type CreateChecklistItemInput = Pick<ChecklistItem, 'descripcion'>;
