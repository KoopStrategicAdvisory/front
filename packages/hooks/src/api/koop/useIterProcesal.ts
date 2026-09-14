import { useState, useCallback } from 'react';
import type {
  Id,
  IterProcesalPlantilla,
  CreateIterProcesalPlantillaInput,
  UpdateIterProcesalPlantillaInput,
  TareaPlantilla,
  CreateTareaPlantillaInput,
  UpdateTareaPlantillaInput,
} from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface IterProcesalApiClient {
  list(idCombo?: Id): Promise<IterProcesalPlantilla[]>;
  get(id: Id): Promise<IterProcesalPlantilla>;
  create(data: CreateIterProcesalPlantillaInput): Promise<IterProcesalPlantilla>;
  update(id: Id, data: UpdateIterProcesalPlantillaInput): Promise<IterProcesalPlantilla>;
  delete(id: Id): Promise<void>;
  listTareas(iterId: Id): Promise<TareaPlantilla[]>;
  createTarea(iterId: Id, data: CreateTareaPlantillaInput): Promise<TareaPlantilla>;
  updateTarea(iterId: Id, tareaId: Id, data: UpdateTareaPlantillaInput): Promise<TareaPlantilla>;
  deleteTarea(iterId: Id, tareaId: Id): Promise<void>;
}

export function useIterProcesal(client: IterProcesalApiClient) {
  const [plantillas, setPlantillas] = useState<IterProcesalPlantilla[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<IterProcesalPlantilla | null>(null);
  const [tareasPlantilla, setTareasPlantilla] = useState<TareaPlantilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlantillas = useCallback(async (idCombo?: Id) => {
    setLoading(true);
    setError(null);
    try {
      setPlantillas(await client.list(idCombo));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar plantillas de iter procesal'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const selectPlantilla = useCallback(async (id: Id) => {
    setLoading(true);
    setError(null);
    try {
      setSelectedPlantilla(await client.get(id));
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar plantilla'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createPlantilla = useCallback(async (data: CreateIterProcesalPlantillaInput) => {
    const created = await client.create(data);
    setPlantillas((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updatePlantilla = useCallback(async (id: Id, data: UpdateIterProcesalPlantillaInput) => {
    const updated = await client.update(id, data);
    setPlantillas((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (selectedPlantilla?.id === id) setSelectedPlantilla(updated);
    return updated;
  }, [client, selectedPlantilla]);

  const deletePlantilla = useCallback(async (id: Id) => {
    await client.delete(id);
    setPlantillas((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlantilla?.id === id) setSelectedPlantilla(null);
  }, [client, selectedPlantilla]);

  const fetchTareasPlantilla = useCallback(async (iterId: Id) => {
    setError(null);
    try {
      const data = await client.listTareas(iterId);
      setTareasPlantilla(data);
      return data;
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar tareas de la plantilla'));
      return [];
    }
  }, [client]);

  const createTareaPlantilla = useCallback(async (iterId: Id, data: CreateTareaPlantillaInput) => {
    const created = await client.createTarea(iterId, data);
    setTareasPlantilla((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateTareaPlantilla = useCallback(
    async (iterId: Id, tareaId: Id, data: UpdateTareaPlantillaInput) => {
      const updated = await client.updateTarea(iterId, tareaId, data);
      setTareasPlantilla((prev) => prev.map((t) => (t.id === tareaId ? updated : t)));
      return updated;
    },
    [client],
  );

  const deleteTareaPlantilla = useCallback(async (iterId: Id, tareaId: Id) => {
    await client.deleteTarea(iterId, tareaId);
    setTareasPlantilla((prev) => prev.filter((t) => t.id !== tareaId));
  }, [client]);

  return {
    plantillas,
    selectedPlantilla,
    tareasPlantilla,
    loading,
    error,
    fetchPlantillas,
    selectPlantilla,
    createPlantilla,
    updatePlantilla,
    deletePlantilla,
    fetchTareasPlantilla,
    createTareaPlantilla,
    updateTareaPlantilla,
    deleteTareaPlantilla,
  };
}
