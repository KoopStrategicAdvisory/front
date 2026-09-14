import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExpedientes } from '../../../hooks/useExpedientes';
import { useActuaciones } from '../../../hooks/useActuaciones';
import { useAudiencias } from '../../../hooks/useAudiencias';
import { useTareasKoop } from '../../../hooks/useTareasKoop';
import { useAccess } from '../../../context/AccessContext';
import { createEtapa, updateEtapa, deleteEtapa } from '../../../api/expedientes';
import { EditForm, EditRow, EditField, EditTextArea, EditSelect } from '../../../components/common/EditFormKit';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';

const borderCol = '#394b61';

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }); } catch { return iso; }
}

// ─── Actuaciones Tab ──────────────────────────────────────────────────────────
const EMPTY_ACTUACION = { TITULO: '', DESCRIPCION: '', FECHA: '', AUTORIDAD_EMITE: '', ES_HITO: false };

function ActuacionesTab({ expedienteId, canEdit }) {
  const { actuaciones, loading, error, fetchActuaciones, createActuacion, updateActuacion, deleteActuacion } = useActuaciones(expedienteId);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_ACTUACION);
  const [notice, setNotice] = useState(null);

  useEffect(() => { fetchActuaciones(); }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (a) => { setTarget(a); setForm({ TITULO: a.TITULO || '', DESCRIPCION: a.DESCRIPCION || '', FECHA: a.FECHA?.slice(0, 10) || '', AUTORIDAD_EMITE: a.AUTORIDAD_EMITE || '', ES_HITO: !!a.ES_HITO }); setShowEdit(true); };

  const handleCreate = async () => {
    if (!form.TITULO.trim()) { msg('El título es obligatorio', 'danger'); return; }
    try { await createActuacion({ ...form, ID_EXPEDIENTE: expedienteId }); setShowCreate(false); setForm(EMPTY_ACTUACION); msg('Actuación registrada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try { await updateActuacion(target._id, form); setShowEdit(false); msg('Actuación actualizada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try { await deleteActuacion(target._id); setShowDelete(false); msg('Actuación eliminada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

  const ActuacionForm = ({ f, onF }) => (
    <EditForm style={{ marginTop: 8 }}>
      <EditField label="Título *" value={f.TITULO} onChange={(e) => onF({ ...f, TITULO: e.target.value })} placeholder="Auto admisorio de la demanda" />
      <EditRow cols={2}>
        <EditField label="Fecha" type="date" value={f.FECHA} onChange={(e) => onF({ ...f, FECHA: e.target.value })} />
        <EditField label="Autoridad que emite" value={f.AUTORIDAD_EMITE} onChange={(e) => onF({ ...f, AUTORIDAD_EMITE: e.target.value })} placeholder="Juzgado 5 Laboral" />
      </EditRow>
      <EditTextArea label="Descripción" value={f.DESCRIPCION} onChange={(e) => onF({ ...f, DESCRIPCION: e.target.value })} rows={3} placeholder="Descripción detallada..." />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9fb3cc', cursor: 'pointer', marginTop: 4 }}>
        <input type="checkbox" checked={!!f.ES_HITO} onChange={(e) => onF({ ...f, ES_HITO: e.target.checked })} />
        Es hito procesal
      </label>
    </EditForm>
  );

  return (
    <div>
      {notice && <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: notice.type === 'success' ? '#064e3b' : '#7f1d1d', color: notice.type === 'success' ? '#a7f3d0' : '#fecaca' }}>{notice.type === 'success' ? '✅' : '❌'} {notice.text}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_ACTUACION); setShowCreate(true); }} style={{ fontSize: 13, padding: '8px 16px' }}>➕ Nueva Actuación</button>}
      </div>
      {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
      {loading && actuaciones.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>Cargando actuaciones...</div>
      ) : actuaciones.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>No hay actuaciones registradas.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {actuaciones.map((a) => (
            <div key={a._id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{a.TITULO || 'Sin título'}</h4>
                    {a.ES_HITO && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.3)' }}>HITO</span>}
                  </div>
                  {a.DESCRIPCION && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{a.DESCRIPCION}</p>}
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                    {a.FECHA && <span>📅 {fmtDate(a.FECHA)}</span>}
                    {a.AUTORIDAD_EMITE && <span>🏛️ {a.AUTORIDAD_EMITE}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '4px 8px', background: '#4fd1c5', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => { setTarget(a); setShowDelete(true); }} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="➕ Nueva Actuación">
        <ActuacionForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Registrar" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Actuación">
        <ActuacionForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.TITULO} />
    </div>
  );
}

// ─── Audiencias Tab ───────────────────────────────────────────────────────────
const EMPTY_AUDIENCIA = { TIPO_AUDIENCIA: '', FECHA_PROGRAMADA: '', HORA: '', MODALIDAD: 'presencial', JUZGADO_O_AUTORIDAD: '', ENLACE_VIRTUAL: '', ESTADO: 'programada', RESULTADO: '' };
const MODALIDAD_OPTS = [{ value: 'presencial', label: 'Presencial' }, { value: 'virtual', label: 'Virtual' }, { value: 'mixta', label: 'Mixta' }];
const ESTADO_AUD_OPTS = [{ value: 'programada', label: 'Programada' }, { value: 'realizada', label: 'Realizada' }, { value: 'aplazada', label: 'Aplazada' }, { value: 'cancelada', label: 'Cancelada' }];
const AUD_COLOR = { programada: '#60a5fa', realizada: '#34d399', aplazada: '#fbbf24', cancelada: '#f87171' };

function AudienciasTab({ expedienteId, canEdit }) {
  const { audiencias, loading, error, fetchAudiencias, createAudiencia, updateAudiencia, deleteAudiencia } = useAudiencias(expedienteId);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_AUDIENCIA);
  const [notice, setNotice] = useState(null);

  useEffect(() => { fetchAudiencias(); }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (a) => { setTarget(a); setForm({ TIPO_AUDIENCIA: a.TIPO_AUDIENCIA || '', FECHA_PROGRAMADA: a.FECHA_PROGRAMADA?.slice(0, 10) || '', HORA: a.HORA || '', MODALIDAD: a.MODALIDAD || 'presencial', JUZGADO_O_AUTORIDAD: a.JUZGADO_O_AUTORIDAD || '', ENLACE_VIRTUAL: a.ENLACE_VIRTUAL || '', ESTADO: a.ESTADO || 'programada', RESULTADO: a.RESULTADO || '' }); setShowEdit(true); };

  const handleCreate = async () => {
    if (!form.TIPO_AUDIENCIA.trim()) { msg('El tipo de audiencia es obligatorio', 'danger'); return; }
    try { await createAudiencia({ ...form, ID_EXPEDIENTE: expedienteId }); setShowCreate(false); setForm(EMPTY_AUDIENCIA); msg('Audiencia registrada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try { await updateAudiencia(target._id, form); setShowEdit(false); msg('Audiencia actualizada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try { await deleteAudiencia(target._id); setShowDelete(false); msg('Audiencia eliminada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

  const AudienciaForm = ({ f, onF }) => (
    <EditForm style={{ marginTop: 8 }}>
      <EditField label="Tipo de audiencia *" value={f.TIPO_AUDIENCIA} onChange={(e) => onF({ ...f, TIPO_AUDIENCIA: e.target.value })} placeholder="Audiencia de Conciliación" />
      <EditRow cols={2}>
        <EditField label="Fecha programada" type="date" value={f.FECHA_PROGRAMADA} onChange={(e) => onF({ ...f, FECHA_PROGRAMADA: e.target.value })} />
        <EditField label="Hora" type="time" value={f.HORA} onChange={(e) => onF({ ...f, HORA: e.target.value })} />
      </EditRow>
      <EditRow cols={2}>
        <EditSelect label="Modalidad" value={f.MODALIDAD} onChange={(e) => onF({ ...f, MODALIDAD: e.target.value })} options={MODALIDAD_OPTS} />
        <EditSelect label="Estado" value={f.ESTADO} onChange={(e) => onF({ ...f, ESTADO: e.target.value })} options={ESTADO_AUD_OPTS} />
      </EditRow>
      <EditField label="Juzgado / Autoridad" value={f.JUZGADO_O_AUTORIDAD} onChange={(e) => onF({ ...f, JUZGADO_O_AUTORIDAD: e.target.value })} placeholder="Juzgado 5 Laboral del Circuito" />
      {f.MODALIDAD !== 'presencial' && <EditField label="Enlace virtual" value={f.ENLACE_VIRTUAL} onChange={(e) => onF({ ...f, ENLACE_VIRTUAL: e.target.value })} placeholder="https://meet.google.com/..." />}
      {f.ESTADO === 'realizada' && <EditField label="Resultado" value={f.RESULTADO} onChange={(e) => onF({ ...f, RESULTADO: e.target.value })} placeholder="Conciliación parcial alcanzada..." />}
    </EditForm>
  );

  return (
    <div>
      {notice && <TabNotice notice={notice} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_AUDIENCIA); setShowCreate(true); }} style={{ fontSize: 13, padding: '8px 16px' }}>➕ Nueva Audiencia</button>}
      </div>
      {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
      {loading && audiencias.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>Cargando audiencias...</div>
      ) : audiencias.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>No hay audiencias registradas.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {audiencias.map((a) => (
            <div key={a._id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{a.TIPO_AUDIENCIA || 'Sin tipo'}</h4>
                    {a.ESTADO && <Badge color={AUD_COLOR[a.ESTADO]}>{a.ESTADO}</Badge>}
                    {a.MODALIDAD && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(156,163,175,0.1)', color: '#9ca3af' }}>{a.MODALIDAD}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                    {a.FECHA_PROGRAMADA && <span>📅 {fmtDate(a.FECHA_PROGRAMADA)}{a.HORA ? ` ${a.HORA}` : ''}</span>}
                    {a.JUZGADO_O_AUTORIDAD && <span>🏛️ {a.JUZGADO_O_AUTORIDAD}</span>}
                    {a.RESULTADO && <span style={{ color: '#34d399' }}>✔ {a.RESULTADO}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '4px 8px', background: '#4fd1c5', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => { setTarget(a); setShowDelete(true); }} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="➕ Nueva Audiencia">
        <AudienciaForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Registrar" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Audiencia">
        <AudienciaForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.TIPO_AUDIENCIA} />
    </div>
  );
}

// ─── Etapas Tab ───────────────────────────────────────────────────────────────
const EMPTY_ETAPA = { NOMBRE_ETAPA: '', ORDEN: '', FECHA_INICIO: '', FECHA_VENCIMIENTO: '', OBSERVACIONES: '' };

function EtapasTab({ expedienteId, canEdit }) {
  const { etapas, loading: loadingEtapas, fetchEtapas } = useExpedientes();
  const [etapaList, setEtapaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_ETAPA);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEtapas(expedienteId);
      setEtapaList(result?.items ?? result ?? []);
    } catch (e) {
      setError(e?.message || 'Error al cargar etapas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (e) => { setTarget(e); setForm({ NOMBRE_ETAPA: e.NOMBRE_ETAPA || '', ORDEN: e.ORDEN ?? '', FECHA_INICIO: e.FECHA_INICIO?.slice(0, 10) || '', FECHA_VENCIMIENTO: e.FECHA_VENCIMIENTO?.slice(0, 10) || '', OBSERVACIONES: e.OBSERVACIONES || '' }); setShowEdit(true); };

  const handleCreate = async () => {
    if (!form.NOMBRE_ETAPA.trim()) { msg('El nombre de la etapa es obligatorio', 'danger'); return; }
    try {
      const created = await createEtapa(expedienteId, { ...form, ORDEN: form.ORDEN !== '' ? Number(form.ORDEN) : undefined });
      setEtapaList((p) => [...p, created]);
      setShowCreate(false); setForm(EMPTY_ETAPA); msg('Etapa creada');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try {
      const updated = await updateEtapa(expedienteId, target._id, { ...form, ORDEN: form.ORDEN !== '' ? Number(form.ORDEN) : undefined });
      setEtapaList((p) => p.map((e) => e._id === target._id ? updated : e));
      setShowEdit(false); msg('Etapa actualizada');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try {
      await deleteEtapa(expedienteId, target._id);
      setEtapaList((p) => p.filter((e) => e._id !== target._id));
      setShowDelete(false); msg('Etapa eliminada');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

  const EtapaForm = ({ f, onF }) => (
    <EditForm style={{ marginTop: 8 }}>
      <EditRow cols={2}>
        <EditField label="Nombre de etapa *" value={f.NOMBRE_ETAPA} onChange={(e) => onF({ ...f, NOMBRE_ETAPA: e.target.value })} placeholder="Audiencia de Conciliación" />
        <EditField label="Orden" type="number" value={f.ORDEN} onChange={(e) => onF({ ...f, ORDEN: e.target.value })} placeholder="1" />
      </EditRow>
      <EditRow cols={2}>
        <EditField label="Fecha inicio" type="date" value={f.FECHA_INICIO} onChange={(e) => onF({ ...f, FECHA_INICIO: e.target.value })} />
        <EditField label="Fecha vencimiento" type="date" value={f.FECHA_VENCIMIENTO} onChange={(e) => onF({ ...f, FECHA_VENCIMIENTO: e.target.value })} />
      </EditRow>
      <EditTextArea label="Observaciones" value={f.OBSERVACIONES} onChange={(e) => onF({ ...f, OBSERVACIONES: e.target.value })} rows={2} placeholder="Observaciones opcionales..." />
    </EditForm>
  );

  const sorted = [...etapaList].sort((a, b) => (a.ORDEN ?? 999) - (b.ORDEN ?? 999));

  return (
    <div>
      {notice && <TabNotice notice={notice} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_ETAPA); setShowCreate(true); }} style={{ fontSize: 13, padding: '8px 16px' }}>➕ Nueva Etapa</button>}
      </div>
      {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
      {loading ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>Cargando etapas...</div>
      ) : sorted.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>No hay etapas registradas.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((e, idx) => (
            <div key={e._id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#a5b4fc', flexShrink: 0 }}>
                {e.ORDEN ?? idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{e.NOMBRE_ETAPA || 'Sin nombre'}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                  {e.FECHA_INICIO && <span>▶ {fmtDate(e.FECHA_INICIO)}</span>}
                  {e.FECHA_VENCIMIENTO && <span>⏰ Vence: {fmtDate(e.FECHA_VENCIMIENTO)}</span>}
                  {e.OBSERVACIONES && <span style={{ color: '#94a3b8' }}>{e.OBSERVACIONES}</span>}
                </div>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(e)} style={{ padding: '4px 8px', background: '#4fd1c5', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => { setTarget(e); setShowDelete(true); }} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="➕ Nueva Etapa">
        <EtapaForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Crear" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Etapa">
        <EtapaForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.NOMBRE_ETAPA} />
    </div>
  );
}

// ─── Tareas Tab ───────────────────────────────────────────────────────────────
const EMPTY_TAREA = { TITULO: '', DESCRIPCION: '', FECHA_LIMITE: '', ID_ESTADO_TAREA: '', ID_PRIORIDAD: '', ES_HITO_PRECLUSIVO: false };

function TareasTab({ expedienteId, canEdit }) {
  const { tareas, loading, error, estados, prioridades, fetchTareas, createTarea, updateTarea, deleteTarea, fetchEstados, fetchPrioridades } = useTareasKoop({ initialFilters: { ID_EXPEDIENTE: expedienteId } });
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_TAREA);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchTareas();
    fetchEstados();
    fetchPrioridades();
  }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (t) => { setTarget(t); setForm({ TITULO: t.TITULO || '', DESCRIPCION: t.DESCRIPCION || '', FECHA_LIMITE: t.FECHA_LIMITE?.slice(0, 10) || '', ID_ESTADO_TAREA: t.ID_ESTADO_TAREA?._id || t.ID_ESTADO_TAREA || '', ID_PRIORIDAD: t.ID_PRIORIDAD?._id || t.ID_PRIORIDAD || '', ES_HITO_PRECLUSIVO: !!t.ES_HITO_PRECLUSIVO }); setShowEdit(true); };

  const estadoOpts = [{ value: '', label: 'Estado...' }, ...estados.map((e) => ({ value: e._id, label: e.NOMBRE }))];
  const prioridadOpts = [{ value: '', label: 'Prioridad...' }, ...prioridades.map((p) => ({ value: p._id, label: p.NOMBRE }))];

  const estadoColor = {};
  estados.forEach((e) => { if (e.NOMBRE?.toLowerCase().includes('completad')) estadoColor[e._id] = '#34d399'; else if (e.NOMBRE?.toLowerCase().includes('progreso')) estadoColor[e._id] = '#60a5fa'; else if (e.NOMBRE?.toLowerCase().includes('pend')) estadoColor[e._id] = '#fbbf24'; });

  const handleCreate = async () => {
    if (!form.TITULO.trim()) { msg('El título es obligatorio', 'danger'); return; }
    try { await createTarea({ ...form, ID_EXPEDIENTE: expedienteId }); setShowCreate(false); setForm(EMPTY_TAREA); msg('Tarea creada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try { await updateTarea(target._id, form); setShowEdit(false); msg('Tarea actualizada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try { await deleteTarea(target._id); setShowDelete(false); msg('Tarea eliminada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

  const TareaForm = ({ f, onF }) => (
    <EditForm style={{ marginTop: 8 }}>
      <EditField label="Título *" value={f.TITULO} onChange={(e) => onF({ ...f, TITULO: e.target.value })} placeholder="Presentar demanda laboral" />
      <EditRow cols={2}>
        <EditSelect label="Estado" value={f.ID_ESTADO_TAREA} onChange={(e) => onF({ ...f, ID_ESTADO_TAREA: e.target.value })} options={estadoOpts} />
        <EditSelect label="Prioridad" value={f.ID_PRIORIDAD} onChange={(e) => onF({ ...f, ID_PRIORIDAD: e.target.value })} options={prioridadOpts} />
      </EditRow>
      <EditField label="Fecha límite" type="date" value={f.FECHA_LIMITE} onChange={(e) => onF({ ...f, FECHA_LIMITE: e.target.value })} />
      <EditTextArea label="Descripción" value={f.DESCRIPCION} onChange={(e) => onF({ ...f, DESCRIPCION: e.target.value })} rows={2} placeholder="Detalles..." />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9fb3cc', cursor: 'pointer', marginTop: 4 }}>
        <input type="checkbox" checked={!!f.ES_HITO_PRECLUSIVO} onChange={(e) => onF({ ...f, ES_HITO_PRECLUSIVO: e.target.checked })} />
        Es hito preclusivo
      </label>
    </EditForm>
  );

  return (
    <div>
      {notice && <TabNotice notice={notice} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_TAREA); setShowCreate(true); }} style={{ fontSize: 13, padding: '8px 16px' }}>➕ Nueva Tarea</button>}
      </div>
      {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
      {loading && tareas.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>Cargando tareas...</div>
      ) : tareas.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>No hay tareas para este expediente.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tareas.map((t) => {
            const estadoId = t.ID_ESTADO_TAREA?._id || t.ID_ESTADO_TAREA;
            const estadoNombre = (estados.find((e) => e._id === estadoId)?.NOMBRE) || estadoId || '';
            const prioNombre = (prioridades.find((p) => p._id === (t.ID_PRIORIDAD?._id || t.ID_PRIORIDAD))?.NOMBRE) || '';
            return (
              <div key={t._id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{t.TITULO}</span>
                      {estadoNombre && <Badge color={estadoColor[estadoId] || '#9ca3af'}>{estadoNombre}</Badge>}
                      {prioNombre && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(156,163,175,0.1)', color: '#9ca3af' }}>{prioNombre}</span>}
                      {t.ES_HITO_PRECLUSIVO && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.3)' }}>HITO</span>}
                    </div>
                    {t.DESCRIPCION && <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8' }}>{t.DESCRIPCION}</p>}
                    {t.FECHA_LIMITE && <span style={{ fontSize: 11, color: '#64748b' }}>⏰ Vence: {fmtDate(t.FECHA_LIMITE)}</span>}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(t)} style={{ padding: '4px 8px', background: '#4fd1c5', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => { setTarget(t); setShowDelete(true); }} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="➕ Nueva Tarea">
        <TareaForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Crear" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Tarea">
        <TareaForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.TITULO} />
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function TabNotice({ notice }) {
  return <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: notice.type === 'success' ? '#064e3b' : '#7f1d1d', color: notice.type === 'success' ? '#a7f3d0' : '#fecaca' }}>{notice.type === 'success' ? '✅' : '❌'} {notice.text}</div>;
}

function Badge({ color, children }) {
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase', fontWeight: 600 }}>{children}</span>;
}

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#1e2a3a', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%', border: `1px solid ${borderCol}`, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
      <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '10px 20px' }}>Cancelar</button>
      <button className="btn btn-primary" onClick={onConfirm} style={{ padding: '10px 20px' }}>{confirmLabel}</button>
    </div>
  );
}

function DeleteModal({ show, onClose, onConfirm, label }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#1e2a3a', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', border: `1px solid ${borderCol}` }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>🗑️ Confirmar eliminación</h3>
        <p style={{ color: '#9fb3cc', fontSize: 14 }}>¿Eliminar <strong style={{ color: '#fc771c' }}>{label}</strong>?</p>
        <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 20 }}>⚠️ Esta acción no se puede deshacer.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ padding: '10px 20px' }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Actuaciones', 'Audiencias', 'Etapas', 'Tareas'];

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAccess();
  const isAdmin = role === 'admin';
  const isLawyer = role === 'lawyer';
  const canEdit = isAdmin || isLawyer;

  const { selectExpediente, selectedExpediente, loading, error } = useExpedientes();
  const [activeTab, setActiveTab] = useState('Actuaciones');

  useEffect(() => { if (id) selectExpediente(id); }, [id]);

  const tabStyle = (t) => ({
    padding: '10px 20px',
    background: activeTab === t ? '#6366f1' : 'transparent',
    border: `1px solid ${activeTab === t ? '#6366f1' : borderCol}`,
    borderRadius: 8,
    color: activeTab === t ? 'white' : '#9fb3cc',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: activeTab === t ? 600 : 400,
    transition: 'all 0.2s',
  });

  return (
    <div
      className="dash-page"
      style={{ backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', padding: '20px' }}
    >
      <div className="dash-card" style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>

        <button onClick={() => navigate('/admin/expedientes')} style={{ background: 'none', border: 'none', color: '#9fb3cc', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Volver a Expedientes
        </button>

        {loading && !selectedExpediente ? (
          <div style={{ color: '#9fb3cc', padding: 40, textAlign: 'center' }}>Cargando expediente...</div>
        ) : error && !selectedExpediente ? (
          <div style={{ color: '#fca5a5', padding: 40, textAlign: 'center' }}>⚠️ {error}</div>
        ) : selectedExpediente ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${borderCol}` }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 8h10M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{selectedExpediente.numero_de_expediente}</h1>
                  {selectedExpediente.NOMBRE_TIPO_PROCESO && (
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'rgba(79,209,197,0.1)', color: '#67e8f9', border: '1px solid rgba(79,209,197,0.2)' }}>{selectedExpediente.NOMBRE_TIPO_PROCESO}</span>
                  )}
                  {selectedExpediente.NOMBRE_SUBTIPO_PROCESO && (
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{selectedExpediente.NOMBRE_SUBTIPO_PROCESO}</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 18, color: '#a5b4fc', fontWeight: 500 }}>{selectedExpediente.cliente}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 10, fontSize: 13, color: '#64748b' }}>
                  {selectedExpediente.contraparte && <span>Contraparte: <span style={{ color: '#94a3b8' }}>{selectedExpediente.contraparte}</span></span>}
                  {selectedExpediente.juzgado_o_autoridad_que_conoce && <span>Juzgado: <span style={{ color: '#94a3b8' }}>{selectedExpediente.juzgado_o_autoridad_que_conoce}</span></span>}
                  {selectedExpediente.calidad && <span style={{ textTransform: 'capitalize' }}>Calidad: <span style={{ color: '#94a3b8' }}>{selectedExpediente.calidad}</span></span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {TABS.map((t) => (
                <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>{t}</button>
              ))}
            </div>

            {activeTab === 'Actuaciones' && <ActuacionesTab expedienteId={id} canEdit={canEdit} />}
            {activeTab === 'Audiencias' && <AudienciasTab expedienteId={id} canEdit={canEdit} />}
            {activeTab === 'Etapas' && <EtapasTab expedienteId={id} canEdit={canEdit} />}
            {activeTab === 'Tareas' && <TareasTab expedienteId={id} canEdit={canEdit} />}
          </>
        ) : null}
      </div>
    </div>
  );
}
