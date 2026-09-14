import type { Id } from './shared';

export interface Expediente {
  id: Id;
  numero_de_expediente: string;
  id_usuario?: Id;
  id_cliente?: Id;
  id_calidad_usuario?: Id;
  id_tipo_proc_subtipo_proc_tipo_pre?: Id;
  id_contraparte?: Id;
  juzgado_o_autoridad_que_conoce?: string;
  id_estado_proceso?: Id;
  active: boolean;
}

export type CreateExpedienteInput = Pick<Expediente, 'numero_de_expediente'> & {
  id_cliente?: Id;
  id_calidad_usuario?: Id;
  id_tipo_proc_subtipo_proc_tipo_pre?: Id;
  id_contraparte?: Id;
  juzgado_o_autoridad_que_conoce?: string;
  id_estado_proceso?: Id;
};

export type UpdateExpedienteInput = Partial<CreateExpedienteInput>;

export interface ExpedienteEtapa {
  id: Id;
  id_expediente: Id;
  id_iter_plantilla?: Id;
  id_etapa?: Id;
  orden?: number;
  id_instancia?: Id;
  id_estado_etapa?: Id;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  fecha_fin_real?: string;
  id_usuario_responsable?: Id;
  observaciones?: string;
  active: boolean;
}

export type CreateExpedienteEtapaInput = {
  id_etapa?: Id;
  id_iter_plantilla?: Id;
  orden?: number;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  id_usuario_responsable?: Id;
};

export type UpdateExpedienteEtapaInput = Partial<CreateExpedienteEtapaInput> & {
  id_estado_etapa?: Id;
  fecha_fin_real?: string;
  observaciones?: string;
};
