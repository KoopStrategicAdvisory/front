import { useState, useCallback } from 'react';
import type {
  Id,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  TipoProceso,
  CreateTipoProcesoInput,
  EtapaProcesal,
  CreateEtapaProcesalInput,
  UpdateEtapaProcesalInput,
  TipoProcCombo,
  CreateTipoProcComboInput,
} from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface CatalogosApiClient {
  listRoles(): Promise<Role[]>;
  createRole(data: CreateRoleInput): Promise<Role>;
  updateRole(id: Id, data: UpdateRoleInput): Promise<Role>;
  deleteRole(id: Id): Promise<void>;
  listTiposProceso(): Promise<TipoProceso[]>;
  createTipoProceso(data: CreateTipoProcesoInput): Promise<TipoProceso>;
  updateTipoProceso(id: Id, data: CreateTipoProcesoInput): Promise<TipoProceso>;
  deleteTipoProceso(id: Id): Promise<void>;
  listEtapasProcesales(idTipoProceso?: Id): Promise<EtapaProcesal[]>;
  createEtapaProcesal(data: CreateEtapaProcesalInput): Promise<EtapaProcesal>;
  updateEtapaProcesal(id: Id, data: UpdateEtapaProcesalInput): Promise<EtapaProcesal>;
  deleteEtapaProcesal(id: Id): Promise<void>;
  listTipoProcCombo(): Promise<TipoProcCombo[]>;
  createTipoProcCombo(data: CreateTipoProcComboInput): Promise<TipoProcCombo>;
  deleteTipoProcCombo(id: Id): Promise<void>;
}

export function useCatalogos(client: CatalogosApiClient) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [tiposProceso, setTiposProceso] = useState<TipoProceso[]>([]);
  const [etapasProcesales, setEtapasProcesales] = useState<EtapaProcesal[]>([]);
  const [combos, setCombos] = useState<TipoProcCombo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await client.listRoles());
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar roles'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createRole = useCallback(async (data: CreateRoleInput) => {
    const created = await client.createRole(data);
    setRoles((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateRole = useCallback(async (id: Id, data: UpdateRoleInput) => {
    const updated = await client.updateRole(id, data);
    setRoles((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, [client]);

  const deleteRole = useCallback(async (id: Id) => {
    await client.deleteRole(id);
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }, [client]);

  const fetchTiposProceso = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTiposProceso(await client.listTiposProceso());
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar tipos de proceso'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createTipoProceso = useCallback(async (data: CreateTipoProcesoInput) => {
    const created = await client.createTipoProceso(data);
    setTiposProceso((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateTipoProceso = useCallback(async (id: Id, data: CreateTipoProcesoInput) => {
    const updated = await client.updateTipoProceso(id, data);
    setTiposProceso((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, [client]);

  const deleteTipoProceso = useCallback(async (id: Id) => {
    await client.deleteTipoProceso(id);
    setTiposProceso((prev) => prev.filter((t) => t.id !== id));
  }, [client]);

  const fetchEtapasProcesales = useCallback(async (idTipoProceso?: Id) => {
    setLoading(true);
    setError(null);
    try {
      setEtapasProcesales(await client.listEtapasProcesales(idTipoProceso));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar etapas procesales'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createEtapaProcesal = useCallback(async (data: CreateEtapaProcesalInput) => {
    const created = await client.createEtapaProcesal(data);
    setEtapasProcesales((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateEtapaProcesal = useCallback(async (id: Id, data: UpdateEtapaProcesalInput) => {
    const updated = await client.updateEtapaProcesal(id, data);
    setEtapasProcesales((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, [client]);

  const deleteEtapaProcesal = useCallback(async (id: Id) => {
    await client.deleteEtapaProcesal(id);
    setEtapasProcesales((prev) => prev.filter((e) => e.id !== id));
  }, [client]);

  const fetchTipoProcCombo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCombos(await client.listTipoProcCombo());
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar combinaciones de proceso'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createTipoProcCombo = useCallback(async (data: CreateTipoProcComboInput) => {
    const created = await client.createTipoProcCombo(data);
    setCombos((prev) => [...prev, created]);
    return created;
  }, [client]);

  const deleteTipoProcCombo = useCallback(async (id: Id) => {
    await client.deleteTipoProcCombo(id);
    setCombos((prev) => prev.filter((c) => c.id !== id));
  }, [client]);

  return {
    roles,
    tiposProceso,
    etapasProcesales,
    combos,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchTiposProceso,
    createTipoProceso,
    updateTipoProceso,
    deleteTipoProceso,
    fetchEtapasProcesales,
    createEtapaProcesal,
    updateEtapaProcesal,
    deleteEtapaProcesal,
    fetchTipoProcCombo,
    createTipoProcCombo,
    deleteTipoProcCombo,
  };
}
