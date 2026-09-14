import { useState, useCallback, useEffect } from 'react';
import type { Id, User, CreateUserInput, UpdateUserInput, ListResponse } from '@repo/koop-models';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const errMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

/** Reemplaza a `useAdminUsers` (`/admin/users`). El nuevo `/users` no tiene endpoint para
 * "crear cliente desde usuario" (`createClientFromUser`) — queda fuera de este hook. */
export interface UsersApiClient {
  list(): Promise<ListResponse<User>>;
  get(id: Id): Promise<User>;
  create(data: CreateUserInput): Promise<User>;
  update(id: Id, data: UpdateUserInput): Promise<User>;
  delete(id: Id): Promise<void>;
  addRole(id: Id, idRol: Id): Promise<void>;
  removeRole(id: Id, idRol: Id): Promise<void>;
}

export function useUsers(client: UsersApiClient, isAdmin: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Id | null>(null);
  const [deleting, setDeleting] = useState<Id | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.list();
      setUsers(data.items ?? []);
    } catch (err) {
      setError(errMsg(err, 'No se pudo cargar la lista de usuarios'));
    } finally {
      setLoading(false);
    }
  }, [client, isAdmin]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (data: CreateUserInput) => {
    const created = await client.create(data);
    setUsers((prev) => [...prev, created]);
    return created;
  }, [client]);

  const updateUser = useCallback(async (id: Id, data: UpdateUserInput) => {
    setUpdating(id);
    setError(null);
    try {
      const updated = await client.update(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      return updated;
    } catch (err) {
      setError(errMsg(err, 'No se pudo actualizar el usuario'));
      throw err;
    } finally {
      setUpdating(null);
    }
  }, [client]);

  const deleteUser = useCallback(async (id: Id) => {
    setDeleting(id);
    setError(null);
    try {
      await client.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(errMsg(err, 'No se pudo eliminar el usuario'));
      throw err;
    } finally {
      setDeleting(null);
    }
  }, [client]);

  const addRole = useCallback(async (id: Id, idRol: Id) => {
    await client.addRole(id, idRol);
    await fetchUsers();
  }, [client, fetchUsers]);

  const removeRole = useCallback(async (id: Id, idRol: Id) => {
    await client.removeRole(id, idRol);
    await fetchUsers();
  }, [client, fetchUsers]);

  return {
    users,
    loading,
    error,
    updating,
    deleting,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    addRole,
    removeRole,
  };
}
