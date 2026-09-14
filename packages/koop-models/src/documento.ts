import type { Id } from './shared';

export interface Documento {
  id: Id;
  id_expediente?: Id;
  id_tipo_documento?: Id;
  nombre_archivo: string;
  titulo?: string;
  descripcion?: string;
  url_storage?: string;
  mime_type?: string;
  tamano_bytes?: number;
  fecha_documento?: string;
  fecha_carga?: string;
  id_usuario_carga?: Id;
  id_expediente_etapa?: Id;
  version?: number;
  visibilidad_cliente?: boolean;
  active: boolean;
}

export type CreateDocumentoInput = Pick<Documento, 'id_expediente' | 'nombre_archivo'> & {
  id_tipo_documento?: Id;
  titulo?: string;
  url_storage?: string;
  mime_type?: string;
  visibilidad_cliente?: boolean;
};

export type UpdateDocumentoInput = Partial<CreateDocumentoInput>;
