import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockTarea, mockTareaList } from '@repo/koop-models/__mocks__';
import type { CreateTareaInput, UpdateTareaInput, ListResponse, Tarea } from '@repo/koop-models';

// Contrato del hook — implementado en ../useTareasKoop.ts
import { useTareasKoop } from '../useTareasKoop';
import type { TareasKoopApiClient } from '../useTareasKoop';

// ─── Mock del ApiClient ───────────────────────────────────────────────────────

const makeMockClient = (overrides?: Partial<TareasKoopApiClient>): TareasKoopApiClient => ({
  list: vi.fn().mockResolvedValue({ items: mockTareaList(5), total: 5 } satisfies ListResponse<Tarea>),
  get: vi.fn().mockResolvedValue(mockTarea()),
  create: vi.fn().mockResolvedValue(mockTarea({ id: 999, titulo: 'Tarea nueva' })),
  update: vi.fn().mockResolvedValue(mockTarea({ id_estado_tarea: 2 })),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useTareasKoop', () => {
  let client: TareasKoopApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  describe('estado inicial', () => {
    it('inicia sin tareas, loading=false, error=null', () => {
      const { result } = renderHook(() => useTareasKoop(client));
      expect(result.current.tareas).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('acepta filtros iniciales y los aplica en el primer fetch', async () => {
      const { result } = renderHook(() =>
        useTareasKoop(client, { initialFilters: { id_expediente: 1, vencidas: true } })
      );

      await act(() => result.current.fetchTareas());

      expect(client.list).toHaveBeenCalledWith(
        expect.objectContaining({ id_expediente: 1, vencidas: true })
      );
    });
  });

  describe('fetchTareas', () => {
    it('carga tareas y expone el total', async () => {
      const { result } = renderHook(() => useTareasKoop(client));

      await act(() => result.current.fetchTareas());

      expect(result.current.tareas).toHaveLength(5);
      expect(result.current.total).toBe(5);
    });

    it('permite paginar pasando limit/offset', async () => {
      const { result } = renderHook(() => useTareasKoop(client));

      await act(() => result.current.fetchTareas({ limit: 10, offset: 10 }));

      expect(client.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 10 }));
    });

    it('expone error cuando falla la carga', async () => {
      client = makeMockClient({ list: vi.fn().mockRejectedValue(new Error('Timeout')) });
      const { result } = renderHook(() => useTareasKoop(client));

      await act(() => result.current.fetchTareas());

      expect(result.current.error).toBe('Timeout');
    });
  });

  describe('createTarea', () => {
    it('crea una tarea y la agrega a la lista', async () => {
      const { result } = renderHook(() => useTareasKoop(client));
      await act(() => result.current.fetchTareas());

      const input: CreateTareaInput = {
        titulo: 'Tarea nueva',
        id_expediente: 1,
      };

      await act(() => result.current.createTarea(input));

      expect(client.create).toHaveBeenCalledWith(input);
      await waitFor(() => {
        expect(result.current.tareas.some((t) => t.id === 999)).toBe(true);
      });
    });
  });

  describe('updateTarea', () => {
    it('actualiza el estado de una tarea in-place', async () => {
      client = makeMockClient({
        list: vi.fn().mockResolvedValue({ items: [mockTarea()], total: 1 }),
        update: vi.fn().mockResolvedValue(mockTarea({ id_estado_tarea: 2 })),
      });
      const { result } = renderHook(() => useTareasKoop(client));
      await act(() => result.current.fetchTareas());

      const patch: UpdateTareaInput = { id_estado_tarea: 2 };
      await act(() => result.current.updateTarea(1, patch));

      expect(client.update).toHaveBeenCalledWith(1, patch);
      await waitFor(() => {
        const t = result.current.tareas.find((t) => t.id === 1);
        expect(t?.id_estado_tarea).toBe(2);
      });
    });
  });

  describe('deleteTarea', () => {
    it('elimina la tarea de la lista local tras confirmar en backend', async () => {
      client = makeMockClient({
        list: vi.fn().mockResolvedValue({ items: [mockTarea()], total: 1 }),
      });
      const { result } = renderHook(() => useTareasKoop(client));
      await act(() => result.current.fetchTareas());

      await act(() => result.current.deleteTarea(1));

      expect(client.delete).toHaveBeenCalledWith(1);
      expect(result.current.tareas).toHaveLength(0);
    });
  });
});
