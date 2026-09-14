import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockHonorario, mockPago, mockGasto, mockResumenFinanciero } from '@repo/koop-models/__mocks__';

import { useFinanciero } from '../useFinanciero';
import type { FinancieroApiClient } from '../useFinanciero';

const makeMockClient = (overrides?: Partial<FinancieroApiClient>): FinancieroApiClient => ({
  listHonorarios: vi.fn().mockResolvedValue({ items: [mockHonorario()], total: 1 }),
  createHonorario: vi.fn().mockResolvedValue(mockHonorario({ id: 999 })),
  updateHonorario: vi.fn().mockResolvedValue(mockHonorario({ estado: 'liquidado' })),
  deleteHonorario: vi.fn().mockResolvedValue(undefined),
  listPagos: vi.fn().mockResolvedValue({ items: [mockPago()], total: 1 }),
  createPago: vi.fn().mockResolvedValue(mockPago({ id: 999 })),
  updatePago: vi.fn().mockResolvedValue(mockPago({ metodo_pago: 'efectivo' })),
  listGastos: vi.fn().mockResolvedValue({ items: [mockGasto()], total: 1 }),
  createGasto: vi.fn().mockResolvedValue(mockGasto({ id: 999 })),
  updateGasto: vi.fn().mockResolvedValue(mockGasto({ reembolsado: true })),
  deleteGasto: vi.fn().mockResolvedValue(undefined),
  getResumen: vi.fn().mockResolvedValue(mockResumenFinanciero()),
  ...overrides,
});

describe('useFinanciero', () => {
  let client: FinancieroApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('fetchHonorarios carga los honorarios del expediente', async () => {
    const { result } = renderHook(() => useFinanciero(client));
    await act(() => result.current.fetchHonorarios(1));
    expect(client.listHonorarios).toHaveBeenCalledWith(1);
    expect(result.current.honorarios).toHaveLength(1);
  });

  it('createPago agrega el pago creado', async () => {
    const { result } = renderHook(() => useFinanciero(client));
    await act(() => result.current.createPago({ id_expediente: 1, fecha_pago: '2024-06-01', monto: 500000 }));
    expect(result.current.pagos.some((p) => p.id === 999)).toBe(true);
  });

  it('deleteGasto elimina el gasto de la lista', async () => {
    const { result } = renderHook(() => useFinanciero(client));
    await act(() => result.current.fetchGastos(1));
    await act(() => result.current.deleteGasto(1));
    expect(result.current.gastos).toHaveLength(0);
  });

  it('fetchResumen carga el resumen financiero del expediente', async () => {
    const { result } = renderHook(() => useFinanciero(client));
    await act(() => result.current.fetchResumen(1));
    expect(result.current.resumen).toEqual(mockResumenFinanciero());
  });
});
