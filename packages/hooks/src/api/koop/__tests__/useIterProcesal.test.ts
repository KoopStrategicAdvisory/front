import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockIterProcesalPlantilla, mockTareaPlantilla } from '@repo/koop-models/__mocks__';

import { useIterProcesal } from '../useIterProcesal';
import type { IterProcesalApiClient } from '../useIterProcesal';

const makeMockClient = (overrides?: Partial<IterProcesalApiClient>): IterProcesalApiClient => ({
  list: vi.fn().mockResolvedValue([mockIterProcesalPlantilla()]),
  get: vi.fn().mockResolvedValue(mockIterProcesalPlantilla()),
  create: vi.fn().mockResolvedValue(mockIterProcesalPlantilla({ id: 999 })),
  update: vi.fn().mockResolvedValue(mockIterProcesalPlantilla({ plazo_dias: 15 })),
  delete: vi.fn().mockResolvedValue(undefined),
  listTareas: vi.fn().mockResolvedValue([mockTareaPlantilla()]),
  createTarea: vi.fn().mockResolvedValue(mockTareaPlantilla({ id: 999, titulo: 'Nueva tarea plantilla' })),
  updateTarea: vi.fn().mockResolvedValue(mockTareaPlantilla({ dias_desde_etapa: 5 })),
  deleteTarea: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useIterProcesal', () => {
  let client: IterProcesalApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('fetchPlantillas carga las plantillas de iter procesal', async () => {
    const { result } = renderHook(() => useIterProcesal(client));
    await act(() => result.current.fetchPlantillas());
    expect(result.current.plantillas).toHaveLength(1);
  });

  it('createPlantilla agrega la plantilla creada', async () => {
    const { result } = renderHook(() => useIterProcesal(client));
    await act(() =>
      result.current.createPlantilla({ id_tipo_proc_subtipo_proc_tipo_pre: 1, id_etapa: 1, orden: 1 }),
    );
    expect(result.current.plantillas.some((p) => p.id === 999)).toBe(true);
  });

  it('deletePlantilla elimina la plantilla de la lista', async () => {
    const { result } = renderHook(() => useIterProcesal(client));
    await act(() => result.current.fetchPlantillas());
    await act(() => result.current.deletePlantilla(1));
    expect(result.current.plantillas).toHaveLength(0);
  });

  it('fetchTareasPlantilla carga las tareas de una plantilla', async () => {
    const { result } = renderHook(() => useIterProcesal(client));
    await act(() => result.current.fetchTareasPlantilla(1));
    expect(client.listTareas).toHaveBeenCalledWith(1);
    expect(result.current.tareasPlantilla).toHaveLength(1);
  });

  it('createTareaPlantilla agrega la tarea de plantilla creada', async () => {
    const { result } = renderHook(() => useIterProcesal(client));
    await act(() => result.current.createTareaPlantilla(1, { titulo: 'Nueva tarea plantilla' }));
    expect(client.createTarea).toHaveBeenCalledWith(1, { titulo: 'Nueva tarea plantilla' });
    expect(result.current.tareasPlantilla.some((t) => t.id === 999)).toBe(true);
  });
});
