import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockAudiencia } from '@repo/koop-models/__mocks__';
import type { CreateAudienciaInput } from '@repo/koop-models';

import { useAudiencias } from '../useAudiencias';
import type { AudienciasApiClient } from '../useAudiencias';

const makeMockClient = (overrides?: Partial<AudienciasApiClient>): AudienciasApiClient => ({
  list: vi.fn().mockResolvedValue({ items: [mockAudiencia()], total: 1 }),
  create: vi.fn().mockResolvedValue(mockAudiencia({ id: 999, tipo_audiencia: 'Audiencia de Trámite' })),
  update: vi.fn().mockResolvedValue(mockAudiencia({ estado: 'realizada', resultado: 'conciliación parcial' })),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useAudiencias', () => {
  let client: AudienciasApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('inicia sin audiencias cargadas', () => {
    const { result } = renderHook(() => useAudiencias(client, 1));
    expect(result.current.audiencias).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchAudiencias carga las audiencias del expediente', async () => {
    const { result } = renderHook(() => useAudiencias(client, 1));

    await act(() => result.current.fetchAudiencias());

    expect(client.list).toHaveBeenCalledWith(1);
    expect(result.current.audiencias).toHaveLength(1);
    expect(result.current.audiencias[0].tipo_audiencia).toBe('Audiencia de Conciliación');
  });

  it('createAudiencia añade la audiencia a la lista', async () => {
    const { result } = renderHook(() => useAudiencias(client, 1));
    await act(() => result.current.fetchAudiencias());

    const input: CreateAudienciaInput = {
      id_expediente: 1,
      fecha_audiencia: '2024-07-01T10:00:00Z',
      tipo_audiencia: 'Audiencia de Trámite',
      modalidad: 'presencial',
    };

    await act(() => result.current.createAudiencia(input));

    expect(result.current.audiencias).toHaveLength(2);
    expect(result.current.audiencias[1].tipo_audiencia).toBe('Audiencia de Trámite');
  });

  it('updateAudiencia actualiza estado y resultado', async () => {
    client = makeMockClient({
      list: vi.fn().mockResolvedValue({ items: [mockAudiencia()], total: 1 }),
      update: vi.fn().mockResolvedValue(mockAudiencia({ estado: 'realizada', resultado: 'conciliación parcial' })),
    });
    const { result } = renderHook(() => useAudiencias(client, 1));
    await act(() => result.current.fetchAudiencias());

    await act(() => result.current.updateAudiencia(1, { estado: 'realizada', resultado: 'conciliación parcial' }));

    const upd = result.current.audiencias.find((a) => a.id === 1);
    expect(upd?.estado).toBe('realizada');
    expect(upd?.resultado).toBe('conciliación parcial');
  });

  it('expone error cuando la carga falla', async () => {
    client = makeMockClient({ list: vi.fn().mockRejectedValue(new Error('Not found')) });
    const { result } = renderHook(() => useAudiencias(client, 1));

    await act(() => result.current.fetchAudiencias());

    expect(result.current.error).toBe('Not found');
  });
});
