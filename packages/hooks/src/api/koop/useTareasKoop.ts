import { useState, useCallback } from 'react';
import type { Id, Tarea, CreateTareaInput, UpdateTareaInput, ListTareasParams, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

/** El spec v2 no expone `/catalogos/estados-tarea` ni `/catalogos/prioridades` —
 * no hay endpoint del que listar los valores válidos de `id_estado_tarea`/`id_prioridad`.
 * Los comentarios de tarea tampoco tienen endpoint propio bajo `/tareas`; viven en
 * `useColaboracion` (`/colaboracion/comentarios` con `tipo_entidad: 'tarea'`). */
export interface TareasKoopApiClient {
  list(params?: ListTareasParams): Promise<ListResponse<Tarea>>;
  get(id: Id): Promise<Tarea>;
  create(data: CreateTareaInput): Promise<Tarea>;
  update(id: Id, data: UpdateTareaInput): Promise<Tarea>;
  delete(id: Id): Promise<void>;
}

interface UseTareasKoopOptions {
  initialFilters?: Partial<ListTareasParams>;
}

export function useTareasKoop(client: TareasKoopApiClient, options: UseTareasKoopOptions = {}) {
  const { initialFilters = {} } = options;

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTareas = useCallback(async (params?: Partial<ListTareasParams>) => {
    setLoading(true);
    setError(null);
    try {
      const merged = { ...initialFilters, ...params };
      const data = await client.list(merged);
      setTareas(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar tareas'));
    } finally {
      setLoading(false);
    }
  }, [client, initialFilters]);

  const createTarea = useCallback(async (data: CreateTareaInput) => {
    setLoading(true);
    setError(null);
    try {
      const created = await client.create(data);
      setTareas((prev) => [...prev, created]);
      setTotal((prev) => prev + 1);
      return created;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al crear tarea'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const updateTarea = useCallback(async (id: Id, data: UpdateTareaInput) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await client.update(id, data);
      setTareas((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al actualizar tarea'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const deleteTarea = useCallback(async (id: Id) => {
    setLoading(true);
    setError(null);
    try {
      await client.delete(id);
      setTareas((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al eliminar tarea'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    tareas,
    loading,
    error,
    total,
    fetchTareas,
    createTarea,
    updateTarea,
    deleteTarea,
  };
}
