import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  createConsultationLog,
  downloadConsultationPdf,
  listConsultationLogs,
  listRadicadosActivos,
  verificarRamaJudicial,
} from '../../../api/consultas';
import { listExpedientes, listRadicadosPublicos, createRadicadoPublico } from '../../../api/expedientes';
import { Modal } from '../../../components/common/Modal';
import { EditForm, EditSelect, EditTextArea } from '../../../components/common/EditFormKit';
import { CONSULTATION_PORTALS, ORGANISMO_OPTIONS } from '../../../constants/consultaPortals';
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const EMPTY_FORM = {
  id_expediente: '',
  id_radicado_publico: '',
  numero_radicado: '',
  organismo: '',
  resultado: 'sin_movimiento',
  observacion: '',
};

export default function ConsultasPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const [radicados, setRadicados] = useState([]);
  const [radicadosLoading, setRadicadosLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [verificandoRama, setVerificandoRama] = useState(false);

  const isAdminOrLawyer = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
    return roles.some((role) => ['admin', 'lawyer'].includes(String(role || '').toLowerCase()));
  }, [user]);

  // Modal de registro — dos modos:
  //  - checklist: el radicado ya viene fijo (viene del checklist de hoy).
  //  - manual: primero se elige el expediente, y de ahi el radicado publico
  //    (o se crea uno nuevo en el sitio), porque el mismo expediente puede
  //    tener un radicado distinto por cada organismo externo.
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('checklist');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [expedientes, setExpedientes] = useState([]);
  const [expedientesLoading, setExpedientesLoading] = useState(false);
  const [expRadicados, setExpRadicados] = useState([]);
  const [expRadicadosLoading, setExpRadicadosLoading] = useState(false);
  const [showNewRadicado, setShowNewRadicado] = useState(false);
  const [newRadicado, setNewRadicado] = useState({ organismo: CONSULTATION_PORTALS[0].label, numero_radicado: '' });
  const [addingRadicado, setAddingRadicado] = useState(false);

  const pendientes = useMemo(() => radicados.filter((r) => !r.ultima_consulta_hoy_id), [radicados]);
  const revisados = useMemo(() => radicados.filter((r) => r.ultima_consulta_hoy_id), [radicados]);

  const loadRadicados = () => {
    setRadicadosLoading(true);
    listRadicadosActivos(selectedDate)
      .then((data) => setRadicados(Array.isArray(data.items) ? data.items : []))
      .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar los radicados activos.' }))
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

  // Dispara ahora mismo el mismo chequeo que corre solo cada dia a las 6am:
  // busca cada radicado de Rama Judicial en el portal publico (sin captcha)
  // y actualiza cual tuvo actuacion nueva desde la ultima vez que se reviso.
  const handleVerificarRama = async () => {
    setVerificandoRama(true);
    setMessage(null);
    try {
      const r = await verificarRamaJudicial();
      loadRadicados();
      const texto = r.novedades > 0
        ? `Se encontraron ${r.novedades} radicado${r.novedades === 1 ? '' : 's'} con actuación nueva de ${r.revisados} revisados en Rama Judicial.`
        : `Se revisaron ${r.revisados} radicados en Rama Judicial — sin novedades.`;
      setMessage({ type: 'success', text: texto + (r.errores.length ? ` (${r.errores.length} no se pudieron consultar)` : '') });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'No se pudo verificar Rama Judicial.' });
    } finally {
      setVerificandoRama(false);
    }
  };

  // Si el verificador automatico ya encontro una actuacion nueva para este
  // radicado, se precarga el formulario con eso — el abogado solo confirma
  // o ajusta en vez de escribir todo desde cero.
  const openFromChecklist = (item) => {
    setFormMode('checklist');
    const hayNovedadAutomatica = !!item.ultima_actuacion_texto;
    setForm({
      id_expediente: item.id_expediente,
      id_radicado_publico: item.id_radicado_publico,
      numero_radicado: item.numero_radicado,
      organismo: item.organismo,
      resultado: hayNovedadAutomatica ? 'actuacion_nueva' : 'sin_movimiento',
      observacion: hayNovedadAutomatica ? `Detectado automáticamente (Rama Judicial): ${item.ultima_actuacion_texto}` : '',
    });
    setShowForm(true);
  };

  const openManual = () => {
    setFormMode('manual');
    setForm(EMPTY_FORM);
    setExpRadicados([]);
    setShowNewRadicado(false);
    setShowForm(true);
    if (expedientes.length === 0) {
      setExpedientesLoading(true);
      listExpedientes({ active: true, limit: 200 })
        .then((data) => setExpedientes(Array.isArray(data.items) ? data.items : []))
        .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar los expedientes.' }))
        .finally(() => setExpedientesLoading(false));
    }
  };

  const onSelectExpediente = (idExpediente) => {
    setForm((f) => ({ ...f, id_expediente: idExpediente, id_radicado_publico: '', numero_radicado: '', organismo: '' }));
    setExpRadicados([]);
    setShowNewRadicado(false);
    if (!idExpediente) return;
    setExpRadicadosLoading(true);
    listRadicadosPublicos(idExpediente)
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        setExpRadicados(items);
        if (items.length === 0) setShowNewRadicado(true);
      })
      .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar los radicados de ese expediente.' }))
      .finally(() => setExpRadicadosLoading(false));
  };

  const onSelectRadicadoPublico = (idRadicado) => {
    const found = expRadicados.find((r) => String(r.id) === String(idRadicado));
    setForm((f) => ({
      ...f,
      id_radicado_publico: idRadicado,
      numero_radicado: found?.numero_radicado || '',
      organismo: found?.organismo || '',
    }));
  };

  const handleAddRadicado = async () => {
    if (!form.id_expediente || !newRadicado.numero_radicado.trim()) {
      setMessage({ type: 'error', text: 'Elige el expediente y escribe el número de radicado.' });
      return;
    }
    setAddingRadicado(true);
    try {
      const created = await createRadicadoPublico(form.id_expediente, {
        organismo: newRadicado.organismo,
        numero_radicado: newRadicado.numero_radicado.trim(),
      });
      setExpRadicados((prev) => [...prev.filter((r) => r.id !== created.id), created]);
      setForm((f) => ({ ...f, id_radicado_publico: created.id, numero_radicado: created.numero_radicado, organismo: created.organismo }));
      setShowNewRadicado(false);
      setNewRadicado({ organismo: CONSULTATION_PORTALS[0].label, numero_radicado: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'No se pudo agregar el radicado.' });
    } finally {
      setAddingRadicado(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.numero_radicado.trim()) {
      setMessage({ type: 'error', text: 'Selecciona (o agrega) un radicado antes de guardar.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createConsultationLog({
        id_expediente: form.id_expediente || undefined,
        id_radicado_publico: form.id_radicado_publico || undefined,
        numero_radicado: form.numero_radicado.trim(),
        portal_consultado: form.organismo || undefined,
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
  const expedienteOptions = expedientes.map((e) => ({
    value: String(e.id),
    label: `${e.numero_de_expediente}${e.nombre_cliente ? ` — ${e.nombre_cliente}` : ''}`,
  }));
  const radicadoOptions = expRadicados.map((r) => ({ value: String(r.id), label: `${r.organismo} — ${r.numero_radicado}` }));

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
          <div className="koop-section-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="koop-section-icon" aria-hidden="true">✅</span>
              <span className="koop-section-title">Checklist de hoy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleVerificarRama} disabled={verificandoRama}>
                {verificandoRama ? 'Verificando…' : '🤖 Verificar Rama Judicial ahora'}
              </button>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {radicadosLoading ? 'Cargando…' : `${revisados.length} de ${radicados.length} revisados`}
              </span>
            </div>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Un mismo expediente puede aparecer varias veces si tiene radicado en más de un organismo (Rama Judicial, Fiscalía, etc.) — cada uno se revisa por separado. Los de Rama Judicial también se verifican solos todos los días a las 6:00 a.m.
          </p>

          {radicadosLoading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>Cargando radicados activos...</div>
          ) : radicados.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>
              Ningún expediente activo tiene todavía un radicado público registrado. Usa "Registro manual" para agregar el primero.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              {[...pendientes, ...revisados].map((item) => {
                const done = !!item.ultima_consulta_hoy_id;
                const badge = done ? RESULT_BADGE_COLOR[item.ultimo_resultado_hoy] || RESULT_BADGE_COLOR.sin_movimiento : null;
                return (
                  <div
                    key={item.id_radicado_publico}
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
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.14)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                          {item.organismo}
                        </span>
                        <span>Radicado: {item.numero_radicado}</span>
                      </div>
                      {!done && item.ultima_actuacion_texto && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#f6cd72', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <span>🤖</span>
                          <span>Detectado automáticamente: {item.ultima_actuacion_texto}</span>
                        </div>
                      )}
                    </div>
                    {done ? (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}`, whiteSpace: 'nowrap' }}>
                        ✓ {RESULT_LABEL[item.ultimo_resultado_hoy] || 'Revisado'}
                      </span>
                    ) : (
                      <button type="button" className="btn btn-gold btn-sm" onClick={() => openFromChecklist(item)}>
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

        {/* Registro manual */}
        <div className="dash-item" style={{ marginTop: 16 }}>
          <div className="koop-section-head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="koop-section-icon" aria-hidden="true">✍️</span>
              <span className="koop-section-title">Registro manual</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={openManual}>
              + Elegir expediente
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Elige el expediente y el organismo/radicado público que corresponda (Rama Judicial, Fiscalía, Publicaciones Procesales...) — si el expediente aún no tiene ese radicado registrado, lo puedes agregar en el momento.
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
          {formMode === 'manual' ? (
            <>
              <EditSelect
                label="Expediente *"
                value={form.id_expediente ? String(form.id_expediente) : ''}
                onChange={(e) => onSelectExpediente(e.target.value)}
                options={expedientesLoading ? [{ value: '', label: 'Cargando expedientes...' }] : expedienteOptions}
              />
              {form.id_expediente && (
                <>
                  {expRadicadosLoading ? (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cargando radicados del expediente...</div>
                  ) : radicadoOptions.length > 0 && !showNewRadicado ? (
                    <>
                      <EditSelect
                        label="Radicado público *"
                        value={form.id_radicado_publico ? String(form.id_radicado_publico) : ''}
                        onChange={(e) => onSelectRadicadoPublico(e.target.value)}
                        options={radicadoOptions}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" style={{ justifySelf: 'start' }} onClick={() => setShowNewRadicado(true)}>
                        + Agregar otro radicado a este expediente
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 10, border: '1px dashed var(--border)' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Nuevo radicado público</div>
                      <EditSelect
                        label="Organismo"
                        value={newRadicado.organismo}
                        onChange={(e) => setNewRadicado((n) => ({ ...n, organismo: e.target.value }))}
                        options={ORGANISMO_OPTIONS}
                      />
                      <input
                        className="input"
                        placeholder="Número de radicado"
                        value={newRadicado.numero_radicado}
                        onChange={(e) => setNewRadicado((n) => ({ ...n, numero_radicado: e.target.value }))}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleAddRadicado} disabled={addingRadicado}>
                          {addingRadicado ? 'Agregando…' : 'Agregar radicado'}
                        </button>
                        {radicadoOptions.length > 0 && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewRadicado(false)}>Cancelar</button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(148,163,184,0.05)', border: '1px solid var(--border-subtle)', fontSize: 13.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{form.organismo}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Radicado: {form.numero_radicado}</div>
            </div>
          )}

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
          <button className="btn btn-gold" type="button" onClick={handleSubmit} disabled={saving || !form.numero_radicado}>
            {saving ? 'Guardando…' : 'Guardar registro'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
