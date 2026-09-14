import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockCliente, mockClienteList } from '@repo/koop-models/__mocks__';
import type { CreateClienteInput } from '@repo/koop-models';

import { useClientes } from '../useClientes';
import type { ClientesApiClient } from '../useClientes';

const makeMockClient = (overrides?: Partial<ClientesApiClient>): ClientesApiClient => ({
  list: vi.fn().mockResolvedValue({ items: mockClienteList(3), total: 3 }),
  get: vi.fn().mockResolvedValue(mockCliente()),
  create: vi.fn().mockResolvedValue(mockCliente({ id: 999, nombre: 'Cliente Nuevo' })),
  update: vi.fn().mockResolvedValue(mockCliente({ telefono: '+57 300 000 0000' })),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useClientes', () => {
  let client: ClientesApiClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('carga la lista automáticamente al montar', async () => {
    const { result } = renderHook(() => useClientes(client));

    await waitFor(() => {
      expect(result.current.clientes).toHaveLength(3);
      expect(result.current.total).toBe(3);
    });
  });

  it('no carga automáticamente si autoFetch=false', () => {
    renderHook(() => useClientes(client, { autoFetch: false }));
    expect(client.list).not.toHaveBeenCalled();
  });

  it('createCliente agrega el cliente creado a la lista', async () => {
    const { result } = renderHook(() => useClientes(client, { autoFetch: false }));

    const input: CreateClienteInput = { nombre: 'Cliente Nuevo' };
    await act(() => result.current.createCliente(input));

    expect(client.create).toHaveBeenCalledWith(input);
    expect(result.current.clientes.some((c) => c.id === 999)).toBe(true);
  });

  it('updateCliente actualiza el registro in-place', async () => {
    client = makeMockClient({
      list: vi.fn().mockResolvedValue({ items: [mockCliente()], total: 1 }),
    });
    const { result } = renderHook(() => useClientes(client));
    await waitFor(() => expect(result.current.clientes).toHaveLength(1));

    await act(() => result.current.updateCliente(1, { telefono: '+57 300 000 0000' }));

    expect(result.current.clientes[0].telefono).toBe('+57 300 000 0000');
  });

  it('deleteCliente elimina el registro de la lista', async () => {
    client = makeMockClient({
      list: vi.fn().mockResolvedValue({ items: [mockCliente()], total: 1 }),
    });
    const { result } = renderHook(() => useClientes(client));
    await waitFor(() => expect(result.current.clientes).toHaveLength(1));

    await act(() => result.current.deleteCliente(1));

    expect(result.current.clientes).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('expone error cuando la carga falla', async () => {
    client = makeMockClient({ list: vi.fn().mockRejectedValue(new Error('Forbidden')) });
    const { result } = renderHook(() => useClientes(client));

    await waitFor(() => expect(result.current.error).toBe('Forbidden'));
  });
});
