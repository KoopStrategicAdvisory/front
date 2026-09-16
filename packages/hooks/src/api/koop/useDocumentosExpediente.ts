import { useState, useCallback } from 'react';
import type { Id, Documento, CreateDocumentoInput, UpdateDocumentoInput, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface ListDocumentosParams {
  id_expediente?: Id;
  visibilidad_cliente?: boolean;
}

/** Metadata formal de documentos de expediente (`/documentos`) — distinto del vault S3
 * de `useMiExpediente`, que queda fuera de este esfuerzo de migración. */
export interface DocumentosExpedienteApiClient {
  list(params?: ListDocumentosParams): Promise<ListResponse<Documento>>;
  get(id: Id): Promise<Documento>;
  create(data: CreateDocumentoInput, onUploadProgress?: (percent: number | null) => void): Promise<Documento>;
  update(id: Id, data: UpdateDocumentoInput): Promise<Documento>;
  delete(id: Id): Promise<void>;
}

export function useDocumentosExpediente(client: DocumentosExpedienteApiClient) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentos = useCallback(async (params?: ListDocumentosParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.list(params);
      setDocumentos(data.items ?? []);
    } catch (err: unknown) {
      setError(errMsg(err, 'Error al cargar documentos'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createDocumento = useCallback(async (data: CreateDocumentoInput, onUploadProgress?: (percent: number | null) => void) => {
    const created = await client.create(data, onUploadProgress);
    setDocumentos((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateDocumento = useCallback(async (id: Id, data: UpdateDocumentoInput) => {
    const updated = await client.update(id, data);
    setDocumentos((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, [client]);

  const deleteDocumento = useCallback(async (id: Id) => {
    await client.delete(id);
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
  }, [client]);

  return {
    documentos,
    loading,
    error,
    fetchDocumentos,
    createDocumento,
    updateDocumento,
    deleteDocumento,
  };
}
