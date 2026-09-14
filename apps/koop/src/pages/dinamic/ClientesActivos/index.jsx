import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useClientes } from '../../../hooks/useClientes';
import { listRecentDocs } from '../../../api/docs';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/dashboard.css';
import { SuccessNotice, DangerNotice } from '../../../components/common/Notice';
import { EditForm, EditField, EditRow, EditSelect } from '../../../components/common/EditFormKit';

const EMPTY_CLIENT_FORM = {
  nombre: '',
  tipo_persona: 'NATURAL',
  tipo_documento: 'CC',
  numero_documento: '',
  email: '',
  telefono: '',
};

const TIPO_PERSONA_OPTIONS = [
  { value: 'NATURAL', label: 'Persona natural' },
  { value: 'JURIDICA', label: 'Persona jurídica' },
];

const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PE', label: 'Permiso especial' },
];

function CreateClientModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY_CLIENT_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.nombre.trim()) return setError('El nombre es obligatorio');

    setSaving(true);
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        tipo_persona: form.tipo_persona,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim() || undefined,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
      });
    } catch (e) {
      setError(e?.message || 'Error al crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dash-card" style={{ width: '100%', maxWidth: 560 }}>
        <div className="dash-header" style={{ marginBottom: 12 }}>
          <div className="dash-title">Nuevo cliente</div>
        </div>
        <div className="dash-item">
          <EditForm>
            <EditField label="Nombre completo / razón social" value={form.nombre} onChange={set('nombre')} placeholder="Ej: María Fernanda Torres" />
            <EditRow cols={2}>
              <EditSelect label="Tipo de persona" value={form.tipo_persona} onChange={set('tipo_persona')} options={TIPO_PERSONA_OPTIONS} />
              <EditSelect label="Tipo de documento" value={form.tipo_documento} onChange={set('tipo_documento')} options={TIPO_DOCUMENTO_OPTIONS} />
            </EditRow>
            <EditField label="Número de documento" value={form.numero_documento} onChange={set('numero_documento')} placeholder="Ej: 80153356" />
            <EditRow cols={2}>
              <EditField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="cliente@correo.com" />
              <EditField label="Celular" value={form.telefono} onChange={set('telefono')} placeholder="Ej: 300 123 4567" />
            </EditRow>
          </EditForm>
          {error && <DangerNotice>{error}</DangerNotice>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creando...' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesActivos() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
  const isAdmin = roles.some((r) => String(r || '').toLowerCase() === 'admin');

  const { clientes, loading, error, fetchClientes, createCliente, updateCliente, deleteCliente } = useClientes({ autoFetch: isAdmin });

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [noticeKind, setNoticeKind] = useState('success');
  const [expandedClient, setExpandedClient] = useState(null);
  const [clientFiles, setClientFiles] = useState({});
  const [loadingFiles, setLoadingFiles] = useState({});
  const noticeTimer = useRef(null);

  const showNotice = useCallback((msg, kind = 'success') => {
    setNotice(msg);
    setNoticeKind(kind);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.email, c.numero_documento, c.telefono, c.id]
        .map((v) => String(v ?? '').toLowerCase())
        .some((v) => v.includes(q))
    );
  }, [clientes, search]);

  const folderForClient = useCallback((c) => {
    const id = String(c?.numero_documento ?? c?.id ?? '').trim();
    return id ? `clientes/${id}/` : 'clientes/sin-id/';
  }, []);

  const loadClientFiles = useCallback(async (c) => {
    const folder = folderForClient(c).replace(/\/$/, '');
    setLoadingFiles((prev) => ({ ...prev, [c.id]: true }));
    try {
      const data = await listRecentDocs({ limit: 50, subfolder: folder });
      setClientFiles((prev) => ({ ...prev, [c.id]: Array.isArray(data?.items) ? data.items : [] }));
    } catch {
      setClientFiles((prev) => ({ ...prev, [c.id]: [] }));
    } finally {
      setLoadingFiles((prev) => ({ ...prev, [c.id]: false }));
    }
  }, [folderForClient]);

  const toggleClientExpansion = useCallback(async (c) => {
    if (expandedClient === c.id) { setExpandedClient(null); return; }
    setExpandedClient(c.id);
    if (!clientFiles[c.id]) await loadClientFiles(c);
  }, [expandedClient, clientFiles, loadClientFiles]);

  const onEdit = (c) => setEditing({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    numero_documento: c.numero_documento,
    telefono: c.telefono,
  });

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateCliente(editing.id, {
        nombre: String(editing.nombre ?? '').trim(),
        numero_documento: String(editing.numero_documento ?? '').trim() || undefined,
        telefono: String(editing.telefono ?? '').trim() || undefined,
      });
      setEditing(null);
      showNotice('Cliente actualizado correctamente');
    } catch (e) {
      showNotice(e?.message || 'No se pudo guardar', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmDeleteClient) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCliente(confirmDeleteClient.id);
      setConfirmDeleteClient(null);
      showNotice('Cliente eliminado correctamente', 'danger');
    } catch (e) {
      setDeleteError(e?.message || 'No se pudo eliminar el cliente');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (payload) => {
    await createCliente(payload);
    setShowCreateModal(false);
    showNotice('Cliente creado correctamente');
  };

  if (!isAdmin) {
    return (
      <div className="dash-page" style={{ padding: 40 }}>
        <div className="dash-card" style={{ maxWidth: 560 }}>
          <h2 className="dash-title">Acceso restringido</h2>
          <p style={{ marginTop: 12 }}>Esta sección está disponible solo para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dash-page"
      style={{
        backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
      }}
    >
      <div className="dash-card" style={{ width: '100%', maxWidth: 1200 }}>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .only-mobile { display: block; }
          .only-desktop { display: none; }
          @media (min-width: 768px) { .only-mobile { display: none; } .only-desktop { display: block; } }
          .clients-header { display: grid; gap: 10px; align-items: center; }
          .clients-actions { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; }
          @media (min-width: 768px) { .clients-header { grid-template-columns: 1fr auto; } }
          @media (max-width: 767px) { .clients-actions { grid-template-columns: 1fr 1fr; } .clients-actions input[type=search] { grid-column: 1 / -1; } }
          .mobile-item { border: 1px solid rgba(148,163,184,0.35); border-radius: 10px; overflow: hidden; background: #1b263b; }
          .mobile-item-header { display: flex; align-items: center; justify-content: space-between; padding: 0; cursor: pointer; height: 44px; }
          .mobile-item .btn { border-radius: 10px; width: 100%; }
          .mobile-item-title { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; padding: 0 12px; }
          .mobile-item-details { padding: 10px 12px; border-top: 1px solid rgba(148,163,184,0.25); }
          .kv { display: grid; grid-template-columns: 120px 1fr; gap: 8px; font-size: 14px; }
          @media (max-width: 480px) { .kv { grid-template-columns: 1fr; } }
        `}</style>

        <div className="dash-header clients-header" style={{ marginBottom: 16 }}>
          <div className="dash-title">Clientes</div>
          <div className="clients-actions">
            <input
              type="search"
              name="q"
              autoComplete="off"
              placeholder="Buscar por nombre, email, documento o celular"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: '#1b263b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 8, padding: '6px 10px' }}
            />
            <button className="btn btn-secondary" onClick={fetchClientes} disabled={loading}>
              {loading ? 'Actualizando...' : 'Refrescar'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Nuevo cliente
            </button>
          </div>
        </div>

        {notice && (noticeKind === 'danger' ? <DangerNotice autoHideMs={3500}>{notice}</DangerNotice> : <SuccessNotice autoHideMs={3500}>{notice}</SuccessNotice>)}
        {error && <DangerNotice>{error}</DangerNotice>}

        {/* Desktop table */}
        <div className="dash-item only-desktop" style={{ overflowX: 'auto' }}>
          <table className="me-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Documento</th>
                <th>Celular</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>{loading ? 'Cargando...' : 'No hay clientes para mostrar'}</td></tr>
              )}
              {filtered.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td>
                      <div
                        style={{ cursor: 'pointer', color: '#4fd1c5', fontWeight: 500, textDecoration: 'underline' }}
                        onClick={() => toggleClientExpansion(c)}
                      >
                        {c.nombre || '-'} {expandedClient === c.id ? '▼' : '▶'}
                      </div>
                    </td>
                    <td>{c.email || '-'}</td>
                    <td>{c.numero_documento || '-'}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => onEdit(c)}>Editar</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteClient(c)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {expandedClient === c.id && (
                    <tr key={`expanded-${c.id}`}>
                      <td colSpan={5} style={{ padding: 0, background: '#0c1530' }}>
                        <div style={{ padding: 20 }}>
                          <h4 style={{ margin: '0 0 16px', color: '#e2e8f0' }}>Archivos recientes — {c.nombre}</h4>
                          {loadingFiles[c.id] ? (
                            <div style={{ textAlign: 'center', padding: 24, color: '#cbd5e1' }}>Cargando archivos...</div>
                          ) : (!clientFiles[c.id] || clientFiles[c.id].length === 0) ? (
                            <div style={{ textAlign: 'center', padding: 24, color: '#cbd5e1' }}>No hay archivos para mostrar</div>
                          ) : (
                            <div style={{ border: '1px solid #394b61', borderRadius: 8, overflow: 'hidden', background: '#1b263b' }}>
                              {clientFiles[c.id].map((f) => (
                                <div key={f.key || f.id} style={{ padding: '10px 14px', borderBottom: '1px solid #394b61', color: '#e2e8f0' }}>
                                  {f.name || (f.key || '').split('/').pop()}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="dash-item only-mobile" style={{ display: 'grid', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 8 }}>{loading ? 'Cargando...' : 'No hay clientes para mostrar'}</div>
          )}
          {filtered.map((c) => {
            const isOpen = expandedClient === c.id;
            return (
              <div key={c.id} className="mobile-item">
                <button
                  type="button"
                  className="btn btn-primary btn-sm mobile-item-header"
                  onClick={() => toggleClientExpansion(c)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div className="mobile-item-title">{c.nombre || '-'}</div>
                  <div style={{ opacity: 0.9, fontSize: 12, paddingRight: 10 }}>{isOpen ? '▼' : '▶'}</div>
                </button>
                {isOpen && (
                  <div className="mobile-item-details">
                    <div className="kv"><span>Email</span><div>{c.email || '-'}</div></div>
                    <div className="kv" style={{ marginTop: 6 }}><span>Documento</span><div>{c.numero_documento || '-'}</div></div>
                    <div className="kv" style={{ marginTop: 6 }}><span>Celular</span><div>{c.telefono || '-'}</div></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => onEdit(c)}>Editar</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteClient(c)}>Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="dash-card" style={{ width: '100%', maxWidth: 560, padding: 16 }}>
            <div className="dash-header" style={{ marginBottom: 12 }}><div className="dash-title">Editar cliente</div></div>
            <div className="dash-item">
              <EditForm>
                <EditField label="Nombre" value={editing.nombre} onChange={(e) => setEditing((p) => ({ ...p, nombre: e.target.value }))} />
                <EditField label="Email" type="email" value={editing.email} onChange={() => {}} inputProps={{ readOnly: true }} />
                <EditRow cols={2}>
                  <EditField label="Documento" value={editing.numero_documento} onChange={(e) => setEditing((p) => ({ ...p, numero_documento: e.target.value }))} />
                  <EditField label="Celular" value={editing.telefono} onChange={(e) => setEditing((p) => ({ ...p, telefono: e.target.value }))} />
                </EditRow>
              </EditForm>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteClient && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteClient(null); }}>
          <div className="dash-card" style={{ width: '100%', maxWidth: 480 }}>
            <div className="dash-header" style={{ marginBottom: 8 }}><div className="dash-title">Confirmar eliminación</div></div>
            <div className="dash-item" style={{ display: 'grid', gap: 10 }}>
              <div>¿Eliminar al cliente <strong>{confirmDeleteClient.nombre || confirmDeleteClient.email}</strong>?</div>
              {deleteError && <div style={{ background: '#7f1d1d', color: '#fecaca', padding: 8, borderRadius: 6 }}>{deleteError}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteClient(null)} disabled={deleting}>Cancelar</button>
              <button className="btn btn-primary" onClick={onConfirmDelete} disabled={deleting}>{deleting ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateClientModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
