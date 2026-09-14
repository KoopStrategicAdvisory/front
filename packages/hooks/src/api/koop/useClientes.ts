import { useState, useCallback, useEffect } from 'react';
import type { Id, Cliente, CreateClienteInput, UpdateClienteInput, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface ListClientesParams {
  search?: string;
  limit?: number;
  offset?: number;
}

/** Reemplaza a `useActiveClients` (`/admin/clients/*`). El nuevo `/clientes` no tiene
 * equivalente para "asignar admin a cliente" ni para el vault de documentos S3 —
 * ambos quedan fuera de este hook (ver gap documentado en el plan). */
export interface ClientesApiClient {
  list(params?: ListClientesParams): Promise<ListResponse<Cliente>>;
  get(id: Id): Promise<Cliente>;
  create(data: CreateClienteInput): Promise<Cliente>;
  update(id: Id, data: UpdateClienteInput): Promise<Cliente>;
  delete(id: Id): Promise<void>;
}

interface UseClientesOptions {
  autoFetch?: boolean;
}

export function useClientes(client: ClientesApiClient, options: UseClientesOptions = {}) {
  const { autoFetch = true } = options;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchClientes = useCallback(async (params?: ListClientesParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.list(params);
      setClientes(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      setError(errMsg(err, 'No se pudo cargar la lista de clientes'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (autoFetch) fetchClientes();
  }, [autoFetch, fetchClientes]);

  const createCliente = useCallback(async (data: CreateClienteInput) => {
    const created = await client.create(data);
    setClientes((prev) => [...prev, created]);
    setTotal((prev) => prev + 1);
    return created;
  }, [client]);

  const updateCliente = useCallback(async (id: Id, data: UpdateClienteInput) => {
    const updated = await client.update(id, data);
    setClientes((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, [client]);

  const deleteCliente = useCallback(async (id: Id) => {
    await client.delete(id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  }, [client]);

  return {
    clientes,
    loading,
    error,
    total,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
