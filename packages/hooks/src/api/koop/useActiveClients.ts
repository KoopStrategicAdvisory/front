import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KoopClient, KoopDocument, KoopUser } from '@repo/types';

type ApiError = { response?: { data?: { message?: string } }; message?: string };
const apiMsg = (err: unknown, fallback: string) =>
  (err as ApiError)?.response?.data?.message ?? (err as ApiError)?.message ?? fallback;

export interface ActiveClientsApiClient {
  listActiveClients(): Promise<{ items: KoopClient[] }>;
  updateClient(id: string, payload: Partial<KoopClient>): Promise<{ client: KoopClient }>;
  assignClientAdmin(id: string, adminUserId: string): Promise<void>;
  deleteClient(id: string, adminPass?: string): Promise<{ s3?: { deleted: number } }>;
  listUsers(): Promise<{ items: KoopUser[] }>;
  listRecentDocs(params: { limit: number; subfolder: string }): Promise<{ items: KoopDocument[] }>;
}

export function useActiveClients(client: ActiveClientsApiClient, isAdmin: boolean) {
  const [clients, setClients] = useState<KoopClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<KoopClient> & { id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignClient, setAssignClient] = useState<KoopClient | null>(null);
  const [admins, setAdmins] = useState<Pick<KoopUser, 'id' | 'name' | 'email'>[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [filesOpen, setFilesOpen] = useState(false);
  const [filesClient, setFilesClient] = useState<KoopClient | null>(null);
  const [clientFiles, setClientFiles] = useState<Record<string, KoopDocument[]>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<KoopClient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePass, setDeletePass] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] = useState<'success' | 'danger'>('success');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string, kind: 'success' | 'danger' = 'success') => {
    setNotice(msg);
    setNoticeKind(kind);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const fetchClients = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.listActiveClients();
      setClients(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(apiMsg(err, 'No se pudo cargar la lista de clientes'));
    } finally {
      setLoading(false);
    }
  }, [client, isAdmin]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.email, c.documentNumber, c.phone, c.id]
        .map((v) => String(v ?? '').toLowerCase())
        .some((v) => v.includes(q))
    );
  }, [clients, search]);

  const getAssignedFor = useCallback(
    (clientId: string) => clients.find((c) => c.id === clientId)?.assignedAdmin ?? null,
    [clients]
  );

  const openAssignModal = useCallback(async (c: KoopClient) => {
    setAssignClient(c);
    setAssignOpen(true);
    setAdminsError(null);
    setAdminsLoading(true);
    try {
      const data = await client.listUsers();
      const items = Array.isArray(data?.items) ? data.items : [];
      const adminUsers = items.filter((u) =>
        (Array.isArray(u.roles) ? u.roles : [u.roles])
          .map((r) => String(r ?? '').toLowerCase())
          .includes('admin')
      );
      setAdmins(adminUsers.map((u) => ({ id: u.id, name: u.name ?? u.id, email: u.email ?? '' })));
      setSelectedAdminId(getAssignedFor(c.id)?.id ?? '');
    } catch (err) {
      setAdminsError(apiMsg(err, 'No se pudo cargar administradores'));
    } finally {
      setAdminsLoading(false);
    }
  }, [client, getAssignedFor]);

  const onSaveAssignment = useCallback(async () => {
    if (!assignClient) return;
    try {
      await client.assignClientAdmin(assignClient.id, selectedAdminId);
      await fetchClients();
      setAssignOpen(false);
      setAssignClient(null);
    } catch (err) {
      setAdminsError(apiMsg(err, 'No se pudo asignar'));
    }
  }, [client, assignClient, selectedAdminId, fetchClients]);

  const onEdit = useCallback((c: KoopClient) => {
    setEditing({ id: c.id, name: c.name, email: c.email, documentNumber: c.documentNumber, phone: c.phone });
  }, []);

  const onSave = useCallback(async () => {
    if (!editing) return;
    const payload: Partial<KoopClient> = {
      name: String(editing.name ?? '').trim(),
      documentNumber: String(editing.documentNumber ?? '').trim(),
      phone: String(editing.phone ?? '').trim(),
    };
    try {
      setSaving(true);
      setError(null);
      const resp = await client.updateClient(editing.id, payload);
      if (resp?.client) {
        setClients((prev) => prev.map((c) => (c.id === resp.client.id ? { ...c, ...resp.client } : c)));
      }
      setEditing(null);
    } catch (err) {
      setError(apiMsg(err, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }, [client, editing]);

  const onAskDelete = useCallback((c: KoopClient) => {
    setConfirmDeleteClient(c);
    setConfirmDeleteOpen(true);
    setDeleteError(null);
    setDeletePass('');
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!confirmDeleteClient) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      const res = await client.deleteClient(confirmDeleteClient.id, deletePass);
      await fetchClients();
      setConfirmDeleteOpen(false);
      setConfirmDeleteClient(null);
      const deleted = res?.s3?.deleted;
      showNotice(
        typeof deleted === 'number'
          ? `Cliente eliminado. Archivos S3 eliminados: ${deleted}`
          : 'Cliente eliminado correctamente',
        'danger'
      );
    } catch (err) {
      setDeleteError(apiMsg(err, 'No se pudo eliminar el cliente'));
    } finally {
      setDeleting(false);
    }
  }, [client, confirmDeleteClient, deletePass, fetchClients, showNotice]);

  const folderForClient = useCallback((c: KoopClient) => {
    const id = String(c?.documentNumber ?? c?.id ?? '').trim();
    return id ? `clientes/${id}/` : 'clientes/sin-id/';
  }, []);

  const loadClientFiles = useCallback(async (c: KoopClient) => {
    const folder = folderForClient(c);
    setLoadingFiles((prev) => ({ ...prev, [c.id]: true }));
    try {
      const subfolder = folder.startsWith('clientes/') ? folder.replace(/\/$/, '') : folder;
      const data = await client.listRecentDocs({ limit: 50, subfolder });
      setClientFiles((prev) => ({ ...prev, [c.id]: Array.isArray(data?.items) ? data.items : [] }));
    } catch {
      setClientFiles((prev) => ({ ...prev, [c.id]: [] }));
    } finally {
      setLoadingFiles((prev) => ({ ...prev, [c.id]: false }));
    }
  }, [client, folderForClient]);

  const toggleClientExpansion = useCallback(async (c: KoopClient) => {
    if (expandedClient === c.id) { setExpandedClient(null); return; }
    setExpandedClient(c.id);
    if (!clientFiles[c.id]) await loadClientFiles(c);
  }, [expandedClient, clientFiles, loadClientFiles]);

  return {
    isAdmin,
    clients,
    loading,
    error,
    editing,
    setEditing,
    saving,
    search,
    setSearch,
    expandedClient,
    collapseClient: useCallback(() => setExpandedClient(null), []),
    assignOpen,
    assignClient,
    admins,
    adminsLoading,
    adminsError,
    selectedAdminId,
    setSelectedAdminId,
    filesOpen,
    filesClient,
    clientFiles,
    loadingFiles,
    confirmDeleteOpen,
    confirmDeleteClient,
    deleting,
    deleteError,
    deletePass,
    setDeletePass,
    notice,
    noticeKind,
    filtered,
    fetchClients,
    getAssignedFor,
    openAssignModal,
    onSaveAssignment,
    onEdit,
    onSave,
    onAskDelete,
    onConfirmDelete,
    openFilesModal: useCallback((c: KoopClient) => { setFilesClient(c); setFilesOpen(true); }, []),
    folderForClient,
    loadClientFiles,
    toggleClientExpansion,
    closeAssignModal: useCallback(() => { setAssignOpen(false); setAssignClient(null); }, []),
    closeFilesModal: useCallback(() => { setFilesOpen(false); setFilesClient(null); }, []),
    closeDeleteModal: useCallback(() => { setConfirmDeleteOpen(false); setConfirmDeleteClient(null); }, []),
    showNotice,
  };
}
