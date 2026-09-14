import type { Documento } from '../documento';

const NOW = new Date().toISOString();

export const mockDocumento = (overrides?: Partial<Documento>): Documento => ({
  id: 1,
  id_expediente: 1,
  id_tipo_documento: 1,
  nombre_archivo: 'demanda.pdf',
  titulo: 'Demanda ordinaria laboral',
  url_storage: 's3://koop-docs/exp-1/demanda.pdf',
  mime_type: 'application/pdf',
  tamano_bytes: 204800,
  fecha_carga: NOW,
  id_usuario_carga: 2,
  version: 1,
  visibilidad_cliente: true,
  active: true,
  ...overrides,
});
