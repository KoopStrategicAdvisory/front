import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpedientes } from '../../../hooks/useExpedientes';
import { useAccess } from '../../../context/AccessContext';
import { useAuth } from '../../../context/AuthContext';
import { listTiposProceso, listTipoProcCombo, listSubtiposProceso, listTiposPretension } from '../../../api/catalogos';
import { listClientes } from '../../../api/clientes';
import { EditForm, EditRow, EditField, EditSelect } from '../../../components/common/EditFormKit';
import { Modal, DeleteModal } from '../../../components/common/Modal';
import { WizardSteps, WizardPanel, WizardFooter, Reveal } from '../../../components/common/Wizard';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  numero_de_expediente: '',
  numero_radicado_despacho: '',
  id_cliente: '',
  juzgado_o_autoridad_que_conoce: '',
  id_tipo_proc_subtipo_proc_tipo_pre: '',
  _tipoProceso: '',
  _subtipoProceso: '',
};

const WIZARD_STEPS = ['Datos básicos', 'Materia del caso', 'Confirmar'];

// Asistente paso a paso para crear/editar un expediente. Antes era un solo
// formulario plano con todos los campos a la vez; ahora avanza en 3 pasos
// (datos básicos -> materia del caso en cascada -> confirmación), con
// transiciones animadas entre pasos y revelado progresivo de los campos
// dependientes (subtipo tras elegir tipo, pretensión tras elegir subtipo).
function ExpedienteWizard({ form, onChange, tiposProceso, combos, subtiposProceso, tiposPretension, clientes, onSubmit, onCancel, submitLabel, submitting, startMaxReached = 0 }) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(startMaxReached);
  const [direction, setDirection] = useState(1);

  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  const nombreSubtipo = (id) => subtiposProceso.find((s) => String(s.id) === String(id))?.nombre || `Subtipo #${id}`;
  const nombrePretension = (id) => tiposPretension.find((p) => String(p.id) === String(id))?.nombre || `Pretensión #${id}`;
  const nombreCliente = clientes.find((c) => String(c.id) === String(form.id_cliente))?.nombre;
  const nombreTipoProceso = tiposProceso.find((t) => String(t.id) === String(form._tipoProceso))?.nombre;

  const clienteOptions = clientes.map((c) => ({ value: String(c.id), label: c.nombre }));
  const tipoOptions = useMemo(() => tiposProceso.map((t) => ({ value: String(t.id), label: t.nombre })), [tiposProceso]);

  const subtipoOptions = useMemo(() => {
    if (!form._tipoProceso) return [];
    const seen = new Set();
    return combos
      .filter((c) => String(c.id_tipo_proceso) === String(form._tipoProceso))
      .filter((c) => (seen.has(c.id_subtipo_proceso) ? false : seen.add(c.id_subtipo_proceso)))
      .map((c) => ({ value: String(c.id_subtipo_proceso), label: nombreSubtipo(c.id_subtipo_proceso) }));
  }, [combos, form._tipoProceso, subtiposProceso]);

  const pretensionOptions = useMemo(() => {
    if (!form._subtipoProceso) return [];
    return combos
      .filter((c) => String(c.id_tipo_proceso) === String(form._tipoProceso) && String(c.id_subtipo_proceso) === String(form._subtipoProceso))
      .map((c) => ({ value: String(c.id), label: nombrePretension(c.id_tipo_pretension) }));
  }, [combos, form._tipoProceso, form._subtipoProceso, tiposPretension]);

  const onTipo = (e) => onChange({ ...form, _tipoProceso: e.target.value, _subtipoProceso: '', id_tipo_proc_subtipo_proc_tipo_pre: '' });
  const onSubtipo = (e) => onChange({ ...form, _subtipoProceso: e.target.value, id_tipo_proc_subtipo_proc_tipo_pre: '' });
  const onPretension = (e) => onChange({ ...form, id_tipo_proc_subtipo_proc_tipo_pre: e.target.value });

  const stepValid = [
    !!form.numero_de_expediente.trim() && !!form.id_cliente,
    !!form.id_tipo_proc_subtipo_proc_tipo_pre,
    true,
  ];

  const goTo = (i) => { setDirection(i > step ? 1 : -1); setStep(i); };
  const goNext = () => { if (!stepValid[step]) return; const next = Math.min(step + 1, WIZARD_STEPS.length - 1); setDirection(1); setStep(next); setMaxReached((m) => Math.max(m, next)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(0, s - 1)); };

  return (
    <div>
      <WizardSteps steps={WIZARD_STEPS} current={step} maxReached={maxReached} onJump={goTo} />

      <WizardPanel stepKey={step} direction={direction}>
        {step === 0 && (
          <EditForm>
            <EditField label="N° Expediente KOOP *" value={form.numero_de_expediente} onChange={set('numero_de_expediente')} placeholder="KOOP-2024-001" />
            <EditField label="N° Radicado del despacho (opcional)" value={form.numero_radicado_despacho} onChange={set('numero_radicado_despacho')} placeholder="Ej: 11001310300320240012300" />
            <EditSelect
              label="Cliente *"
              value={form.id_cliente}
              onChange={set('id_cliente')}
              options={[{ value: '', label: clientes.length ? 'Seleccione cliente' : 'Cargando clientes...' }, ...clienteOptions]}
            />
          </EditForm>
        )}

        {step === 1 && (
          <EditForm>
            {tiposProceso.length === 0 ? (
              <EditField label="Tipo de proceso" value="" onChange={() => {}} placeholder="Cargando catálogo..." inputProps={{ readOnly: true }} />
            ) : (
              <>
                <EditSelect
                  label="Tipo de proceso"
                  value={form._tipoProceso}
                  onChange={onTipo}
                  options={[{ value: '', label: 'Seleccione tipo de proceso' }, ...tipoOptions]}
                />
                {form._tipoProceso && (
                  <Reveal revealKey={`subtipo-${form._tipoProceso}`}>
                    <EditSelect
                      label="Subtipo de proceso"
                      value={form._subtipoProceso}
                      onChange={onSubtipo}
                      options={[{ value: '', label: 'Seleccione subtipo' }, ...subtipoOptions]}
                    />
                  </Reveal>
                )}
                {form._subtipoProceso && pretensionOptions.length > 0 && (
                  <Reveal revealKey={`pretension-${form._subtipoProceso}`}>
                    <EditSelect
                      label="Tipo de pretensión"
                      value={form.id_tipo_proc_subtipo_proc_tipo_pre}
                      onChange={onPretension}
                      options={[{ value: '', label: 'Seleccione pretensión' }, ...pretensionOptions]}
                    />
                  </Reveal>
                )}
              </>
            )}
          </EditForm>
        )}

        {step === 2 && (
          <EditForm>
            <EditField label="Juzgado / Autoridad que conoce" value={form.juzgado_o_autoridad_que_conoce} onChange={set('juzgado_o_autoridad_que_conoce')} placeholder="Juzgado 5 Laboral del Circuito de Bogotá" />
            <dl className="kf-wizard-summary">
              <div className="kf-wizard-summary-row"><dt>N° Expediente KOOP</dt><dd>{form.numero_de_expediente || '—'}</dd></div>
              <div className="kf-wizard-summary-row"><dt>N° Radicado del despacho</dt><dd>{form.numero_radicado_despacho || '—'}</dd></div>
              <div className="kf-wizard-summary-row"><dt>Cliente</dt><dd>{nombreCliente || '—'}</dd></div>
              <div className="kf-wizard-summary-row"><dt>Materia</dt><dd>{nombreTipoProceso || '—'}</dd></div>
            </dl>
          </EditForm>
        )}
      </WizardPanel>

      <WizardFooter>
        {step === 0 ? (
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        ) : (
          <button className="btn btn-secondary" onClick={goBack}>← Atrás</button>
        )}
        {step < WIZARD_STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={goNext} disabled={!stepValid[step]}>Siguiente →</button>
        ) : (
          <button className="btn btn-primary" onClick={onSubmit} disabled={submitting}>{submitLabel}</button>
        )}
      </WizardFooter>
    </div>
  );
}

function expedienteToForm(exp, combos) {
  let _tipoProceso = '';
  let _subtipoProceso = '';
  if (exp.id_tipo_proc_subtipo_proc_tipo_pre) {
    const found = combos.find((c) => c.id === exp.id_tipo_proc_subtipo_proc_tipo_pre);
    if (found) {
      _tipoProceso = String(found.id_tipo_proceso);
      _subtipoProceso = String(found.id_subtipo_proceso);
    }
  }
  return {
    numero_de_expediente: exp.numero_de_expediente || '',
    numero_radicado_despacho: exp.numero_radicado_despacho || '',
    id_cliente: exp.id_cliente != null ? String(exp.id_cliente) : '',
    juzgado_o_autoridad_que_conoce: exp.juzgado_o_autoridad_que_conoce || '',
    id_tipo_proc_subtipo_proc_tipo_pre: exp.id_tipo_proc_subtipo_proc_tipo_pre != null ? String(exp.id_tipo_proc_subtipo_proc_tipo_pre) : '',
    _tipoProceso,
    _subtipoProceso,
  };
}

function formToPayload(form) {
  const payload = {
    numero_de_expediente: form.numero_de_expediente,
    numero_radicado_despacho: form.numero_radicado_despacho?.trim() || undefined,
    juzgado_o_autoridad_que_conoce: form.juzgado_o_autoridad_que_conoce || undefined,
  };
  if (form.id_cliente) payload.id_cliente = Number(form.id_cliente);
  if (form.id_tipo_proc_subtipo_proc_tipo_pre) {
    payload.id_tipo_proc_subtipo_proc_tipo_pre = Number(form.id_tipo_proc_subtipo_proc_tipo_pre);
  }
  return payload;
}

export default function Expedientes() {
  const { role } = useAccess();
  const { user } = useAuth();
  const isAdmin = role === 'admin';
  const isLawyer = role === 'lawyer';
  const canEdit = isAdmin || isLawyer;
  const navigate = useNavigate();

  const {
    expedientes,
    loading,
    error,
    total,
    fetchExpedientes,
    createExpediente,
    updateExpediente,
    deleteExpediente,
  } = useExpedientes();

  const [tiposProceso, setTiposProceso] = useState([]);
  const [combos, setCombos] = useState([]);
  const [subtiposProceso, setSubtiposProceso] = useState([]);
  const [tiposPretension, setTiposPretension] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [q, setQ] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  const doFetch = useCallback((search, pg) => {
    fetchExpedientes({ search: search || undefined, offset: (pg - 1) * PAGE_SIZE, limit: PAGE_SIZE });
  }, [fetchExpedientes]);

  useEffect(() => {
    doFetch('', 1);
    listTiposProceso().then(setTiposProceso).catch(() => {});
    listTipoProcCombo().then(setCombos).catch(() => {});
    listSubtiposProceso().then(setSubtiposProceso).catch(() => {});
    listTiposPretension().then(setTiposPretension).catch(() => {});
    listClientes().then((r) => setClientes(r.items || [])).catch(() => {});
  }, []);

  const clienteNombre = useCallback(
    (idCliente) => clientes.find((c) => c.id === idCliente)?.nombre,
    [clientes]
  );
  const tipoProcesoNombre = useCallback(
    (exp) => {
      const combo = combos.find((c) => c.id === exp.id_tipo_proc_subtipo_proc_tipo_pre);
      if (!combo) return null;
      return tiposProceso.find((t) => t.id === combo.id_tipo_proceso)?.nombre;
    },
    [combos, tiposProceso]
  );

  const onSearchChange = (e) => {
    const val = e.target.value;
    setQ(val);
    setCurrentPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(val, 1), 400);
  };

  const goToPage = (pg) => {
    setCurrentPage(pg);
    doFetch(q, pg);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const showMsg = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setShowCreate(true); };
  const openEdit = (exp) => { setEditTarget(exp); setForm(expedienteToForm(exp, combos)); setShowEdit(true); };
  const openDelete = (exp) => { setEditTarget(exp); setShowDelete(true); };

  const handleCreate = async () => {
    if (!form.numero_de_expediente.trim() || !form.id_cliente) { showMsg('N° expediente y cliente son obligatorios', 'danger'); return; }
    try {
      await createExpediente(formToPayload(form));
      setShowCreate(false);
      showMsg('Expediente creado exitosamente');
    } catch (e) {
      showMsg(e?.message || 'Error al crear expediente', 'danger');
    }
  };

  const handleEdit = async () => {
    try {
      await updateExpediente(editTarget.id, formToPayload(form));
      setShowEdit(false);
      showMsg('Expediente actualizado');
    } catch (e) {
      showMsg(e?.message || 'Error al actualizar', 'danger');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpediente(editTarget.id);
      setShowDelete(false);
      showMsg('Expediente eliminado', 'danger');
    } catch (e) {
      showMsg(e?.message || 'Error al eliminar', 'danger');
    }
  };

  const cardBg = 'linear-gradient(135deg, #2a3a51, #1e2a3a)';
  const borderCol = '#394b61';

  return (
    <div
      className="dash-page"
      style={{ backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', padding: '20px' }}
    >
      <div className="dash-card" style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${borderCol}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 8h10M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: 'var(--ff-heading)', color: '#e2e8f0' }}>Expedientes</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9fb3cc' }}>Gestión de expedientes jurídicos</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#9fb3cc', padding: '4px 8px', background: '#1e2a3a', borderRadius: 6, border: `1px solid ${borderCol}` }}>
              {loading ? 'Cargando...' : `${total} expediente${total !== 1 ? 's' : ''}`}
            </div>
            {canEdit && (
              <button className="btn btn-primary" onClick={openCreate} style={{ fontSize: 14, padding: '10px 16px' }}>
                ➕ Nuevo Expediente
              </button>
            )}
          </div>
        </div>

        {/* Search */}
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
            ⚠️ {error} — <button onClick={() => fetchExpedientes()} style={{ background: 'none', border: 'none', color: '#67e8f9', cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button>
          </div>
        )}

        {/* Cards list */}
        <div style={{ background: '#1e2a3a', borderRadius: 12, border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Lista de expedientes</h3>
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
                <p style={{ margin: 0, fontSize: 14 }}>{canEdit ? 'Crea el primer expediente con el botón de arriba.' : 'No hay expedientes asignados aún.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                {expedientes.map((exp) => {
                  const nombreTipoProceso = tipoProcesoNombre(exp);
                  const nombreCliente = clienteNombre(exp.id_cliente);
                  return (
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
                          {nombreTipoProceso && (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(79,209,197,0.1)', color: '#67e8f9', border: '1px solid rgba(79,209,197,0.2)' }}>
                              {nombreTipoProceso}
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{nombreCliente || 'Sin cliente'}</h4>
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
                      </div>

                      {canEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 12, borderTop: `1px solid ${borderCol}`, gap: 6 }}>
                          <button onClick={(e) => { e.stopPropagation(); openEdit(exp); }} style={{ padding: '4px 8px', background: '#4fd1c5', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }} title="Editar">✏️</button>
                          {isAdmin && <button onClick={(e) => { e.stopPropagation(); openDelete(exp); }} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }} title="Eliminar">🗑️</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {notice && (
        <div style={{ position: 'fixed', top: 20, right: 20, padding: 16, borderRadius: 8, zIndex: 10001, maxWidth: 400, boxShadow: '0 6px 18px rgba(0,0,0,0.25)', background: notice.type === 'success' ? '#064e3b' : '#7f1d1d', color: notice.type === 'success' ? '#a7f3d0' : '#fecaca', border: `1px solid ${notice.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(248,113,113,0.35)'}` }}>
          {notice.type === 'success' ? '✅' : '❌'} {notice.msg}
        </div>
      )}

      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="➕ Nuevo Expediente">
        <ExpedienteWizard
          form={form} onChange={setForm}
          tiposProceso={tiposProceso} combos={combos} subtiposProceso={subtiposProceso} tiposPretension={tiposPretension} clientes={clientes}
          onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Crear expediente" submitting={loading}
        />
      </Modal>

      <Modal show={showEdit && !!editTarget} onClose={() => setShowEdit(false)} title="✏️ Editar Expediente">
        <ExpedienteWizard
          form={form} onChange={setForm}
          tiposProceso={tiposProceso} combos={combos} subtiposProceso={subtiposProceso} tiposPretension={tiposPretension} clientes={clientes}
          onSubmit={handleEdit} onCancel={() => setShowEdit(false)} submitLabel="Guardar cambios" submitting={loading}
          startMaxReached={WIZARD_STEPS.length - 1}
        />
      </Modal>

      <DeleteModal
        show={showDelete && !!editTarget}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        description={editTarget && (
          <>¿Eliminar el expediente <strong style={{ color: '#fc771c' }}>{editTarget.numero_de_expediente}</strong> — {clienteNombre(editTarget.id_cliente) || 'sin cliente'}?</>
        )}
      />
    </div>
  );
}
