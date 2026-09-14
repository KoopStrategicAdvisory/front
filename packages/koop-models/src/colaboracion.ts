import type { Id } from './shared';

export type TipoEntidadColaboracion = 'tarea' | 'expediente_etapa' | string;

export interface Etiqueta {
  id: Id;
  nombre: string;
  color?: string;
  icono?: string;
  descripcion?: string;
  active: boolean;
}

export type CreateEtiquetaInput = Pick<Etiqueta, 'nombre'> & { color?: string; icono?: string };

export interface AsignarEtiquetaInput {
  tipo_entidad: TipoEntidadColaboracion;
  id_etiqueta: Id;
  id_tarea?: Id;
  id_expediente_etapa?: Id;
}

export interface Comentario {
  id: Id;
  tipo_entidad?: TipoEntidadColaboracion;
  id_tarea?: Id;
  id_expediente_etapa?: Id;
  id_usuario_autor?: Id;
  id_parent?: Id;
  contenido: string;
  editado?: boolean;
  created_at?: string;
  active: boolean;
}

export type CreateComentarioInput = Pick<Comentario, 'tipo_entidad' | 'contenido'> & {
  id_tarea?: Id;
  id_parent?: Id;
};

export type UpdateComentarioInput = Pick<Comentario, 'contenido'>;

export interface Adjunto {
  id: Id;
  tipo_entidad?: TipoEntidadColaboracion;
  id_tarea?: Id;
  id_expediente_etapa?: Id;
  id_comentario?: Id;
  nombre_archivo: string;
  url_archivo?: string;
  mime_type?: string;
  tamano_bytes?: number;
  active: boolean;
}

export type CreateAdjuntoInput = Pick<Adjunto, 'tipo_entidad' | 'nombre_archivo'> & {
  url_archivo?: string;
  mime_type?: string;
};

export type TipoDependencia = 'FS' | 'SS' | 'FF' | 'SF';

export interface Dependencia {
  id: Id;
  tipo_dependencia?: TipoDependencia;
  es_bloqueante?: boolean;
  active: boolean;
}

/** El spec no documenta `id_tarea_origen`/`id_tarea_destino` en el body de creación
 * (aunque el GET sí filtra por `id_tarea_origen`) — confirmar con backend antes de integrar la UI. */
export type CreateDependenciaInput = {
  tipo_dependencia?: TipoDependencia;
  es_bloqueante?: boolean;
};
