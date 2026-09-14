import { useState, useCallback } from 'react';
import type { Id, Notificacion, CreateNotificacionInput, UpdateNotificacionInput, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface NotificacionesApiClient {
  list(idExpediente?: Id): Promise<ListResponse<Notificacion>>;
  get(id: Id): Promise<Notificacion>;
  create(data: CreateNotificacionInput): Promise<Notificacion>;
  update(id: Id, data: UpdateNotificacionInput): Promise<Notificacion>;
  delete(id: Id): Promise<void>;
  proximasVencer(dias?: number): Promise<Notificacion[]>;
}

export function useNotificaciones(client: NotificacionesApiClient) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [proximasVencer, setProximasVencer] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificaciones = useCallback(async (idExpediente?: Id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.list(idExpediente);
      setNotificaciones(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar notificaciones'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchProximasVencer = useCallback(async (dias?: number) => {
    setError(null);
    try {
      setProximasVencer(await client.proximasVencer(dias));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar notificaciones próximas a vencer'));
    }
  }, [client]);

  const createNotificacion = useCallback(async (data: CreateNotificacionInput) => {
    const created = await client.create(data);
    setNotificaciones((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateNotificacion = useCallback(async (id: Id, data: UpdateNotificacionInput) => {
    const updated = await client.update(id, data);
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  }, [client]);

  const deleteNotificacion = useCallback(async (id: Id) => {
    await client.delete(id);
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, [client]);

  return {
    notificaciones,
    proximasVencer,
    loading,
    error,
    fetchNotificaciones,
    fetchProximasVencer,
    createNotificacion,
    updateNotificacion,
    deleteNotificacion,
  };
}
