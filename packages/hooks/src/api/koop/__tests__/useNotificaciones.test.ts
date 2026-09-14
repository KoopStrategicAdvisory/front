import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockNotificacion } from '@repo/koop-models/__mocks__';

import { useNotificaciones } from '../useNotificaciones';
import type { NotificacionesApiClient } from '../useNotificaciones';

const makeMockClient = (overrides?: Partial<NotificacionesApiClient>): NotificacionesApiClient => ({
  list: vi.fn().mockResolvedValue({ items: [mockNotificacion()], total: 1 }),
  get: vi.fn().mockResolvedValue(mockNotificacion()),
  create: vi.fn().mockResolvedValue(mockNotificacion({ id: 999 })),
  update: vi.fn().mockResolvedValue(mockNotificacion({ estado: 'vencida' })),
  delete: vi.fn().mockResolvedValue(undefined),
  proximasVencer: vi.fn().mockResolvedValue([mockNotificacion()]),
  ...overrides,
});

describe('useNotificaciones', () => {
  let client: NotificacionesApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('fetchNotificaciones carga las notificaciones', async () => {
    const { result } = renderHook(() => useNotificaciones(client));
    await act(() => result.current.fetchNotificaciones(1));
    expect(client.list).toHaveBeenCalledWith(1);
    expect(result.current.notificaciones).toHaveLength(1);
  });

  it('fetchProximasVencer carga las notificaciones próximas a vencer', async () => {
    const { result } = renderHook(() => useNotificaciones(client));
    await act(() => result.current.fetchProximasVencer(5));
    expect(client.proximasVencer).toHaveBeenCalledWith(5);
    expect(result.current.proximasVencer).toHaveLength(1);
  });

  it('createNotificacion agrega la notificación creada', async () => {
    const { result } = renderHook(() => useNotificaciones(client));
    await act(() =>
      result.current.createNotificacion({ id_expediente: 1, fecha_notificacion: '2024-06-01' }),
    );
    expect(result.current.notificaciones.some((n) => n.id === 999)).toBe(true);
  });

  it('deleteNotificacion elimina la notificación de la lista', async () => {
    const { result } = renderHook(() => useNotificaciones(client));
    await act(() => result.current.fetchNotificaciones(1));
    await act(() => result.current.deleteNotificacion(1));
    expect(result.current.notificaciones).toHaveLength(0);
  });
});
