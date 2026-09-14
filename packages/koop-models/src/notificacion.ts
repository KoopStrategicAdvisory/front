import type { Id } from './shared';

export interface Notificacion {
  id: Id;
  id_expediente: Id;
  id_expediente_etapa?: Id;
  id_actuacion?: Id;
  id_tipo_notificacion?: Id;
  id_medio_notificacion?: Id;
  parte_notificada?: string;
  destinatario?: string;
  direccion_o_correo?: string;
  fecha_realizacion?: string;
  fecha_surtimiento?: string;
  dias_plazo?: number;
  fecha_vencimiento?: string;
  objeto_notificacion?: string;
  estado?: string;
  observaciones?: string;
  active: boolean;
}

export type CreateNotificacionInput = {
  id_expediente: Id;
  fecha_notificacion: string;
  id_tipo_notificacion?: Id;
  id_medio_notificacion?: Id;
  parte_notificada?: string;
  destinatario?: string;
  dias_plazo?: number;
};

export type UpdateNotificacionInput = Partial<CreateNotificacionInput> & {
  estado?: string;
  observaciones?: string;
};
