import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockTablero, mockColumnasKanban, mockKanbanPosicion } from '@repo/koop-models/__mocks__';

import { useKanban } from '../useKanban';
import type { KanbanApiClient } from '../useKanban';

const makeMockClient = (overrides?: Partial<KanbanApiClient>): KanbanApiClient => ({
  getTablero: vi.fn().mockResolvedValue(mockTablero()),
  listColumnas: vi.fn().mockResolvedValue(mockColumnasKanban()),
  listPosiciones: vi.fn().mockResolvedValue([
    mockKanbanPosicion({ id: 1, id_columna: 1, id_tarea: 1, orden_vertical: 0 }),
    mockKanbanPosicion({ id: 2, id_columna: 2, id_tarea: 2, orden_vertical: 0 }),
  ]),
  crearPosicion: vi.fn().mockImplementation((data) =>
    Promise.resolve({ id: 999, ...data })),
  eliminarPosicion: vi.fn().mockResolvedValue(undefined),
  asignarUsuario: vi.fn().mockResolvedValue(undefined),
  createTablero: vi.fn().mockResolvedValue(mockTablero({ id: 2, nombre: 'Nuevo tablero' })),
  ...overrides,
});

describe('useKanban', () => {
  let client: KanbanApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('inicia sin tablero cargado', () => {
    const { result } = renderHook(() => useKanban(client));
    expect(result.current.tablero).toBeNull();
    expect(result.current.columnas).toEqual([]);
    expect(result.current.posiciones).toEqual([]);
  });

  describe('loadTablero', () => {
    it('carga el tablero, sus columnas y las posiciones de las tarjetas', async () => {
      const { result } = renderHook(() => useKanban(client));

      await act(() => result.current.loadTablero(1));

      expect(client.getTablero).toHaveBeenCalledWith(1);
      expect(client.listColumnas).toHaveBeenCalledWith(1);
      expect(client.listPosiciones).toHaveBeenCalledWith(1);

      expect(result.current.tablero?.nombre).toBe('Tablero de Tareas Koop');
      expect(result.current.columnas).toHaveLength(4);
      expect(result.current.posiciones).toHaveLength(2);
    });

    it('activa loading durante la carga', async () => {
      let resolveTablero!: (v: unknown) => void;
      client = makeMockClient({
        getTablero: vi.fn().mockReturnValue(new Promise((r) => { resolveTablero = r; })),
      });

      const { result } = renderHook(() => useKanban(client));
      act(() => { void result.current.loadTablero(1); });

      expect(result.current.loading).toBe(true);

      await act(() => { resolveTablero(mockTablero()); });
    });
  });

  describe('getTarjetasPorColumna', () => {
    it('agrupa las posiciones por columna', async () => {
      const { result } = renderHook(() => useKanban(client));
      await act(() => result.current.loadTablero(1));

      const col1 = result.current.getTarjetasPorColumna(1);
      const col2 = result.current.getTarjetasPorColumna(2);

      expect(col1).toHaveLength(1);
      expect(col2).toHaveLength(1);
    });
  });

  describe('moverTarea', () => {
    it('elimina la posición actual y crea una nueva en la columna destino', async () => {
      const { result } = renderHook(() => useKanban(client));
      await act(() => result.current.loadTablero(1));

      await act(() => result.current.moverTarea(1, 2));

      expect(client.eliminarPosicion).toHaveBeenCalledWith(1);
      expect(client.crearPosicion).toHaveBeenCalledWith(
        expect.objectContaining({ id_tablero: 1, id_columna: 2, tipo_entidad: 'tarea', id_tarea: 1 }),
      );

      await waitFor(() => {
        const enColumna2 = result.current.getTarjetasPorColumna(2);
        expect(enColumna2.some((p) => p.tipo_entidad === 'tarea' && p.id_tarea === 1)).toBe(true);
      });
    });

    it('revierte la posición si el backend rechaza el movimiento', async () => {
      client = makeMockClient({
        listPosiciones: vi.fn().mockResolvedValue([
          mockKanbanPosicion({ id: 1, id_columna: 1, id_tarea: 1 }),
        ]),
        crearPosicion: vi.fn().mockRejectedValue(new Error('No permitido')),
      });

      const { result } = renderHook(() => useKanban(client));
      await act(() => result.current.loadTablero(1));

      await act(async () => {
        try { await result.current.moverTarea(1, 4); } catch { /* esperado */ }
      });

      await waitFor(() => {
        const enColumna1 = result.current.getTarjetasPorColumna(1);
        expect(enColumna1.some((p) => p.tipo_entidad === 'tarea' && p.id_tarea === 1)).toBe(true);
      });
      expect(result.current.error).toBe('No permitido');
    });
  });

  describe('asignarUsuario', () => {
    it('asigna un usuario al tablero cargado', async () => {
      const { result } = renderHook(() => useKanban(client));
      await act(() => result.current.loadTablero(1));

      await act(() => result.current.asignarUsuario(5));

      expect(client.asignarUsuario).toHaveBeenCalledWith(1, 5);
    });
  });
});
