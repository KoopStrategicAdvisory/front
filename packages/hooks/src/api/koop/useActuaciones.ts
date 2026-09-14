import { useState, useCallback } from 'react';
import type { Id, Actuacion, CreateActuacionInput, UpdateActuacionInput, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface ActuacionesApiClient {
  list(expedienteId: Id, params?: Record<string, unknown>): Promise<ListResponse<Actuacion>>;
  create(data: CreateActuacionInput): Promise<Actuacion>;
  update(id: Id, data: UpdateActuacionInput): Promise<Actuacion>;
  delete(id: Id): Promise<void>;
}

export function useActuaciones(client: ActuacionesApiClient, expedienteId: Id) {
  const [actuaciones, setActuaciones] = useState<Actuacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActuaciones = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.list(expedienteId, params ?? {});
      setActuaciones(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar actuaciones'));
    } finally {
      setLoading(false);
    }
  }, [client, expedienteId]);

  const createActuacion = useCallback(async (data: CreateActuacionInput) => {
    setLoading(true);
    setError(null);
    try {
      const created = await client.create(data);
      setActuaciones((prev) => [...prev, created]);
      return created;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al crear actuación'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const updateActuacion = useCallback(async (id: Id, data: UpdateActuacionInput) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await client.update(id, data);
      setActuaciones((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al actualizar actuación'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const deleteActuacion = useCallback(async (id: Id) => {
    setLoading(true);
    setError(null);
    try {
      await client.delete(id);
      setActuaciones((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al eliminar actuación'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    actuaciones,
    loading,
    error,
    fetchActuaciones,
    createActuacion,
    updateActuacion,
    deleteActuacion,
  };
}
