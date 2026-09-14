import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockExpediente, mockExpedienteList, mockExpedienteEtapa } from '@repo/koop-models/__mocks__';
import type { CreateExpedienteInput, UpdateExpedienteInput } from '@repo/koop-models';

// Contrato del hook — implementado en ../useExpedientes.ts
import { useExpedientes } from '../useExpedientes';
import type { ExpedientesApiClient } from '../useExpedientes';

// ─── Mock del ApiClient ───────────────────────────────────────────────────────

const makeMockClient = (overrides?: Partial<ExpedientesApiClient>): ExpedientesApiClient => ({
  list: vi.fn().mockResolvedValue({ items: mockExpedienteList(3), total: 3 }),
  get: vi.fn().mockResolvedValue(mockExpediente()),
  create: vi.fn().mockResolvedValue(mockExpediente({ id: 999, numero_de_expediente: 'KOOP-2024-999' })),
  update: vi.fn().mockResolvedValue(mockExpediente({ id_estado_proceso: 2 })),
  delete: vi.fn().mockResolvedValue(undefined),
  listEtapas: vi.fn().mockResolvedValue({ items: [mockExpedienteEtapa()], total: 1 }),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useExpedientes', () => {
  let client: ExpedientesApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  describe('estado inicial', () => {
    it('inicia con lista vacía y loading=false', () => {
      const { result } = renderHook(() => useExpedientes(client));
      expect(result.current.expedientes).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('no llama al client si autoFetch=false', () => {
      renderHook(() => useExpedientes(client, { autoFetch: false }));
      expect(client.list).not.toHaveBeenCalled();
    });
  });

  describe('fetchExpedientes', () => {
    it('carga la lista y actualiza el estado', async () => {
      const { result } = renderHook(() => useExpedientes(client));

      await act(() => result.current.fetchExpedientes());

      expect(client.list).toHaveBeenCalledOnce();
      expect(result.current.expedientes).toHaveLength(3);
      expect(result.current.total).toBe(3);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('activa loading durante la carga', async () => {
      let resolveList!: (v: unknown) => void;
      client = makeMockClient({
        list: vi.fn().mockReturnValue(new Promise((r) => { resolveList = r; })),
      });

      const { result } = renderHook(() => useExpedientes(client));
      act(() => { void result.current.fetchExpedientes(); });

      expect(result.current.loading).toBe(true);

      await act(() => {
        resolveList({ items: mockExpedienteList(2), total: 2 });
      });

      expect(result.current.loading).toBe(false);
    });

    it('guarda error cuando el client rechaza', async () => {
      client = makeMockClient({ list: vi.fn().mockRejectedValue(new Error('Network error')) });
      const { result } = renderHook(() => useExpedientes(client));

      await act(() => result.current.fetchExpedientes());

      expect(result.current.error).toBe('Network error');
      expect(result.current.expedientes).toEqual([]);
    });
  });

  describe('selectExpediente', () => {
    it('carga un expediente individual y lo expone en selectedExpediente', async () => {
      const { result } = renderHook(() => useExpedientes(client));

      await act(() => result.current.selectExpediente(1));

      expect(client.get).toHaveBeenCalledWith(1);
      expect(result.current.selectedExpediente).toMatchObject({ numero_de_expediente: 'KOOP-2024-001' });
    });
  });

  describe('createExpediente', () => {
    it('llama al client.create y añade el nuevo expediente a la lista', async () => {
      const { result } = renderHook(() => useExpedientes(client));
      await act(() => result.current.fetchExpedientes());

      const input: CreateExpedienteInput = {
        numero_de_expediente: 'KOOP-2024-999',
        id_cliente: 1,
      };

      await act(() => result.current.createExpediente(input));

      expect(client.create).toHaveBeenCalledWith(input);
      await waitFor(() => {
        expect(result.current.expedientes.some((e) => e.id === 999)).toBe(true);
      });
    });
  });

  describe('updateExpediente', () => {
    it('llama al client.update y actualiza el expediente en la lista', async () => {
      client = makeMockClient({
        list: vi.fn().mockResolvedValue({ items: [mockExpediente()], total: 1 }),
        update: vi.fn().mockResolvedValue(mockExpediente({ id_estado_proceso: 2 })),
      });
      const { result } = renderHook(() => useExpedientes(client));
      await act(() => result.current.fetchExpedientes());

      const update: UpdateExpedienteInput = { id_estado_proceso: 2 };
      await act(() => result.current.updateExpediente(1, update));

      expect(client.update).toHaveBeenCalledWith(1, update);
      await waitFor(() => {
        const found = result.current.expedientes.find((e) => e.id === 1);
        expect(found?.id_estado_proceso).toBe(2);
      });
    });
  });

  describe('deleteExpediente', () => {
    it('llama al client.delete y elimina de la lista local', async () => {
      client = makeMockClient({
        list: vi.fn().mockResolvedValue({ items: [mockExpediente()], total: 1 }),
      });
      const { result } = renderHook(() => useExpedientes(client));
      await act(() => result.current.fetchExpedientes());

      await act(() => result.current.deleteExpediente(1));

      expect(client.delete).toHaveBeenCalledWith(1);
      expect(result.current.expedientes).toHaveLength(0);
    });
  });

  describe('listEtapas', () => {
    it('carga las etapas del expediente seleccionado', async () => {
      const { result } = renderHook(() => useExpedientes(client));

      await act(() => result.current.fetchEtapas(1));

      expect(client.listEtapas).toHaveBeenCalledWith(1);
      expect(result.current.etapas).toHaveLength(1);
    });
  });
});
