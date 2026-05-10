import { useCallback, useEffect, useRef, useState } from 'react';
import type { KoopUser, KoopRole } from '@repo/types';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const apiMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export const ROLE_OPTIONS: { id: KoopRole; label: string }[] = [
  { id: 'admin', label: 'Administrador' },
  { id: 'lawyer', label: 'Abogado' },
  { id: 'client', label: 'Cliente' },
  { id: 'user', label: 'Usuario' },
];

export interface ClientModalData {
  userId: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDate?: string;
  phone: string;
  email: string;
  address: string;
  contactInfo: string;
  role: KoopRole;
}

export interface AdminUsersApiClient {
  listUsers(): Promise<{ items: KoopUser[] }>;
  setUserActive(id: string, active: boolean): Promise<void>;
  deleteUser(id: string): Promise<void>;
  setUserRole(id: string, role: KoopRole): Promise<{ user: KoopUser }>;
  createClientFromUser(id: string, payload: Omit<ClientModalData, 'userId' | 'role'>): Promise<void>;
}

export function useAdminUsers(client: AdminUsersApiClient, isAdmin: boolean) {
  const [users, setUsers] = useState<KoopUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<{ id: string; role: KoopRole } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clientModal, setClientModal] = useState<ClientModalData | null>(null);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.listUsers();
      setUsers(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(apiMsg(err, 'No se pudo cargar la lista'));
    } finally {
      setLoading(false);
    }
  }, [client, isAdmin]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    try {
      setUpdating(id);
      await client.setUserActive(id, active);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
    } catch (err) {
      setError(apiMsg(err, 'No se pudo actualizar el usuario'));
    } finally {
      setUpdating(null);
    }
  }, [client]);

  const changeRole = useCallback(async (id: string, role: KoopRole) => {
    const roleLabels: Record<KoopRole, string> = {
      admin: 'administrador', lawyer: 'abogado', client: 'cliente', user: 'usuario',
    };
    const confirmed = window.confirm(
      `¿Deseas asignar el rol ${roleLabels[role] ?? role} a este usuario?`
    );
    if (!confirmed) return;
    try {
      setError(null);
      setRoleUpdating({ id, role });
      const data = await client.setUserRole(id, role);
      if (data?.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
      }
    } catch (err) {
      setError(apiMsg(err, 'No se pudo actualizar los roles'));
    } finally {
      setRoleUpdating(null);
    }
  }, [client]);

  const removeUser = useCallback(async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este usuario? Esta acción es permanente.')) return;
    try {
      setDeleting(id);
      await client.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(apiMsg(err, 'No se pudo eliminar el usuario'));
    } finally {
      setDeleting(null);
    }
  }, [client]);

  const openClientModal = useCallback((u: KoopUser) => {
    setClientError(null);
    const role: KoopRole = u.roles.includes('admin')
      ? 'admin'
      : u.roles.includes('lawyer')
      ? 'lawyer'
      : 'client';
    setClientModal({
      userId: u.id,
      fullName: u.name ?? '',
      documentType: '',
      documentNumber: '',
      birthDate: '',
      phone: '',
      email: u.email ?? '',
      address: '',
      contactInfo: '',
      role,
    });
  }, []);

  const saveClient = useCallback(async () => {
    if (!clientModal?.userId) return;
    setClientError(null);
    try {
      setClientSaving(true);
      const payload = {
        fullName: clientModal.fullName.trim(),
        documentType: clientModal.documentType.trim(),
        documentNumber: clientModal.documentNumber.trim(),
        birthDate: clientModal.birthDate ? new Date(clientModal.birthDate).toISOString() : undefined,
        phone: clientModal.phone.trim(),
        email: clientModal.email.trim(),
        address: clientModal.address.trim(),
        contactInfo: clientModal.contactInfo.trim(),
      };
      if (!payload.fullName) { setClientError('El nombre completo es requerido'); return; }
      await client.createClientFromUser(clientModal.userId, payload);
      setClientModal(null);
      setNotice('Cliente creado y carpeta asignada');
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      setClientError(apiMsg(err, 'No se pudo crear el cliente'));
    } finally {
      setClientSaving(false);
    }
  }, [client, clientModal]);

  return {
    isAdmin,
    users,
    loading,
    error,
    updating,
    roleUpdating,
    deleting,
    clientModal,
    clientSaving,
    clientError,
    notice,
    fetchUsers,
    toggleActive,
    changeRole,
    removeUser,
    openClientModal,
    saveClient,
    setClientModal,
    setClientError,
    setNotice,
  };
}
