import { useState, useCallback } from 'react';
import type {
  Id,
  Etiqueta,
  CreateEtiquetaInput,
  AsignarEtiquetaInput,
  Comentario,
  CreateComentarioInput,
  UpdateComentarioInput,
  Adjunto,
  CreateAdjuntoInput,
  Dependencia,
  CreateDependenciaInput,
  ListResponse,
} from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface ListComentariosParams {
  tipo_entidad?: string;
  id_tarea?: Id;
}

export interface ListAdjuntosParams {
  tipo_entidad?: string;
  id_tarea?: Id;
}

export interface ColaboracionApiClient {
  listEtiquetas(): Promise<ListResponse<Etiqueta>>;
  createEtiqueta(data: CreateEtiquetaInput): Promise<Etiqueta>;
  updateEtiqueta(id: Id, data: Partial<CreateEtiquetaInput>): Promise<Etiqueta>;
  deleteEtiqueta(id: Id): Promise<void>;
  asignarEtiqueta(data: AsignarEtiquetaInput): Promise<void>;
  listComentarios(params?: ListComentariosParams): Promise<ListResponse<Comentario>>;
  createComentario(data: CreateComentarioInput): Promise<Comentario>;
  updateComentario(id: Id, data: UpdateComentarioInput): Promise<Comentario>;
  deleteComentario(id: Id): Promise<void>;
  listReplies(id: Id): Promise<ListResponse<Comentario>>;
  addMencion(id: Id, idUsuario: Id): Promise<void>;
  removeMencion(id: Id, idUsuario: Id): Promise<void>;
  listAdjuntos(params?: ListAdjuntosParams): Promise<ListResponse<Adjunto>>;
  createAdjunto(data: CreateAdjuntoInput): Promise<Adjunto>;
  deleteAdjunto(id: Id): Promise<void>;
  listDependencias(idTareaOrigen?: Id): Promise<ListResponse<Dependencia>>;
  createDependencia(data: CreateDependenciaInput): Promise<Dependencia>;
  deleteDependencia(id: Id): Promise<void>;
}

export function useColaboracion(client: ColaboracionApiClient) {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEtiquetas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listEtiquetas();
      setEtiquetas(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar etiquetas'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createEtiqueta = useCallback(async (data: CreateEtiquetaInput) => {
    const created = await client.createEtiqueta(data);
    setEtiquetas((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateEtiqueta = useCallback(async (id: Id, data: Partial<CreateEtiquetaInput>) => {
    const updated = await client.updateEtiqueta(id, data);
    setEtiquetas((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, [client]);

  const deleteEtiqueta = useCallback(async (id: Id) => {
    await client.deleteEtiqueta(id);
    setEtiquetas((prev) => prev.filter((e) => e.id !== id));
  }, [client]);

  const asignarEtiqueta = useCallback(async (data: AsignarEtiquetaInput) => {
    await client.asignarEtiqueta(data);
  }, [client]);

  const fetchComentarios = useCallback(async (params?: ListComentariosParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listComentarios(params);
      setComentarios(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar comentarios'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createComentario = useCallback(async (data: CreateComentarioInput) => {
    const created = await client.createComentario(data);
    setComentarios((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateComentario = useCallback(async (id: Id, data: UpdateComentarioInput) => {
    const updated = await client.updateComentario(id, data);
    setComentarios((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, [client]);

  const deleteComentario = useCallback(async (id: Id) => {
    await client.deleteComentario(id);
    setComentarios((prev) => prev.filter((c) => c.id !== id));
  }, [client]);

  const fetchReplies = useCallback(async (id: Id) => {
    const data = await client.listReplies(id);
    return data.items ?? [];
  }, [client]);

  const addMencion = useCallback(async (id: Id, idUsuario: Id) => {
    await client.addMencion(id, idUsuario);
  }, [client]);

  const removeMencion = useCallback(async (id: Id, idUsuario: Id) => {
    await client.removeMencion(id, idUsuario);
  }, [client]);

  const fetchAdjuntos = useCallback(async (params?: ListAdjuntosParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listAdjuntos(params);
      setAdjuntos(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar adjuntos'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createAdjunto = useCallback(async (data: CreateAdjuntoInput) => {
    const created = await client.createAdjunto(data);
    setAdjuntos((prev) => [...prev, created]);
    return created;
  }, [client]);

  const deleteAdjunto = useCallback(async (id: Id) => {
    await client.deleteAdjunto(id);
    setAdjuntos((prev) => prev.filter((a) => a.id !== id));
  }, [client]);

  const fetchDependencias = useCallback(async (idTareaOrigen?: Id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listDependencias(idTareaOrigen);
      setDependencias(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar dependencias'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createDependencia = useCallback(async (data: CreateDependenciaInput) => {
    const created = await client.createDependencia(data);
    setDependencias((prev) => [...prev, created]);
    return created;
  }, [client]);

  const deleteDependencia = useCallback(async (id: Id) => {
    await client.deleteDependencia(id);
    setDependencias((prev) => prev.filter((d) => d.id !== id));
  }, [client]);

  return {
    etiquetas,
    comentarios,
    adjuntos,
    dependencias,
    loading,
    error,
    fetchEtiquetas,
    createEtiqueta,
    updateEtiqueta,
    deleteEtiqueta,
    asignarEtiqueta,
    fetchComentarios,
    createComentario,
    updateComentario,
    deleteComentario,
    fetchReplies,
    addMencion,
    removeMencion,
    fetchAdjuntos,
    createAdjunto,
    deleteAdjunto,
    fetchDependencias,
    createDependencia,
    deleteDependencia,
  };
}
