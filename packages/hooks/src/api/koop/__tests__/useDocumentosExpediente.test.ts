import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockDocumento } from '@repo/koop-models/__mocks__';

import { useDocumentosExpediente } from '../useDocumentosExpediente';
import type { DocumentosExpedienteApiClient } from '../useDocumentosExpediente';

const makeMockClient = (overrides?: Partial<DocumentosExpedienteApiClient>): DocumentosExpedienteApiClient => ({
  list: vi.fn().mockResolvedValue({ items: [mockDocumento()], total: 1 }),
  get: vi.fn().mockResolvedValue(mockDocumento()),
  create: vi.fn().mockResolvedValue(mockDocumento({ id: 999, nombre_archivo: 'contrato.pdf' })),
  update: vi.fn().mockResolvedValue(mockDocumento({ visibilidad_cliente: false })),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useDocumentosExpediente', () => {
  let client: DocumentosExpedienteApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('fetchDocumentos carga los documentos filtrados por expediente', async () => {
    const { result } = renderHook(() => useDocumentosExpediente(client));
    await act(() => result.current.fetchDocumentos({ id_expediente: 1 }));
    expect(client.list).toHaveBeenCalledWith({ id_expediente: 1 });
    expect(result.current.documentos).toHaveLength(1);
  });

  it('createDocumento agrega el documento creado', async () => {
    const { result } = renderHook(() => useDocumentosExpediente(client));
    await act(() =>
      result.current.createDocumento({ id_expediente: 1, nombre_archivo: 'contrato.pdf' }),
    );
    expect(result.current.documentos.some((d) => d.id === 999)).toBe(true);
  });

  it('updateDocumento actualiza el registro in-place', async () => {
    client = makeMockClient({ list: vi.fn().mockResolvedValue({ items: [mockDocumento()], total: 1 }) });
    const { result } = renderHook(() => useDocumentosExpediente(client));
    await act(() => result.current.fetchDocumentos());
    await act(() => result.current.updateDocumento(1, { visibilidad_cliente: false }));
    expect(result.current.documentos[0].visibilidad_cliente).toBe(false);
  });

  it('deleteDocumento elimina el registro de la lista', async () => {
    client = makeMockClient({ list: vi.fn().mockResolvedValue({ items: [mockDocumento()], total: 1 }) });
    const { result } = renderHook(() => useDocumentosExpediente(client));
    await act(() => result.current.fetchDocumentos());
    await act(() => result.current.deleteDocumento(1));
    expect(result.current.documentos).toHaveLength(0);
  });
});
