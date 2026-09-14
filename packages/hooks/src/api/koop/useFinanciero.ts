import { useState, useCallback } from 'react';
import type {
  Id,
  Honorario,
  CreateHonorarioInput,
  UpdateHonorarioInput,
  Pago,
  CreatePagoInput,
  UpdatePagoInput,
  GastoProceso,
  CreateGastoInput,
  UpdateGastoInput,
  ResumenFinanciero,
  ListResponse,
} from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface FinancieroApiClient {
  listHonorarios(idExpediente: Id): Promise<ListResponse<Honorario>>;
  createHonorario(data: CreateHonorarioInput): Promise<Honorario>;
  updateHonorario(id: Id, data: UpdateHonorarioInput): Promise<Honorario>;
  deleteHonorario(id: Id): Promise<void>;
  listPagos(idExpediente: Id, idHonorario?: Id): Promise<ListResponse<Pago>>;
  createPago(data: CreatePagoInput): Promise<Pago>;
  updatePago(id: Id, data: UpdatePagoInput): Promise<Pago>;
  listGastos(idExpediente: Id): Promise<ListResponse<GastoProceso>>;
  createGasto(data: CreateGastoInput): Promise<GastoProceso>;
  updateGasto(id: Id, data: UpdateGastoInput): Promise<GastoProceso>;
  deleteGasto(id: Id): Promise<void>;
  getResumen(idExpediente: Id): Promise<ResumenFinanciero>;
}

export function useFinanciero(client: FinancieroApiClient) {
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [gastos, setGastos] = useState<GastoProceso[]>([]);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHonorarios = useCallback(async (idExpediente: Id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listHonorarios(idExpediente);
      setHonorarios(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar honorarios'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createHonorario = useCallback(async (data: CreateHonorarioInput) => {
    const created = await client.createHonorario(data);
    setHonorarios((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateHonorario = useCallback(async (id: Id, data: UpdateHonorarioInput) => {
    const updated = await client.updateHonorario(id, data);
    setHonorarios((prev) => prev.map((h) => (h.id === id ? updated : h)));
    return updated;
  }, [client]);

  const deleteHonorario = useCallback(async (id: Id) => {
    await client.deleteHonorario(id);
    setHonorarios((prev) => prev.filter((h) => h.id !== id));
  }, [client]);

  const fetchPagos = useCallback(async (idExpediente: Id, idHonorario?: Id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listPagos(idExpediente, idHonorario);
      setPagos(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar pagos'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createPago = useCallback(async (data: CreatePagoInput) => {
    const created = await client.createPago(data);
    setPagos((prev) => [...prev, created]);
    return created;
  }, [client]);

  /** No hay DELETE para pagos en el spec — solo GET/PUT */
  const updatePago = useCallback(async (id: Id, data: UpdatePagoInput) => {
    const updated = await client.updatePago(id, data);
    setPagos((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, [client]);

  const fetchGastos = useCallback(async (idExpediente: Id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listGastos(idExpediente);
      setGastos(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar gastos'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createGasto = useCallback(async (data: CreateGastoInput) => {
    const created = await client.createGasto(data);
    setGastos((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateGasto = useCallback(async (id: Id, data: UpdateGastoInput) => {
    const updated = await client.updateGasto(id, data);
    setGastos((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, [client]);

  const deleteGasto = useCallback(async (id: Id) => {
    await client.deleteGasto(id);
    setGastos((prev) => prev.filter((g) => g.id !== id));
  }, [client]);

  const fetchResumen = useCallback(async (idExpediente: Id) => {
    setError(null);
    try {
      setResumen(await client.getResumen(idExpediente));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar resumen financiero'));
    }
  }, [client]);

  return {
    honorarios,
    pagos,
    gastos,
    resumen,
    loading,
    error,
    fetchHonorarios,
    createHonorario,
    updateHonorario,
    deleteHonorario,
    fetchPagos,
    createPago,
    updatePago,
    fetchGastos,
    createGasto,
    updateGasto,
    deleteGasto,
    fetchResumen,
  };
}
