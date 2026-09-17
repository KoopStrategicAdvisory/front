import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { configurarSeguimiento, createConsultationLog, downloadConsultationPdf, listConsultationLogs, listRadicadosActivos, verificarRamaJudicial } from '../../../api/consultas';
import { CONSULTATION_PORTALS } from '../../../constants/consultaPortals';
import { Modal } from '../../../components/common/Modal';
import AgregarProceso from './AgregarProceso';
import '../../../styles/dashboard.css';
import './consultas.css';

const RESULTADOS = { sin_movimiento: 'Sin movimiento', actuacion_nueva: 'Actuación nueva', termino_corriendo: 'Término corriendo' };
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const fechaHora = (value) => new Date(value).toLocaleString('es-CO', { timeZone: 'America/Bogota' });

export default function ConsultasPage() {
  const { user } = useAuth();
  const autorizado = (Array.isArray(user?.roles) ? user.roles : [user?.roles]).some((r) => ['admin', 'lawyer', 'super_admin', 'abogado', 'socio', 'asociado', 'junior', 'paralegal'].includes(r));
  const [fecha, setFecha] = useState(hoy);
  const [items, setItems] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [revision, setRevision] = useState(null);
  const [retiro, setRetiro] = useState(null);
  const [resultado, setResultado] = useState('');
  const [observacion, setObservacion] = useState('');
  const [busy, setBusy] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const esHoy = fecha === hoy();

  useEffect(() => {
    if (!autorizado) return;
    let cancelled = false;
    setLoading(true); setError('');
    Promise.all([listRadicadosActivos(fecha), listConsultationLogs(fecha)])
      .then(([lista, logs]) => { if (!cancelled) { setItems(lista.items || []); setRegistros(logs.items || []); } })
      .catch(() => { if (!cancelled) setError('No se pudo cargar la revisión diaria.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fecha, reload, autorizado]);

  const completados = items.filter((i) => i.ultima_consulta_hoy_id).length;
  const completa = items.length > 0 && completados === items.length;
  const registroDe = (item) => registros.find((r) => String(r.id) === String(item.ultima_consulta_hoy_id));
  const ejecutar = async (action) => {
    setBusy(true); setError(''); setAviso('');
    try { await action(); }
    catch (e) { setError(e?.response?.data?.message || 'No se pudo completar la acción. Inténtalo nuevamente.'); }
    finally { setBusy(false); }
  };
  const abrirRevision = (item) => {
    const registro = registroDe(item);
    setResultado(registro?.resultado || ''); setObservacion(registro?.observacion || '');
    setError(''); setRevision(item);
  };
  const guardarRevision = (event) => {
    event.preventDefault();
    ejecutar(async () => {
      await createConsultationLog({ id_radicado_publico: revision.id_radicado_publico, resultado, observacion: observacion.trim(), fecha_consulta: fecha });
      setRevision(null); setReload((n) => n + 1); setAviso('Revisión del día guardada.');
    });
  };
  const verificar = async () => {
    setVerificando(true); setError(''); setAviso('');
    try {
      const result = await verificarRamaJudicial();
      setReload((n) => n + 1);
      setAviso(`Consulta automática: ${result.revisados} de ${result.total} procesos consultados. Revisa los resultados y registra la constancia del día.`);
      if (result.errores?.length) setError(result.errores.map((e) => `${e.numero_radicado}: ${e.message}`).join(' · '));
    } catch { setError('No se pudo realizar la consulta automática. Puedes revisar los procesos manualmente en su página.'); }
    finally { setVerificando(false); }
  };
  const descargar = () => ejecutar(async () => {
    const blob = await downloadConsultationPdf(fecha);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `bitacora-diaria-${fecha}.pdf`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  if (!autorizado) return <div className="dash-page">No tienes acceso a la consulta diaria.</div>;
  return <div className="dash-page consulta-page">
    <div className="dash-card consulta-container">
      <header className="consulta-header">
        <div><h1>Consulta diaria de procesos</h1><p>Los procesos de esta lista se revisan cada día hasta que los retires.</p></div>
        {(loading || items.length > 0) && <button className="btn btn-gold" disabled={busy} onClick={() => { setError(''); setAgregando(true); }}>+ Agregar proceso</button>}
      </header>
      <div className="consulta-toolbar">
        <label>Fecha de revisión <input type="date" className="input" aria-label="Fecha de revisión" value={fecha} max={hoy()} disabled={busy || verificando} onChange={(e) => { if (e.target.value) { setFecha(e.target.value); setAviso(''); } }} /></label>
        <span>{loading ? 'Cargando…' : `${completados} de ${items.length} revisados`}</span>
        {esHoy && items.some((i) => i.modalidad === 'automatica') && <button className="btn btn-secondary" disabled={busy || verificando || loading} onClick={verificar}>{verificando ? 'Consultando…' : 'Consultar automáticos ahora'}</button>}
      </div>
      {error && !revision && !retiro && <div role="alert" className="alert alert-error">{error} <button className="btn btn-secondary btn-sm" onClick={() => setReload((n) => n + 1)}>Actualizar lista</button></div>}
      {aviso && <p role="status" className="consulta-aviso">{aviso}</p>}
      {loading ? <p role="status" className="consulta-empty">Cargando procesos…</p> : !items.length ? <div className="consulta-empty">
        <h2>{esHoy ? 'Agrega tu primer proceso' : 'No había procesos en seguimiento en esta fecha'}</h2>
        <p>Selecciona un cliente, el radicado de su expediente y la página donde se revisará.</p>
        <button className="btn btn-gold" onClick={() => { setError(''); setAgregando(true); }}>+ Agregar {esHoy ? 'primer ' : ''}proceso</button>
      </div> : <div className="consulta-lista">
        {items.map((item) => {
          const log = registroDe(item);
          const portal = CONSULTATION_PORTALS.find((p) => p.label === item.organismo);
          return <article className="consulta-proceso" key={item.id_radicado_publico}>
            <div className="consulta-proceso-head">
              <div><small>{item.nombre_cliente || 'Cliente sin asignar'}</small><h2>{item.numero_radicado}</h2></div>
              <span className={`consulta-estado ${log ? 'consulta-estado--completo' : ''}`}>{log ? RESULTADOS[log.resultado] : 'Pendiente de revisión'}</span>
            </div>
            <p className="consulta-portal">{item.organismo}<span>{item.modalidad === 'automatica' ? 'Automática' : 'Manual'}</span></p>
            {item.modalidad === 'automatica' && esHoy && <details className="consulta-datos-auto">
              <summary>Información de la consulta automática</summary>
              <p>{item.ultima_verificacion_automatica ? `Última consulta: ${fechaHora(item.ultima_verificacion_automatica)}` : 'Todavía no se ha consultado automáticamente.'}</p>
              {item.ultima_actuacion_texto && <p>Última actuación conocida: {item.ultima_actuacion_texto}</p>}
              <small>Confirma que la información corresponde al día de hoy antes de registrar el resultado.</small>
            </details>}
            {log && <div className="consulta-resultado">{log.observacion && <p>{log.observacion}</p>}<small>Registrado por {log.nombre_usuario || '—'} · {fechaHora(log.created_at)}</small></div>}
            <div className="consulta-acciones">
              {portal && <a className="btn btn-secondary btn-sm" href={portal.url} target="_blank" rel="noopener noreferrer">Abrir página</a>}
              <button className="btn btn-secondary btn-sm" onClick={() => ejecutar(async () => { await navigator.clipboard.writeText(item.numero_radicado); setAviso('Radicado copiado.'); })} disabled={busy}>Copiar radicado</button>
              {esHoy && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => abrirRevision(item)}>{log ? 'Corregir registro' : 'Registrar revisión'}</button>}
              {esHoy && <button className="btn btn-secondary btn-sm consulta-retirar" disabled={busy || verificando} onClick={() => { setError(''); setRetiro(item); }}>Retirar de la lista</button>}
            </div>
          </article>;
        })}
      </div>}
      <footer className="consulta-cierre">
        <div><strong>Bitácora del día</strong><p>{completa ? 'Todos los procesos tienen registro. La constancia está lista.' : 'Registra la revisión de cada proceso para generar la constancia diaria.'}</p></div>
        <button className="btn btn-gold" disabled={!completa || loading || busy} onClick={descargar}>{busy ? 'Procesando…' : 'Generar bitácora del día (PDF)'}</button>
      </footer>
    </div>
    {agregando && <AgregarProceso onClose={() => setAgregando(false)} onAdded={() => { setAgregando(false); setFecha(hoy()); setReload((n) => n + 1); setAviso('Proceso agregado a la lista diaria.'); }} />}
    <Modal show={!!revision} onClose={() => { if (!busy) setRevision(null); }} title="Registrar revisión del día">
      {revision && <form className="consulta-form" onSubmit={guardarRevision}>
        <div className="consulta-radicado"><small>{revision.nombre_cliente} · {fecha}</small><strong>{revision.numero_radicado}</strong><small>{revision.organismo}</small></div>
        {error && <p role="alert" className="alert alert-error">{error}</p>}
        <fieldset disabled={busy}>
          <label>Resultado<select className="input" aria-label="Resultado" required value={resultado} onChange={(e) => setResultado(e.target.value)}><option value="">Selecciona el resultado</option>{Object.entries(RESULTADOS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Observaciones<textarea className="input" rows={4} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Actuaciones, fechas o detalles de la consulta" /></label>
        </fieldset>
        <div className="kf-modal-footer"><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setRevision(null)}>Cancelar</button><button className="btn btn-gold" disabled={busy || !resultado}>{busy ? 'Guardando…' : 'Guardar revisión'}</button></div>
      </form>}
    </Modal>
    <Modal show={!!retiro} onClose={() => { if (!busy) setRetiro(null); }} title="Retirar de la revisión diaria" size="sm">
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <p>El radicado <strong>{retiro?.numero_radicado}</strong> dejará de revisarse desde hoy. Se conservarán el expediente y sus registros. Puedes agregarlo de nuevo después.</p>
      <div className="kf-modal-footer"><button className="btn btn-secondary" disabled={busy} onClick={() => setRetiro(null)}>Cancelar</button><button className="btn btn-gold" disabled={busy} onClick={() => ejecutar(async () => { await configurarSeguimiento(retiro.id_radicado_publico, null); setRetiro(null); setReload((n) => n + 1); })}>{busy ? 'Retirando…' : 'Retirar proceso'}</button></div>
    </Modal>
  </div>;
}
