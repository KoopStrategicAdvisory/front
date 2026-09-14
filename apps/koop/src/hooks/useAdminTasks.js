import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listUsers } from '../api/users';
import { listTareas, createTarea, updateTarea, deleteTarea } from '../api/tareas';

const DEFAULT_TASK_FORM = {
  title: '',
  client: '',
  description: '',
  priorityId: '',
  due: '',
  assignee: '',
  tags: '',
  radicado: '',
  estadoId: '',
};

function normalizeRoles(value) {
  const roles = Array.isArray(value) ? value : [value];
  return roles.map((r) => String(r || '').trim().toLowerCase());
}

/** El spec v2 no expone `/catalogos/estados-tarea` ni `/catalogos/prioridades` — no hay forma
 * de obtener los nombres reales. Se listan los valores de id observados en las tareas cargadas
 * en vez de inventar nombres o IDs. */
function distinctIdOptions(tareas, field, label) {
  const ids = new Set();
  tareas.forEach((t) => { if (t[field] != null) ids.add(t[field]); });
  return Array.from(ids).sort((a, b) => a - b).map((id) => ({ id, nombre: `${label} #${id}` }));
}

// Mapea la tarea del backend al shape plano que usa la UI de AdminTareas.
function toTask(tarea) {
  return {
    id: tarea.id,
    title: tarea.titulo ?? '',
    client: tarea.observaciones ?? '',
    description: tarea.descripcion ?? '',
    priorityId: tarea.id_prioridad ?? '',
    due: tarea.fecha_limite?.slice(0, 10) ?? '',
    assignee: tarea.id_usuario_asignado ?? '',
    estadoId: tarea.id_estado_tarea ?? '',
    // Sin catálogo de estados, "hecho" se deriva de `fecha_completado` (dato real de la tarea,
    // no un nombre inventado); no hay forma de distinguir "en curso" de "pendiente".
    status: tarea.fecha_completado ? 'hecho' : 'pendiente',
    tags: [],
    radicado: null,
    createdAt: tarea.created_at ?? '',
    raw: tarea,
  };
}

export function useAdminTasks() {
  const { user } = useAuth();
  const userRoles = normalizeRoles(user?.roles);
  const isAdmin = userRoles.includes('admin');
  const isLawyer = userRoles.includes('lawyer');
  const canAccess = isAdmin || isLawyer;

  const [tasks, setTasks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [me, setMe] = useState('');
  const [status, setStatus] = useState('all');
  const [viewMine, setViewMine] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_TASK_FORM);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [showErrorNotice, setShowErrorNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  const notifySuccess = useCallback((message) => { setNoticeMessage(message); setShowSuccessNotice(true); }, []);
  const notifyError = useCallback((message) => { setNoticeMessage(message); setShowErrorNotice(true); }, []);

  useEffect(() => { if (showSuccessNotice) { const t = setTimeout(() => setShowSuccessNotice(false), 5000); return () => clearTimeout(t); } }, [showSuccessNotice]);
  useEffect(() => { if (showErrorNotice) { const t = setTimeout(() => setShowErrorNotice(false), 7000); return () => clearTimeout(t); } }, [showErrorNotice]);

  const loadAll = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    setError(null);
    try {
      const [usersRes, tareasRes] = await Promise.all([
        listUsers().catch(() => ({ items: [] })),
        listTareas({ limit: 200 }),
      ]);

      const adminUsers = Array.isArray(usersRes?.items) ? usersRes.items : [];
      setAdmins(adminUsers);
      if (adminUsers.length > 0) setMe((prev) => prev || String(adminUsers[0].id));

      const rawTareas = tareasRes?.items ?? [];
      setTasks(rawTareas.map(toTask));
    } catch (e) {
      notifyError('Error al cargar tareas: ' + (e?.message || ''));
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [canAccess]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const estados = useMemo(
    () => distinctIdOptions(tasks.map((t) => t.raw), 'id_estado_tarea', 'Estado'),
    [tasks]
  );
  const prioridades = useMemo(
    () => distinctIdOptions(tasks.map((t) => t.raw), 'id_prioridad', 'Prioridad'),
    [tasks]
  );

  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_TASK_FORM, assignee: admins.length > 0 ? String(admins[0].id) : '' });
  }, [admins]);

  const openCreateModal = useCallback(() => { resetForm(); setSelectedTask(null); setShowCreateModal(true); }, [resetForm]);
  const openEditModal = useCallback((task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      client: task.client,
      description: task.description || '',
      priorityId: task.priorityId || '',
      due: task.due,
      assignee: task.assignee,
      tags: (task.tags || []).join(', '),
      radicado: task.radicado || '',
      estadoId: task.estadoId || '',
    });
    setShowEditModal(true);
  }, []);
  const openDeleteModal = useCallback((task) => { setSelectedTask(task); setShowDeleteModal(true); }, []);
  const closeCreateModal = useCallback(() => { setShowCreateModal(false); setSelectedTask(null); }, []);
  const closeEditModal = useCallback(() => { setShowEditModal(false); setSelectedTask(null); }, []);
  const closeDeleteModal = useCallback(() => { setShowDeleteModal(false); setSelectedTask(null); }, []);

  const buildPayload = useCallback(() => ({
    titulo: formData.title.trim(),
    descripcion: formData.description.trim() || undefined,
    observaciones: formData.client.trim() || undefined,
    fecha_limite: formData.due || undefined,
    id_usuario_asignado: formData.assignee ? Number(formData.assignee) : undefined,
    id_prioridad: formData.priorityId ? Number(formData.priorityId) : undefined,
  }), [formData]);

  const handleCreateTask = useCallback(async () => {
    if (!formData.title.trim()) { notifyError('El título es obligatorio'); return; }
    try {
      const created = await createTarea(buildPayload());
      setTasks((prev) => [toTask(created), ...prev]);
      closeCreateModal(); resetForm();
      notifySuccess('Tarea creada exitosamente');
    } catch (e) { notifyError('Error al crear tarea: ' + (e?.message || '')); }
  }, [formData, buildPayload, notifyError, notifySuccess, closeCreateModal, resetForm]);

  const handleEditTask = useCallback(async () => {
    if (!formData.title.trim()) { notifyError('El título es obligatorio'); return; }
    try {
      const updated = await updateTarea(selectedTask.id, buildPayload());
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? toTask(updated) : t)));
      closeEditModal(); resetForm();
      notifySuccess('Tarea actualizada exitosamente');
    } catch (e) { notifyError('Error al actualizar tarea: ' + (e?.message || '')); }
  }, [formData, buildPayload, selectedTask, notifyError, notifySuccess, closeEditModal, resetForm]);

  const handleDeleteTask = useCallback(async () => {
    try {
      await deleteTarea(selectedTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      closeDeleteModal();
      notifySuccess('Tarea eliminada exitosamente');
    } catch (e) { notifyError('Error al eliminar tarea: ' + (e?.message || '')); }
  }, [selectedTask, notifyError, notifySuccess, closeDeleteModal]);

  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const updated = await updateTarea(taskId, {
        fecha_completado: newStatus === 'hecho' ? new Date().toISOString() : null,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? toTask(updated) : t)));
      notifySuccess('Estado actualizado');
    } catch (e) { notifyError('Error: ' + (e?.message || '')); }
  }, [tasks, notifyError, notifySuccess]);

  const filteredTasks = useMemo(() => {
    let data = tasks.slice();
    if (viewMine) data = data.filter((t) => String(t.assignee) === String(me));
    if (status !== 'all') data = data.filter((t) => t.status === status);
    const needle = q.trim().toLowerCase();
    if (needle) data = data.filter((t) => [t.title, t.client, t.radicado].filter(Boolean).join(' ').toLowerCase().includes(needle));
    return data;
  }, [tasks, viewMine, me, status, q]);

  return {
    user, isAdmin, canAccess, admins, estados, prioridades, tasks, loading, error,
    q, setQ, me, setMe, status, setStatus, viewMine, setViewMine,
    showCreateModal, showEditModal, showDeleteModal, selectedTask,
    formData, setFormData,
    showSuccessNotice, showErrorNotice, noticeMessage,
    countLabel: `${filteredTasks.length} resultado${filteredTasks.length === 1 ? '' : 's'}`,
    filteredTasks, loadAdmins: loadAll,
    openCreateModal, openEditModal, openDeleteModal,
    closeCreateModal, closeEditModal, closeDeleteModal,
    handleCreateTask, handleEditTask, handleDeleteTask, handleStatusChange,
    resetForm, setError, setNoticeMessage, notifyError, notifySuccess,
    setShowSuccessNotice, setShowErrorNotice,
  };
}
