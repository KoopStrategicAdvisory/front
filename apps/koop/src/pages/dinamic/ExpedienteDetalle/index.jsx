import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExpedientes } from '../../../hooks/useExpedientes';
import { useActuaciones } from '../../../hooks/useActuaciones';
import { useAudiencias } from '../../../hooks/useAudiencias';
import { useTareasKoop } from '../../../hooks/useTareasKoop';
import { useDocumentosExpediente } from '../../../hooks/useDocumentosExpediente';
import { getDownloadUrl, createDocumentosBulk } from '../../../api/documentosExpediente';
import { useAccess } from '../../../context/AccessContext';
import { createEtapa, updateEtapa, deleteEtapa, generarEtapas, listRadicadosPublicos, createRadicadoPublico, deleteRadicadoPublico } from '../../../api/expedientes';
import { listEstadosTarea, listPrioridades, listTiposActuacion, listEstadosEtapa, listEtapasProcesales, listTiposDocumento, listEstadosProceso } from '../../../api/catalogos';
import { EditForm, EditRow, EditField, EditTextArea, EditSelect, EditCheckbox, EditFileField } from '../../../components/common/EditFormKit';
import { Modal, ModalFooter, DeleteModal } from '../../../components/common/Modal';
import { ORGANISMO_OPTIONS } from '../../../constants/consultaPortals';
import { estadoProcesoColor } from '../../../constants/estadoProceso';
import { fileKind, canPreview, FILE_KIND_META } from '../../../constants/fileKind';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';

const borderCol = '#394b61';

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }); } catch { return iso; }
}

// ─── Actuaciones Tab ──────────────────────────────────────────────────────────
// Reescrito: usaba campos SCREAMING_SNAKE_CASE / _id de una version anterior del
// backend (Mongo). id_tipo_actuacion es NOT NULL en el esquema y no tenia campo
// en el formulario.
const EMPTY_ACTUACION = { titulo: '', descripcion: '', fecha: '', autoridad_emite: '', id_tipo_actuacion: '', es_hito: false };

// Definido fuera del componente de la pestaña a proposito: si se define adentro,
// React lo trata como un tipo de componente nuevo en cada render del padre
// (cada setForm) y desmonta/remonta el formulario completo -> se pierde el foco
// en cada tecla. Mismo fix aplicado a AudienciaForm/EtapaForm/TareaForm abajo.
function ActuacionForm({ f, onF, tipoActuacionOpts }) {
  return (
    <EditForm style={{ marginTop: 8 }}>
      <EditField label="Título *" value={f.titulo} onChange={(e) => onF({ ...f, titulo: e.target.value })} placeholder="Auto admisorio de la demanda" />
      <EditRow cols={2}>
        <EditField label="Fecha *" type="date" value={f.fecha} onChange={(e) => onF({ ...f, fecha: e.target.value })} />
        <EditSelect label="Tipo de actuación *" value={f.id_tipo_actuacion} onChange={(e) => onF({ ...f, id_tipo_actuacion: e.target.value })} options={tipoActuacionOpts} />
      </EditRow>
      <EditField label="Autoridad que emite" value={f.autoridad_emite} onChange={(e) => onF({ ...f, autoridad_emite: e.target.value })} placeholder="Juzgado 5 Laboral" />
      <EditTextArea label="Descripción" value={f.descripcion} onChange={(e) => onF({ ...f, descripcion: e.target.value })} rows={3} placeholder="Descripción detallada..." />
      <EditCheckbox label="Es hito procesal" checked={f.es_hito} onChange={(e) => onF({ ...f, es_hito: e.target.checked })} />
    </EditForm>
  );
}

function ActuacionesTab({ expedienteId, canEdit }) {
  const { actuaciones, loading, error, fetchActuaciones, createActuacion, updateActuacion, deleteActuacion } = useActuaciones(expedienteId);
  const [tiposActuacion, setTiposActuacion] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_ACTUACION);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchActuaciones();
    listTiposActuacion().then(setTiposActuacion).catch(() => {});
  }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (a) => { setTarget(a); setForm({ titulo: a.titulo || '', descripcion: a.descripcion || '', fecha: a.fecha?.slice(0, 10) || '', autoridad_emite: a.autoridad_emite || '', id_tipo_actuacion: a.id_tipo_actuacion != null ? String(a.id_tipo_actuacion) : '', es_hito: !!a.es_hito }); setShowEdit(true); };

  const tipoActuacionOpts = [{ value: '', label: 'Seleccione tipo...' }, ...tiposActuacion.map((t) => ({ value: String(t.id), label: t.nombre }))];

  const toPayload = (f) => ({
    titulo: f.titulo.trim(),
    descripcion: f.descripcion.trim() || undefined,
    fecha: f.fecha || undefined,
    autoridad_emite: f.autoridad_emite.trim() || undefined,
    id_tipo_actuacion: f.id_tipo_actuacion ? Number(f.id_tipo_actuacion) : undefined,
    es_hito: f.es_hito,
  });

  const handleCreate = async () => {
    if (!form.titulo.trim()) { msg('El título es obligatorio', 'danger'); return; }
    if (!form.fecha) { msg('La fecha es obligatoria', 'danger'); return; }
    if (!form.id_tipo_actuacion) { msg('El tipo de actuación es obligatorio', 'danger'); return; }
    try { await createActuacion({ ...toPayload(form), id_expediente: expedienteId }); setShowCreate(false); setForm(EMPTY_ACTUACION); msg('Actuación registrada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try { await updateActuacion(target.id, toPayload(form)); setShowEdit(false); msg('Actuación actualizada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try { await deleteActuacion(target.id); setShowDelete(false); msg('Actuación eliminada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

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
            <div key={a.id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{a.titulo || 'Sin título'}</h4>
                    {a.es_hito && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.3)' }}>HITO</span>}
                  </div>
                  {a.descripcion && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{a.descripcion}</p>}
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                    {a.fecha && <span>📅 {fmtDate(a.fecha)}</span>}
                    {a.autoridad_emite && <span>🏛️ {a.autoridad_emite}</span>}
                    {a.nombre_tipo_actuacion && <span>{a.nombre_tipo_actuacion}</span>}
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
        <ActuacionForm f={form} onF={setForm} tipoActuacionOpts={tipoActuacionOpts} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Registrar" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Actuación">
        <ActuacionForm f={form} onF={setForm} tipoActuacionOpts={tipoActuacionOpts} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.titulo} />
    </div>
  );
}

// ─── Audiencias Tab ───────────────────────────────────────────────────────────
// Reescrito: campos SCREAMING_SNAKE_CASE/_id obsoletos. Ademas 'fecha_programada'
// es un timestamptz unico en el esquema (no hay columna 'hora' separada, y
// 'HORA' no tenia donde guardarse); se combinan fecha+hora al enviar. El check
// constraint de 'estado' es ('programada','celebrada','aplazada','cancelada') —
// el formulario usaba 'realizada', que la base de datos habria rechazado.
const EMPTY_AUDIENCIA = { tipo_audiencia: '', fecha_programada: '', hora: '', modalidad: 'presencial', juzgado_o_autoridad: '', enlace_virtual: '', estado: 'programada', resultado: '' };
const MODALIDAD_OPTS = [{ value: 'presencial', label: 'Presencial' }, { value: 'virtual', label: 'Virtual' }, { value: 'mixta', label: 'Mixta' }];
const ESTADO_AUD_OPTS = [{ value: 'programada', label: 'Programada' }, { value: 'celebrada', label: 'Celebrada' }, { value: 'aplazada', label: 'Aplazada' }, { value: 'cancelada', label: 'Cancelada' }];
const AUD_COLOR = { programada: '#60a5fa', celebrada: '#34d399', aplazada: '#fbbf24', cancelada: '#f87171' };

function AudienciaForm({ f, onF }) {
  return (
    <EditForm style={{ marginTop: 8 }}>
      <EditField label="Tipo de audiencia *" value={f.tipo_audiencia} onChange={(e) => onF({ ...f, tipo_audiencia: e.target.value })} placeholder="Audiencia de Conciliación" />
      <EditRow cols={2}>
        <EditField label="Fecha programada *" type="date" value={f.fecha_programada} onChange={(e) => onF({ ...f, fecha_programada: e.target.value })} />
        <EditField label="Hora" type="time" value={f.hora} onChange={(e) => onF({ ...f, hora: e.target.value })} />
      </EditRow>
      <EditRow cols={2}>
        <EditSelect label="Modalidad" value={f.modalidad} onChange={(e) => onF({ ...f, modalidad: e.target.value })} options={MODALIDAD_OPTS} />
        <EditSelect label="Estado" value={f.estado} onChange={(e) => onF({ ...f, estado: e.target.value })} options={ESTADO_AUD_OPTS} />
      </EditRow>
      <EditField label="Juzgado / Autoridad" value={f.juzgado_o_autoridad} onChange={(e) => onF({ ...f, juzgado_o_autoridad: e.target.value })} placeholder="Juzgado 5 Laboral del Circuito" />
      {f.modalidad !== 'presencial' && <EditField label="Enlace virtual" value={f.enlace_virtual} onChange={(e) => onF({ ...f, enlace_virtual: e.target.value })} placeholder="https://meet.google.com/..." />}
      {f.estado === 'celebrada' && <EditField label="Resultado" value={f.resultado} onChange={(e) => onF({ ...f, resultado: e.target.value })} placeholder="Conciliación parcial alcanzada..." />}
    </EditForm>
  );
}

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
  const openEdit = (a) => {
    const [datePart, timePart] = (a.fecha_programada || '').split('T');
    setTarget(a);
    setForm({ tipo_audiencia: a.tipo_audiencia || '', fecha_programada: datePart || '', hora: timePart ? timePart.slice(0, 5) : '', modalidad: a.modalidad || 'presencial', juzgado_o_autoridad: a.juzgado_o_autoridad || '', enlace_virtual: a.enlace_virtual || '', estado: a.estado || 'programada', resultado: a.resultado || '' });
    setShowEdit(true);
  };

  const toPayload = (f) => ({
    tipo_audiencia: f.tipo_audiencia.trim(),
    fecha_programada: f.fecha_programada ? `${f.fecha_programada}T${f.hora || '00:00'}:00` : undefined,
    modalidad: f.modalidad || undefined,
    juzgado_o_autoridad: f.juzgado_o_autoridad.trim() || undefined,
    enlace_virtual: f.modalidad !== 'presencial' ? (f.enlace_virtual.trim() || undefined) : undefined,
    estado: f.estado || undefined,
    resultado: f.estado === 'celebrada' ? (f.resultado.trim() || undefined) : undefined,
  });

  const handleCreate = async () => {
    if (!form.tipo_audiencia.trim()) { msg('El tipo de audiencia es obligatorio', 'danger'); return; }
    if (!form.fecha_programada) { msg('La fecha programada es obligatoria', 'danger'); return; }
    try { await createAudiencia({ ...toPayload(form), id_expediente: expedienteId }); setShowCreate(false); setForm(EMPTY_AUDIENCIA); msg('Audiencia registrada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try { await updateAudiencia(target.id, toPayload(form)); setShowEdit(false); msg('Audiencia actualizada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try { await deleteAudiencia(target.id); setShowDelete(false); msg('Audiencia eliminada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

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
            <div key={a.id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{a.tipo_audiencia || 'Sin tipo'}</h4>
                    {a.estado && <Badge color={AUD_COLOR[a.estado]}>{a.estado}</Badge>}
                    {a.modalidad && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(156,163,175,0.1)', color: '#9ca3af' }}>{a.modalidad}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                    {a.fecha_programada && <span>📅 {fmtDate(a.fecha_programada)}</span>}
                    {a.juzgado_o_autoridad && <span>🏛️ {a.juzgado_o_autoridad}</span>}
                    {a.resultado && <span style={{ color: '#34d399' }}>✔ {a.resultado}</span>}
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
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.tipo_audiencia} />
    </div>
  );
}

// ─── Etapas Tab ───────────────────────────────────────────────────────────────
// Reescrito: 'NOMBRE_ETAPA' no es un campo propio de expediente_etapas, viene del
// catalogo etapas_procesales (columna id_etapa, se muestra como nombre_etapa en
// el join del backend); 'orden' e 'id_estado_etapa' son NOT NULL y no tenian
// campo en el formulario.
const EMPTY_ETAPA = { id_etapa: '', id_estado_etapa: '', orden: '', fecha_inicio: '', fecha_vencimiento: '', observaciones: '' };

function EtapaForm({ f, onF, etapaOpts, estadoEtapaOpts }) {
  return (
    <EditForm style={{ marginTop: 8 }}>
      <EditRow cols={2}>
        <EditSelect label="Etapa" value={f.id_etapa} onChange={(e) => onF({ ...f, id_etapa: e.target.value })} options={etapaOpts} />
        <EditField label="Orden *" type="number" value={f.orden} onChange={(e) => onF({ ...f, orden: e.target.value })} placeholder="1" />
      </EditRow>
      <EditSelect label="Estado *" value={f.id_estado_etapa} onChange={(e) => onF({ ...f, id_estado_etapa: e.target.value })} options={estadoEtapaOpts} />
      <EditRow cols={2}>
        <EditField label="Fecha inicio" type="date" value={f.fecha_inicio} onChange={(e) => onF({ ...f, fecha_inicio: e.target.value })} />
        <EditField label="Fecha vencimiento" type="date" value={f.fecha_vencimiento} onChange={(e) => onF({ ...f, fecha_vencimiento: e.target.value })} />
      </EditRow>
      <EditTextArea label="Observaciones" value={f.observaciones} onChange={(e) => onF({ ...f, observaciones: e.target.value })} rows={2} placeholder="Observaciones opcionales..." />
    </EditForm>
  );
}

function EtapasTab({ expedienteId, canEdit }) {
  const { fetchEtapas } = useExpedientes();
  const [etapaList, setEtapaList] = useState([]);
  const [etapasProcesales, setEtapasProcesales] = useState([]);
  const [estadosEtapa, setEstadosEtapa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_ETAPA);
  const [notice, setNotice] = useState(null);
  const [generating, setGenerating] = useState(false);

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

  const handleGenerar = async () => {
    setGenerating(true);
    try {
      const { etapas, tareas } = await generarEtapas(expedienteId);
      await load();
      if (etapas === 0) {
        msg('No se generó nada — este tipo de proceso todavía no tiene una plantilla de trámite cargada, o ya se habían generado antes.', 'danger');
      } else {
        msg(`Se generaron ${etapas} etapa${etapas === 1 ? '' : 's'}${tareas ? ` y ${tareas} tarea${tareas === 1 ? '' : 's'}` : ''} desde la plantilla del trámite.`);
      }
    } catch (e) {
      msg(e?.response?.data?.message || e?.message || 'No se pudo generar', 'danger');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    load();
    listEtapasProcesales().then(setEtapasProcesales).catch(() => {});
    listEstadosEtapa().then(setEstadosEtapa).catch(() => {});
  }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (e) => { setTarget(e); setForm({ id_etapa: e.id_etapa != null ? String(e.id_etapa) : '', id_estado_etapa: e.id_estado_etapa != null ? String(e.id_estado_etapa) : '', orden: e.orden ?? '', fecha_inicio: e.fecha_inicio?.slice(0, 10) || '', fecha_vencimiento: e.fecha_vencimiento?.slice(0, 10) || '', observaciones: e.observaciones || '' }); setShowEdit(true); };

  const etapaOpts = [{ value: '', label: 'Seleccione etapa...' }, ...etapasProcesales.map((e) => ({ value: String(e.id), label: e.nombre_etapa }))];
  const estadoEtapaOpts = [{ value: '', label: 'Seleccione estado...' }, ...estadosEtapa.map((e) => ({ value: String(e.id), label: e.nombre }))];

  const toPayload = (f) => ({
    id_etapa: f.id_etapa ? Number(f.id_etapa) : undefined,
    id_estado_etapa: f.id_estado_etapa ? Number(f.id_estado_etapa) : undefined,
    orden: f.orden !== '' ? Number(f.orden) : undefined,
    fecha_inicio: f.fecha_inicio || undefined,
    fecha_vencimiento: f.fecha_vencimiento || undefined,
    observaciones: f.observaciones.trim() || undefined,
  });

  // create/update en el backend devuelven la fila cruda (INSERT/UPDATE ... RETURNING *),
  // sin los nombres del catalogo (nombre_etapa, nombre_estado_etapa) que solo trae el
  // listado (JOIN). Se recarga la lista tras cada cambio para mostrar el nombre real
  // en vez de "Sin nombre" hasta el proximo refresh manual.
  const handleCreate = async () => {
    if (!form.orden) { msg('El orden es obligatorio', 'danger'); return; }
    if (!form.id_estado_etapa) { msg('El estado es obligatorio', 'danger'); return; }
    try {
      await createEtapa(expedienteId, toPayload(form));
      await load();
      setShowCreate(false); setForm(EMPTY_ETAPA); msg('Etapa creada');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try {
      await updateEtapa(expedienteId, target.id, toPayload(form));
      await load();
      setShowEdit(false); msg('Etapa actualizada');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try {
      await deleteEtapa(expedienteId, target.id);
      setEtapaList((p) => p.filter((e) => e.id !== target.id));
      setShowDelete(false); msg('Etapa eliminada');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };


  const sorted = [...etapaList].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));

  return (
    <div>
      {notice && <TabNotice notice={notice} />}
      <p style={{ fontSize: 13, color: '#9fb3cc', marginTop: 0, marginBottom: 16 }}>
        Las etapas se pueden generar automáticamente con el orden real del trámite (si el tipo de proceso ya tiene una plantilla cargada), o agregarse una por una a mano.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        {canEdit && (
          <button className="btn btn-gold" onClick={handleGenerar} disabled={generating} style={{ fontSize: 13, padding: '8px 16px' }}>
            {generating ? 'Generando…' : '🪄 Generar desde plantilla'}
          </button>
        )}
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
            <div key={e.id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#a5b4fc', flexShrink: 0 }}>
                {e.orden ?? idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{e.nombre_etapa || 'Sin nombre'} {e.nombre_estado_etapa && <span style={{ fontWeight: 400, fontSize: 12, color: '#9fb3cc' }}>· {e.nombre_estado_etapa}</span>}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                  {e.fecha_inicio && <span>▶ {fmtDate(e.fecha_inicio)}</span>}
                  {e.fecha_vencimiento && <span>⏰ Vence: {fmtDate(e.fecha_vencimiento)}</span>}
                  {e.observaciones && <span style={{ color: '#94a3b8' }}>{e.observaciones}</span>}
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
        <EtapaForm f={form} onF={setForm} etapaOpts={etapaOpts} estadoEtapaOpts={estadoEtapaOpts} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Crear" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Etapa">
        <EtapaForm f={form} onF={setForm} etapaOpts={etapaOpts} estadoEtapaOpts={estadoEtapaOpts} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.nombre_etapa} />
    </div>
  );
}

// ─── Tareas Tab ───────────────────────────────────────────────────────────────
// Nota: esta pestaña usaba convenciones de una version anterior del backend
// (Mongo: _id, campos SCREAMING_SNAKE_CASE) y llamaba fetchEstados/fetchPrioridades,
// que ni siquiera existen en el hook base useTareasKoop (packages/hooks/src/api/koop).
// Se reescribe contra los campos y catalogos reales.
const EMPTY_TAREA = { titulo: '', descripcion: '', fecha_limite: '', id_estado_tarea: '', id_prioridad: '', es_hito_preclusivo: false };

function TareaForm({ f, onF, estadoOpts, prioridadOpts }) {
  return (
    <EditForm style={{ marginTop: 8 }}>
      <EditField label="Título *" value={f.titulo} onChange={(e) => onF({ ...f, titulo: e.target.value })} placeholder="Presentar demanda laboral" />
      <EditRow cols={2}>
        <EditSelect label="Estado *" value={f.id_estado_tarea} onChange={(e) => onF({ ...f, id_estado_tarea: e.target.value })} options={estadoOpts} />
        <EditSelect label="Prioridad" value={f.id_prioridad} onChange={(e) => onF({ ...f, id_prioridad: e.target.value })} options={prioridadOpts} />
      </EditRow>
      <EditField label="Fecha límite" type="date" value={f.fecha_limite} onChange={(e) => onF({ ...f, fecha_limite: e.target.value })} />
      <EditTextArea label="Descripción" value={f.descripcion} onChange={(e) => onF({ ...f, descripcion: e.target.value })} rows={2} placeholder="Detalles..." />
      <EditCheckbox label="Es hito preclusivo" checked={f.es_hito_preclusivo} onChange={(e) => onF({ ...f, es_hito_preclusivo: e.target.checked })} />
    </EditForm>
  );
}

function TareasTab({ expedienteId, canEdit }) {
  const { tareas, loading, error, fetchTareas, createTarea, updateTarea, deleteTarea } = useTareasKoop({ initialFilters: { id_expediente: expedienteId } });
  const [estados, setEstados] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_TAREA);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchTareas();
    listEstadosTarea().then(setEstados).catch(() => {});
    listPrioridades().then(setPrioridades).catch(() => {});
  }, []);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };
  const openEdit = (t) => { setTarget(t); setForm({ titulo: t.titulo || '', descripcion: t.descripcion || '', fecha_limite: t.fecha_limite?.slice(0, 10) || '', id_estado_tarea: t.id_estado_tarea != null ? String(t.id_estado_tarea) : '', id_prioridad: t.id_prioridad != null ? String(t.id_prioridad) : '', es_hito_preclusivo: !!t.es_hito_preclusivo }); setShowEdit(true); };

  const estadoOpts = [{ value: '', label: 'Estado...' }, ...estados.map((e) => ({ value: String(e.id), label: e.nombre }))];
  const prioridadOpts = [{ value: '', label: 'Prioridad...' }, ...prioridades.map((p) => ({ value: String(p.id), label: p.nombre }))];

  const estadoColor = {};
  estados.forEach((e) => { const id = String(e.id); if (e.nombre?.toLowerCase().includes('completad')) estadoColor[id] = '#34d399'; else if (e.nombre?.toLowerCase().includes('progreso') || e.nombre?.toLowerCase().includes('curso')) estadoColor[id] = '#60a5fa'; else if (e.nombre?.toLowerCase().includes('pend')) estadoColor[id] = '#fbbf24'; });

  const toPayload = (f) => ({
    titulo: f.titulo.trim(),
    descripcion: f.descripcion.trim() || undefined,
    fecha_limite: f.fecha_limite || undefined,
    id_estado_tarea: f.id_estado_tarea ? Number(f.id_estado_tarea) : undefined,
    id_prioridad: f.id_prioridad ? Number(f.id_prioridad) : undefined,
    es_hito_preclusivo: f.es_hito_preclusivo,
  });

  const handleCreate = async () => {
    if (!form.titulo.trim()) { msg('El título es obligatorio', 'danger'); return; }
    if (!form.id_estado_tarea) { msg('El estado es obligatorio', 'danger'); return; }
    try { await createTarea({ ...toPayload(form), id_expediente: expedienteId }); setShowCreate(false); setForm(EMPTY_TAREA); msg('Tarea creada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleEdit = async () => {
    try { await updateTarea(target.id, toPayload(form)); setShowEdit(false); msg('Tarea actualizada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };
  const handleDelete = async () => {
    try { await deleteTarea(target.id); setShowDelete(false); msg('Tarea eliminada'); } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };


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
            const estadoId = t.id_estado_tarea != null ? String(t.id_estado_tarea) : '';
            const estadoNombre = t.nombre_estado_tarea || (estados.find((e) => String(e.id) === estadoId)?.nombre) || '';
            const prioNombre = t.nombre_prioridad || (prioridades.find((p) => String(p.id) === String(t.id_prioridad))?.nombre) || '';
            return (
              <div key={t.id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{t.titulo}</span>
                      {estadoNombre && <Badge color={estadoColor[estadoId] || '#9ca3af'}>{estadoNombre}</Badge>}
                      {prioNombre && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(156,163,175,0.1)', color: '#9ca3af' }}>{prioNombre}</span>}
                      {t.es_hito_preclusivo && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.3)' }}>HITO</span>}
                    </div>
                    {t.descripcion && <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8' }}>{t.descripcion}</p>}
                    {t.fecha_limite && <span style={{ fontSize: 11, color: '#64748b' }}>⏰ Vence: {fmtDate(t.fecha_limite)}</span>}
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
        <TareaForm f={form} onF={setForm} estadoOpts={estadoOpts} prioridadOpts={prioridadOpts} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Crear" />
      </Modal>
      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Tarea">
        <TareaForm f={form} onF={setForm} estadoOpts={estadoOpts} prioridadOpts={prioridadOpts} />
        <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={handleEdit} confirmLabel="Guardar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.titulo} />
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

// ─── Documentos Tab ───────────────────────────────────────────────────────────
// Reescrito: la version anterior solo permitia subir y descargar — sin
// previsualizacion, sin edicion (aunque el backend ya soportaba PUT completo),
// sin busqueda/filtro, y todos los archivos se veian identicos (mismo icono
// generico) en una lista angosta de una sola columna.
const EMPTY_DOCUMENTO = { files: [], id_tipo_documento: '', descripcion: '', fecha_documento: '', visibilidad_cliente: false };
const EMPTY_EDIT_DOCUMENTO = { titulo: '', id_tipo_documento: '', descripcion: '', fecha_documento: '', visibilidad_cliente: false };
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconBtnStyle(color) {
  return { flex: 1, padding: '6px 0', background: `${color}1a`, border: `1px solid ${color}44`, borderRadius: 6, color, fontSize: 13, cursor: 'pointer' };
}

// showFile=false para el formulario de edicion: el archivo en si no se
// reemplaza (subir uno nuevo es, en la practica, otro documento con su
// propia version/fecha), solo su metadata. En creacion (showFile=true) se
// pueden elegir varios archivos a la vez — cada uno queda como su propio
// documento con el nombre de archivo como titulo, asi que el campo "Título"
// solo tiene sentido al editar un documento ya existente (uno a la vez).
function DocumentoForm({ f, onF, tipoDocumentoOpts, showFile = true }) {
  return (
    <EditForm style={{ marginTop: 8 }}>
      {showFile && (
        <EditFileField
          label="Archivo(s) *"
          files={f.files}
          onFilesChange={(files) => onF({ ...f, files })}
          onRemove={(i) => onF({ ...f, files: f.files.filter((_, idx) => idx !== i) })}
          multiple
        />
      )}
      {!showFile && (
        <EditField label="Título" value={f.titulo} onChange={(e) => onF({ ...f, titulo: e.target.value })} placeholder="Auto admisorio - notificación" />
      )}
      <EditRow cols={2}>
        <EditSelect label="Tipo de documento *" value={f.id_tipo_documento} onChange={(e) => onF({ ...f, id_tipo_documento: e.target.value })} options={tipoDocumentoOpts} />
        <EditField label="Fecha del documento" type="date" value={f.fecha_documento} onChange={(e) => onF({ ...f, fecha_documento: e.target.value })} />
      </EditRow>
      <EditTextArea label="Descripción" value={f.descripcion} onChange={(e) => onF({ ...f, descripcion: e.target.value })} rows={2} placeholder={showFile ? 'Notas compartidas por todos los archivos...' : 'Notas sobre el documento...'} />
      <EditCheckbox label="Visible para el cliente" checked={f.visibilidad_cliente} onChange={(e) => onF({ ...f, visibilidad_cliente: e.target.checked })} />
    </EditForm>
  );
}

function DocumentosTab({ expedienteId, canEdit }) {
  const { documentos, loading, error, fetchDocumentos, updateDocumento, deleteDocumento } = useDocumentosExpediente();
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_DOCUMENTO);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_DOCUMENTO);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [notice, setNotice] = useState(null);
  const [thumbUrls, setThumbUrls] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = () => fetchDocumentos({ id_expediente: expedienteId });

  useEffect(() => {
    load();
    listTiposDocumento().then(setTiposDocumento).catch(() => {});
  }, [expedienteId]);

  // Miniaturas reales para imagenes (el resto de tipos usa un icono fijo por
  // categoria) — se piden bajo demanda, una por una, solo para las que aun
  // no tienen URL firmada en cache.
  useEffect(() => {
    const pendientes = documentos.filter((d) => fileKind(d.mime_type, d.nombre_archivo) === 'image' && !thumbUrls[d.id]);
    if (pendientes.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const d of pendientes) {
        try {
          const { url } = await getDownloadUrl(d.id, 900);
          if (!cancelled) setThumbUrls((prev) => ({ ...prev, [d.id]: url }));
        } catch { /* sin miniatura, se queda con el icono */ }
      }
    })();
    return () => { cancelled = true; };
  }, [documentos]);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 4000); };
  const tipoDocumentoOpts = [{ value: '', label: 'Seleccione tipo...' }, ...tiposDocumento.map((t) => ({ value: String(t.id), label: t.nombre }))];

  const filtered = documentos.filter((d) => {
    if (tipoFilter && String(d.id_tipo_documento) !== tipoFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return [d.titulo, d.nombre_archivo, d.descripcion].some((v) => v?.toLowerCase().includes(q));
  });

  const handleUpload = async () => {
    if (!form.files.length) { msg('Selecciona al menos un archivo', 'danger'); return; }
    if (!form.id_tipo_documento) { msg('El tipo de documento es obligatorio', 'danger'); return; }
    const tooLarge = form.files.find((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge) { msg(`"${tooLarge.name}" supera el límite de 25 MB`, 'danger'); return; }
    setUploading(true);
    setUploadProgress(0);
    try {
      const { creados = [], errores = [] } = await createDocumentosBulk({
        files: form.files,
        id_expediente: expedienteId,
        id_tipo_documento: Number(form.id_tipo_documento),
        descripcion: form.descripcion || undefined,
        fecha_documento: form.fecha_documento || undefined,
        visibilidad_cliente: form.visibilidad_cliente,
      }, setUploadProgress);
      await load();
      if (errores.length === 0) {
        setShowUpload(false); setForm(EMPTY_DOCUMENTO);
        msg(`${creados.length} documento${creados.length === 1 ? '' : 's'} subido${creados.length === 1 ? '' : 's'} exitosamente`);
      } else if (creados.length === 0) {
        msg(`No se pudo subir ningún archivo: ${errores.map((e) => e.nombre_archivo).join(', ')}`, 'danger');
      } else {
        // Deja en el formulario solo los que fallaron, para no obligar a
        // volver a elegir todo el lote si la mayoria si subio bien.
        setForm((prev) => ({ ...prev, files: prev.files.filter((f) => errores.some((e) => e.nombre_archivo === f.name)) }));
        msg(`${creados.length} subidos, ${errores.length} fallaron: ${errores.map((e) => e.nombre_archivo).join(', ')}`, 'danger');
      }
    } catch (e) {
      msg(e?.response?.data?.message || e?.message || 'Error al subir documentos', 'danger');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const openEdit = (d) => {
    setTarget(d);
    setEditForm({
      titulo: d.titulo || '',
      id_tipo_documento: d.id_tipo_documento != null ? String(d.id_tipo_documento) : '',
      descripcion: d.descripcion || '',
      fecha_documento: d.fecha_documento?.slice(0, 10) || '',
      visibilidad_cliente: !!d.visibilidad_cliente,
    });
    setShowEdit(true);
  };

  // El UPDATE del backend devuelve la fila cruda (sin el JOIN de nombre_tipo_documento
  // / nombre_usuario_carga que trae el listado) — se recarga la lista para no dejar
  // esos nombres en blanco hasta el proximo refresh manual (mismo patron que Etapas).
  const handleEditSave = async () => {
    try {
      await updateDocumento(target.id, {
        id_tipo_documento: editForm.id_tipo_documento ? Number(editForm.id_tipo_documento) : undefined,
        titulo: editForm.titulo || undefined,
        descripcion: editForm.descripcion || undefined,
        fecha_documento: editForm.fecha_documento || undefined,
        visibilidad_cliente: editForm.visibilidad_cliente,
      });
      await load();
      setShowEdit(false);
      msg('Documento actualizado');
    } catch (e) {
      msg(e?.response?.data?.message || e?.message || 'Error al actualizar', 'danger');
    }
  };

  const openPreview = async (d) => {
    setTarget(d);
    setShowPreview(true);
    const kind = fileKind(d.mime_type, d.nombre_archivo);
    if (!canPreview(kind)) { setPreviewUrl(null); return; }
    if (thumbUrls[d.id]) { setPreviewUrl(thumbUrls[d.id]); return; }
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const { url } = await getDownloadUrl(d.id, 900);
      setPreviewUrl(url);
    } catch (e) {
      msg('No se pudo cargar la vista previa', 'danger');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { url } = await getDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      msg(e?.response?.data?.message || e?.message || 'No se pudo generar el enlace de descarga', 'danger');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocumento(target.id);
      setShowDelete(false);
      msg('Documento eliminado', 'danger');
    } catch (e) { msg(e?.message || 'Error', 'danger'); }
  };

  return (
    <div>
      {notice && <TabNotice notice={notice} />}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por título, archivo o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '10px 14px', background: '#1e2a3a', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}
        />
        <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} style={{ padding: '10px 14px', background: '#1e2a3a', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}>
          <option value="">Todos los tipos</option>
          {tiposDocumento.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
        </select>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_DOCUMENTO); setShowUpload(true); }} style={{ fontSize: 13, padding: '10px 16px', whiteSpace: 'nowrap' }}>📤 Subir Documentos</button>}
      </div>
      {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
      {loading && documentos.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>Cargando documentos...</div>
      ) : documentos.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>No hay documentos cargados para este expediente.</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>No se encontraron documentos con ese filtro.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtered.map((d) => {
            const kind = fileKind(d.mime_type, d.nombre_archivo);
            const meta = FILE_KIND_META[kind];
            const thumb = thumbUrls[d.id];
            return (
              <div
                key={d.id}
                onClick={() => openPreview(d)}
                style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = meta.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderCol; }}
              >
                <div style={{ aspectRatio: '4 / 3', background: thumb ? '#0d1522' : `${meta.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {thumb ? (
                    <img src={thumb} alt={d.titulo || d.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 42 }}>{meta.icon}</span>
                  )}
                  {d.visibilidad_cliente && (
                    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'rgba(52,211,153,0.9)', color: '#052e21', fontWeight: 700 }}>Cliente</span>
                  )}
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.titulo || d.nombre_archivo}>
                    {d.titulo || d.nombre_archivo}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                    <span>· {formatBytes(d.tamano_bytes)}</span>
                    <span>· {fmtDate(d.fecha_carga)}</span>
                  </div>
                  {d.nombre_tipo_documento && (
                    <span style={{ alignSelf: 'flex-start', fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(79,209,197,0.1)', color: '#67e8f9', border: '1px solid rgba(79,209,197,0.2)' }}>{d.nombre_tipo_documento}</span>
                  )}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 6, paddingTop: 10 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openPreview(d)} title="Ver" style={iconBtnStyle('#4fd1c5')}>👁️</button>
                    <button onClick={() => handleDownload(d)} title="Descargar" style={iconBtnStyle('#60a5fa')}>⬇️</button>
                    {canEdit && <button onClick={() => openEdit(d)} title="Editar" style={iconBtnStyle('#fbbf24')}>✏️</button>}
                    {canEdit && <button onClick={() => { setTarget(d); setShowDelete(true); }} title="Eliminar" style={iconBtnStyle('#ef4444')}>🗑️</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showUpload} onClose={() => setShowUpload(false)} title="📤 Subir Documentos">
        <DocumentoForm f={form} onF={setForm} tipoDocumentoOpts={tipoDocumentoOpts} />
        {uploading && (
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 6, background: '#1e2a3a', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress ?? 0}%`, background: 'linear-gradient(90deg, #f0b942, #fc771c)', transition: 'width 0.2s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: '#9fb3cc', marginTop: 4, textAlign: 'right' }}>{uploadProgress ?? 0}%</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={() => setShowUpload(false)} style={{ padding: '10px 20px' }} disabled={uploading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleUpload} style={{ padding: '10px 20px' }} disabled={uploading}>
            {uploading ? 'Subiendo...' : form.files.length ? `Subir ${form.files.length} documento${form.files.length === 1 ? '' : 's'}` : 'Subir'}
          </button>
        </div>
      </Modal>

      <Modal show={showEdit && !!target} onClose={() => setShowEdit(false)} title="✏️ Editar Documento">
        <DocumentoForm f={editForm} onF={setEditForm} tipoDocumentoOpts={tipoDocumentoOpts} showFile={false} />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={() => setShowEdit(false)} style={{ padding: '10px 20px' }}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleEditSave} style={{ padding: '10px 20px' }}>Guardar</button>
        </div>
      </Modal>

      <Modal show={showPreview && !!target} onClose={() => setShowPreview(false)} title={target ? (target.titulo || target.nombre_archivo) : ''} size="lg">
        {target && (() => {
          const kind = fileKind(target.mime_type, target.nombre_archivo);
          const meta = FILE_KIND_META[kind];
          return (
            <div>
              <div style={{ background: '#0d1522', borderRadius: 10, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16 }}>
                {previewLoading ? (
                  <div style={{ color: '#9fb3cc', padding: 40 }}>Cargando vista previa...</div>
                ) : kind === 'image' && previewUrl ? (
                  <img src={previewUrl} alt={target.titulo || target.nombre_archivo} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                ) : kind === 'pdf' && previewUrl ? (
                  <iframe src={previewUrl} title={target.titulo || target.nombre_archivo} style={{ width: '100%', height: '65vh', border: 'none' }} />
                ) : (
                  <div style={{ color: '#9fb3cc', padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 42, marginBottom: 10 }}>{meta.icon}</div>
                    Vista previa no disponible para este tipo de archivo.
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, fontSize: 12, color: '#9fb3cc', marginBottom: 16 }}>
                <div><span style={{ color: '#64748b' }}>Tipo</span><br />{target.nombre_tipo_documento || '—'}</div>
                <div><span style={{ color: '#64748b' }}>Tamaño</span><br />{formatBytes(target.tamano_bytes)}</div>
                <div><span style={{ color: '#64748b' }}>Subido</span><br />{fmtDate(target.fecha_carga)}</div>
                <div><span style={{ color: '#64748b' }}>Por</span><br />{target.nombre_usuario_carga || '—'}</div>
                {target.fecha_documento && <div><span style={{ color: '#64748b' }}>Fecha del documento</span><br />{fmtDate(target.fecha_documento)}</div>}
                <div><span style={{ color: '#64748b' }}>Visible cliente</span><br />{target.visibilidad_cliente ? 'Sí' : 'No'}</div>
              </div>
              {target.descripcion && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>{target.descripcion}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                {canEdit && <button className="btn btn-secondary" onClick={() => { setShowPreview(false); openEdit(target); }}>✏️ Editar</button>}
                <button className="btn btn-primary" onClick={() => handleDownload(target)}>⬇️ Descargar</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.titulo || target?.nombre_archivo} />
    </div>
  );
}

// ─── Radicados públicos Tab ─────────────────────────────────────────────────────
// Un mismo expediente puede tener un radicado distinto por cada organismo
// externo (Rama Judicial, Fiscalia, Publicaciones Procesales, SIUGJ,
// SuperFinanciera...) — sin uno de estos registrado aqui, el expediente
// no aparece como pendiente de revisar en la bitacora de Consultas.
const EMPTY_RADICADO = { organismo: ORGANISMO_OPTIONS[0]?.value || '', numero_radicado: '' };

function RadicadoPublicoForm({ f, onF }) {
  return (
    <EditForm style={{ marginTop: 8 }}>
      <EditSelect label="Organismo *" value={f.organismo} onChange={(e) => onF({ ...f, organismo: e.target.value })} options={ORGANISMO_OPTIONS} />
      <EditField label="Número de radicado *" value={f.numero_radicado} onChange={(e) => onF({ ...f, numero_radicado: e.target.value })} placeholder="Ej: 11001-31-05-2025-00123" />
    </EditForm>
  );
}

function RadicadosPublicosTab({ expedienteId, canEdit, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_RADICADO);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRadicadosPublicos(expedienteId);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Error al cargar radicados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [expedienteId]);

  const msg = (text, type = 'success') => { setNotice({ text, type }); setTimeout(() => setNotice(null), 3500); };

  const handleCreate = async () => {
    if (!form.organismo || !form.numero_radicado.trim()) { msg('Organismo y número de radicado son obligatorios', 'danger'); return; }
    try {
      await createRadicadoPublico(expedienteId, { organismo: form.organismo, numero_radicado: form.numero_radicado.trim() });
      await load();
      onChanged?.();
      setShowCreate(false); setForm(EMPTY_RADICADO); msg('Radicado agregado');
    } catch (e) { msg(e?.response?.data?.message || e?.message || 'Error', 'danger'); }
  };

  const handleDelete = async () => {
    try {
      await deleteRadicadoPublico(expedienteId, target.id);
      setItems((p) => p.filter((r) => r.id !== target.id));
      onChanged?.();
      setShowDelete(false); msg('Radicado eliminado');
    } catch (e) { msg(e?.response?.data?.message || e?.message || 'Error', 'danger'); }
  };

  return (
    <div>
      {notice && <TabNotice notice={notice} />}
      <p style={{ fontSize: 13, color: '#9fb3cc', marginTop: 0, marginBottom: 16 }}>
        Cada radicado que agregues aquí aparece automáticamente en el checklist diario de "Consultas externas" para que no se le pase revisarlo.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {canEdit && <button className="btn btn-primary" onClick={() => { setForm(EMPTY_RADICADO); setShowCreate(true); }} style={{ fontSize: 13, padding: '8px 16px' }}>➕ Nuevo Radicado</button>}
      </div>
      {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
      {loading ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>Cargando radicados...</div>
      ) : items.length === 0 ? (
        <div style={{ color: '#9fb3cc', textAlign: 'center', padding: 40 }}>
          Sin radicados públicos registrados — este expediente no aparecerá en el checklist de Consultas externas hasta que agregues al menos uno.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((r) => (
            <div key={r.id} style={{ background: 'linear-gradient(135deg, #2a3a51, #1e2a3a)', border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600, marginRight: 10 }}>
                  {r.organismo}
                </span>
                <span style={{ fontSize: 14, color: '#e2e8f0' }}>{r.numero_radicado}</span>
              </div>
              {canEdit && (
                <button onClick={() => { setTarget(r); setShowDelete(true); }} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="➕ Nuevo Radicado Público">
        <RadicadoPublicoForm f={form} onF={setForm} />
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} confirmLabel="Agregar" />
      </Modal>
      <DeleteModal show={showDelete && !!target} onClose={() => setShowDelete(false)} onConfirm={handleDelete} label={target?.numero_radicado} />
    </div>
  );
}

// ─── Estado del proceso (header) ──────────────────────────────────────────────
// El estado del expediente (activo/suspendido/ganado/perdido/...) no tenia
// forma de fijarse ni cambiarse en ningun lado del front — el asistente de
// crear/editar expediente nunca tuvo ese campo, asi que siempre quedaba en
// NULL y se veia como "Sin estado" en Mis Casos sin que nadie pudiera
// corregirlo. Se edita aqui mismo, junto al resto de datos del expediente,
// en vez de en el asistente (cambia mucho mas seguido que el resto de esos
// campos, que casi nunca se tocan tras crear el expediente).
function EstadoProcesoField({ expediente, canEdit, estadosProceso, onChange }) {
  const [saving, setSaving] = useState(false);
  const nombreActual = expediente.nombre_estado_proceso;
  const idActual = expediente.id_estado_proceso != null ? String(expediente.id_estado_proceso) : '';

  const handleChange = async (e) => {
    const value = e.target.value;
    if (!value || value === idActual) return;
    setSaving(true);
    try {
      await onChange(Number(value));
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return nombreActual ? (
      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: `${estadoProcesoColor(nombreActual)}22`, color: estadoProcesoColor(nombreActual), border: `1px solid ${estadoProcesoColor(nombreActual)}44`, fontWeight: 600 }}>
        {nombreActual}
      </span>
    ) : null;
  }

  return (
    <select
      value={idActual}
      onChange={handleChange}
      disabled={saving || estadosProceso.length === 0}
      style={{
        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, cursor: saving ? 'wait' : 'pointer',
        background: `${estadoProcesoColor(nombreActual)}22`, color: estadoProcesoColor(nombreActual), border: `1px solid ${estadoProcesoColor(nombreActual)}44`,
      }}
    >
      {!idActual && <option value="">Sin estado</option>}
      {estadosProceso.map((es) => (
        <option key={es.id} value={String(es.id)} style={{ background: '#1e2a3a', color: '#e2e8f0' }}>{es.nombre}</option>
      ))}
    </select>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Actuaciones', 'Audiencias', 'Etapas', 'Tareas', 'Documentos', 'Radicados'];

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAccess();
  const isAdmin = role === 'admin';
  const isLawyer = role === 'lawyer';
  const canEdit = isAdmin || isLawyer;

  const { selectExpediente, selectedExpediente, updateExpediente, loading, error } = useExpedientes();
  const [activeTab, setActiveTab] = useState('Actuaciones');
  const [estadosProceso, setEstadosProceso] = useState([]);
  const [estadoNotice, setEstadoNotice] = useState(null);
  const [radicadosPublicos, setRadicadosPublicos] = useState([]);

  useEffect(() => { if (id) selectExpediente(id); }, [id]);
  useEffect(() => { listEstadosProceso().then(setEstadosProceso).catch(() => {}); }, []);
  // Se usa para el asunto del correo al juzgado: siempre debe llevar el
  // radicado publico (el que reconoce la entidad externa), nunca el numero
  // interno KOOP — se recarga cada vez que cambian los radicados en la
  // pestaña "Radicados" via el prop onChanged de abajo.
  const loadRadicadosPublicos = useCallback(() => {
    if (id) listRadicadosPublicos(id).then((data) => setRadicadosPublicos(Array.isArray(data?.items) ? data.items : [])).catch(() => setRadicadosPublicos([]));
  }, [id]);
  useEffect(() => { loadRadicadosPublicos(); }, [loadRadicadosPublicos]);

  const handleEstadoChange = async (idEstadoProceso) => {
    try {
      await updateExpediente(id, { id_estado_proceso: idEstadoProceso });
      await selectExpediente(id);
    } catch (e) {
      setEstadoNotice({ text: e?.response?.data?.message || e?.message || 'No se pudo actualizar el estado', type: 'danger' });
      setTimeout(() => setEstadoNotice(null), 3500);
    }
  };

  // El asunto del correo al juzgado siempre debe llevar el radicado publico
  // (el que reconoce la entidad externa) y nunca el numero interno KOOP —
  // ese numero solo tiene sentido dentro de la firma. Si todavia no hay
  // radicado publico cargado, se usa el radicado del despacho (tambien
  // externo); si tampoco existe, se manda sin numero de radicado.
  const radicadoParaAsunto = radicadosPublicos[0]?.numero_radicado || selectedExpediente?.numero_radicado_despacho || '';
  const asuntoCorreoJuzgado = radicadoParaAsunto ? `Radicado ${radicadoParaAsunto}` : 'Notificación judicial';

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
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--ff-heading)', color: '#e2e8f0' }}>{selectedExpediente.numero_de_expediente}</h1>
                  {selectedExpediente.nombre_tipo_proceso && (
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'rgba(79,209,197,0.1)', color: '#67e8f9', border: '1px solid rgba(79,209,197,0.2)' }}>{selectedExpediente.nombre_tipo_proceso}</span>
                  )}
                  {selectedExpediente.nombre_subtipo_proceso && (
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{selectedExpediente.nombre_subtipo_proceso}</span>
                  )}
                  {selectedExpediente.nombre_tipo_pretension && (
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'rgba(240,185,66,0.1)', color: '#f0b942', border: '1px solid rgba(240,185,66,0.25)' }}>{selectedExpediente.nombre_tipo_pretension}</span>
                  )}
                  <EstadoProcesoField expediente={selectedExpediente} canEdit={canEdit} estadosProceso={estadosProceso} onChange={handleEstadoChange} />
                </div>
                {estadoNotice && <div style={{ fontSize: 12, color: estadoNotice.type === 'danger' ? '#fca5a5' : '#a7f3d0', marginBottom: 6 }}>{estadoNotice.type === 'danger' ? '❌' : '✅'} {estadoNotice.text}</div>}
                <p style={{ margin: 0, fontSize: 18, color: '#a5b4fc', fontWeight: 500 }}>{selectedExpediente.nombre_cliente}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 10, fontSize: 13, color: '#64748b' }}>
                  {selectedExpediente.numero_radicado_despacho && <span>Radicado despacho: <span style={{ color: '#94a3b8' }}>{selectedExpediente.numero_radicado_despacho}</span></span>}
                  {selectedExpediente.nombre_contraparte && <span>Contraparte: <span style={{ color: '#94a3b8' }}>{selectedExpediente.nombre_contraparte}</span></span>}
                  {selectedExpediente.juzgado_o_autoridad_que_conoce && <span>Juzgado: <span style={{ color: '#94a3b8' }}>{selectedExpediente.juzgado_o_autoridad_que_conoce}</span></span>}
                  {selectedExpediente.correo_juzgado && (
                    <span>
                      Correo juzgado:{' '}
                      <a
                        href={`mailto:${selectedExpediente.correo_juzgado}?subject=${encodeURIComponent(asuntoCorreoJuzgado)}`}
                        style={{ color: '#67e8f9', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        title="Enviar correo con el cliente de correo predeterminado"
                      >
                        ✉️ {selectedExpediente.correo_juzgado}
                      </a>
                    </span>
                  )}
                  {selectedExpediente.direccion_juzgado && <span>Dirección juzgado: <span style={{ color: '#94a3b8' }}>{selectedExpediente.direccion_juzgado}</span></span>}
                  {selectedExpediente.calidad_usuario && <span style={{ textTransform: 'capitalize' }}>Calidad: <span style={{ color: '#94a3b8' }}>{selectedExpediente.calidad_usuario}</span></span>}
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
            {activeTab === 'Documentos' && <DocumentosTab expedienteId={id} canEdit={canEdit} />}
            {activeTab === 'Radicados' && <RadicadosPublicosTab expedienteId={id} canEdit={canEdit} onChanged={loadRadicadosPublicos} />}
          </>
        ) : null}
      </div>
    </div>
  );
}
