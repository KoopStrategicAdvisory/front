import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockUser } from '@repo/koop-models/__mocks__';

import { useUsers } from '../useUsers';
import type { UsersApiClient } from '../useUsers';

const makeMockClient = (overrides?: Partial<UsersApiClient>): UsersApiClient => ({
  list: vi.fn().mockResolvedValue({ items: [mockUser()], total: 1 }),
  get: vi.fn().mockResolvedValue(mockUser()),
  create: vi.fn().mockResolvedValue(mockUser({ id: 999, nombre: 'Usuario Nuevo' })),
  update: vi.fn().mockResolvedValue(mockUser({ active: false })),
  delete: vi.fn().mockResolvedValue(undefined),
  addRole: vi.fn().mockResolvedValue(undefined),
  removeRole: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useUsers', () => {
  let client: UsersApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('no carga usuarios si isAdmin=false', () => {
    renderHook(() => useUsers(client, false));
    expect(client.list).not.toHaveBeenCalled();
  });

  it('carga usuarios automáticamente si isAdmin=true', async () => {
    const { result } = renderHook(() => useUsers(client, true));

    await waitFor(() => expect(result.current.users).toHaveLength(1));
  });

  it('createUser agrega el usuario a la lista', async () => {
    const { result } = renderHook(() => useUsers(client, false));

    await act(() => result.current.createUser({ nombre: 'Usuario Nuevo', email: 'nuevo@koop.co', password: 'segura123' }));

    expect(result.current.users.some((u) => u.id === 999)).toBe(true);
  });

  it('updateUser actualiza el registro in-place', async () => {
    client = makeMockClient({ list: vi.fn().mockResolvedValue({ items: [mockUser()], total: 1 }) });
    const { result } = renderHook(() => useUsers(client, true));
    await waitFor(() => expect(result.current.users).toHaveLength(1));

    await act(() => result.current.updateUser(1, { active: false }));

    expect(result.current.users[0].active).toBe(false);
  });

  it('deleteUser elimina el registro de la lista', async () => {
    client = makeMockClient({ list: vi.fn().mockResolvedValue({ items: [mockUser()], total: 1 }) });
    const { result } = renderHook(() => useUsers(client, true));
    await waitFor(() => expect(result.current.users).toHaveLength(1));

    await act(() => result.current.deleteUser(1));

    expect(result.current.users).toHaveLength(0);
  });

  it('addRole llama al client y refresca la lista', async () => {
    client = makeMockClient({ list: vi.fn().mockResolvedValue({ items: [mockUser()], total: 1 }) });
    const { result } = renderHook(() => useUsers(client, true));
    await waitFor(() => expect(result.current.users).toHaveLength(1));

    await act(() => result.current.addRole(1, 2));

    expect(client.addRole).toHaveBeenCalledWith(1, 2);
    expect(client.list).toHaveBeenCalledTimes(2);
  });
});
