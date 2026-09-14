import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockEtiqueta, mockComentario, mockAdjunto, mockDependencia } from '@repo/koop-models/__mocks__';

import { useColaboracion } from '../useColaboracion';
import type { ColaboracionApiClient } from '../useColaboracion';

const makeMockClient = (overrides?: Partial<ColaboracionApiClient>): ColaboracionApiClient => ({
  listEtiquetas: vi.fn().mockResolvedValue({ items: [mockEtiqueta()], total: 1 }),
  createEtiqueta: vi.fn().mockResolvedValue(mockEtiqueta({ id: 999, nombre: 'Prioritario' })),
  updateEtiqueta: vi.fn().mockResolvedValue(mockEtiqueta({ color: '#000000' })),
  deleteEtiqueta: vi.fn().mockResolvedValue(undefined),
  asignarEtiqueta: vi.fn().mockResolvedValue(undefined),
  listComentarios: vi.fn().mockResolvedValue({ items: [mockComentario()], total: 1 }),
  createComentario: vi.fn().mockResolvedValue(mockComentario({ id: 999, contenido: 'Nuevo comentario' })),
  updateComentario: vi.fn().mockResolvedValue(mockComentario({ contenido: 'Editado', editado: true })),
  deleteComentario: vi.fn().mockResolvedValue(undefined),
  listReplies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  addMencion: vi.fn().mockResolvedValue(undefined),
  removeMencion: vi.fn().mockResolvedValue(undefined),
  listAdjuntos: vi.fn().mockResolvedValue({ items: [mockAdjunto()], total: 1 }),
  createAdjunto: vi.fn().mockResolvedValue(mockAdjunto({ id: 999 })),
  deleteAdjunto: vi.fn().mockResolvedValue(undefined),
  listDependencias: vi.fn().mockResolvedValue({ items: [mockDependencia()], total: 1 }),
  createDependencia: vi.fn().mockResolvedValue(mockDependencia({ id: 999 })),
  deleteDependencia: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useColaboracion', () => {
  let client: ColaboracionApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('fetchEtiquetas carga las etiquetas', async () => {
    const { result } = renderHook(() => useColaboracion(client));
    await act(() => result.current.fetchEtiquetas());
    expect(result.current.etiquetas).toHaveLength(1);
  });

  it('fetchComentarios carga comentarios filtrados por tarea', async () => {
    const { result } = renderHook(() => useColaboracion(client));
    await act(() => result.current.fetchComentarios({ tipo_entidad: 'tarea', id_tarea: 1 }));
    expect(client.listComentarios).toHaveBeenCalledWith({ tipo_entidad: 'tarea', id_tarea: 1 });
    expect(result.current.comentarios).toHaveLength(1);
  });

  it('createComentario agrega el comentario creado', async () => {
    const { result } = renderHook(() => useColaboracion(client));
    await act(() => result.current.createComentario({ tipo_entidad: 'tarea', contenido: 'Nuevo comentario' }));
    expect(result.current.comentarios.some((c) => c.id === 999)).toBe(true);
  });

  it('fetchAdjuntos carga los adjuntos', async () => {
    const { result } = renderHook(() => useColaboracion(client));
    await act(() => result.current.fetchAdjuntos({ id_tarea: 1 }));
    expect(result.current.adjuntos).toHaveLength(1);
  });

  it('fetchDependencias carga las dependencias por tarea origen', async () => {
    const { result } = renderHook(() => useColaboracion(client));
    await act(() => result.current.fetchDependencias(1));
    expect(client.listDependencias).toHaveBeenCalledWith(1);
    expect(result.current.dependencias).toHaveLength(1);
  });

  it('deleteDependencia elimina la dependencia de la lista', async () => {
    const { result } = renderHook(() => useColaboracion(client));
    await act(() => result.current.fetchDependencias(1));
    await act(() => result.current.deleteDependencia(1));
    expect(result.current.dependencias).toHaveLength(0);
  });
});
