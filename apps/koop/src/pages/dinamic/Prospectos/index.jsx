import React, { useEffect, useState } from 'react';
import { useAccess } from '../../../context/AccessContext';
import { listProspectos, deleteProspecto } from '../../../api/users';
import '../../../styles/dashboard.css';

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function ProspectosPage() {
  const { role } = useAccess();
  const canView = role === 'admin' || role === 'lawyer';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listProspectos()
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'No se pudo cargar la lista.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (canView) load(); }, [canView]);

  const handleDiscard = async (item) => {
    if (!window.confirm(`¿Descartar el registro de "${item.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(item.id);
    try {
      await deleteProspecto(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNotice('Descartado.');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setNotice(e?.response?.data?.message || e?.message || 'No se pudo descartar.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!canView) {
    return (
      <div className="dash-page" style={{ padding: 24 }}>
        <div className="dash-card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Acceso no autorizado</div>
          <div>No tienes permiso para ver esta sección.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page" style={{ padding: 24 }}>
      <div className="dash-card" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="dash-header">
          <div>
            <div className="dash-title">Prospectos</div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Personas que se registraron en el portal pero cuya cédula no coincide con ningún cliente cargado — quizás quieren una asesoría. Revísalos y decide si los contactas o los descartas.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? 'Cargando…' : '↻ Refrescar'}
          </button>
        </div>

        {notice && (
          <div className="alert" style={{ background: 'var(--success-bg)', color: '#bdf5dd', border: '1px solid rgba(167,243,208,0.25)', marginBottom: 12 }}>
            {notice}
          </div>
        )}
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

        {loading && items.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Cargando…</div>
        ) : items.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No hay prospectos pendientes por revisar.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
                  padding: '14px 16px', borderRadius: 12,
                  background: 'linear-gradient(180deg, var(--surface-3), var(--surface-2))',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text-primary)' }}>{item.nombre || 'Sin nombre'}</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    <span>✉️ {item.email}</span>
                    {item.telefono_principal && <span>📞 {item.telefono_principal}</span>}
                    {item.numero_documento && <span>🪪 {item.tipo_documento} {item.numero_documento}</span>}
                    <span>🕒 {fmtDate(item.created_at)}</span>
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDiscard(item)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? 'Descartando…' : '🗑️ Descartar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
