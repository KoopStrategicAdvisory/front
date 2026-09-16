import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listUsers } from '../api/users';
import { listTareas, createTarea, updateTarea, deleteTarea } from '../api/tareas';
import { listEstadosTarea, listPrioridades } from '../api/catalogos';
import { listExpedientes } from '../api/expedientes';

const DEFAULT_TASK_FORM = {
  title: '',
  client: '',
  description: '',
  priorityId: '',
  due: '',
  assignee: '',
  estadoId: '',
  expedienteId: '',
};

function normalizeRoles(value) {
  const roles = Array.isArray(value) ? value : [value];
  return roles.map((r) => String(r || '').trim().toLowerCase());
}

// Mapea la tarea del backend al shape plano que usa la UI de AdminTareas.
function toTask(tarea) {
  return {
    id: tarea.id,
    title: tarea.titulo ?? '',
    client: tarea.observaciones ?? '',
    description: tarea.descripcion ?? '',
    priorityId: tarea.id_prioridad ?? '',
    prioridadNombre: tarea.nombre_prioridad ?? '',
    due: tarea.fecha_limite?.slice(0, 10) ?? '',
    assignee: tarea.id_usuario_asignado ?? '',
    estadoId: tarea.id_estado_tarea ?? '',
    estadoNombre: tarea.nombre_estado_tarea ?? '',
    expedienteId: tarea.id_expediente ?? '',
    numeroExpediente: tarea.numero_de_expediente ?? '',
    // El toggle rapido "Pendiente/Hecho" de cada tarjeta se deriva de `fecha_completado`
    // (dato real) — es una simplificacion binaria sobre el estado real de 6 valores
    // (Pendiente/En curso/Completada/Vencida/Cancelada/Reasignada), util como atajo,
    // pero el nombre de estado real (estadoNombre) es el que se muestra en la tarjeta.
    status: tarea.fecha_completado ? 'hecho' : 'pendiente',
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
  const [expedientes, setExpedientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
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
      const [usersRes, tareasRes, estadosRes, prioridadesRes, expedientesRes] = await Promise.all([
        listUsers().catch(() => ({ items: [] })),
        listTareas({ limit: 200 }),
        listEstadosTarea().catch(() => []),
        listPrioridades().catch(() => []),
        listExpedientes({ limit: 200 }).catch(() => ({ items: [] })),
      ]);

      const adminUsers = Array.isArray(usersRes?.items) ? usersRes.items : [];
      setAdmins(adminUsers);
      if (adminUsers.length > 0) setMe((prev) => prev || String(adminUsers[0].id));

      setEstados(Array.isArray(estadosRes) ? estadosRes : []);
      setPrioridades(Array.isArray(prioridadesRes) ? prioridadesRes : []);
      setExpedientes(Array.isArray(expedientesRes?.items) ? expedientesRes.items : []);

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

  // id_estado_tarea es NOT NULL en el esquema — toda tarea nueva necesita un estado desde
  // el arranque. Se parte de "Pendiente" del catalogo real en vez de dejarlo vacio.
  const estadoPendienteId = useMemo(
    () => estados.find((e) => /pendiente/i.test(e.nombre))?.id ?? (estados[0]?.id ?? ''),
    [estados]
  );

  const resetForm = useCallback(() => {
    setFormData({
      ...DEFAULT_TASK_FORM,
      assignee: admins.length > 0 ? String(admins[0].id) : '',
      estadoId: estadoPendienteId ? String(estadoPendienteId) : '',
    });
  }, [admins, estadoPendienteId]);

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
      estadoId: task.estadoId || '',
      expedienteId: task.expedienteId || '',
    });
    setShowEditModal(true);
  }, []);
  const openDeleteModal = useCallback((task) => { setSelectedTask(task); setShowDeleteModal(true); }, []);
  const closeCreateModal = useCallback(() => { setShowCreateModal(false); setSelectedTask(null); }, []);
  const closeEditModal = useCallback(() => { setShowEditModal(false); setSelectedTask(null); }, []);
  const closeDeleteModal = useCallback(() => { setShowDeleteModal(false); setSelectedTask(null); }, []);

  // id_expediente e id_estado_tarea son NOT NULL en el esquema (tareas.id_expediente,
  // tareas.id_estado_tarea) — antes ninguno de los dos se mandaba, asi que crear una
  // tarea siempre fallaba con un 400 del backend. id_expediente solo se manda al crear:
  // el backend no permite reasignar el expediente de una tarea existente (no esta en
  // los campos editables de tareas.update).
  const buildPayload = useCallback((isCreate) => ({
    titulo: formData.title.trim(),
    descripcion: formData.description.trim() || undefined,
    observaciones: formData.client.trim() || undefined,
    fecha_limite: formData.due || undefined,
    id_usuario_asignado: formData.assignee ? Number(formData.assignee) : undefined,
    id_prioridad: formData.priorityId ? Number(formData.priorityId) : undefined,
    id_estado_tarea: formData.estadoId ? Number(formData.estadoId) : undefined,
    ...(isCreate ? { id_expediente: formData.expedienteId ? Number(formData.expedienteId) : undefined } : {}),
  }), [formData]);

  const handleCreateTask = useCallback(async () => {
    if (!formData.title.trim()) { notifyError('El título es obligatorio'); return; }
    if (!formData.expedienteId) { notifyError('El expediente es obligatorio'); return; }
    if (!formData.estadoId) { notifyError('El estado es obligatorio'); return; }
    try {
      await createTarea(buildPayload(true));
      // El INSERT devuelve la fila cruda, sin los nombres del catalogo (nombre_estado_tarea,
      // nombre_prioridad, numero_de_expediente) que solo trae el listado con JOIN — se
      // recarga todo para no dejar esos nombres en blanco hasta el proximo refresh manual.
      await loadAll();
      closeCreateModal(); resetForm();
      notifySuccess('Tarea creada exitosamente');
    } catch (e) { notifyError('Error al crear tarea: ' + (e?.response?.data?.message || e?.message || '')); }
  }, [formData, buildPayload, notifyError, notifySuccess, closeCreateModal, resetForm, loadAll]);

  const handleEditTask = useCallback(async () => {
    if (!formData.title.trim()) { notifyError('El título es obligatorio'); return; }
    try {
      await updateTarea(selectedTask.id, buildPayload(false));
      await loadAll();
      closeEditModal(); resetForm();
      notifySuccess('Tarea actualizada exitosamente');
    } catch (e) { notifyError('Error al actualizar tarea: ' + (e?.response?.data?.message || e?.message || '')); }
  }, [formData, buildPayload, selectedTask, notifyError, notifySuccess, closeEditModal, resetForm, loadAll]);

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
      await updateTarea(taskId, {
        fecha_completado: newStatus === 'hecho' ? new Date().toISOString() : null,
      });
      await loadAll();
      notifySuccess('Estado actualizado');
    } catch (e) { notifyError('Error: ' + (e?.message || '')); }
  }, [tasks, notifyError, notifySuccess, loadAll]);

  const filteredTasks = useMemo(() => {
    let data = tasks.slice();
    if (viewMine) data = data.filter((t) => String(t.assignee) === String(me));
    if (status !== 'all') data = data.filter((t) => t.status === status);
    const needle = q.trim().toLowerCase();
    if (needle) data = data.filter((t) => [t.title, t.client, t.numeroExpediente].filter(Boolean).join(' ').toLowerCase().includes(needle));
    return data;
  }, [tasks, viewMine, me, status, q]);

  return {
    user, isAdmin, canAccess, admins, expedientes, estados, prioridades, tasks, loading, error,
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
