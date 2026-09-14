import type { Id } from './shared';

/** Plantilla de una etapa dentro del flujo procesal de un tipo de proceso/subtipo/pretensión */
export interface IterProcesalPlantilla {
  id: Id;
  id_tipo_proc_subtipo_proc_tipo_pre: Id;
  id_etapa: Id;
  orden: number;
  id_instancia?: Id;
  plazo_dias?: number;
  dias_habiles?: boolean;
  dispara_notificacion?: boolean;
  es_obligatoria?: boolean;
  observaciones?: string;
  active: boolean;
}

export type CreateIterProcesalPlantillaInput = Pick<
  IterProcesalPlantilla,
  'id_tipo_proc_subtipo_proc_tipo_pre' | 'id_etapa' | 'orden'
> & {
  plazo_dias?: number;
  dias_habiles?: boolean;
  es_obligatoria?: boolean;
};

export type UpdateIterProcesalPlantillaInput = Partial<CreateIterProcesalPlantillaInput>;

/** Tarea estándar generada automáticamente cuando un expediente entra a la etapa de la plantilla */
export interface TareaPlantilla {
  id: Id;
  id_iter_plantilla: Id;
  titulo: string;
  descripcion?: string;
  dias_desde_etapa?: number;
  dias_habiles?: boolean;
  id_prioridad?: Id;
  id_rol_responsable?: Id;
  es_hito_critico?: boolean;
  active: boolean;
}

export type CreateTareaPlantillaInput = Pick<TareaPlantilla, 'titulo'> & {
  descripcion?: string;
  dias_desde_etapa?: number;
  id_prioridad?: Id;
};

export type UpdateTareaPlantillaInput = Partial<CreateTareaPlantillaInput>;
