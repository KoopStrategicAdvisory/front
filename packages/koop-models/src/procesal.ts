import type { Id } from './shared';

export interface Actuacion {
  id: Id;
  id_expediente: Id;
  id_expediente_etapa?: Id;
  fecha?: string;
  id_tipo_actuacion?: Id;
  titulo?: string;
  descripcion?: string;
  autoridad_emite?: string;
  id_usuario_registra?: Id;
  es_hito?: boolean;
  url_rama_judicial?: string;
  created_at?: string;
  active: boolean;
}

/** El endpoint de creación usa `fecha_actuacion` (no `fecha`, como en la entidad) */
export type CreateActuacionInput = {
  id_expediente: Id;
  fecha_actuacion: string;
  id_tipo_actuacion?: Id;
  titulo?: string;
  descripcion?: string;
  autoridad_emite?: string;
};

export type UpdateActuacionInput = Partial<CreateActuacionInput>;

export type ModalidadAudiencia = 'presencial' | 'virtual' | 'mixta';

export interface Audiencia {
  id: Id;
  id_expediente: Id;
  id_expediente_etapa?: Id;
  tipo_audiencia?: string;
  fecha_programada?: string;
  modalidad?: ModalidadAudiencia;
  enlace_virtual?: string;
  juzgado_o_autoridad?: string;
  direccion_fisica?: string;
  asistentes?: string;
  id_usuario_responsable?: Id;
  estado?: string;
  resultado?: string;
  observaciones?: string;
  active: boolean;
}

/** El endpoint de creación usa `fecha_audiencia` (no `fecha_programada`, como en la entidad) */
export type CreateAudienciaInput = {
  id_expediente: Id;
  fecha_audiencia: string;
  tipo_audiencia?: string;
  modalidad?: ModalidadAudiencia;
  enlace_virtual?: string;
  juzgado_o_autoridad?: string;
  id_usuario_responsable?: Id;
};

export type UpdateAudienciaInput = Partial<CreateAudienciaInput> & {
  estado?: string;
  resultado?: string;
  observaciones?: string;
};
