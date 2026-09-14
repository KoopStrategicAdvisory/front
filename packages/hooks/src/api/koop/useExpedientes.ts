import { useState, useCallback, useEffect } from 'react';
import type {
  Id,
  Expediente,
  ExpedienteEtapa,
  CreateExpedienteInput,
  UpdateExpedienteInput,
  ListResponse,
} from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface ListExpedientesParams {
  limit?: number;
  offset?: number;
  search?: string;
  id_cliente?: Id;
  id_estado_proceso?: Id;
}

export interface ExpedientesApiClient {
  list(params?: ListExpedientesParams): Promise<ListResponse<Expediente>>;
  get(id: Id): Promise<Expediente>;
  create(data: CreateExpedienteInput): Promise<Expediente>;
  update(id: Id, data: UpdateExpedienteInput): Promise<Expediente>;
  delete(id: Id): Promise<void>;
  listEtapas(expedienteId: Id): Promise<ListResponse<ExpedienteEtapa>>;
}

interface UseExpedientesOptions {
  autoFetch?: boolean;
}

export function useExpedientes(client: ExpedientesApiClient, options: UseExpedientesOptions = {}) {
  const { autoFetch = false } = options;

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const [etapas, setEtapas] = useState<ExpedienteEtapa[]>([]);

  const fetchExpedientes = useCallback(async (params?: ListExpedientesParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.list(params);
      setExpedientes(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar expedientes'));
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (autoFetch) fetchExpedientes();
  }, [autoFetch, fetchExpedientes]);

  const selectExpediente = useCallback(async (id: Id) => {
    setLoading(true);
    setError(null);
    try {
      const expediente = await client.get(id);
      setSelectedExpediente(expediente);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar expediente'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createExpediente = useCallback(async (data: CreateExpedienteInput) => {
    setLoading(true);
    setError(null);
    try {
      const created = await client.create(data);
      setExpedientes((prev) => [...prev, created]);
      setTotal((prev) => prev + 1);
      return created;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al crear expediente'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const updateExpediente = useCallback(async (id: Id, data: UpdateExpedienteInput) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await client.update(id, data);
      setExpedientes((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (selectedExpediente?.id === id) setSelectedExpediente(updated);
      return updated;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al actualizar expediente'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, selectedExpediente]);

  const deleteExpediente = useCallback(async (id: Id) => {
    setLoading(true);
    setError(null);
    try {
      await client.delete(id);
      setExpedientes((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedExpediente?.id === id) setSelectedExpediente(null);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al eliminar expediente'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, selectedExpediente]);

  const fetchEtapas = useCallback(async (expedienteId: Id) => {
    setError(null);
    try {
      const data = await client.listEtapas(expedienteId);
      const items = data.items ?? [];
      setEtapas(items);
      return data;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar etapas'));
      return { items: [], total: 0 };
    }
  }, [client]);

  return {
    expedientes,
    loading,
    error,
    total,
    selectedExpediente,
    etapas,
    fetchExpedientes,
    selectExpediente,
    createExpediente,
    updateExpediente,
    deleteExpediente,
    fetchEtapas,
  };
}
