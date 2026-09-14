import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockRole, mockTipoProceso, mockEtapaProcesal, mockTipoProcCombo } from '@repo/koop-models/__mocks__';

import { useCatalogos } from '../useCatalogos';
import type { CatalogosApiClient } from '../useCatalogos';

const makeMockClient = (overrides?: Partial<CatalogosApiClient>): CatalogosApiClient => ({
  listRoles: vi.fn().mockResolvedValue([mockRole()]),
  createRole: vi.fn().mockResolvedValue(mockRole({ id: 999, nombre: 'auditor' })),
  updateRole: vi.fn().mockResolvedValue(mockRole({ descripcion: 'Actualizado' })),
  deleteRole: vi.fn().mockResolvedValue(undefined),
  listTiposProceso: vi.fn().mockResolvedValue([mockTipoProceso()]),
  createTipoProceso: vi.fn().mockResolvedValue(mockTipoProceso({ id: 999, nombre: 'Proceso Civil' })),
  updateTipoProceso: vi.fn().mockResolvedValue(mockTipoProceso({ nombre: 'Actualizado' })),
  deleteTipoProceso: vi.fn().mockResolvedValue(undefined),
  listEtapasProcesales: vi.fn().mockResolvedValue([mockEtapaProcesal()]),
  createEtapaProcesal: vi.fn().mockResolvedValue(mockEtapaProcesal({ id: 999 })),
  updateEtapaProcesal: vi.fn().mockResolvedValue(mockEtapaProcesal({ descripcion: 'Actualizado' })),
  deleteEtapaProcesal: vi.fn().mockResolvedValue(undefined),
  listTipoProcCombo: vi.fn().mockResolvedValue([mockTipoProcCombo()]),
  createTipoProcCombo: vi.fn().mockResolvedValue(mockTipoProcCombo({ id: 999 })),
  deleteTipoProcCombo: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useCatalogos', () => {
  let client: CatalogosApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('fetchRoles carga los roles', async () => {
    const { result } = renderHook(() => useCatalogos(client));
    await act(() => result.current.fetchRoles());
    expect(result.current.roles).toHaveLength(1);
  });

  it('createRole agrega el rol creado', async () => {
    const { result } = renderHook(() => useCatalogos(client));
    await act(() => result.current.createRole({ nombre: 'auditor' }));
    expect(result.current.roles.some((r) => r.id === 999)).toBe(true);
  });

  it('deleteRole elimina el rol de la lista', async () => {
    const { result } = renderHook(() => useCatalogos(client));
    await act(() => result.current.fetchRoles());
    await act(() => result.current.deleteRole(1));
    expect(result.current.roles).toHaveLength(0);
  });

  it('fetchEtapasProcesales carga etapas filtradas por tipo de proceso', async () => {
    const { result } = renderHook(() => useCatalogos(client));
    await act(() => result.current.fetchEtapasProcesales(1));
    expect(client.listEtapasProcesales).toHaveBeenCalledWith(1);
    expect(result.current.etapasProcesales).toHaveLength(1);
  });

  it('fetchTipoProcCombo carga las combinaciones', async () => {
    const { result } = renderHook(() => useCatalogos(client));
    await act(() => result.current.fetchTipoProcCombo());
    expect(result.current.combos).toHaveLength(1);
  });
});
