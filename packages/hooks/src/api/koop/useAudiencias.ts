import { useState, useCallback } from 'react';
import type { Id, Audiencia, CreateAudienciaInput, UpdateAudienciaInput, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface AudienciasApiClient {
  list(expedienteId: Id): Promise<ListResponse<Audiencia>>;
  create(data: CreateAudienciaInput): Promise<Audiencia>;
  update(id: Id, data: UpdateAudienciaInput): Promise<Audiencia>;
  delete(id: Id): Promise<void>;
}

export function useAudiencias(client: AudienciasApiClient, expedienteId: Id) {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAudiencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.list(expedienteId);
      setAudiencias(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar audiencias'));
    } finally {
      setLoading(false);
    }
  }, [client, expedienteId]);

  const createAudiencia = useCallback(async (data: CreateAudienciaInput) => {
    setLoading(true);
    setError(null);
    try {
      const created = await client.create(data);
      setAudiencias((prev) => [...prev, created]);
      return created;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al crear audiencia'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const updateAudiencia = useCallback(async (id: Id, data: UpdateAudienciaInput) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await client.update(id, data);
      setAudiencias((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al actualizar audiencia'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const deleteAudiencia = useCallback(async (id: Id) => {
    setLoading(true);
    setError(null);
    try {
      await client.delete(id);
      setAudiencias((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al eliminar audiencia'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    audiencias,
    loading,
    error,
    fetchAudiencias,
    createAudiencia,
    updateAudiencia,
    deleteAudiencia,
  };
}
