import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  createConsultationLog,
  downloadConsultationPdf,
  listConsultationLogs,
  listRadicadosActivos,
} from '../../../api/consultas';
import { Modal } from '../../../components/common/Modal';
import { EditForm, EditField, EditSelect, EditTextArea } from '../../../components/common/EditFormKit';
import '../../../styles/dashboard.css';

const RESULT_OPTIONS = [
  { value: 'sin_movimiento', label: 'Sin movimiento' },
  { value: 'actuacion_nueva', label: 'Actuación nueva' },
  { value: 'termino_corriendo', label: 'Término corriendo' },
];

const RESULT_LABEL = Object.fromEntries(RESULT_OPTIONS.map((o) => [o.value, o.label]));

const RESULT_BADGE_COLOR = {
  sin_movimiento: { bg: 'rgba(79,209,197,0.14)', fg: '#67e8f9', border: 'rgba(79,209,197,0.28)' },
  actuacion_nueva: { bg: 'rgba(240,185,66,0.16)', fg: '#f6cd72', border: 'rgba(240,185,66,0.32)' },
  termino_corriendo: { bg: 'rgba(239,68,68,0.14)', fg: '#fca5a5', border: 'rgba(239,68,68,0.28)' },
};

const CONSULTATION_PORTALS = [
  { label: 'Consulta de procesos Rama Judicial', url: 'https://consultaprocesos.ramajudicial.gov.co/Procesos/Index' },
  { label: 'Publicaciones Procesales Rama Judicial', url: 'https://publicacionesprocesales.ramajudicial.gov.co/' },
  { label: 'SIUGJ', url: 'https://siugj.ramajudicial.gov.co/principalPortal/index.php' },
  { label: 'Consultas Fiscalía', url: 'https://consulta-web.fiscalia.gov.co/' },
  { label: 'Consultas Jurisdiccionales SuperFinanciera', url: 'https://www.superfinanciera.gov.co/formulesuqueja/faces/consulta/jurisdiccional.xhtml' },
];

const PORTAL_OPTIONS = [
  ...CONSULTATION_PORTALS.map((p) => ({ value: p.label, label: p.label })),
  { value: 'Otro', label: 'Otro sitio' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ConsultasPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const [radicados, setRadicados] = useState([]);
  const [radicadosLoading, setRadicadosLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isAdminOrLawyer = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
    return roles.some((role) => ['admin', 'lawyer'].includes(String(role || '').toLowerCase()));
  }, [user]);

  // Modal de registro (se abre desde el checklist o desde "Registro manual")
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id_expediente: '', numero_radicado: '', portal_consultado: CONSULTATION_PORTALS[0].label, resultado: 'sin_movimiento', observacion: '' });
  const [saving, setSaving] = useState(false);

  const pendientes = useMemo(() => radicados.filter((r) => !r.ultima_consulta_hoy_id), [radicados]);
  const revisados = useMemo(() => radicados.filter((r) => r.ultima_consulta_hoy_id), [radicados]);

  const loadRadicados = () => {
    setRadicadosLoading(true);
    listRadicadosActivos(selectedDate)
      .then((data) => setRadicados(Array.isArray(data.items) ? data.items : []))
      .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar los expedientes activos.' }))
      .finally(() => setRadicadosLoading(false));
  };

  const loadRecords = () => {
    setRecordsLoading(true);
    listConsultationLogs(selectedDate)
      .then((data) => setRecords(Array.isArray(data.items) ? data.items : []))
      .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar los registros del día.' }))
      .finally(() => setRecordsLoading(false));
  };

  useEffect(() => { if (selectedDate) { loadRadicados(); loadRecords(); } }, [selectedDate]);

  const openFormFor = (item) => {
    setForm({
      id_expediente: item?.id_expediente || '',
      numero_radicado: item?.numero_radicado_despacho || '',
      portal_consultado: CONSULTATION_PORTALS[0].label,
      resultado: 'sin_movimiento',
      observacion: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.numero_radicado.trim()) {
      setMessage({ type: 'error', text: 'El radicado es requerido.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createConsultationLog({
        id_expediente: form.id_expediente || undefined,
        numero_radicado: form.numero_radicado.trim(),
        portal_consultado: form.portal_consultado || undefined,
        resultado: form.resultado,
        observacion: form.observacion.trim() || undefined,
        fecha_consulta: selectedDate,
      });
      setShowForm(false);
      setMessage({ type: 'success', text: 'Registro guardado — queda constancia de la revisión.' });
      loadRadicados();
      loadRecords();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'No se pudo guardar el registro.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      const blob = await downloadConsultationPdf(selectedDate);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bitacora-diaria-${selectedDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: 'error', text: 'No se pudo generar el PDF.' });
    } finally {
      setPdfLoading(false);
    }
  };

  if (!isAdminOrLawyer) {
    return (
      <div className="dash-page" style={{ padding: 24 }}>
        <div className="dash-card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Acceso no autorizado</div>
          <div>No tienes permiso para ver esta sección.</div>
        </div>
      </div>
    );
  }

  const borderCol = 'var(--border)';

  return (
    <div className="dash-page" style={{ padding: 24 }}>
      <div className="dash-card" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="dash-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="dash-title">Consultas externas diarias</div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Revisión diaria de los procesos activos en los portales externos, con constancia de quién y cuándo la hizo.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="date" className="input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setSelectedDate(todayIso())}>Hoy</button>
            <button className="btn btn-gold btn-sm" type="button" onClick={handleDownloadPdf} disabled={pdfLoading}>
              {pdfLoading ? 'Generando…' : '📄 Generar constancia PDF'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : ''}`} style={message.type === 'success' ? { background: 'var(--success-bg)', color: '#bdf5dd', border: '1px solid rgba(167,243,208,0.25)' } : undefined}>
            {message.text}
          </div>
        )}

        {/* Checklist del día */}
        <div className="dash-item" style={{ marginTop: 16 }}>
          <div className="koop-section-head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="koop-section-icon" aria-hidden="true">✅</span>
              <span className="koop-section-title">Checklist de hoy</span>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {radicadosLoading ? 'Cargando…' : `${revisados.length} de ${radicados.length} revisados`}
            </span>
          </div>

          {radicadosLoading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>Cargando expedientes activos...</div>
          ) : radicados.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>
              No hay expedientes activos con radicado de despacho registrado todavía.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              {[...pendientes, ...revisados].map((item) => {
                const done = !!item.ultima_consulta_hoy_id;
                const badge = done ? RESULT_BADGE_COLOR[item.ultimo_resultado_hoy] || RESULT_BADGE_COLOR.sin_movimiento : null;
                return (
                  <div
                    key={item.id_expediente}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                      padding: '12px 14px', borderRadius: 12,
                      background: done ? 'rgba(52,211,153,0.05)' : 'linear-gradient(180deg, var(--surface-3), var(--surface-2))',
                      border: `1px solid ${done ? 'rgba(52,211,153,0.22)' : borderCol}`,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {item.nombre_cliente || 'Sin cliente'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {item.numero_de_expediente}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Radicado: {item.numero_radicado_despacho}
                      </div>
                    </div>
                    {done ? (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}`, whiteSpace: 'nowrap' }}>
                        ✓ {RESULT_LABEL[item.ultimo_resultado_hoy] || 'Revisado'}
                      </span>
                    ) : (
                      <button type="button" className="btn btn-gold btn-sm" onClick={() => openFormFor(item)}>
                        Marcar revisado
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Portales externos */}
        <div className="dash-item" style={{ marginTop: 16 }}>
          <div className="koop-section-head">
            <span className="koop-section-icon" aria-hidden="true">🔗</span>
            <span className="koop-section-title">Portales de consulta</span>
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {CONSULTATION_PORTALS.map((portal) => (
              <button
                key={portal.label}
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => window.open(portal.url, '_blank', 'noopener')}
              >
                {portal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registro manual (radicado que no está en el checklist) */}
        <div className="dash-item" style={{ marginTop: 16 }}>
          <div className="koop-section-head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="koop-section-icon" aria-hidden="true">✍️</span>
              <span className="koop-section-title">Registro manual</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openFormFor(null)}>
              + Nuevo registro
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Para un radicado externo que aún no tiene expediente asociado en el sistema.
          </p>
        </div>

        {/* Registros del día */}
        <div className="dash-item" style={{ marginTop: 16 }}>
          <div className="koop-section-head">
            <span className="koop-section-icon" aria-hidden="true">📋</span>
            <span className="koop-section-title">Registros del {selectedDate}</span>
          </div>
          {recordsLoading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Cargando registros...</div>
          ) : records.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No hay registros para esta fecha.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {records.map((record) => {
                const badge = RESULT_BADGE_COLOR[record.resultado] || RESULT_BADGE_COLOR.sin_movimiento;
                return (
                  <div key={record.id} style={{ padding: 14, borderRadius: 12, background: 'linear-gradient(180deg, var(--surface-3), var(--surface-2))', border: `1px solid ${borderCol}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 600 }}>
                        {record.numero_radicado} {record.numero_de_expediente ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {record.numero_de_expediente}</span> : null}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}` }}>
                        {RESULT_LABEL[record.resultado] || record.resultado}
                      </span>
                    </div>
                    {(record.nombre_cliente || record.nombre_contraparte) && (
                      <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        Partes: {record.nombre_cliente || '—'}{record.nombre_contraparte ? ` vs. ${record.nombre_contraparte}` : ''}
                      </div>
                    )}
                    {record.portal_consultado && (
                      <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        Sitio consultado: {record.portal_consultado}
                      </div>
                    )}
                    {record.observacion && <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13.5 }}>{record.observacion}</div>}
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                      Revisado por {record.nombre_usuario || '—'} · {formatDateTime(record.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal show={showForm} onClose={() => setShowForm(false)} title="✅ Registrar revisión">
        <EditForm>
          <EditField label="Radicado *" value={form.numero_radicado} onChange={(e) => setForm({ ...form, numero_radicado: e.target.value })} placeholder="Ej: 11001-31-05-2025-00123" />
          <EditSelect
            label="Sitio / portal consultado"
            value={form.portal_consultado}
            onChange={(e) => setForm({ ...form, portal_consultado: e.target.value })}
            options={PORTAL_OPTIONS}
          />
          <EditSelect
            label="Resultado"
            value={form.resultado}
            onChange={(e) => setForm({ ...form, resultado: e.target.value })}
            options={RESULT_OPTIONS}
          />
          <EditTextArea label="Observación" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} rows={4} placeholder="Detalles relevantes de la revisión (opcional)" />
        </EditForm>
        <div className="kf-modal-footer" style={{ padding: '18px 0 0' }}>
          <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</button>
          <button className="btn btn-gold" type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar registro'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
