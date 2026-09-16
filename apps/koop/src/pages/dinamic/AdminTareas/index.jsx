import { useAdminTasks } from '../../../hooks/useAdminTasks';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';
import { TaskFormFields } from '../../../components/common/TaskFormFields';

function getUserInfo(userId, admins) {
  const admin = admins.find((adminItem) => String(adminItem.id) === String(userId));
  if (admin) {
    const name = admin.nombre || admin.email || 'Usuario';
    const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#0ea5e9', '#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#ef4444'];
    const colorIndex = admins.indexOf(admin) % colors.length;
    return { name, initials, color: colors[colorIndex] };
  }
  return { name: 'Usuario', initials: 'U', color: '#6b7280' };
}

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }); } catch { return iso; }
}

function isOverdue(iso) {
  if (!iso) return false;
  try { return new Date(iso) < new Date(new Date().toDateString()); } catch { return false; }
}

export default function AdminTareas() {
  const {
    isAdmin,
    canAccess,
    admins,
    expedientes,
    estados,
    prioridades,
    loading,
    q,
    setQ,
    me,
    setMe,
    status,
    setStatus,
    viewMine,
    setViewMine,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    selectedTask,
    formData,
    setFormData,
    showSuccessNotice,
    showErrorNotice,
    noticeMessage,
    countLabel,
    filteredTasks,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeCreateModal,
    closeEditModal,
    closeDeleteModal,
    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleStatusChange,
    resetForm,
    setShowSuccessNotice,
    setShowErrorNotice,
  } = useAdminTasks();

  if (!canAccess) {
    return (
      <div className="dash-page" style={{ padding: 40 }}>
        <div className="dash-card" style={{ maxWidth: 560 }}>
          <h2 className="dash-title">Acceso restringido</h2>
          <p style={{ marginTop: 12 }}>
            Esta sección está disponible solo para administradores y abogados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dash-page"
      style={{
        backgroundImage:
          "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <div className="dash-card" style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #394b61',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4fd1c5, #fc771c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 209, 197, 0.3)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#e2e8f0', letterSpacing: '0.5px' }}>
                Tablero de Tareas
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#9fb3cc' }}>
                Gestión y seguimiento de tareas del equipo
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#9fb3cc', padding: '4px 8px', background: '#1e2a3a', borderRadius: '6px', border: '1px solid #394b61' }}>
              {loading ? 'Cargando...' : `${admins.length} admin${admins.length !== 1 ? 's' : ''}`}
            </div>
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={loading || admins.length === 0}
            >
              ➕ Nueva Tarea
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <input
              type="search"
              placeholder="Buscar por título o expediente..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: '#1e2a3a', border: '1px solid #394b61', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px' }}
            />
          </div>

          <select
            value={me}
            onChange={(e) => setMe(e.target.value)}
            style={{ padding: '12px 16px', background: '#1e2a3a', border: '1px solid #394b61', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', minWidth: '200px' }}
          >
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.nombre || admin.email} (Admin)
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '12px 16px', background: '#1e2a3a', border: '1px solid #394b61', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', minWidth: '150px' }}
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="hecho">Hecho</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${viewMine ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMine(true)}
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            Mis tareas
          </button>
          <button
            className={`btn ${!viewMine ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMine(false)}
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            Todas las tareas
          </button>
        </div>

        <div style={{ background: '#1e2a3a', borderRadius: '12px', border: '1px solid #394b61', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #394b61', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>{viewMine ? 'Mis tareas' : 'Todas las tareas'}</h3>
            <span style={{ fontSize: '14px', color: '#9fb3cc', background: '#2a3a51', padding: '4px 12px', borderRadius: '20px' }}>{countLabel}</span>
          </div>

          <div style={{ padding: '20px' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9fb3cc' }}>
                <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #4fd1c5, #fc771c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>No hay tareas asignadas</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#9fb3cc' }}>Cuando te asignen una tarea aparecerá aquí</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {filteredTasks.map((t) => {
                  const u = getUserInfo(t.assignee, admins);
                  const statusTxt = t.status === 'hecho' ? 'Hecho' : 'Pendiente';
                  return (
                    <div
                      key={t.id}
                      style={{
                        background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)',
                        border: '1px solid #394b61',
                        borderRadius: '12px',
                        padding: '20px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4fd1c5';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 209, 197, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#394b61';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#e2e8f0', lineHeight: '1.4' }}>{t.title}</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#9fb3cc' }}>
                          Expediente: <strong style={{ color: '#4fd1c5' }}>{t.numeroExpediente || '—'}</strong>
                        </p>
                        {t.client && (
                          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#9fb3cc' }}>{t.client}</p>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        {t.prioridadNombre && (
                          <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(79, 209, 197, 0.15)', color: '#67e8f9', border: '1px solid rgba(79, 209, 197, 0.3)' }}>
                            {t.prioridadNombre.toUpperCase()}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: t.status === 'hecho' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)', color: t.status === 'hecho' ? '#bbf7d0' : '#d1d5db', border: `1px solid ${t.status === 'hecho' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}` }}>
                          {t.estadoNombre || statusTxt}
                        </span>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: isOverdue(t.due) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 209, 197, 0.15)', color: isOverdue(t.due) ? '#fecaca' : '#67e8f9', border: `1px solid ${isOverdue(t.due) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(79, 209, 197, 0.3)'}` }}>
                          {isOverdue(t.due) ? 'VENCIDA' : 'VENCE'}: {fmtDate(t.due)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #394b61' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>
                            {u.initials}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9fb3cc' }}>Asignada a</p>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{u.name}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            style={{ fontSize: '11px', padding: '4px 8px', background: '#1e2a3a', border: '1px solid #394b61', borderRadius: '6px', color: '#e2e8f0' }}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="hecho">Hecho</option>
                          </select>

                          <button
                            onClick={() => openEditModal(t)}
                            style={{ padding: '4px 8px', background: '#4fd1c5', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', cursor: 'pointer' }}
                            title="Editar tarea"
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() => openDeleteModal(t)}
                            style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', cursor: 'pointer' }}
                            title="Eliminar tarea"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSuccessNotice && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#064e3b', color: '#a7f3d0', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)', zIndex: 10001, maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>✅ {noticeMessage}</span>
            <button onClick={() => setShowSuccessNotice(false)} style={{ background: 'transparent', border: 'none', color: '#a7f3d0', fontSize: '18px', cursor: 'pointer', marginLeft: '10px' }}>×</button>
          </div>
        </div>
      )}
      {showErrorNotice && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#7f1d1d', color: '#fecaca', padding: '16px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.35)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)', zIndex: 10001, maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>❌ {noticeMessage}</span>
            <button onClick={() => setShowErrorNotice(false)} style={{ background: 'transparent', border: 'none', color: '#fecaca', fontSize: '18px', cursor: 'pointer', marginLeft: '10px' }}>×</button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1e2a3a', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', border: '1px solid #394b61', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>➕ Nueva Tarea</h3>
            <TaskFormFields formData={formData} setFormData={setFormData} admins={admins} estados={estados} prioridades={prioridades} expedientes={expedientes} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => { closeCreateModal(); resetForm(); }} style={{ padding: '10px 20px' }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreateTask} style={{ padding: '10px 20px' }}>Crear Tarea</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1e2a3a', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', border: '1px solid #394b61', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>✏️ Editar Tarea</h3>
            <TaskFormFields formData={formData} setFormData={setFormData} admins={admins} estados={estados} prioridades={prioridades} expedientes={expedientes} isEdit />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => { closeEditModal(); resetForm(); }} style={{ padding: '10px 20px' }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleEditTask} style={{ padding: '10px 20px' }}>Actualizar Tarea</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1e2a3a', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', border: '1px solid #394b61', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>🗑️ Eliminar Tarea</h3>
            <p style={{ margin: '0 0 20px 0', color: '#9fb3cc', fontSize: '14px', lineHeight: '1.5' }}>
              ¿Estás seguro de que quieres eliminar la tarea <strong style={{ color: '#fc771c' }}>&quot;{selectedTask.title}&quot;</strong>?
            </p>
            <p style={{ margin: '0 0 20px 0', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>⚠️ Esta acción no se puede deshacer</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeDeleteModal} style={{ padding: '10px 20px' }}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeleteTask} style={{ padding: '10px 20px' }}>Eliminar Tarea</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
