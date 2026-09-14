import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockActuacion } from '@repo/koop-models/__mocks__';
import type { CreateActuacionInput } from '@repo/koop-models';

import { useActuaciones } from '../useActuaciones';
import type { ActuacionesApiClient } from '../useActuaciones';

const makeMockClient = (overrides?: Partial<ActuacionesApiClient>): ActuacionesApiClient => ({
  list: vi.fn().mockResolvedValue({ items: [mockActuacion()], total: 1 }),
  create: vi.fn().mockResolvedValue(mockActuacion({ id: 999, titulo: 'Nuevo auto' })),
  update: vi.fn().mockResolvedValue(mockActuacion({ es_hito: false })),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useActuaciones', () => {
  let client: ActuacionesApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('inicia con lista vacía', () => {
    const { result } = renderHook(() => useActuaciones(client, 1));
    expect(result.current.actuaciones).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetchActuaciones carga las actuaciones del expediente', async () => {
    const { result } = renderHook(() => useActuaciones(client, 1));

    await act(() => result.current.fetchActuaciones());

    expect(client.list).toHaveBeenCalledWith(1, expect.anything());
    expect(result.current.actuaciones).toHaveLength(1);
    expect(result.current.actuaciones[0].titulo).toBe('Auto admisorio de la demanda');
  });

  it('createActuacion añade la nueva actuación a la lista', async () => {
    const { result } = renderHook(() => useActuaciones(client, 1));
    await act(() => result.current.fetchActuaciones());

    const input: CreateActuacionInput = {
      id_expediente: 1,
      fecha_actuacion: '2024-06-01',
      titulo: 'Nuevo auto',
    };

    await act(() => result.current.createActuacion(input));

    expect(client.create).toHaveBeenCalledWith(input);
    expect(result.current.actuaciones).toHaveLength(2);
    expect(result.current.actuaciones[1].id).toBe(999);
  });

  it('updateActuacion actualiza el registro in-place', async () => {
    client = makeMockClient({
      list: vi.fn().mockResolvedValue({ items: [mockActuacion()], total: 1 }),
      update: vi.fn().mockResolvedValue(mockActuacion({ es_hito: false })),
    });
    const { result } = renderHook(() => useActuaciones(client, 1));
    await act(() => result.current.fetchActuaciones());

    await act(() => result.current.updateActuacion(1, { titulo: 'Auto corregido' }));

    const updated = result.current.actuaciones.find((a) => a.id === 1);
    expect(updated?.es_hito).toBe(false);
  });

  it('deleteActuacion elimina la actuación de la lista', async () => {
    client = makeMockClient({
      list: vi.fn().mockResolvedValue({ items: [mockActuacion()], total: 1 }),
    });
    const { result } = renderHook(() => useActuaciones(client, 1));
    await act(() => result.current.fetchActuaciones());

    await act(() => result.current.deleteActuacion(1));

    expect(result.current.actuaciones).toHaveLength(0);
  });

  it('expone error si la carga falla', async () => {
    client = makeMockClient({ list: vi.fn().mockRejectedValue(new Error('Forbidden')) });
    const { result } = renderHook(() => useActuaciones(client, 1));

    await act(() => result.current.fetchActuaciones());

    expect(result.current.error).toBe('Forbidden');
  });
});
