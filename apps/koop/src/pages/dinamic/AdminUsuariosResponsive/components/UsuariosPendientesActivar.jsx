import { useState, useMemo } from 'react';

export default function UsuariosPendientesActivar({
  users = [],
  loading = false,
  currentUserId,
  updating,
  deleting,
  roleOptions = [],
  onToggleActive,
  onToggleRole,
  onRemoveUser,
  initialOpen = true,
}) {
  const [open, setOpen] = useState(Boolean(initialOpen));
  const [rolePanel, setRolePanel] = useState(null);

  const rolePanelStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.35)',
  };

  const toggleRolePanel = (id) => {
    setRolePanel((prev) => (prev === id ? null : id));
  };

  const pending = useMemo(() => {
    const byCreatedAtDesc = (a, b) => {
      const atA = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const atB = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return atB - atA;
    };
    return (users || []).filter((u) => u?.active === false).sort(byCreatedAtDesc);
  }, [users]);

  const renderRow = (u) => {
    const created = u.created_at ? new Date(u.created_at) : null;
    const roles = Array.isArray(u.roles) ? u.roles : [];
    const rolesLabel = roles.length > 0 ? roles.map((r) => r.nombre).join(', ') : '-';
    const isSelf = String(currentUserId ?? '') === String(u.id ?? '');
    const rolePanelOpen = rolePanel === u.id;

    return (
      <tr key={u.id}>
        <td>{u.nombre || '-'}</td>
        <td>{u.email}</td>
        <td>{rolesLabel}</td>
        <td>
          <span className="me-badge me-badge-error">Inactivo</span>
        </td>
        <td>{created ? created.toLocaleString() : '-'}</td>
        <td>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onToggleActive?.(u.id, true)}
              disabled={updating === u.id}
            >
              {updating === u.id ? 'Guardando...' : 'Activar'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => toggleRolePanel(u.id)}>
              {rolePanelOpen ? 'Cerrar roles' : 'Administrar roles'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onRemoveUser?.(u.id)}
              disabled={deleting === u.id || isSelf}
              title={isSelf ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
            >
              {deleting === u.id ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
          {rolePanelOpen && (
            <div style={rolePanelStyle}>
              {roleOptions.length === 0 && (
                <span style={{ fontSize: 13, opacity: 0.7 }}>No hay roles disponibles en el catálogo</span>
              )}
              {roleOptions.map((role) => {
                const hasRole = roles.some((r) => r.id === role.id);
                return (
                  <button
                    key={role.id}
                    className="btn btn-secondary btn-sm"
                    onClick={() => onToggleRole?.(u.id, role.id, hasRole)}
                    disabled={isSelf}
                    title={isSelf ? 'No puedes modificar tus propios roles' : undefined}
                    style={hasRole ? { borderColor: '#4fd1c5', color: '#4fd1c5' } : undefined}
                  >
                    {hasRole ? `✓ ${role.nombre}` : role.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="dash-item" style={{ marginBottom: 16 }}>
      <div className="dash-header" style={{ marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>
          Usuarios creados (no activados)
          {pending.length > 0 ? ` · ${pending.length}` : ''}
        </h4>
        <button className="btn btn-secondary btn-sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table className="me-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Activo</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>
                    {loading ? 'Cargando...' : 'No hay usuarios no activados'}
                  </td>
                </tr>
              )}
              {pending.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
