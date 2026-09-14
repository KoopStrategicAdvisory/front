import type { Id } from './shared';

/** Forma genérica usada por catálogos simples y por referencias embebidas (p.ej. `User.roles`) */
export interface CatalogItem {
  id: Id;
  nombre: string;
  active?: boolean;
}

export interface Role {
  id: Id;
  nombre: string;
  descripcion?: string;
  active: boolean;
}

export type CreateRoleInput = Pick<Role, 'nombre'> & { descripcion?: string };
export type UpdateRoleInput = Partial<CreateRoleInput>;

/** `GET/POST /catalogos/tipo-proceso` no tiene schema propio en el spec — responde con la forma genérica `CatalogItem` */
export type TipoProceso = CatalogItem;
export type CreateTipoProcesoInput = { nombre: string };

export interface EtapaProcesal {
  id: Id;
  id_tipo_proceso: Id;
  nombre_etapa: string;
  descripcion?: string;
  fundamento_legal?: string;
  active: boolean;
}

export type CreateEtapaProcesalInput = Pick<EtapaProcesal, 'id_tipo_proceso' | 'nombre_etapa'> & {
  descripcion?: string;
  fundamento_legal?: string;
};
export type UpdateEtapaProcesalInput = Partial<CreateEtapaProcesalInput>;

/** Combinación tipo de proceso + subtipo + pretensión. El backend solo expone los FK enteros
 * (no hay endpoint propio para subtipo-proceso ni tipo-pretensión) — para mostrar nombres en UI
 * hay que cruzar client-side contra `/catalogos/tipo-proceso` y las demás fuentes disponibles. */
export interface TipoProcCombo {
  id: Id;
  id_tipo_proceso: Id;
  id_subtipo_proceso: Id;
  id_tipo_pretension: Id;
  active: boolean;
}

export type CreateTipoProcComboInput = Pick<
  TipoProcCombo,
  'id_tipo_proceso' | 'id_subtipo_proceso' | 'id_tipo_pretension'
>;

/** Sin endpoint de listado propio en el spec v2 — solo se referencia por `id_prioridad` en Tarea/TareaPlantilla */
export interface Prioridad {
  id: Id;
  nombre: string;
  nivel?: number;
  active: boolean;
}

/** Sin endpoint de listado propio en el spec v2 — solo se referencia por `id_tipo_notificacion` en Notificacion */
export interface TipoNotificacion {
  id: Id;
  nombre: string;
  fundamento_legal?: string;
  dias_surtimiento?: number;
  descripcion?: string;
  active: boolean;
}
