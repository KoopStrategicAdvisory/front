import React, { useEffect, useState } from 'react';
import { useExpedientes } from '../../../hooks/useExpedientes';
import { estadoProcesoColor } from '../../../constants/estadoProceso';
import '../../../styles/dashboard.css';
import '../../../styles/mis-casos.css';

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }); }
  catch { return iso; }
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function MisCasos() {
  const { expedientes, loading, error, etapas, fetchExpedientes, fetchEtapas } = useExpedientes();
  const [selected, setSelected] = useState(null);
  const [etapasLoading, setEtapasLoading] = useState(false);

  useEffect(() => { fetchExpedientes({ active: true, limit: 100 }); }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const openCase = async (exp) => {
    setSelected(exp);
    setEtapasLoading(true);
    try { await fetchEtapas(exp.id); } finally { setEtapasLoading(false); }
  };

  const sortedEtapas = [...etapas].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));

  return (
    <div
      className="dash-page"
      style={{
        backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      <div className="dash-card" style={{ maxWidth: 900 }}>
        <div className="dash-header">
          <div>
            <div className="dash-title">Mis casos</div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Haz clic en un caso para ver la línea de tiempo del proceso.
            </p>
          </div>
        </div>

        <div className="dash-item" style={{ padding: 0 }}>
          {error && (
            <div className="alert alert-error" style={{ margin: 16 }}>⚠️ {error}</div>
          )}
          {loading && expedientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Cargando tus casos...</div>
          ) : expedientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              Todavía no tienes ningún expediente asociado a tu cuenta.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cases-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e2a3a' }}>
                    <th style={th}>N° Expediente</th>
                    <th style={th}>Materia</th>
                    <th style={th}>Estado</th>
                    <th style={th}>Despacho</th>
                    <th style={th}>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {expedientes.map((exp) => (
                    <tr key={exp.id} onClick={() => openCase(exp)} className="row-clickable">
                      <td style={td}>{exp.numero_de_expediente}</td>
                      <td style={td}>
                        {exp.nombre_tipo_proceso || 'Sin materia'}
                        {exp.nombre_subtipo_proceso && <span style={{ color: '#9fb3cc' }}> — {exp.nombre_subtipo_proceso}</span>}
                      </td>
                      <td style={td}>
                        <span className="badge" style={badge(exp.nombre_estado_proceso)}>{exp.nombre_estado_proceso || 'Sin estado'}</span>
                      </td>
                      <td style={td}>{exp.juzgado_o_autoridad_que_conoce || '—'}</td>
                      <td style={td}>{fmtDate(exp.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="caso-title" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title" id="caso-title">{selected.nombre_tipo_proceso || selected.numero_de_expediente}</div>
              <button className="btn btn-primary" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
            <div className="modal-body">
              <div className="case-grid">
                <div>
                  <div className="muted">N° Expediente</div>
                  <div>{selected.numero_de_expediente}</div>
                </div>
                <div>
                  <div className="muted">Estado</div>
                  <div><span className="badge" style={badge(selected.nombre_estado_proceso)}>{selected.nombre_estado_proceso || 'Sin estado'}</span></div>
                </div>
                <div>
                  <div className="muted">Despacho</div>
                  <div>{selected.juzgado_o_autoridad_que_conoce || '—'}</div>
                </div>
                <div>
                  <div className="muted">Última actualización</div>
                  <div>{fmtDateTime(selected.updated_at)}</div>
                </div>
              </div>

              {etapasLoading ? (
                <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 20 }}>Cargando línea de tiempo...</div>
              ) : sortedEtapas.length === 0 ? (
                <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 20 }}>
                  Aún no se han registrado etapas para este caso.
                </div>
              ) : (
                <div className="timeline">
                  {sortedEtapas.map((etapa, i) => {
                    const estado = String(etapa.nombre_estado_etapa || '').toLowerCase();
                    const done = estado === 'completada';
                    const active = estado === 'en curso';
                    const warn = estado === 'vencida';
                    const skip = estado === 'saltada' || estado === 'cancelada';
                    const dotClass = warn ? 'warn' : skip ? 'skip' : done ? 'done' : active ? 'active' : '';
                    return (
                      <div className={`timeline-step ${done ? 'done' : ''} ${active ? 'active' : ''} ${skip ? 'skip' : ''}`} key={etapa.id}>
                        <div className={`dot ${dotClass}`}></div>
                        {i < sortedEtapas.length - 1 && <div className={`bar ${done ? 'done' : ''}`}></div>}
                        <div className="label">
                          {etapa.orden ?? i + 1}. {etapa.nombre_etapa || 'Etapa'}
                          <span className="sub-label">
                            {etapa.nombre_estado_etapa || 'Pendiente'}
                            {warn && etapa.fecha_vencimiento && ` · venció ${fmtDate(etapa.fecha_vencimiento)}`}
                            {!warn && !done && etapa.fecha_vencimiento && ` · vence ${fmtDate(etapa.fecha_vencimiento)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: 'left',
  padding: '12px 14px',
  borderBottom: '1px solid #394b61',
  fontWeight: 600,
  color: '#e2e8f0',
  whiteSpace: 'nowrap',
};

const td = {
  padding: '12px 14px',
  borderBottom: '1px solid #34465a',
  color: '#e5edf7',
  verticalAlign: 'top',
};

function badge(estado) {
  return {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: 8,
    background: estadoProcesoColor(estado),
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
  };
}
