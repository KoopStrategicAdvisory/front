import { useState, useCallback } from 'react';
import type { Id, Tablero, ColumnaKanban, KanbanPosicion, CreateTableroInput, CreateKanbanPosicionInput } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface KanbanApiClient {
  getTablero(id: Id): Promise<Tablero>;
  listColumnas(tableroId: Id): Promise<ColumnaKanban[]>;
  listPosiciones(tableroId: Id): Promise<KanbanPosicion[]>;
  crearPosicion(data: CreateKanbanPosicionInput): Promise<KanbanPosicion>;
  eliminarPosicion(id: Id): Promise<void>;
  asignarUsuario(tableroId: Id, idUsuario: Id): Promise<void>;
  createTablero(data: CreateTableroInput): Promise<Tablero>;
}

export function useKanban(client: KanbanApiClient) {
  const [tablero, setTablero] = useState<Tablero | null>(null);
  const [columnas, setColumnas] = useState<ColumnaKanban[]>([]);
  const [posiciones, setPosiciones] = useState<KanbanPosicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTablero = useCallback(async (tableroId: Id) => {
    setLoading(true);
    setError(null);
    try {
      const [t, cols, poses] = await Promise.all([
        client.getTablero(tableroId),
        client.listColumnas(tableroId),
        client.listPosiciones(tableroId),
      ]);
      setTablero(t);
      setColumnas(cols);
      setPosiciones(poses);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar tablero'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const getTarjetasPorColumna = useCallback(
    (columnaId: Id) => posiciones.filter((p) => p.id_columna === columnaId),
    [posiciones],
  );

  /** El backend no soporta "mover" atómicamente: se elimina la posición actual y se crea una nueva.
   * Si `eliminarPosicion` tiene éxito pero `crearPosicion` falla, la tarjeta queda sin posición
   * (riesgo aceptado — documentado en el plan, no se resuelve aquí con lógica compensatoria). */
  const moverTarea = useCallback(async (tareaId: Id, nuevaColumnaId: Id) => {
    if (!tablero) return;
    const prevPosiciones = posiciones;
    const actual = posiciones.find((p) => p.tipo_entidad === 'TAREA' && p.id_tarea === tareaId);
    const ordenVertical = posiciones.filter((p) => p.id_columna === nuevaColumnaId).length;

    setError(null);
    try {
      if (actual) await client.eliminarPosicion(actual.id);
      const creada = await client.crearPosicion({
        id_tablero: tablero.id,
        id_columna: nuevaColumnaId,
        tipo_entidad: 'TAREA',
        id_tarea: tareaId,
        orden_vertical: ordenVertical,
      });
      setPosiciones((prev) => [...prev.filter((p) => p.id !== actual?.id), creada]);
      return creada;
    } catch (err: unknown) {
      setPosiciones(prevPosiciones);
      setError(errMsg(err, 'Error al mover tarea'));
      throw err;
    }
  }, [client, tablero, posiciones]);

  const asignarUsuario = useCallback(async (idUsuario: Id) => {
    if (!tablero) return;
    setError(null);
    try {
      await client.asignarUsuario(tablero.id, idUsuario);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al asignar usuario al tablero'));
      throw err;
    }
  }, [client, tablero]);

  const createTablero = useCallback(async (data: CreateTableroInput) => {
    setLoading(true);
    setError(null);
    try {
      const created = await client.createTablero(data);
      setTablero(created);
      return created;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al crear tablero'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    tablero,
    columnas,
    posiciones,
    loading,
    error,
    loadTablero,
    getTarjetasPorColumna,
    moverTarea,
    asignarUsuario,
    createTablero,
  };
}
