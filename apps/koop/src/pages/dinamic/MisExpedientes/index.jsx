import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpedientes } from '../../../hooks/useExpedientes';
import { useAccess } from '../../../context/AccessContext';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';

const PAGE_SIZE = 20;

// "Mis expedientes": vista personal sobre los MISMOS expedientes reales que
// administra la firma en /admin/expedientes — no es un sistema aparte. Cada
// quien ve solo lo suyo:
//   - cliente: el backend ya fuerza esto solo (scopeExpedientesQuery), no
//     hace falta mandar ningun filtro — pedir de mas no sirve de nada,
//     el backend lo ignora y de todas formas solo devuelve lo suyo.
//   - abogado/socio/admin: se filtra por id_usuario (el abogado responsable)
//     para mostrar solo los expedientes que le pertenecen a esa persona,
//     dejando la vista de "todos los expedientes de la firma" para
//     /admin/expedientes.
export default function MisExpedientes() {
  const { role } = useAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isClient = role === 'client';

  const { expedientes, loading, error, total, fetchExpedientes } = useExpedientes();

  const [q, setQ] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef(null);

  const doFetch = useCallback((search, pg) => {
    const params = { search: search || undefined, offset: (pg - 1) * PAGE_SIZE, limit: PAGE_SIZE };
    if (!isClient && user?.id) params.id_usuario = user.id;
    fetchExpedientes(params);
  }, [fetchExpedientes, isClient, user?.id]);

  useEffect(() => {
    doFetch('', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, user?.id]);

  const onSearchChange = (e) => {
    const val = e.target.value;
    setQ(val);
    setCurrentPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(val, 1), 400);
  };

  const goToPage = (pg) => { setCurrentPage(pg); doFetch(q, pg); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cardBg = 'linear-gradient(135deg, #2a3a51, #1e2a3a)';
  const borderCol = '#394b61';
  const titulo = isClient ? 'Mi expediente' : 'Mis expedientes';
  const subtitulo = isClient
    ? 'El expediente y los documentos asociados a tu cuenta'
    : 'Los expedientes en los que eres el abogado responsable';
  const vacioMsg = isClient
    ? 'Todavía no tienes ningún expediente asociado a tu cuenta. Si ya eres cliente de la firma, contáctanos para vincularlo.'
    : 'No tienes expedientes asignados como responsable. Si crees que falta alguno, contacta a un administrador.';

  return (
    <div
      className="dash-page"
      style={{ backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', padding: '20px' }}
    >
      <div className="dash-card" style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${borderCol}`, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 8h10M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{titulo}</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9fb3cc' }}>{subtitulo}</p>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#9fb3cc', padding: '4px 8px', background: '#1e2a3a', borderRadius: 6, border: `1px solid ${borderCol}` }}>
            {loading ? 'Cargando...' : `${total} expediente${total !== 1 ? 's' : ''}`}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <input
            type="search"
            placeholder="Buscar por número de expediente..."
            value={q}
            onChange={onSearchChange}
            style={{ width: '100%', padding: '12px 16px', background: '#1e2a3a', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 14 }}
          />
        </div>

        {error && (
          <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', marginBottom: 16, fontSize: 14 }}>
            ⚠️ {error} — <button onClick={() => doFetch(q, currentPage)} style={{ background: 'none', border: 'none', color: '#67e8f9', cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button>
          </div>
        )}

        <div style={{ background: '#1e2a3a', borderRadius: 12, border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>{titulo}</h3>
            <span style={{ fontSize: 14, color: '#9fb3cc', background: '#2a3a51', padding: '4px 12px', borderRadius: 20 }}>{total} resultado{total !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ padding: 20 }}>
            {loading && expedientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9fb3cc' }}>Cargando expedientes...</div>
            ) : expedientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9fb3cc' }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 8h10M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>No hay expedientes</h4>
                <p style={{ margin: '0 auto', maxWidth: 420, fontSize: 14 }}>{vacioMsg}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                {expedientes.map((exp) => (
                  <div
                    key={exp.id}
                    style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderCol; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onClick={() => navigate(`/admin/expedientes/${exp.id}`)}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }}>
                          {exp.numero_de_expediente || 'SIN N°'}
                        </span>
                        {exp.nombre_tipo_proceso && (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(79,209,197,0.1)', color: '#67e8f9', border: '1px solid rgba(79,209,197,0.2)' }}>
                            {exp.nombre_tipo_proceso}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
                        {isClient ? (exp.nombre_usuario ? `Abogado: ${exp.nombre_usuario}` : 'Sin abogado asignado') : (exp.nombre_cliente || 'Sin cliente')}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {exp.numero_radicado_despacho && (
                        <div style={{ fontSize: 13, color: '#9fb3cc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.numero_radicado_despacho}>
                          <span style={{ color: '#64748b' }}>Radicado despacho:</span> <span style={{ color: '#cbd5e1' }}>{exp.numero_radicado_despacho}</span>
                        </div>
                      )}
                      {exp.juzgado_o_autoridad_que_conoce && (
                        <div style={{ fontSize: 13, color: '#9fb3cc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.juzgado_o_autoridad_que_conoce}>
                          <span style={{ color: '#64748b' }}>Juzgado:</span> <span style={{ color: '#cbd5e1' }}>{exp.juzgado_o_autoridad_que_conoce}</span>
                        </div>
                      )}
                      {exp.nombre_estado_proceso && (
                        <div style={{ fontSize: 13, color: '#9fb3cc' }}>
                          <span style={{ color: '#64748b' }}>Estado:</span> <span style={{ color: '#cbd5e1' }}>{exp.nombre_estado_proceso}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 12, borderTop: `1px solid ${borderCol}` }}>
                      <span style={{ fontSize: 12, color: '#67e8f9' }}>Ver expediente →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px', borderTop: `1px solid ${borderCol}` }}>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1 || loading} style={{ padding: '8px 16px', background: currentPage <= 1 ? 'transparent' : '#2a3a51', border: `1px solid ${borderCol}`, borderRadius: 6, color: currentPage <= 1 ? '#394b61' : '#9fb3cc', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>← Anterior</button>
              <span style={{ fontSize: 13, color: '#9fb3cc' }}>Página {currentPage} de {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages || loading} style={{ padding: '8px 16px', background: currentPage >= totalPages ? 'transparent' : '#2a3a51', border: `1px solid ${borderCol}`, borderRadius: 6, color: currentPage >= totalPages ? '#394b61' : '#9fb3cc', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13 }}>Siguiente →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
