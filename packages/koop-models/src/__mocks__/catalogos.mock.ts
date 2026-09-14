import type { CatalogItem, Role, EtapaProcesal, TipoProcCombo, Prioridad, TipoNotificacion } from '../catalogos';

export const mockCatalogItem = (overrides?: Partial<CatalogItem>): CatalogItem => ({
  id: 1,
  nombre: 'Proceso Laboral',
  active: true,
  ...overrides,
});

export const mockRole = (overrides?: Partial<Role>): Role => ({
  id: 1,
  nombre: 'admin',
  descripcion: 'Administrador del sistema',
  active: true,
  ...overrides,
});

/** `TipoProceso` es un alias de `CatalogItem` — se reutiliza el mismo mock */
export const mockTipoProceso = mockCatalogItem;

export const mockEtapaProcesal = (overrides?: Partial<EtapaProcesal>): EtapaProcesal => ({
  id: 1,
  id_tipo_proceso: 1,
  nombre_etapa: 'Admisión de la demanda',
  descripcion: 'El juez admite o inadmite la demanda',
  fundamento_legal: 'Art. 28 CPTSS',
  active: true,
  ...overrides,
});

export const mockTipoProcCombo = (overrides?: Partial<TipoProcCombo>): TipoProcCombo => ({
  id: 1,
  id_tipo_proceso: 1,
  id_subtipo_proceso: 1,
  id_tipo_pretension: 1,
  active: true,
  ...overrides,
});

export const mockPrioridad = (overrides?: Partial<Prioridad>): Prioridad => ({
  id: 1,
  nombre: 'Alta',
  nivel: 1,
  active: true,
  ...overrides,
});

export const mockTipoNotificacion = (overrides?: Partial<TipoNotificacion>): TipoNotificacion => ({
  id: 1,
  nombre: 'Notificación Personal',
  fundamento_legal: 'Art. 291 CGP',
  dias_surtimiento: 0,
  active: true,
  ...overrides,
});
