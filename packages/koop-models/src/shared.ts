/** Identificador entero autogenerado por el backend (nunca un string tipo Mongo _id) */
export type Id = number;

/** Envelope normalizado de listado; la capa de adaptadores (apps/koop/src/api) mapea
 * tanto `{ data, total }` como arreglos planos del backend a esta forma. */
export interface ListResponse<T> {
  items: T[];
  total: number;
}
