import type { Id } from './shared';

export interface Tablero {
  id: Id;
  nombre: string;
  descripcion?: string;
  tipo_granularidad?: string;
  tipo_ambito?: string;
  id_expediente?: Id;
  id_usuario_propietario?: Id;
  es_publico?: boolean;
  active: boolean;
}

export type CreateTableroInput = Pick<Tablero, 'nombre'> & {
  descripcion?: string;
  id_expediente?: Id;
  es_publico?: boolean;
};

export interface ColumnaKanban {
  id: Id;
  id_tablero: Id;
  nombre: string;
  orden: number;
  color?: string;
  wip_limit?: number;
  es_inicial?: boolean;
  es_final?: boolean;
  active: boolean;
}

export type CreateColumnaInput = Pick<ColumnaKanban, 'nombre' | 'orden'> & { color?: string };
export type UpdateColumnaInput = Partial<CreateColumnaInput>;

// Minuscula: asi lo exige el CHECK real de la columna en Postgres
// (tarea_kanban_position.tipo_entidad IN ('tarea','etapa')) — el codigo
// anterior usaba 'TAREA'/'ETAPA' en mayuscula, que la base siempre rechazaba.
export type TipoEntidadKanban = 'tarea' | 'etapa';

/** Una posición referencia una tarea O una etapa de expediente, nunca ambas */
export type KanbanPosicion =
  | {
      id: Id;
      id_tablero: Id;
      id_columna: Id;
      tipo_entidad: 'tarea';
      id_tarea: Id;
      orden_vertical?: number;
      active: boolean;
    }
  | {
      id: Id;
      id_tablero: Id;
      id_columna: Id;
      tipo_entidad: 'etapa';
      id_expediente_etapa: Id;
      orden_vertical?: number;
      active: boolean;
    };

/** Escrito como unión explícita (no `Omit<KanbanPosicion, ...>`) porque `Omit` sobre una unión
 * discriminada colapsa a las propiedades comunes y pierde el discriminante `tipo_entidad`. */
export type CreateKanbanPosicionInput =
  | { id_tablero: Id; id_columna: Id; tipo_entidad: 'tarea'; id_tarea: Id; orden_vertical?: number }
  | { id_tablero: Id; id_columna: Id; tipo_entidad: 'etapa'; id_expediente_etapa: Id; orden_vertical?: number };

export interface TableroConColumnas extends Tablero {
  columnas: ColumnaKanban[];
}

export interface ColumnaConTarjetas extends ColumnaKanban {
  tarjetas: KanbanPosicion[];
}
